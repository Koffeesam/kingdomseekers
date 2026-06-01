import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface ProfileRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  mode: 'followers' | 'following';
  title: string;
}

const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=15';

export default function FollowListDialog({ open, onOpenChange, userId, mode, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<ProfileRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const col = mode === 'followers' ? 'following_id' : 'follower_id';
      const otherCol = mode === 'followers' ? 'follower_id' : 'following_id';
      const { data: rows } = await supabase.from('follows').select(otherCol).eq(col, userId);
      const ids = (rows ?? []).map((r: any) => r[otherCol]);
      if (ids.length === 0) {
        if (!cancelled) { setPeople([]); setLoading(false); }
        return;
      }
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, bio')
        .in('user_id', ids);
      if (!cancelled) {
        setPeople((profs ?? []) as ProfileRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId, mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No one here yet 🙏</p>
        ) : (
          <ul className="divide-y divide-border">
            {people.map(p => (
              <li key={p.user_id}>
                <Link
                  to={`/profile/${p.user_id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 py-3 hover:bg-secondary/50 rounded-lg px-2 transition"
                >
                  <img
                    src={p.avatar_url || FALLBACK_AVATAR}
                    alt={p.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">@{p.username}</p>
                    {p.bio && <p className="text-xs text-muted-foreground truncate">{p.bio}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}