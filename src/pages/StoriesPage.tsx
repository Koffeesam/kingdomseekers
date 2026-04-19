import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import StoriesBar from '@/components/StoriesBar';

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  return `${h}h ago`;
}

export default function StoriesPage() {
  const { stories, user } = useApp();
  const mine = stories.filter(s => s.userId === user.id);
  const others = stories.filter(s => s.userId !== user.id);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></Link>
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold flex-1">Stories</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5">
        <StoriesBar />

        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Your stories</h2>
          {mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              You haven't posted today. Tap <span className="font-semibold text-primary">"Your story"</span> above to share a verse, photo, or testimony 🙏
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {mine.map(s => (
                <li key={s.id} className={`aspect-[9/16] rounded-2xl overflow-hidden relative ${s.mediaType === 'image' ? 'bg-black' : `bg-gradient-to-br ${s.bgColor}`}`}>
                  {s.mediaType === 'image' && s.mediaUrl
                    ? <img src={s.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <p className="absolute inset-0 p-3 text-white text-xs font-display font-bold flex items-center justify-center text-center">{s.content}</p>
                  }
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white/90 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{timeAgo(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Recent from believers</h2>
          {others.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stories from other believers yet.</p>
          ) : (
            <ul className="space-y-2">
              {others.map(s => (
                <li key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary">
                  <img src={s.avatar} alt={s.username} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.mediaType === 'image' ? '📷 Photo' : s.content}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
