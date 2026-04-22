import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import CallScreen, { IncomingCallScreen } from '@/components/CallScreen';
import { toast } from 'sonner';
import type { CallRole, CallType } from '@/hooks/useWebRTCCall';
import type { User } from '@/types';

interface ActiveCall {
  callId: string;
  other: User;
  role: CallRole;
  callType: CallType;
  accepted: boolean;
}

interface CallManagerContextType {
  startCall: (other: User, callType: CallType) => Promise<void>;
}

const CallManagerContext = createContext<CallManagerContextType | undefined>(undefined);

export function useCall() {
  const ctx = useContext(CallManagerContext);
  if (!ctx) throw new Error('useCall must be used inside CallManager');
  return ctx;
}

export function CallManager({ children }: { children: ReactNode }) {
  const { session, users, sendMessage } = useApp();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const notifRef = useRef<Notification | null>(null);

  // Helper: send a "missed call" DM so the recipient sees it in their chat
  const sendMissedCallDM = useCallback(async (toUserId: string, callType: CallType) => {
    try {
      const icon = callType === 'video' ? '📹' : '📞';
      await sendMessage(toUserId, { text: `${icon} Tried to ${callType === 'video' ? 'video call' : 'call'} you` });
    } catch (e) {
      console.error('missed-call DM error', e);
    }
  }, [sendMessage]);

  // Ask for browser notification permission once the user is signed in.
  useEffect(() => {
    if (!session?.user) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignore */ });
    }
  }, [session?.user]);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (notifRef.current) {
      try { notifRef.current.close(); } catch { /* ignore */ }
      notifRef.current = null;
    }
  }, []);

  // Looping synthesized ringtone (until user accepts/declines or 45s timeout)
  const playRingtone = useCallback(() => {
    const playBurst = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const playBeep = (delay: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 480;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.4);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.45);
        };
        [0, 0.6, 1.8, 2.4].forEach(playBeep);
        window.setTimeout(() => ctx.close(), 3500);
      } catch { /* ignore (likely autoplay blocked) */ }
    };
    playBurst();
    if (ringIntervalRef.current) window.clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = window.setInterval(playBurst, 4000);
    // Auto-stop after 45s
    window.setTimeout(stopRingtone, 45000);
  }, [stopRingtone]);

  const showCallNotification = useCallback((callerName: string, callType: CallType) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      const n = new Notification(`Incoming ${callType} call`, {
        body: `${callerName} is calling you`,
        icon: '/favicon.ico',
        tag: 'kingdom-seekers-call',
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
      notifRef.current = n;
    } catch { /* ignore */ }
  }, []);

  // Listen for incoming calls (where I'm the callee)
  useEffect(() => {
    if (!session?.user) return;
    const myId = session.user.id;

    const channel = supabase
      .channel(`incoming-calls-${myId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `callee_id=eq.${myId}` },
        (payload) => {
          const call = payload.new as { id: string; caller_id: string; call_type: CallType; status: string };
          if (call.status !== 'ringing') return;
          if (active) return; // already in a call
          const caller = users.find(u => u.id === call.caller_id);
          if (!caller) return;
          setActive({ callId: call.id, other: caller, role: 'callee', callType: call.call_type, accepted: false });
          playRingtone();
          showCallNotification(caller.username, call.call_type);
          toast(`📞 Incoming ${call.call_type} call from ${caller.username}`);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `caller_id=eq.${myId}` },
        (payload) => {
          const call = payload.new as { id: string; status: string };
          if (call.status === 'declined') {
            toast.error('Call declined');
            setActive(curr => {
              if (curr?.callId === call.id) {
                // Caller side: leave a missed-call DM for the callee
                sendMissedCallDM(curr.other.id, curr.callType);
                return null;
              }
              return curr;
            });
            stopRingtone();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user, users, active, playRingtone, showCallNotification, stopRingtone, sendMissedCallDM]);

  const startCall = useCallback(async (other: User, callType: CallType) => {
    if (!session?.user) return;
    if (active) { toast.error('You are already in a call'); return; }

    const { data, error } = await supabase
      .from('calls')
      .insert({
        caller_id: session.user.id,
        callee_id: other.id,
        call_type: callType,
        status: 'ringing',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('startCall error', error);
      toast.error('Could not start call');
      return;
    }
    setActive({ callId: data.id, other, role: 'caller', callType, accepted: true });
  }, [session?.user, active]);

  const handleAccept = async () => {
    if (!active) return;
    stopRingtone();
    await supabase
      .from('calls')
      .update({ status: 'accepted', started_at: new Date().toISOString() })
      .eq('id', active.callId);
    setActive({ ...active, accepted: true });
  };

  const handleDecline = async () => {
    if (!active) return;
    stopRingtone();
    await supabase
      .from('calls')
      .update({ status: 'declined', ended_at: new Date().toISOString() })
      .eq('id', active.callId);
    setActive(null);
  };

  const handleClose = () => {
    stopRingtone();
    // If the caller closes before the callee accepted, treat as a missed call
    if (active && active.role === 'caller' && !active.accepted) {
      void sendMissedCallDM(active.other.id, active.callType);
      // mark call as missed in DB (best-effort)
      void supabase.from('calls').update({ status: 'missed', ended_at: new Date().toISOString() }).eq('id', active.callId);
    }
    setActive(null);
  };

  return (
    <CallManagerContext.Provider value={{ startCall }}>
      {children}
      {active && active.role === 'callee' && !active.accepted && (
        <IncomingCallScreen
          other={active.other}
          callType={active.callType}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
      {active && active.accepted && (
        <CallScreen
          callId={active.callId}
          myUserId={session!.user.id}
          other={active.other}
          role={active.role}
          callType={active.callType}
          onClose={handleClose}
        />
      )}
    </CallManagerContext.Provider>
  );
}
