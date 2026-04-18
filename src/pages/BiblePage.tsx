import { useState } from 'react';
import { ArrowLeft, BookOpen, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

const VERSIONS = [
  { id: 'KJV', label: 'King James Version (KJV)' },
  { id: 'NIV', label: 'New International Version (NIV)' },
  { id: 'ESV', label: 'English Standard Version (ESV)' },
  { id: 'NKJV', label: 'New King James Version (NKJV)' },
  { id: 'NLT', label: 'New Living Translation (NLT)' },
  { id: 'AMP', label: 'Amplified Bible (AMP)' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'sw', label: 'Kiswahili' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
  { id: 'de', label: 'Deutsch' },
];

const SAMPLE_VERSES: Record<string, { ref: string; text: string }[]> = {
  KJV: [
    { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  ],
  NIV: [
    { ref: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
    { ref: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.' },
    { ref: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  ],
  ESV: [
    { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
    { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
    { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' },
  ],
};

export default function BiblePage() {
  const [version, setVersion] = useState('KJV');
  const [language, setLanguage] = useState('en');
  const verses = SAMPLE_VERSES[version] || SAMPLE_VERSES.KJV;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Holy Bible</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <Card className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bible Version</label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERSIONS.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
              <Globe className="h-3 w-3" /> Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold px-1">Featured Verses ({version})</h2>
          {verses.map(v => (
            <Card key={v.ref} className="p-4 border-l-4 border-l-primary">
              <p className="text-sm font-semibold text-primary mb-1">{v.ref}</p>
              <p className="text-sm leading-relaxed text-foreground/90 italic">"{v.text}"</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
