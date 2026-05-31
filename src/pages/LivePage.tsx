import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp, Radio, Plus, Trash2, Save } from 'lucide-react';
import ksfLogo from '@/assets/ksf-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CHANNEL_ID = 'UCvHvwe3wVCEibxBpFEs8oqw';

interface SavedTeaching {
  id: string;
  title: string;
  youtube_id: string;
  session_date: string;
  description: string | null;
}

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  // Already an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    const v = url.searchParams.get('v');
    if (v) return v;
    const parts = url.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last && last.length === 11) return last;
  } catch { /* not a URL */ }
  return trimmed;
}

export default function LivePage() {
  const { teachings, setTeachings, isAdmin, session } = useApp();
  const [expandedTeaching, setExpandedTeaching] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [announcing, setAnnouncing] = useState(false);
  const [saved, setSaved] = useState<SavedTeaching[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formVideo, setFormVideo] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('saved_teachings')
        .select('*')
        .order('session_date', { ascending: false });
      if (!error && data) setSaved(data as SavedTeaching[]);
    };
    load();
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isLiveDay = dayOfWeek === 5 || dayOfWeek === 0; // Fri or Sun

  const handleGoLive = async () => {
    if (!session?.user) return;
    setAnnouncing(true);
    const { error } = await supabase.from('live_announcements').insert({
      title: 'Pastor is live now',
      message: 'Join the live teaching at KSF Thika Road 🙏',
      stream_url: `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}`,
      active: true,
      created_by: session.user.id,
    });
    setAnnouncing(false);
    if (error) {
      toast.error('Could not send announcement');
      console.error(error);
    } else {
      toast.success('Believers have been notified');
      // Fire-and-forget: auto-create today's saved teaching so it archives itself.
      supabase.functions.invoke('auto-save-teaching', {
        body: { trigger: 'live', created_by: session.user.id },
      }).then(({ data, error: fnErr }) => {
        if (fnErr) { console.error('auto-save-teaching', fnErr); return; }
        console.log('auto-save-teaching', data);
        // Refresh archive list
        supabase
          .from('saved_teachings')
          .select('*')
          .order('session_date', { ascending: false })
          .then(({ data: rows }) => { if (rows) setSaved(rows as SavedTeaching[]); });
      });
    }
  };

  const handleSaveTeaching = async () => {
    if (!session?.user) return;
    const ytId = extractYouTubeId(formVideo);
    if (!formTitle.trim() || !ytId) {
      toast.error('Title and YouTube link/ID are required');
      return;
    }
    setSavingForm(true);
    const { data, error } = await supabase
      .from('saved_teachings')
      .insert({
        title: formTitle.trim(),
        youtube_id: ytId,
        session_date: formDate,
        description: formDesc.trim(),
        created_by: session.user.id,
      })
      .select()
      .single();
    setSavingForm(false);
    if (error) {
      toast.error('Could not save teaching');
      console.error(error);
      return;
    }
    setSaved(prev => [data as SavedTeaching, ...prev]);
    setFormTitle(''); setFormVideo(''); setFormDesc('');
    setShowSaveForm(false);
    toast.success('Sunday preach saved for rewatching 🙏');
  };

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Remove this saved teaching?')) return;
    const { error } = await supabase.from('saved_teachings').delete().eq('id', id);
    if (error) { toast.error('Could not delete'); return; }
    setSaved(prev => prev.filter(s => s.id !== id));
    toast.success('Removed');
  };

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

          {isAdmin && (
            <button
              onClick={handleGoLive}
              disabled={announcing}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
              <Radio size={16} />
              {announcing ? 'Sending...' : 'Notify believers — Pastor is LIVE'}
            </button>
          )}

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

        {/* Saved Sunday Preaches Archive */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display font-bold text-foreground">Saved Sunday Preaches</h2>
          {isAdmin && (
            <button
              onClick={() => setShowSaveForm(s => !s)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
            >
              <Plus size={14} />
              {showSaveForm ? 'Close' : 'Save preach'}
            </button>
          )}
        </div>

        {isAdmin && showSaveForm && (
          <div className="feed-card mb-4 space-y-2">
            <input
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Title (e.g. Sunday Service — Faith over fear)"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={formVideo}
              onChange={e => setFormVideo(e.target.value)}
              placeholder="YouTube link or video ID"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button
              onClick={handleSaveTeaching}
              disabled={savingForm}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
              <Save size={16} />
              {savingForm ? 'Saving...' : 'Save for rewatch'}
            </button>
          </div>
        )}

        {saved.length === 0 && (
          <p className="text-xs text-muted-foreground mb-4">No saved preaches yet. {isAdmin ? 'Add one above after a Sunday service.' : 'Check back after Sunday service 🙏'}</p>
        )}

        {saved.map(s => (
          <div key={s.id} className="feed-card">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              {isAdmin && (
                <button onClick={() => handleDeleteSaved(s.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <div className="rounded-xl overflow-hidden aspect-video bg-foreground/5 mb-2">
              <iframe
                src={`https://www.youtube.com/embed/${s.youtube_id}`}
                title={s.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {s.description && <p className="text-xs text-foreground/80 whitespace-pre-line">{s.description}</p>}
          </div>
        ))}

        {/* Past Teachings (legacy) */}
        {teachings.length > 0 && (
          <h2 className="text-base font-display font-bold text-foreground mb-3 mt-4">Past Teachings</h2>
        )}

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
