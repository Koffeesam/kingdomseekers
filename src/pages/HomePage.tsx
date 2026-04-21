import { useApp } from '@/context/AppContext';
import FeedCard from '@/components/FeedCard';
import TopNav from '@/components/TopNav';
import ksfLogo from '@/assets/ksf-logo.png';

export default function HomePage() {
  const { posts } = useApp();
  // Home feed shows text posts and short videos (<60s). Reels live in /videos.
  const feedPosts = posts.filter(p => p.type !== 'video' || p.videoCategory !== 'reel');

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background watermark */}
      <img
        src={ksfLogo}
        alt=""
        className="fixed inset-0 w-full h-full object-contain opacity-[0.03] pointer-events-none select-none scale-125 z-0"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between py-2 px-3">
          <TopNav />
          <div className="flex items-center gap-2">
            <img src={ksfLogo} alt="Kingdom Seekers" className="w-7 h-7" />
            <h1 className="text-base font-display font-bold bg-gradient-to-r from-gold-dark to-primary bg-clip-text text-transparent">
              Kingdom Seekers
            </h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Feed */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4">
        {feedPosts.map(post => (
          <FeedCard key={post.id} post={post} />
        ))}
      </main>
    </div>
  );
}
