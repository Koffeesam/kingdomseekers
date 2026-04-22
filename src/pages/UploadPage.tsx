import { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, FileText, CheckCircle, X, Upload as UploadIcon, Film, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

type UploadMode = 'text' | 'short' | 'reel';

const probeVideoDuration = (file: File): Promise<number> => new Promise((resolve) => {
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.preload = 'metadata';
  v.src = url;
  v.onloadedmetadata = () => { const d = v.duration || 0; URL.revokeObjectURL(url); resolve(d); };
  v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
});

export default function UploadPage() {
  const { addPost, session } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<UploadMode>('text');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelected = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error('Video must be under 100 MB');
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    const dur = await probeVideoDuration(file);
    setVideoDuration(dur);
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(0);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isVideoMode = mode === 'short' || mode === 'reel';

  const handleSubmit = async () => {
    if (mode === 'text') {
      if (!content.trim()) return;
      addPost('text', content.trim());
      finish();
      return;
    }

    // video mode (short or reel — user explicitly picked)
    if (!videoFile) { toast.error('Please record or pick a video first'); return; }
    if (!session?.user) { toast.error('You need to be signed in'); return; }

    const file = videoFile;
    const caption = content.trim();
    const category: 'short' | 'reel' = mode === 'reel' ? 'reel' : 'short';
    const duration = videoDuration;
    const destination = category === 'reel' ? '/videos' : '/';
    const userId = session.user.id;

    toast.message('Uploading testimony…', {
      description: category === 'reel' ? 'Your reel will appear in Videos shortly' : 'Your short will appear on Home shortly',
    });
    finish(destination);

    (async () => {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from('testimony-videos')
          .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('testimony-videos').getPublicUrl(path);
        await addPost('video', caption, publicUrl, { videoCategory: category, videoDuration: duration });
        toast.success(category === 'reel' ? 'Reel posted to Videos ✓' : 'Short posted to Home ✓');
      } catch (e: any) {
        console.error('upload error', e);
        toast.error(e?.message || 'Upload failed');
      }
    })();
  };

  const finish = (to: string = '/') => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContent('');
      clearVideo();
      navigate(to);
    }, 900);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-20 px-4">
        <div className="gold-gradient w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-slide-up">
          <CheckCircle size={40} className="text-primary-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">Testimony Shared!</h2>
        <p className="text-sm text-muted-foreground mt-2">Your testimony has been posted to the community.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto py-3 px-4">
          <h1 className="text-lg font-display font-bold text-center text-foreground">Share Your Testimony</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              mode === 'text' ? 'gold-gradient text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'
            }`}
          >
            <FileText size={18} /> Text
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              mode === 'video' ? 'gold-gradient text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Video size={18} /> Video
          </button>
        </div>

        {mode === 'text' ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share what God has done in your life..."
            rows={8}
            maxLength={1000}
            className="w-full bg-card border border-border rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        ) : (
          <div className="space-y-4">
            {videoPreview ? (
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
                <video src={videoPreview} controls className="w-full max-h-[60vh] bg-black" />
                <button
                  onClick={clearVideo}
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 backdrop-blur"
                  aria-label="Remove video"
                >
                  <X size={16} />
                </button>
                <div className="px-3 py-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {videoFile?.name} · {videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) : '0'} MB
                  </span>
                  {videoDuration > 0 && (
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                      isReel ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent-foreground'
                    }`}>
                      {isReel ? <Film size={12} /> : <Clock size={12} />}
                      {isReel ? `Reel · ${Math.round(videoDuration)}s` : `Short · ${Math.round(videoDuration)}s`}
                    </span>
                  )}
                </div>
                <p className="px-3 pb-2 text-[11px] text-muted-foreground">
                  {isReel
                    ? '60s+ videos go to the Videos page (reels).'
                    : 'Under 60s videos appear on the Home feed (shorts).'}
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                <Camera size={40} className="text-primary" />
                <p className="text-sm text-foreground font-medium">Record or upload a short video testimony</p>
                <p className="text-xs text-muted-foreground">Up to 100 MB · Shorts (&lt;60s) → Home · Reels (60s+) → Videos</p>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gold-gradient text-primary-foreground font-medium text-sm shadow-lg active:scale-[0.98]"
                  >
                    <Camera size={16} /> Record
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground font-medium text-sm active:scale-[0.98]"
                  >
                    <UploadIcon size={16} /> Upload
                  </button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="video/*"
                  capture="user"
                  className="hidden"
                  onChange={e => handleVideoSelected(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => handleVideoSelected(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Add a caption for your video (optional)..."
              rows={3}
              maxLength={500}
              className="w-full bg-card border border-border rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-right">
          {content.length}/{mode === 'text' ? 1000 : 500}
        </p>

        <button
          onClick={handleSubmit}
          disabled={mode === 'text' ? !content.trim() : !videoFile}
          className="w-full mt-4 py-3.5 rounded-xl font-semibold text-sm gold-gradient text-primary-foreground shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Share Testimony ✝️
        </button>

        <div className="mt-6 bg-muted/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-foreground mb-2">📋 Content Guidelines</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Share faith-based, uplifting content only</li>
            <li>• No explicit, immoral, or harmful messages</li>
            <li>• Be respectful and encouraging</li>
            <li>• Content may be reviewed by moderators</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
