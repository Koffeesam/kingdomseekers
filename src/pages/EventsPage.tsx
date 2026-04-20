import { ArrowLeft, Calendar, MapPin, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

type Event = {
  id: string;
  title: string;
  date: Date;
  location: string;
  description: string;
  tag: 'Service' | 'Prayer' | 'Youth' | 'Outreach' | 'Conference';
};

// Helpers to build dates relative to today
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (n: number, h = 9, m = 0) => {
  const d = today(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d;
};
const nextDayOfWeek = (target: number, h = 9, m = 0) => {
  const d = today();
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff); d.setHours(h, m, 0, 0); return d;
};

const events: Event[] = [
  { id: '1', title: 'Sunday Worship Service', date: nextDayOfWeek(0, 9, 0), location: 'KSF Thika Road Sanctuary', description: 'Join us for praise, worship and the Word. All believers welcome.', tag: 'Service' },
  { id: '2', title: 'Midweek Prayer Night', date: nextDayOfWeek(3, 18, 30), location: 'KSF Thika Road', description: 'A powerful night of intercession and breakthrough prayer.', tag: 'Prayer' },
  { id: '3', title: 'Youth Fire Friday', date: nextDayOfWeek(5, 18, 0), location: 'KSF Youth Hall', description: 'Worship, teaching and fellowship for the next generation.', tag: 'Youth' },
  { id: '4', title: 'Saturday Outreach', date: nextDayOfWeek(6, 8, 0), location: 'Thika Town Center', description: 'Sharing the gospel and meeting community needs together.', tag: 'Outreach' },
  { id: '5', title: 'Kingdom Seekers Conference', date: addDays(14, 9, 0), location: 'KSF Main Auditorium', description: '3-day conference with guest ministers and worship sessions.', tag: 'Conference' },
];

const tagStyles: Record<Event['tag'], string> = {
  Service: 'bg-primary/15 text-primary',
  Prayer: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  Youth: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  Outreach: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Conference: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

function isThisWeek(d: Date) {
  const start = today();
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function EventCard({ event }: { event: Event }) {
  const dayNum = event.date.getDate();
  const monthShort = event.date.toLocaleDateString([], { month: 'short' });

  return (
    <article className="card-soft overflow-hidden p-0">
      <div className="flex">
        <div className="shrink-0 w-20 gold-gradient text-primary-foreground flex flex-col items-center justify-center py-4">
          <p className="text-[11px] uppercase font-bold tracking-wider opacity-90">{monthShort}</p>
          <p className="text-3xl font-display font-bold leading-none mt-1">{dayNum}</p>
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base leading-tight truncate">{event.title}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[event.tag]}`}>
              {event.tag}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(event.date)}</span>
            <span className="flex items-center gap-1 truncate"><MapPin size={11} /> {event.location}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const thisWeek = sorted.filter(e => isThisWeek(e.date));
  const upcoming = sorted.filter(e => !isThisWeek(e.date));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary"><ArrowLeft size={20} /></Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Events
            </h1>
            <p className="text-[11px] text-muted-foreground">What's happening this week & beyond</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> This Week
          </h2>
          {thisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No events scheduled this week.</p>
          ) : (
            <div className="space-y-3">
              {thisWeek.map(e => (
                <div key={e.id}>
                  <p className="text-[11px] font-bold text-primary mb-1.5">{formatDate(e.date)}</p>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">More events coming soon 🙏</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(e => (
                <div key={e.id}>
                  <p className="text-[11px] font-bold text-primary mb-1.5">{formatDate(e.date)}</p>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
