import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ksfLogo from '@/assets/ksf-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
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
    // Mock auth - navigates after short delay
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* Background watermark logo */}
      <img
        src={ksfLogo}
        alt=""
        className="absolute inset-0 w-full h-full object-contain opacity-[0.04] pointer-events-none select-none scale-150"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <img src={ksfLogo} alt="Kingdom Seekers Fellowship" className="w-24 h-24 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-gold-dark to-primary bg-clip-text text-transparent">
            Kingdom Seekers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Share your faith. Build community.</p>
        </div>

        {/* Form Card */}
        <div className="feed-card">
          <h2 className="text-lg font-display font-bold text-foreground text-center mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={30}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={255}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={128}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm gold-gradient text-primary-foreground shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Sign Up ✝️' : 'Sign In ✝️'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          "Seek ye first the Kingdom of God" — Matthew 6:33
        </p>
      </div>
    </div>
  );
}
