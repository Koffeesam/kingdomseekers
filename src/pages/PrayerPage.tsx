import { ArrowLeft, HandHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export default function PrayerPage() {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <HandHeart className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Today's Prayer</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground px-1">{today}</p>

        <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30">
          <h2 className="font-display text-xl font-bold mb-4">A Prayer for Today</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
{`Heavenly Father,

Thank You for the gift of this new day. I surrender every moment, every thought, and every step into Your loving hands. Fill me with Your Spirit, guide my words, and let Your light shine through me.

Strengthen the weary, comfort the broken, and draw the lost closer to Your heart. Give me a humble heart to serve, a kind tongue to encourage, and eyes that see others the way You see them.

May Your name be glorified in everything I do today.

In Jesus' mighty name,
Amen. 🙏`}
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
