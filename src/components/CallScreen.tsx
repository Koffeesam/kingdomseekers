import { useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { useWebRTCCall, type CallRole, type CallType } from '@/hooks/useWebRTCCall';
import type { User } from '@/types';

interface CallScreenProps {
  callId: string;
  myUserId: string;
  other: User;
  role: CallRole;
  callType: CallType;
  onClose: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CallScreen({ callId, myUserId, other, role, callType, onClose }: CallScreenProps) {
  const {
    status, muted, cameraOff, remoteHasVideo,
    localVideoRef, remoteVideoRef,
    toggleMute, toggleCamera, endCall,
  } = useWebRTCCall({ callId, myUserId, otherUserId: other.id, role, callType, onEnded: onClose });

  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (status !== 'connected') return;
    const t = window.setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const showVideoUI = callType === 'video';
  const showRemoteVideo = showVideoUI && remoteHasVideo && status === 'connected';

  const statusLabel =
    status === 'connecting' ? (role === 'caller' ? 'Calling…' : 'Connecting…')
    : status === 'connected' ? formatDuration(duration)
    : status === 'ended' ? 'Call ended'
    : 'Ringing…';

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col">
      {/* Remote video / avatar */}
      <div className="flex-1 relative overflow-hidden">
        {showRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <img
                src={other.avatar}
                alt={other.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
              />
              {status === 'connecting' && (
                <span className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
              )}
            </div>
            <h2 className="mt-6 text-2xl font-bold">{other.username}</h2>
            <p className="mt-2 text-white/70 text-sm">{statusLabel}</p>
            <p className="mt-1 text-white/40 text-xs uppercase tracking-wider">
              {callType === 'video' ? 'Video call' : 'Voice call'}
            </p>
          </div>
        )}

        {/* Status bar overlay when video shown */}
        {showRemoteVideo && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-4 py-1.5 rounded-full">
            <p className="text-sm font-medium">{other.username} · {statusLabel}</p>
          </div>
        )}

        {/* Local video PIP */}
        {showVideoUI && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute bottom-6 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-white/30 shadow-xl bg-black ${cameraOff ? 'opacity-30' : ''}`}
          />
        )}

        {/* Hidden audio sink for voice calls */}
        {!showVideoUI && (
          <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${muted ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25 backdrop-blur'}`}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${cameraOff ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25 backdrop-blur'}`}
              aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}

          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            aria-label="End call"
          >
            <PhoneOff size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Incoming-call ring screen (callee, before accept)
interface IncomingCallScreenProps {
  other: User;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallScreen({ other, callType, onAccept, onDecline }: IncomingCallScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center justify-between py-16 px-6">
      <div className="flex flex-col items-center mt-12">
        <p className="text-sm text-white/60 uppercase tracking-wider mb-2">
          Incoming {callType} call
        </p>
        <div className="relative">
          <img
            src={other.avatar}
            alt={other.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
          />
          <span className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
        </div>
        <h2 className="mt-6 text-3xl font-bold">{other.username}</h2>
        <p className="mt-2 text-white/70">is calling you 🙏</p>
      </div>

      <div className="w-full max-w-sm flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onDecline}
          className="flex flex-col items-center gap-2 active:scale-90 transition-all"
          aria-label="Decline"
        >
          <span className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <PhoneOff size={26} />
          </span>
          <span className="text-xs text-white/80">Decline</span>
        </button>
        <button
          onClick={onAccept}
          className="flex flex-col items-center gap-2 active:scale-90 transition-all"
          aria-label="Accept"
        >
          <span className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg animate-pulse">
            <Phone size={26} />
          </span>
          <span className="text-xs text-white/80">Accept</span>
        </button>
      </div>
    </div>
  );
}
