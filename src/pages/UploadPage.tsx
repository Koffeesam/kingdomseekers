import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
  const { addPost } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'text' | 'video'>('text');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addPost(mode, content.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContent('');
      navigate('/');
    }, 1500);
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
        {/* Mode Toggle */}
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
            <Camera size={18} /> Video
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
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <Camera size={48} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Camera recording will be available with backend integration.</p>
              <p className="text-xs text-muted-foreground mt-1">For now, write a caption for your video testimony.</p>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Add a caption for your video..."
              rows={4}
              maxLength={500}
              className="w-full bg-card border border-border rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-right">{content.length}/{mode === 'text' ? 1000 : 500}</p>

        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="w-full mt-4 py-3.5 rounded-xl font-semibold text-sm gold-gradient text-primary-foreground shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
        >
          Share Testimony ✝️
        </button>

        {/* Content Guidelines */}
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
