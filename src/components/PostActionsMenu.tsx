import { useState } from 'react';
import { MoreHorizontal, Copy, Forward, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLang } from '@/context/LanguageContext';

export default function PostActionsMenu({ post }: { post: Post }) {
  const { user, users, deletePost, sendMessage } = useApp();
  const { t } = useLang();
  const [forwardOpen, setForwardOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOwner = post.userId === user.id;

  const buildShareText = () => {
    const base = `📖 ${post.username} on Kingdom Seekers:\n\n${post.content}`;
    return post.videoUrl ? `${base}\n\n🎥 ${post.videoUrl}` : base;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success(t('copied'));
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    await deletePost(post.id);
    toast.success(t('deleted'));
  };

  const handleForward = async (toUserId: string) => {
    await sendMessage(toUserId, { text: buildShareText() });
    setForwardOpen(false);
    toast.success(t('send') + ' ✓');
  };

  const otherUsers = users.filter(u => u.id !== user.id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Post actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
            <Copy className="h-4 w-4" /> {t('copy')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setForwardOpen(true)} className="gap-2 cursor-pointer">
            <Forward className="h-4 w-4" /> {t('forward')}
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              onClick={() => setConfirmOpen(true)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> {t('delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Forward dialog */}
      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('forward_to')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-2">
            {otherUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No contacts yet</p>
            ) : (
              otherUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleForward(u.id)}
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

      {/* Delete confirm */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}