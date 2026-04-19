import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Cross, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import ksfLogo from '@/assets/ksf-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

const signUpSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().trim().email('Enter a valid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const parsed = signUpSchema.safeParse({ username, email, password });
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: parsed.data.username, display_name: parsed.data.username },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes('already')) toast.error('That email is already registered. Try signing in.');
          else toast.error(error.message);
          return;
        }
        toast.success('Account created! Check your inbox to confirm your email. 🙏');
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            toast.error('Please confirm your email first. Check your inbox.');
          } else if (error.message.toLowerCase().includes('invalid')) {
            toast.error('Invalid email or password.');
          } else toast.error(error.message);
          return;
        }
        toast.success('Welcome home! 🕊️');
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/`,
    });
    if (error) {
      toast.error(`Could not sign in with ${provider}. ${error.message ?? ''}`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse at 50% 100%, hsl(var(--primary) / 0.10), transparent 55%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-72 opacity-[0.08] blur-3xl pointer-events-none"
        style={{ background: 'conic-gradient(from 200deg at 50% 50%, hsl(var(--primary)), transparent 30%, hsl(var(--primary)) 60%, transparent 90%)' }}
        aria-hidden="true"
      />
      <img src={ksfLogo} alt="" className="absolute inset-0 m-auto w-[120%] max-w-none object-contain opacity-[0.035] pointer-events-none select-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" aria-hidden="true" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-card to-muted border border-primary/20 shadow-2xl flex items-center justify-center">
              <img src={ksfLogo} alt="Kingdom Seekers Fellowship" className="w-20 h-20 object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary mb-2">
            <Cross size={12} />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase">Kingdom Seekers</span>
            <Cross size={12} />
          </div>
          <h1 className="text-3xl font-display font-bold text-center bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
            {isSignUp ? 'Join the Fellowship' : 'Welcome Home'}
          </h1>
          <p className="text-xs text-muted-foreground mt-2 text-center max-w-[260px]">
            {isSignUp ? 'Create an account to share your testimony and grow in faith.' : 'Sign in to continue your walk with the Kingdom community.'}
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" aria-hidden="true" />
          <div className="relative rounded-3xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Username" maxLength={30} autoComplete="username"
                    className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" maxLength={255} autoComplete="email"
                  className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" maxLength={128}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm gold-gradient text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98] hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    {isSignUp ? 'Create Account' : 'Enter Sanctuary'}
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button" disabled={!!oauthLoading} onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {oauthLoading === 'google' ? '…' : 'Google'}
              </button>
              <button
                type="button" disabled={!!oauthLoading} onClick={() => handleOAuth('apple')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-3.16 2.58-4.68 2.7-4.75-1.47-2.15-3.76-2.45-4.58-2.48-1.95-.2-3.8 1.15-4.79 1.15-.99 0-2.51-1.12-4.13-1.09-2.13.03-4.09 1.24-5.18 3.14-2.21 3.84-.57 9.51 1.59 12.62 1.05 1.52 2.31 3.23 3.95 3.17 1.59-.07 2.19-1.03 4.11-1.03 1.93 0 2.46 1.03 4.14 1 1.71-.03 2.79-1.55 3.83-3.08 1.21-1.77 1.71-3.49 1.74-3.58-.04-.02-3.34-1.28-3.38-5.07zM13.94 3.6c.87-1.06 1.46-2.53 1.3-4-1.25.05-2.77.83-3.67 1.89-.81.94-1.51 2.44-1.32 3.88 1.4.11 2.82-.71 3.69-1.77z"/></svg>
                {oauthLoading === 'apple' ? '…' : 'Apple'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-5">
              {isSignUp ? 'Already part of the family?' : 'New to Kingdom Seekers?'}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80 text-center mt-6 italic font-display">
          “Seek ye first the Kingdom of God” — Matthew 6:33
        </p>
      </div>
    </div>
  );
}
