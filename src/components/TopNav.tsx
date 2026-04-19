import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, BookOpen, MessageCircle, Sparkles, HandHeart, Settings, HelpCircle, LogOut, Camera } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import ksfLogo from '@/assets/ksf-logo.png';

const menuItems = [
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/stories', icon: Camera, label: 'Stories' },
  { to: '/bible', icon: BookOpen, label: 'Bible' },
  { to: '/motivation', icon: Sparkles, label: 'Daily Motivation' },
  { to: '/prayer', icon: HandHeart, label: "Today's Prayer" },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const { logout, messages, user } = useApp();
  const navigate = useNavigate();
  const unread = messages.filter(m => m.toUserId === user.id && !m.read).length;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-secondary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border bg-gradient-to-br from-secondary to-background">
          <div className="flex items-center gap-3">
            <img src={ksfLogo} alt="" className="w-10 h-10" />
            <div className="text-left">
              <SheetTitle className="font-display text-lg bg-gradient-to-r from-gold-dark to-primary bg-clip-text text-transparent">
                Kingdom Seekers
              </SheetTitle>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-secondary transition-colors relative"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span>{label}</span>
              {label === 'Messages' && unread > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full gold-gradient text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
