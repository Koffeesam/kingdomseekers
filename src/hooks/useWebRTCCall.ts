import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CallType = 'voice' | 'video';
export type CallRole = 'caller' | 'callee';
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

interface UseWebRTCCallParams {
  callId: string | null;
  myUserId: string;
  otherUserId: string;
  role: CallRole;
  callType: CallType;
  onEnded?: () => void;
}

export function useWebRTCCall({ callId, myUserId, otherUserId, role, callType, onEnded }: UseWebRTCCallParams) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSet = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const sendSignal = useCallback(
    async (signalType: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => {
      if (!callId) return;
      await supabase.from('call_signals').insert({
        call_id: callId,
        from_user_id: myUserId,
        to_user_id: otherUserId,
        signal_type: signalType,
        payload: payload as never,
      });
    },
    [callId, myUserId, otherUserId],
  );

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    pendingCandidates.current = [];
    remoteDescSet.current = false;
  }, []);

  const endCall = useCallback(async () => {
    if (callId) {
      await supabase.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callId);
    }
    cleanup();
    setStatus('ended');
    onEnded?.();
  }, [callId, cleanup, onEnded]);

  const toggleMute = useCallback(() => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) { audio.enabled = !audio.enabled; setMuted(!audio.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) { video.enabled = !video.enabled; setCameraOff(!video.enabled); }
  }, []);

  // Setup peer connection + signaling channel
  useEffect(() => {
    if (!callId) return;
    let cancelled = false;

    const setup = async () => {
      try {
        // 1. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Create peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

        pc.ontrack = (e) => {
          e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          setRemoteHasVideo(remoteStream.getVideoTracks().length > 0);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) sendSignal('ice-candidate', e.candidate.toJSON());
        };

        pc.onconnectionstatechange = () => {
          const s = pc.connectionState;
          if (s === 'connected') setStatus('connected');
          else if (s === 'failed' || s === 'disconnected' || s === 'closed') {
            // Don't end call on transient disconnects, only on failed
            if (s === 'failed') endCall();
          }
        };

        // 3. Subscribe to signals from the other peer
        const channel = supabase
          .channel(`call-${callId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${callId}` },
            async (payload) => {
              const sig = payload.new as { signal_type: string; from_user_id: string; payload: unknown };
              if (sig.from_user_id === myUserId) return;

              if (sig.signal_type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.payload as RTCSessionDescriptionInit));
                remoteDescSet.current = true;
                for (const c of pendingCandidates.current) await pc.addIceCandidate(c);
                pendingCandidates.current = [];
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await sendSignal('answer', answer);
              } else if (sig.signal_type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.payload as RTCSessionDescriptionInit));
                remoteDescSet.current = true;
                for (const c of pendingCandidates.current) await pc.addIceCandidate(c);
                pendingCandidates.current = [];
              } else if (sig.signal_type === 'ice-candidate') {
                const candidate = sig.payload as RTCIceCandidateInit;
                if (remoteDescSet.current) await pc.addIceCandidate(candidate);
                else pendingCandidates.current.push(candidate);
              }
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
            (payload) => {
              const c = payload.new as { status: string };
              if (c.status === 'ended' || c.status === 'declined') {
                cleanup();
                setStatus('ended');
                onEnded?.();
              }
            },
          )
          .subscribe();
        channelRef.current = channel;

        // 4. Caller creates offer immediately; callee waits for offer
        if (role === 'caller') {
          setStatus('connecting');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal('offer', offer);
        } else {
          setStatus('connecting');
        }
      } catch (err) {
        console.error('WebRTC setup error', err);
        endCall();
      }
    };

    setup();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  return {
    status, muted, cameraOff, remoteHasVideo,
    localVideoRef, remoteVideoRef,
    toggleMute, toggleCamera, endCall,
  };
}
