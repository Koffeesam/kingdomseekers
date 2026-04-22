import { X } from 'lucide-react';

interface Props {
  src: string;
  username: string;
  open: boolean;
  onClose: () => void;
}

export default function AvatarViewer({ src, username, open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-label={`${username} profile picture`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={username}
          className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl"
        />
        <p className="text-white/90 text-sm font-medium">@{username}</p>
      </div>
    </div>
  );
}