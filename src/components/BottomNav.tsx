import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Radio, UserCircle, Film } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/videos', icon: Film, label: 'Videos' },
  { to: '/upload', icon: PlusCircle, label: 'Upload' },
  { to: '/live', icon: Radio, label: 'Live' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className={`nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className="relative">
                <Icon size={22} />
                {label === 'Live' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-live animate-pulse-live" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
