import { useState } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send, Play, Trash2 } from 'lucide-react';
import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import PostActionsMenu from '@/components/PostActionsMenu';
import AvatarViewer from '@/components/AvatarViewer';
import SharePostDialog from '@/components/SharePostDialog';
import { useLang } from '@/context/LanguageContext';

export default function FeedCard({ post }: { post: Post }) {
  const { toggleLike, addComment, deleteComment, user } = useApp();
  const { t } = useLang();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <article className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 mb-4 overflow-hidden animate-slide-up">
      {/* Subtle top gold accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={() => setAvatarOpen(true)}
          className="relative shrink-0 rounded-full p-[2px] bg-gradient-to-br from-primary via-accent to-primary shadow-md hover:scale-105 active:scale-95 transition"
          aria-label={`View ${post.username} avatar`}
        >
          <img
            src={post.avatar}
            alt={post.username}
            className="w-11 h-11 rounded-full object-cover border-2 border-card"
          />
        </button>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${post.userId}`}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
          >
            {post.username}
          </Link>
          <p className="text-[11px] text-muted-foreground">{post.timestamp}</p>
        </div>
        <PostActionsMenu post={post} />
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line px-4 pt-3">
          {post.content}
        </p>
      )}

      {post.type === 'video' && post.videoUrl && (
        <div className="relative mt-3 mx-4 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-secondary group/video">
          <video
            src={post.videoUrl}
            controls
            playsInline
            className="w-full aspect-[9/16] max-h-[460px] object-cover"
            preload="metadata"
          />
          {post.videoCategory === 'short' && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
              <Play className="h-2.5 w-2.5 fill-current" /> SHORT
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 mt-3 pt-2 mx-2 border-t border-border/60">
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all active:scale-95 ${
            post.liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Heart
            size={20}
            className={post.liked ? 'fill-accent text-accent animate-in zoom-in-50' : ''}
          />
          <span className={post.liked ? 'font-semibold' : ''}>{post.likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle size={20} />
          <span>{post.comments.length}</span>
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
          aria-label={t('share')}
        >
          <Send size={18} />
          <span className="hidden sm:inline">{t('share')}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mx-4 mt-2 mb-4 pt-3 border-t border-border/60 space-y-3">
          {post.comments.map(c => {
            const canDelete = c.userId === user.id || post.userId === user.id;
            return (
              <div key={c.id} className="flex gap-2 group/comment">
                <img src={c.avatar} alt={c.username} className="w-7 h-7 rounded-full object-cover" />
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{c.username}</p>
                  <p className="text-xs text-foreground/80 break-words">{c.text}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="opacity-0 group-hover/comment:opacity-100 focus:opacity-100 transition text-muted-foreground hover:text-destructive p-1 self-center"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 items-center">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder={t('write_comment')}
              className="flex-1 bg-muted rounded-full px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleComment} className="text-primary hover:text-primary/80 transition-colors p-1">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <AvatarViewer
        src={post.avatar}
        username={post.username}
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
      />
    </article>
  );
}
