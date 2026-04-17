import { useApp } from '@/context/AppContext';
import FeedCard from '@/components/FeedCard';
import { Film } from 'lucide-react';
import ksfLogo from '@/assets/ksf-logo.png';

export default function VideosPage() {
  const { posts } = useApp();
  const videoPosts = posts.filter(p => p.type === 'video');

  return (
    <div className="min-h-screen pb-20 relative">
      <img src={ksfLogo} alt="" className="fixed inset-0 w-full h-full object-contain opacity-[0.03] pointer-events-none select-none scale-125 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 py-3 px-4">
          <Film size={18} className="text-primary" />
          <h1 className="text-lg font-display font-bold text-foreground">Believer Videos</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4">
        <p className="text-xs text-muted-foreground text-center mb-4">
          Video testimonies shared by the community ✝️
        </p>

        {videoPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Film size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No video testimonies yet</p>
            <p className="text-xs mt-1">Be the first to share one from the Upload page</p>
          </div>
        ) : (
          videoPosts.map(post => <FeedCard key={post.id} post={post} />)
        )}
      </main>
    </div>
  );
}
