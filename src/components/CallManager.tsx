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
  const { session, users } = useApp();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Simple synthesized ringtone using oscillator (no asset needed)
  const playRingtone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playBeep = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 480;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.45);
      };
      [0, 0.6, 1.8, 2.4].forEach(playBeep);
      window.setTimeout(() => ctx.close(), 3500);
    } catch (e) { /* ignore */ }
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
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `caller_id=eq.${myId}` },
        (payload) => {
          const call = payload.new as { id: string; status: string };
          if (call.status === 'declined') {
            toast.error('Call declined');
            setActive(curr => curr?.callId === call.id ? null : curr);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user, users, active, playRingtone]);

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
    await supabase
      .from('calls')
      .update({ status: 'accepted', started_at: new Date().toISOString() })
      .eq('id', active.callId);
    setActive({ ...active, accepted: true });
  };

  const handleDecline = async () => {
    if (!active) return;
    await supabase
      .from('calls')
      .update({ status: 'declined', ended_at: new Date().toISOString() })
      .eq('id', active.callId);
    setActive(null);
  };

  const handleClose = () => setActive(null);

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
