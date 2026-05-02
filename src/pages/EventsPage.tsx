import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type EventTag = 'Service' | 'Prayer' | 'Youth' | 'Outreach' | 'Conference';
type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  tag: EventTag;
  starts_at: string;
  created_by: string;
};

const TAGS: EventTag[] = ['Service', 'Prayer', 'Youth', 'Outreach', 'Conference'];
const tagStyles: Record<EventTag, string> = {
  Service: 'bg-primary/15 text-primary',
  Prayer: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  Youth: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  Outreach: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Conference: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
function isThisWeek(d: Date) {
  const start = today();
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}
const fmtDate = (d: Date) => d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function EventCard({ event, isAdmin, onDelete }: { event: EventRow; isAdmin: boolean; onDelete: (id: string) => void }) {
  const date = new Date(event.starts_at);
  return (
    <article className="card-soft overflow-hidden p-0 relative">
      <div className="flex">
        <div className="shrink-0 w-20 gold-gradient text-primary-foreground flex flex-col items-center justify-center py-4">
          <p className="text-[11px] uppercase font-bold tracking-wider opacity-90">
            {date.toLocaleDateString([], { month: 'short' })}
          </p>
          <p className="text-3xl font-display font-bold leading-none mt-1">{date.getDate()}</p>
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base leading-tight truncate">{event.title}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[event.tag] ?? tagStyles.Service}`}>
              {event.tag}
            </span>
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock size={11} /> {fmtTime(date)}</span>
            {event.location && (
              <span className="flex items-center gap-1 truncate"><MapPin size={11} /> {event.location}</span>
            )}
          </div>
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={() => onDelete(event.id)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-destructive hover:bg-destructive hover:text-destructive-foreground transition"
          aria-label="Delete event"
        >
          <Trash2 size={14} />
        </button>
      )}
    </article>
  );
}

export default function EventsPage() {
  const { isAdmin, session } = useApp();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', location: '', tag: 'Service' as EventTag,
    date: '', time: '',
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('starts_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order('starts_at', { ascending: true });
    if (error) console.error(error);
    setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleCreate = async () => {
    if (!session?.user) return;
    if (!form.title.trim() || !form.date || !form.time) {
      toast.error('Title, date and time are required');
      return;
    }
    const startsAt = new Date(`${form.date}T${form.time}`);
    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      tag: form.tag,
      starts_at: startsAt.toISOString(),
      created_by: session.user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Event created');
    setOpen(false);
    setForm({ title: '', description: '', location: '', tag: 'Service', date: '', time: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Event removed');
  };

  const thisWeek = events.filter(e => isThisWeek(new Date(e.starts_at)));
  const upcoming = events.filter(e => !isThisWeek(new Date(e.starts_at)));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary"><ArrowLeft size={20} /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Events
            </h1>
            <p className="text-[11px] text-muted-foreground">What's happening this week & beyond</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus size={16} /> New</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tag</Label>
                    <Select value={form.tag} onValueChange={(v) => setForm({ ...form, tag: v as EventTag })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Publish</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events scheduled yet.</p>
            {isAdmin && <p className="text-xs text-muted-foreground mt-1">Tap "New" to publish one.</p>}
          </div>
        ) : (
          <>
            {thisWeek.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> This Week
                </h2>
                <div className="space-y-3">
                  {thisWeek.map(e => (
                    <div key={e.id}>
                      <p className="text-[11px] font-bold text-primary mb-1.5">{fmtDate(new Date(e.starts_at))}</p>
                      <EventCard event={e} isAdmin={isAdmin} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map(e => (
                    <div key={e.id}>
                      <p className="text-[11px] font-bold text-primary mb-1.5">{fmtDate(new Date(e.starts_at))}</p>
                      <EventCard event={e} isAdmin={isAdmin} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}