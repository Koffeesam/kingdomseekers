import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLang } from '@/context/LanguageContext';

interface Props {
  post: Post;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * Reusable dialog to forward (re-share) a post or testimony to a fellow believer
 * via direct messages. Used from FeedCard, VideosPage (Reels) and elsewhere.
 */
export default function SharePostDialog({ post, open, onOpenChange }: Props) {
  const { user, users, sendMessage } = useApp();
  const { t } = useLang();

  const buildShareText = () => {
    const base = `📖 ${post.username} on Kingdom Seekers:\n\n${post.content}`;
    return post.videoUrl ? `${base}\n\n🎥 ${post.videoUrl}` : base;
  };

  const handleSend = async (toUserId: string) => {
    await sendMessage(toUserId, { text: buildShareText() });
    onOpenChange(false);
    toast.success(t('shared'));
  };

  const otherUsers = users.filter(u => u.id !== user.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('share_with_believer')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto -mx-2">
          {otherUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No contacts yet</p>
          ) : (
            otherUsers.map(u => (
              <button
                key={u.id}
                onClick={() => handleSend(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-left"
              >
                <img src={u.avatar} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                <span className="text-sm font-medium text-foreground">{u.username}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}