import { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { stories, user, addStory, deleteStory, markStoryViewed, session } = useApp();
  const [creating, setCreating] = useState(false);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BG_OPTIONS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const myStories = stories.filter(s => s.userId === user.id);
  const otherStories = stories.filter(s => s.userId !== user.id);
  const ordered = [...myStories, ...otherStories];

  const reset = () => { setText(''); setBg(BG_OPTIONS[0]); setImageFile(null); setImagePreview(null); setCreating(false); };

  const submit = async () => {
    if (!session?.user) { toast.error('Please sign in'); return; }
    if (!text.trim() && !imageFile) return;
    setPosting(true);
    try {
      let mediaUrl: string | undefined;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const path = `${session.user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('stories-media').upload(path, imageFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('stories-media').getPublicUrl(path);
        mediaUrl = data.publicUrl;
      }
      await addStory({
        content: text.trim() || undefined,
        bgColor: bg,
        mediaUrl,
        mediaType: imageFile ? 'image' : 'text',
      });
      toast.success('Story shared 🙏');
      reset();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Failed to share story');
    } finally {
      setPosting(false);
    }
  };

  const onPickImage = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const openStory = (idx: number) => { setViewingIdx(idx); markStoryViewed(ordered[idx].id); };
  const current = viewingIdx !== null ? ordered[viewingIdx] : null;
  const canDeleteCurrent = current?.userId === user.id;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 px-1 -mx-1 scrollbar-none">
        <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
          <div className="relative">
            <img src={user.avatar} alt="You" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full gold-gradient flex items-center justify-center border-2 border-background shadow">
              <Plus size={14} className="text-primary-foreground" />
            </span>
          </div>
          <span className="text-[10px] text-foreground font-medium truncate w-full text-center">Your story</span>
        </button>

        {ordered.map((s, idx) => (
          <button key={s.id} onClick={() => openStory(idx)} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
            <div className={`p-[2px] rounded-full ${s.viewed ? 'bg-muted' : 'gold-gradient'}`}>
              <div className="bg-background p-[2px] rounded-full">
                <img src={s.avatar} alt={s.username} className="w-14 h-14 rounded-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] text-foreground truncate w-full text-center">{s.username}</span>
          </button>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={reset} className="text-muted-foreground" disabled={posting}><X size={22} /></button>
            <span className="text-sm font-display font-bold">New Story</span>
            <button onClick={submit} disabled={posting || (!text.trim() && !imageFile)} className="text-primary font-semibold text-sm disabled:opacity-40">
              {posting ? 'Sharing…' : 'Share'}
            </button>
          </div>

          <div className={`flex-1 ${imagePreview ? 'bg-black' : `bg-gradient-to-br ${bg}`} flex items-center justify-center p-6 relative`}>
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="" className="max-h-full max-w-full object-contain" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2">
                  <X size={16} />
                </button>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a caption…" maxLength={120}
                  className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur text-white placeholder:text-white/60 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none" rows={2} />
              </>
            ) : (
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share what's on your heart…"
                maxLength={180} rows={5} autoFocus
                className="w-full max-w-sm bg-transparent text-white placeholder:text-white/60 text-2xl font-display font-bold text-center outline-none resize-none" />
            )}
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickImage(e.target.files?.[0])} />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                <ImageIcon size={16} /> {imageFile ? 'Change photo' : 'Add photo'}
              </button>
            </div>
            {!imagePreview && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Background</p>
                <div className="flex gap-2 overflow-x-auto">
                  {BG_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setBg(opt)}
                      className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${opt} ${bg === opt ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      aria-label="Choose background" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {current && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setViewingIdx(null)}>
          <div className="flex items-center gap-3 p-4 text-white" onClick={e => e.stopPropagation()}>
            <img src={current.avatar} alt={current.username} className="w-9 h-9 rounded-full border border-white/40" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{current.username}</p>
              <p className="text-[10px] opacity-70">{timeAgo(current.createdAt)}</p>
            </div>
            {canDeleteCurrent && (
              <button onClick={async () => { await deleteStory(current.id); setViewingIdx(null); toast.success('Story deleted'); }} className="p-2 text-white/80 hover:text-white">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={() => setViewingIdx(null)}><X size={22} /></button>
          </div>
          {current.mediaType === 'image' && current.mediaUrl ? (
            <div className="flex-1 flex items-center justify-center p-2 relative">
              <img src={current.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
              {current.content && (
                <p className="absolute bottom-6 left-6 right-6 text-white text-base font-medium text-center bg-black/40 backdrop-blur rounded-xl px-4 py-2">
                  {current.content}
                </p>
              )}
            </div>
          ) : (
            <div className={`flex-1 bg-gradient-to-br ${current.bgColor} flex items-center justify-center p-8`}>
              <p className="text-white text-2xl font-display font-bold text-center max-w-sm">{current.content}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
