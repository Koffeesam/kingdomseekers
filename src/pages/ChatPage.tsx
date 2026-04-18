import { useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Send, Smile, Phone, Video } from 'lucide-react';

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
  const { messages, users, user, sendMessage, markConversationRead } = useApp();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    sendMessage(other.id, t);
    setText('');
  };

  // Group by day
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
          <button className="p-2 rounded-full hover:bg-secondary text-primary"><Phone size={18} /></button>
          <button className="p-2 rounded-full hover:bg-secondary text-primary"><Video size={18} /></button>
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

            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full font-semibold">
                      {day}
                    </span>
                  </div>
                )}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${sameSenderPrev ? 'mt-0.5' : 'mt-2'}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 text-[15px] shadow-sm break-words ${
                      mine
                        ? `gold-gradient text-primary-foreground rounded-2xl ${sameSenderNext ? 'rounded-br-md' : 'rounded-br-sm'}`
                        : `bg-secondary text-foreground rounded-2xl ${sameSenderNext ? 'rounded-bl-md' : 'rounded-bl-sm'}`
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-snug">{m.text}</p>
                    {!sameSenderNext && (
                      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground'}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div className="flex-1 flex items-end bg-secondary rounded-3xl px-4 py-2 min-h-[44px]">
            <textarea
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
    </div>
  );
}
