import { useState } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';

export default function FeedCard({ post }: { post: Post }) {
  const { toggleLike, addComment } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <article className="feed-card animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.userId}`}>
          <img src={post.avatar} alt={post.username} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
        </Link>
        <div>
          <Link to={`/profile/${post.userId}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
            {post.username}
          </Link>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 text-foreground whitespace-pre-line">{post.content}</p>

      {post.type === 'video' && post.videoUrl && (
        <div className="rounded-xl overflow-hidden mb-3 bg-foreground/5">
          <video
            src={post.videoUrl}
            controls
            className="w-full aspect-[9/16] max-h-[400px] object-cover"
            preload="metadata"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button
          onClick={() => toggleLike(post.id)}
          className="flex items-center gap-1.5 text-sm transition-all active:scale-110"
        >
          <Heart
            size={20}
            className={post.liked ? 'fill-accent text-accent' : 'text-muted-foreground'}
          />
          <span className={post.liked ? 'text-accent font-medium' : 'text-muted-foreground'}>{post.likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageCircle size={20} />
          <span>{post.comments.length}</span>
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <img src={c.avatar} alt={c.username} className="w-7 h-7 rounded-full object-cover" />
              <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-foreground">{c.username}</p>
                <p className="text-xs text-foreground/80">{c.text}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 bg-muted rounded-full px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleComment} className="text-primary hover:text-primary/80 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
