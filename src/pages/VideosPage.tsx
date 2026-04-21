import { useApp } from '@/context/AppContext';
import FeedCard from '@/components/FeedCard';
import { Film } from 'lucide-react';
import ksfLogo from '@/assets/ksf-logo.png';

export default function VideosPage() {
  const { posts } = useApp();
  // Videos page is dedicated to reels (≥60s). Shorts live on Home.
  const videoPosts = posts.filter(p => p.type === 'video' && p.videoCategory === 'reel');

  return (
    <div className="min-h-screen pb-20 relative">
      <img src={ksfLogo} alt="" className="fixed inset-0 w-full h-full object-contain opacity-[0.03] pointer-events-none select-none scale-125 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 py-3 px-4">
          <Film size={18} className="text-primary" />
          <h1 className="text-lg font-display font-bold text-foreground">Believer Reels</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4">
        <p className="text-xs text-muted-foreground text-center mb-4">
          Long-form video testimonies (60s+) shared by the community ✝️
        </p>

        {videoPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Film size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No reels yet</p>
            <p className="text-xs mt-1">Upload a 60s+ video from the Upload page · shorter clips appear on Home</p>
          </div>
        ) : (
          videoPosts.map(post => <FeedCard key={post.id} post={post} />)
        )}
      </main>
    </div>
  );
}
