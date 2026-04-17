import { useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Send } from 'lucide-react';

function timeLabel(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/messages" className="text-muted-foreground"><ArrowLeft size={20} /></Link>
          <Link to={`/profile/${other.id}`} className="flex items-center gap-2 flex-1">
            <img src={other.avatar} alt={other.username} className="w-9 h-9 rounded-full object-cover border border-border" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{other.username}</p>
              <p className="text-[10px] text-muted-foreground">Believer · Online</p>
            </div>
          </Link>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-lg w-full mx-auto space-y-2">
        {convo.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-10">
            Start a Christ-centered conversation with {other.username} 🙏
          </p>
        )}
        {convo.map(m => {
          const mine = m.fromUserId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                mine
                  ? 'gold-gradient text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[9px] mt-0.5 text-right ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-lg border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Type a message…"
            maxLength={500}
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="w-11 h-11 rounded-full gold-gradient text-primary-foreground flex items-center justify-center shadow disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
