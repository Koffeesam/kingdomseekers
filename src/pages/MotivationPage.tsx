import { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles, HandHeart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const MOTIVATIONS = [
  { verse: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."' },
  { verse: 'Isaiah 40:31', text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary.' },
  { verse: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { verse: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' },
];

const PRAYER = {
  title: "Today's Prayer",
  body: `Heavenly Father,

Thank You for the gift of this new day. I surrender every moment, every thought, and every step into Your loving hands. Fill me with Your Spirit, guide my words, and let Your light shine through me.

Strengthen the weary, comfort the broken, and draw the lost closer to Your heart. May Your name be glorified in everything I do today.

In Jesus' mighty name, Amen. 🙏`,
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function MotivationPage() {
  const { isAdmin, session } = useApp();
  const [override, setOverride] = useState<{ body: string; reference: string | null } | null>(null);
  const [prayerOverride, setPrayerOverride] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: 'motivation' as 'motivation' | 'prayer', body: '', reference: '' });

  // Day index — rotates automatically every day
  const dayIndex = Math.floor(Date.now() / 86_400_000) % MOTIVATIONS.length;
  const baseToday = MOTIVATIONS[dayIndex];
  const today = override ? { text: override.body, verse: override.reference || '' } : baseToday;

  useEffect(() => {
    const date = todayKey();
    supabase.from('daily_content').select('kind, body, reference').eq('for_date', date).then(({ data }) => {
      const m = data?.find(d => d.kind === 'motivation');
      const p = data?.find(d => d.kind === 'prayer');
      if (m) setOverride({ body: m.body, reference: m.reference });
      if (p) setPrayerOverride(p.body);
    });
  }, []);

  const handlePublish = async () => {
    if (!session?.user || !form.body.trim()) {
      toast.error('Please add some content');
      return;
    }
    const { error } = await supabase.from('daily_content').upsert({
      kind: form.kind,
      for_date: todayKey(),
      body: form.body.trim(),
      reference: form.reference.trim() || null,
      created_by: session.user.id,
    }, { onConflict: 'kind,for_date' });
    if (error) { toast.error(error.message); return; }
    toast.success('Published for today');
    if (form.kind === 'motivation') setOverride({ body: form.body.trim(), reference: form.reference.trim() });
    else setPrayerOverride(form.body.trim());
    setOpen(false);
    setForm({ kind: 'motivation', body: '', reference: '' });
  };

  const prayerBody = prayerOverride ?? PRAYER.body;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold flex-1">Daily Motivation</h1>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus size={14} /> Publish</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Publish for today</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <div className="flex gap-2 mt-1">
                      {(['motivation','prayer'] as const).map(k => (
                        <Button key={k} type="button" size="sm" variant={form.kind === k ? 'default' : 'outline'}
                          onClick={() => setForm({ ...form, kind: k })}>
                          {k === 'motivation' ? 'Motivation' : 'Prayer'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Body</Label>
                    <Textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
                  </div>
                  {form.kind === 'motivation' && (
                    <div>
                      <Label>Verse reference (optional)</Label>
                      <Input placeholder="e.g. Psalm 23:1" value={form.reference}
                        onChange={e => setForm({ ...form, reference: e.target.value })} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handlePublish}>Publish</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Today */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Today's Word</span>
          </div>
          <p className="font-display text-lg leading-relaxed mb-3">{today.text}</p>
          {today.verse && <p className="text-sm font-semibold text-gold-dark">— {today.verse}</p>}
        </Card>

        {/* Today's Prayer */}
        <Card className="p-6 border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-3">
            <HandHeart className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">{PRAYER.title}</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{prayerBody}</p>
        </Card>

        {/* More motivations */}
        <div>
          <h2 className="font-display text-base font-semibold px-1 mb-3">More Encouragement</h2>
          <div className="space-y-3">
            {MOTIVATIONS.filter((_, i) => i !== dayIndex).map(m => (
              <Card key={m.verse} className="p-4">
                <p className="text-sm leading-relaxed italic mb-2">"{m.text}"</p>
                <p className="text-xs font-semibold text-primary">— {m.verse}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
