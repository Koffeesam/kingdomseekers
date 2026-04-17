import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import ksfLogo from '@/assets/ksf-logo.png';

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesPage() {
  const { messages, users, user } = useApp();

  // Group messages into conversations by the other participant
  const convoMap = new Map<string, { otherUserId: string; lastText: string; lastAt: number; unread: number }>();
  for (const m of messages) {
    if (m.fromUserId !== user.id && m.toUserId !== user.id) continue;
    const otherId = m.fromUserId === user.id ? m.toUserId : m.fromUserId;
    const existing = convoMap.get(otherId);
    if (!existing || m.createdAt > existing.lastAt) {
      convoMap.set(otherId, {
        otherUserId: otherId,
        lastText: m.text,
        lastAt: m.createdAt,
        unread: (existing?.unread ?? 0) + (m.toUserId === user.id && !m.read ? 1 : 0),
      });
    } else if (m.toUserId === user.id && !m.read) {
      existing.unread += 1;
    }
  }
  const conversations = Array.from(convoMap.values()).sort((a, b) => b.lastAt - a.lastAt);

  return (
    <div className="min-h-screen pb-20 relative">
      <img src={ksfLogo} alt="" className="fixed inset-0 w-full h-full object-contain opacity-[0.03] pointer-events-none select-none scale-125 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="text-muted-foreground"><ArrowLeft size={20} /></Link>
          <h1 className="text-lg font-display font-bold text-foreground flex-1 text-center pr-7">Messages</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4">
        {conversations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Visit a believer's profile and tap Message</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl bg-card border border-border overflow-hidden">
            {conversations.map(c => {
              const other = users.find(u => u.id === c.otherUserId);
              if (!other) return null;
              return (
                <li key={c.otherUserId}>
                  <Link to={`/messages/${c.otherUserId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <img src={other.avatar} alt={other.username} className="w-12 h-12 rounded-full object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{other.username}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastAt)}</span>
                      </div>
                      <p className={`text-xs truncate ${c.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{c.lastText}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 rounded-full gold-gradient text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
