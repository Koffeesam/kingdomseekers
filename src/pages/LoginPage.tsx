import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Cross, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ksfLogo from '@/assets/ksf-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !username.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login();
      navigate('/', { replace: true });
    }, 900);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center px-5 py-10">
      {/* Cathedral-inspired background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse at 50% 100%, hsl(var(--primary) / 0.10), transparent 55%)',
        }}
        aria-hidden="true"
      />
      {/* Stained-glass beams */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-72 opacity-[0.08] blur-3xl pointer-events-none"
        style={{ background: 'conic-gradient(from 200deg at 50% 50%, hsl(var(--primary)), transparent 30%, hsl(var(--primary)) 60%, transparent 90%)' }}
        aria-hidden="true"
      />
      {/* Faint logo watermark */}
      <img
        src={ksfLogo}
        alt=""
        className="absolute inset-0 m-auto w-[120%] max-w-none object-contain opacity-[0.035] pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand mark */}
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
            {isSignUp
              ? 'Create an account to share your testimony and grow in faith.'
              : 'Sign in to continue your walk with the Kingdom community.'}
          </p>
        </div>

        {/* Glass card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" aria-hidden="true" />
          <div className="relative rounded-3xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    maxLength={30}
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  maxLength={255}
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-muted/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  maxLength={128}
                />
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <button type="button" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
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

            <p className="text-xs text-muted-foreground text-center mt-5">
              {isSignUp ? 'Already part of the family?' : 'New to Kingdom Seekers?'}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline"
              >
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
