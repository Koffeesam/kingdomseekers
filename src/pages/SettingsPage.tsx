import { useEffect, useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Moon, Bell, Globe, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Easier on the eyes</p>
              </div>
            </div>
            <Switch checked={dark} onCheckedChange={setDark} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Prayers, messages, live alerts</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between p-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-muted-foreground">App display language</p>
              </div>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Kiswahili</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </main>
    </div>
  );
}
