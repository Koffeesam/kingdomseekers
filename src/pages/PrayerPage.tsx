import { useEffect, useState } from 'react';
import { ArrowLeft, HandHeart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const DEFAULT_PRAYER = `Heavenly Father,

Thank You for the gift of this new day. I surrender every moment, every thought, and every step into Your loving hands. Fill me with Your Spirit, guide my words, and let Your light shine through me.

Strengthen the weary, comfort the broken, and draw the lost closer to Your heart. Give me a humble heart to serve, a kind tongue to encourage, and eyes that see others the way You see them.

May Your name be glorified in everything I do today.

In Jesus' mighty name,
Amen. 🙏`;

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function PrayerPage() {
  const { isAdmin, session } = useApp();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const [prayer, setPrayer] = useState<string>(DEFAULT_PRAYER);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');

  useEffect(() => {
    supabase.from('daily_content').select('body').eq('for_date', todayKey()).eq('kind', 'prayer').maybeSingle()
      .then(({ data }) => { if (data?.body) setPrayer(data.body); });
  }, []);

  const handlePublish = async () => {
    if (!session?.user || !body.trim()) { toast.error('Add a prayer'); return; }
    const { error } = await supabase.from('daily_content').upsert({
      kind: 'prayer', for_date: todayKey(), body: body.trim(), created_by: session.user.id,
    }, { onConflict: 'kind,for_date' });
    if (error) { toast.error(error.message); return; }
    setPrayer(body.trim());
    setOpen(false);
    setBody('');
    toast.success("Today's prayer published");
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <HandHeart className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold flex-1">Today's Prayer</h1>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus size={14} /> Publish</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Publish today's prayer</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label>Prayer</Label>
                  <Textarea rows={8} value={body} onChange={e => setBody(e.target.value)} />
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

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground px-1">{today}</p>

        <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30">
          <h2 className="font-display text-xl font-bold mb-4">A Prayer for Today</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
{prayer}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-accent">
          <h3 className="font-display font-bold mb-2">Scripture for Reflection</h3>
          <p className="text-sm italic leading-relaxed">"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."</p>
          <p className="text-xs font-semibold text-primary mt-2">— Philippians 4:6</p>
        </Card>
      </main>
    </div>
  );
}
