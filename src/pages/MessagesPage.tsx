import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MessageCircle, Search, Edit3 } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';

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
  const [query, setQuery] = useState('');

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
  const conversations = Array.from(convoMap.values())
    .sort((a, b) => b.lastAt - a.lastAt)
    .filter(c => {
      const other = users.find(u => u.id === c.otherUserId);
      return !query || other?.username.toLowerCase().includes(query.toLowerCase());
    });

  const otherBelievers = users.filter(u => u.id !== user.id && !convoMap.has(u.id));

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-2 py-2 px-3">
          <TopNav />
          <h1 className="text-lg font-display font-bold flex-1">Messages</h1>
          <button className="p-2 rounded-full hover:bg-secondary text-primary" aria-label="New message">
            <Edit3 className="h-5 w-5" />
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search believers…"
              className="pl-9 h-10 rounded-full bg-secondary border-transparent"
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-4">
        {conversations.length === 0 && !query ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-3">
              <MessageCircle className="h-7 w-7 opacity-60" />
            </div>
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs mt-1">Start chatting with a believer below</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map(c => {
              const other = users.find(u => u.id === c.otherUserId);
              if (!other) return null;
              return (
                <li key={c.otherUserId}>
                  <Link
                    to={`/messages/${c.otherUserId}`}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary active:scale-[0.99] transition-all"
                  >
                    <div className="relative shrink-0">
                      <img src={other.avatar} alt={other.username} className="w-14 h-14 rounded-full object-cover" />
                      {c.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm truncate ${c.unread ? 'font-bold' : 'font-semibold'}`}>{other.username}</p>
                        <span className={`text-[11px] shrink-0 ${c.unread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {timeAgo(c.lastAt)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${c.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {c.lastText}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full gold-gradient text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {otherBelievers.length > 0 && !query && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Start a conversation
            </h2>
            <ul className="space-y-1">
              {otherBelievers.map(b => (
                <li key={b.id}>
                  <Link
                    to={`/messages/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-all"
                  >
                    <img src={b.avatar} alt={b.username} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{b.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.bio}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
