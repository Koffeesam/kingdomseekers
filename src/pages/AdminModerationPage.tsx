import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, X, FileText, Link2 as LinkIcon, Video, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface PendingPost {
  id: string;
  user_id: string;
  type: string;
  content: string;
  status: string;
  image_url: string | null;
  video_url: string | null;
  document_url: string | null;
  document_name: string | null;
  link_url: string | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

export default function AdminModerationPage() {
  const { isAdmin, authReady } = useApp();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('posts')
      .select('id, user_id, type, content, status, image_url, video_url, document_url, document_name, link_url, created_at')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    const ids = Array.from(new Set((rows ?? []).map(r => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', ids)
      : { data: [] as any[] } as any;
    const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    setPosts(((rows ?? []) as any[]).map(r => ({
      ...r,
      username: profMap.get(r.user_id)?.username ?? 'believer',
      avatar_url: profMap.get(r.user_id)?.avatar_url ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  if (!authReady) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    const prev = posts;
    setPosts(p => p.filter(x => x.id !== id));
    const { error } = await supabase.from('posts').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
      setPosts(prev);
      return;
    }
    toast({ title: status === 'approved' ? 'Post approved' : 'Post rejected' });
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'video') return <Video className="h-4 w-4" />;
    if (type === 'image') return <ImageIcon className="h-4 w-4" />;
    if (type === 'document') return <FileText className="h-4 w-4" />;
    if (type === 'link') return <LinkIcon className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-2 py-3 px-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-lg font-bold">Moderation</h1>
        </div>
        <div className="max-w-lg mx-auto px-3 pb-3 flex gap-2">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {loading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No {filter} posts.</p>
        )}
        {posts.map(p => (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">@{p.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
                <TypeIcon type={p.type} /> {p.type}
              </span>
            </div>

            {p.content && <p className="text-sm whitespace-pre-wrap break-words">{p.content}</p>}
            {p.image_url && (
              <img src={p.image_url} alt="" className="rounded-lg max-h-72 w-full object-cover" />
            )}
            {p.video_url && (
              <video src={p.video_url} controls className="rounded-lg w-full max-h-72" />
            )}
            {p.document_url && (
              <a
                href={p.document_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline break-all"
              >
                {p.document_name || p.document_url}
              </a>
            )}
            {p.link_url && (
              <a
                href={p.link_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline break-all"
              >
                {p.link_url}
              </a>
            )}

            {filter === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => moderate(p.id, 'approved')}
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => moderate(p.id, 'rejected')}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
            {filter === 'rejected' && (
              <Button size="sm" variant="outline" onClick={() => moderate(p.id, 'approved')}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            )}
            {filter === 'approved' && (
              <Button size="sm" variant="outline" onClick={() => moderate(p.id, 'rejected')}>
                <X className="h-4 w-4" /> Take down
              </Button>
            )}
          </Card>
        ))}
      </main>
    </div>
  );
}