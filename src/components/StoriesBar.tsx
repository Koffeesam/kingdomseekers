import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, X, Send } from 'lucide-react';

const BG_OPTIONS = [
  'from-amber-500 to-orange-600',
  'from-purple-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-700',
  'from-yellow-400 to-amber-600',
];

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h`;
}

export default function StoriesBar() {
  const { stories, user, addStory, markStoryViewed } = useApp();
  const [creating, setCreating] = useState(false);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BG_OPTIONS[0]);

  const myStories = stories.filter(s => s.userId === user.id);
  const otherStories = stories.filter(s => s.userId !== user.id);
  const ordered = [...myStories, ...otherStories];

  const submit = () => {
    if (!text.trim()) return;
    addStory(text.trim(), bg);
    setText('');
    setBg(BG_OPTIONS[0]);
    setCreating(false);
  };

  const openStory = (idx: number) => {
    setViewingIdx(idx);
    markStoryViewed(ordered[idx].id);
  };

  const current = viewingIdx !== null ? ordered[viewingIdx] : null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 px-1 -mx-1 scrollbar-none">
        {/* Add your story */}
        <button
          onClick={() => setCreating(true)}
          className="flex flex-col items-center gap-1.5 shrink-0 w-16"
        >
          <div className="relative">
            <img src={user.avatar} alt="You" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full gold-gradient flex items-center justify-center border-2 border-background shadow">
              <Plus size={14} className="text-primary-foreground" />
            </span>
          </div>
          <span className="text-[10px] text-foreground font-medium truncate w-full text-center">Your story</span>
        </button>

        {ordered.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => openStory(idx)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-16"
          >
            <div className={`p-[2px] rounded-full ${s.viewed ? 'bg-muted' : 'gold-gradient'}`}>
              <div className="bg-background p-[2px] rounded-full">
                <img src={s.avatar} alt={s.username} className="w-14 h-14 rounded-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] text-foreground truncate w-full text-center">{s.username}</span>
          </button>
        ))}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={() => setCreating(false)} className="text-muted-foreground"><X size={22} /></button>
            <span className="text-sm font-display font-bold">New Story</span>
            <button onClick={submit} disabled={!text.trim()} className="text-primary font-semibold text-sm disabled:opacity-40">
              Share
            </button>
          </div>

          <div className={`flex-1 bg-gradient-to-br ${bg} flex items-center justify-center p-6`}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Share what's on your heart…"
              maxLength={180}
              className="w-full max-w-sm bg-transparent text-white placeholder:text-white/60 text-2xl font-display font-bold text-center outline-none resize-none"
              rows={5}
              autoFocus
            />
          </div>

          <div className="p-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Background</p>
            <div className="flex gap-2 overflow-x-auto">
              {BG_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setBg(opt)}
                  className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${opt} ${bg === opt ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                  aria-label="Choose background"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewer */}
      {current && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setViewingIdx(null)}>
          <div className="flex items-center gap-3 p-4 text-white" onClick={e => e.stopPropagation()}>
            <img src={current.avatar} alt={current.username} className="w-9 h-9 rounded-full border border-white/40" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{current.username}</p>
              <p className="text-[10px] opacity-70">{timeAgo(current.createdAt)}</p>
            </div>
            <button onClick={() => setViewingIdx(null)}><X size={22} /></button>
          </div>
          <div className={`flex-1 bg-gradient-to-br ${current.bgColor} flex items-center justify-center p-8`}>
            <p className="text-white text-2xl font-display font-bold text-center max-w-sm">{current.content}</p>
          </div>
          <div className="p-4 flex gap-2" onClick={e => e.stopPropagation()}>
            <input
              placeholder={`Reply to ${current.username}…`}
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-full px-4 py-2.5 text-sm outline-none"
            />
            <button className="text-white"><Send size={18} /></button>
          </div>
        </div>
      )}
    </>
  );
}
