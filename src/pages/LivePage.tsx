import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import ksfLogo from '@/assets/ksf-logo.png';

const CHANNEL_ID = 'UCvHvwe3wVCEibxBpFEs8oqw';

export default function LivePage() {
  const { teachings, setTeachings } = useApp();
  const [expandedTeaching, setExpandedTeaching] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isLiveDay = dayOfWeek === 5 || dayOfWeek === 0; // Fri or Sun

  const toggleTeachingLike = (id: string) => {
    setTeachings(prev => prev.map(t =>
      t.id === id ? { ...t, liked: !t.liked, likes: t.liked ? t.likes - 1 : t.likes + 1 } : t
    ));
  };

  const addTeachingComment = (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    setTeachings(prev => prev.map(t =>
      t.id === id ? {
        ...t,
        comments: [...t.comments, {
          id: `tc${Date.now()}`,
          userId: '1',
          username: 'GraceWalker',
          avatar: 'https://i.pravatar.cc/150?img=1',
          text,
          timestamp: 'just now',
        }]
      } : t
    ));
    setCommentTexts(prev => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background watermark */}
      <img
        src={ksfLogo}
        alt=""
        className="fixed inset-0 w-full h-full object-contain opacity-[0.03] pointer-events-none select-none scale-125 z-0"
        aria-hidden="true"
      />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 py-3 px-4">
          <img src={ksfLogo} alt="KSF" className="w-7 h-7" />
          <h1 className="text-lg font-display font-bold text-foreground">Live Teachings</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4">
        {/* Live Stream Section */}
        <div className="feed-card mb-6">
          <div className="flex items-center gap-2 mb-3">
            {isLiveDay ? (
              <span className="live-badge">
                <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse-live" />
                LIVE NOW
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                ⏸ OFFLINE
              </span>
            )}
            <span className="text-xs text-muted-foreground">KSF Thika Road</span>
          </div>

          {isLiveDay ? (
            <div className="rounded-xl overflow-hidden aspect-video bg-foreground/5">
              <iframe
                src={`https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}`}
                title="KSF Thika Road Live Stream"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl bg-muted flex flex-col items-center justify-center py-12 px-4 text-center">
              <img src={ksfLogo} alt="" className="w-16 h-16 opacity-30 mb-3" />
              <p className="text-sm font-medium text-foreground">No live session today</p>
              <p className="text-xs text-muted-foreground mt-1">Live teachings are streamed on Fridays & Sundays</p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Fri</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Sun</span>
              </div>
              <a
                href="https://www.youtube.com/@ksfthikaroad"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                Visit YouTube Channel →
              </a>
            </div>
          )}
        </div>

        {/* Past Teachings */}
        <h2 className="text-base font-display font-bold text-foreground mb-3">Past Teachings</h2>

        {teachings.map(teaching => (
          <div key={teaching.id} className="feed-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">{teaching.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{teaching.date}</p>

            <div className="rounded-xl overflow-hidden aspect-video bg-foreground/5 mb-3">
              <iframe
                src={`https://www.youtube.com/embed/${teaching.youtubeId}`}
                title={teaching.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-2 border-t border-border">
              <button onClick={() => toggleTeachingLike(teaching.id)} className="flex items-center gap-1.5 text-sm transition-all active:scale-110">
                <Heart size={18} className={teaching.liked ? 'fill-accent text-accent' : 'text-muted-foreground'} />
                <span className={teaching.liked ? 'text-accent font-medium' : 'text-muted-foreground'}>{teaching.likes}</span>
              </button>
              <button
                onClick={() => setExpandedTeaching(expandedTeaching === teaching.id ? null : teaching.id)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <MessageCircle size={18} />
                <span>{teaching.comments.length}</span>
                {expandedTeaching === teaching.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {expandedTeaching === teaching.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                {teaching.comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                )}
                {teaching.comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <img src={c.avatar} alt={c.username} className="w-7 h-7 rounded-full object-cover" />
                    <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                      <p className="text-xs font-semibold text-foreground">{c.username}</p>
                      <p className="text-xs text-foreground/80">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={commentTexts[teaching.id] || ''}
                    onChange={e => setCommentTexts(prev => ({ ...prev, [teaching.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTeachingComment(teaching.id)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-muted rounded-full px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button onClick={() => addTeachingComment(teaching.id)} className="text-primary"><Send size={16} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
