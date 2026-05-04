import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Film, Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Post } from '@/types';
import SharePostDialog from '@/components/SharePostDialog';

function ReelItem({ post, muted, onToggleMute }: { post: Post; muted: boolean; onToggleMute: () => void }) {
  const { toggleLike } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Autoplay/pause based on visibility within the snap container
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          el.play().catch(() => { /* autoplay restrictions */ });
        } else {
          el.pause();
          el.currentTime = el.currentTime; // keep position
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={post.videoUrl}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-contain"
        onClick={(e) => {
          const v = e.currentTarget;
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }}
      />

      {/* Bottom gradient + meta */}
      <div className="absolute inset-x-0 bottom-0 pt-16 pb-24 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
        <Link to={`/profile/${post.userId}`} className="flex items-center gap-2 mb-2">
          <img src={post.avatar} alt={post.username} className="w-9 h-9 rounded-full border-2 border-white/40 object-cover" />
          <span className="font-semibold text-sm">@{post.username}</span>
        </Link>
        {post.content && (
          <p className="text-sm leading-snug max-w-[80%] whitespace-pre-line">{post.content}</p>
        )}
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 text-white">
        <button
          onClick={() => toggleLike(post.id)}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${post.liked ? 'bg-red-500/90' : 'bg-white/15 backdrop-blur'}`}>
            <Heart size={22} className={post.liked ? 'fill-white text-white' : 'text-white'} />
          </div>
          <span className="text-[11px] font-medium">{post.likes}</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-medium">{post.comments.length}</span>
        </div>
        <button
          onClick={() => setShareOpen(true)}
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <Send size={20} />
          </div>
          <span className="text-[11px] font-medium">Share</span>
        </button>
        <button
          onClick={onToggleMute}
          className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <SharePostDialog post={post} open={shareOpen} onOpenChange={setShareOpen} />
    </section>
  );
}

export default function VideosPage() {
  const { posts } = useApp();
  const [muted, setMuted] = useState(true);
  const reels = posts.filter(p => p.type === 'video' && p.videoCategory === 'reel' && p.videoUrl);

  return (
    <div className="fixed inset-0 bg-black z-30 pb-16">
      {/* Floating header */}
      <header className="absolute top-0 inset-x-0 z-20 pt-3 pb-2 px-4 flex items-center justify-center gap-2 bg-gradient-to-b from-black/60 to-transparent text-white pointer-events-none">
        <Film size={16} />
        <h1 className="text-sm font-display font-bold">Believer Reels</h1>
      </header>

      {reels.length === 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-white/70 px-6 text-center">
          <Film size={40} className="mb-3 opacity-50" />
          <p className="text-sm">No reels yet</p>
          <p className="text-xs mt-1 opacity-70">Post a Reel from the Upload page · shorts appear on Home</p>
        </div>
      ) : (
        <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
          {reels.map(post => (
            <ReelItem key={post.id} post={post} muted={muted} onToggleMute={() => setMuted(m => !m)} />
          ))}
        </div>
      )}
    </div>
  );
}
