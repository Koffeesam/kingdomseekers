import { useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Send, Smile, Phone, Video, MoreVertical, Reply, Forward, Copy, Trash2, Flag, X, CornerUpLeft } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const { userId } = useParams();
  const { messages, users, user, sendMessage, deleteMessage, markConversationRead } = useApp();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);
  const [reportMsgId, setReportMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const other = users.find(u => u.id === userId);

  useEffect(() => {
    if (userId) markConversationRead(userId);
  }, [userId, markConversationRead]);

  const convo = messages
    .filter(m =>
      (m.fromUserId === user.id && m.toUserId === userId) ||
      (m.fromUserId === userId && m.toUserId === user.id)
    )
    .sort((a, b) => a.createdAt - b.createdAt);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [convo.length]);

  if (!other) return <Navigate to="/messages" replace />;

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(other.id, t, replyTo ?? undefined);
    setText('');
    setReplyTo(null);
  };

  const handleReply = (id: string) => {
    setReplyTo(id);
    inputRef.current?.focus();
  };

  const handleCopy = (msgText: string) => {
    navigator.clipboard?.writeText(msgText);
    toast.success('Message copied');
  };

  const handleDelete = (id: string) => {
    deleteMessage(id);
    toast.success('Message deleted');
  };

  const handleForward = (toUserId: string, msgText: string) => {
    sendMessage(toUserId, msgText);
    setForwardMsgId(null);
    toast.success('Message forwarded');
  };

  const handleReport = () => {
    setReportMsgId(null);
    toast.success('Report submitted. Our team will review it. 🙏');
  };

  const findMsg = (id: string | null) => convo.find(m => m.id === id);
  const replyMsg = findMsg(replyTo);
  const forwardMsg = findMsg(forwardMsgId);

  let lastDay = '';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="shrink-0 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-2.5 px-3">
          <Link to="/messages" className="p-2 -ml-1 rounded-full hover:bg-secondary text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <img src={other.avatar} alt={other.username} className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{other.username}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Active now</p>
            </div>
          </Link>
          <button className="p-2 rounded-full hover:bg-secondary text-primary" aria-label="Voice call"><Phone size={18} /></button>
          <button className="p-2 rounded-full hover:bg-secondary text-primary" aria-label="Video call"><Video size={18} /></button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {convo.length === 0 && (
            <div className="text-center py-12">
              <img src={other.avatar} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
              <p className="font-semibold">{other.username}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Start a Christ-centered conversation 🙏
              </p>
            </div>
          )}
          {convo.map((m, i) => {
            const mine = m.fromUserId === user.id;
            const day = dayLabel(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const prev = convo[i - 1];
            const next = convo[i + 1];
            const sameSenderPrev = prev && prev.fromUserId === m.fromUserId && !showDay;
            const sameSenderNext = next && next.fromUserId === m.fromUserId && dayLabel(next.createdAt) === day;
            const repliedTo = m.replyToId ? convo.find(c => c.id === m.replyToId) : null;

            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full font-semibold">
                      {day}
                    </span>
                  </div>
                )}
                <div className={`group flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'} ${sameSenderPrev ? 'mt-0.5' : 'mt-2'}`}>
                  {mine && (
                    <MessageMenu
                      mine
                      onReply={() => handleReply(m.id)}
                      onForward={() => setForwardMsgId(m.id)}
                      onCopy={() => handleCopy(m.text)}
                      onDelete={() => handleDelete(m.id)}
                      onReport={() => setReportMsgId(m.id)}
                    />
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2 text-[15px] shadow-sm break-words ${
                      mine
                        ? `gold-gradient text-primary-foreground rounded-2xl ${sameSenderNext ? 'rounded-br-md' : 'rounded-br-sm'}`
                        : `bg-secondary text-foreground rounded-2xl ${sameSenderNext ? 'rounded-bl-md' : 'rounded-bl-sm'}`
                    }`}
                  >
                    {repliedTo && (
                      <div className={`text-[11px] mb-1.5 pl-2 border-l-2 rounded-sm py-0.5 ${
                        mine ? 'border-primary-foreground/60 bg-primary-foreground/10' : 'border-primary bg-primary/10'
                      }`}>
                        <p className={`font-semibold ${mine ? 'text-primary-foreground/90' : 'text-primary'}`}>
                          {repliedTo.fromUserId === user.id ? 'You' : other.username}
                        </p>
                        <p className={`truncate ${mine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {repliedTo.text}
                        </p>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-snug">{m.text}</p>
                    {!sameSenderNext && (
                      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground'}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    )}
                  </div>
                  {!mine && (
                    <MessageMenu
                      mine={false}
                      onReply={() => handleReply(m.id)}
                      onForward={() => setForwardMsgId(m.id)}
                      onCopy={() => handleCopy(m.text)}
                      onReport={() => setReportMsgId(m.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply preview bar */}
      {replyMsg && (
        <div className="shrink-0 bg-background border-t border-border px-3 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3 bg-secondary rounded-xl px-3 py-2">
            <CornerUpLeft className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
              <p className="text-[11px] font-semibold text-primary">
                Replying to {replyMsg.fromUserId === user.id ? 'yourself' : other.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyMsg.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-background" aria-label="Cancel reply">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div className="flex-1 flex items-end bg-secondary rounded-3xl px-4 py-2 min-h-[44px]">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder="Message…"
              rows={1}
              maxLength={1000}
              className="flex-1 bg-transparent resize-none outline-none text-[15px] max-h-24 leading-snug"
              style={{ minHeight: '20px' }}
            />
            <button className="text-muted-foreground hover:text-primary p-1 -mr-1" aria-label="Emoji">
              <Smile size={20} />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="w-11 h-11 shrink-0 rounded-full gold-gradient text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-40 disabled:scale-95 active:scale-90 transition-all"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Forward dialog */}
      <Dialog open={!!forwardMsgId} onOpenChange={(o) => !o && setForwardMsgId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
            <DialogDescription className="truncate text-xs">"{forwardMsg?.text}"</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {users.filter(u => u.id !== user.id).map(u => (
              <li key={u.id}>
                <button
                  onClick={() => forwardMsg && handleForward(u.id, forwardMsg.text)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.bio}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={!!reportMsgId} onOpenChange={(o) => !o && setReportMsgId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>
              Help keep Kingdom Seekers a safe, faith-centered space. Why are you reporting this?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['Spam', 'Harassment or bullying', 'Inappropriate content', 'Hate speech', 'Other'].map(reason => (
              <button
                key={reason}
                onClick={handleReport}
                className="w-full text-left text-sm p-3 rounded-xl bg-secondary hover:bg-muted transition-colors font-medium"
              >
                {reason}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageMenu({
  mine, onReply, onForward, onCopy, onDelete, onReport,
}: {
  mine: boolean;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  onReport: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 p-1 rounded-full hover:bg-secondary text-muted-foreground transition-opacity"
          aria-label="Message options"
        >
          <MoreVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mine ? 'end' : 'start'} className="w-44">
        <DropdownMenuItem onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" /> Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}>
          <Forward className="h-4 w-4 mr-2" /> Forward
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="h-4 w-4 mr-2" /> Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {mine && onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        )}
        {!mine && (
          <DropdownMenuItem onClick={onReport} className="text-destructive focus:text-destructive">
            <Flag className="h-4 w-4 mr-2" /> Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
