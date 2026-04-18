import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Globe, ChevronRight, Search, Loader2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TopNav from '@/components/TopNav';
import { toast } from 'sonner';

// Versions supported by bible-api.com
const VERSIONS = [
  { id: 'kjv', label: 'King James Version (KJV)' },
  { id: 'web', label: 'World English Bible (WEB)' },
  { id: 'bbe', label: 'Bible in Basic English (BBE)' },
  { id: 'oeb-us', label: 'Open English Bible (US)' },
  { id: 'clementine', label: 'Clementine Latin Vulgate' },
  { id: 'almeida', label: 'João Ferreira de Almeida (PT)' },
  { id: 'rccv', label: 'Cornilescu (RO)' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'sw', label: 'Kiswahili' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
];

const BOOKS: { name: string; chapters: number; testament: 'OT' | 'NT' }[] = [
  { name: 'Genesis', chapters: 50, testament: 'OT' }, { name: 'Exodus', chapters: 40, testament: 'OT' },
  { name: 'Leviticus', chapters: 27, testament: 'OT' }, { name: 'Numbers', chapters: 36, testament: 'OT' },
  { name: 'Deuteronomy', chapters: 34, testament: 'OT' }, { name: 'Joshua', chapters: 24, testament: 'OT' },
  { name: 'Judges', chapters: 21, testament: 'OT' }, { name: 'Ruth', chapters: 4, testament: 'OT' },
  { name: '1 Samuel', chapters: 31, testament: 'OT' }, { name: '2 Samuel', chapters: 24, testament: 'OT' },
  { name: '1 Kings', chapters: 22, testament: 'OT' }, { name: '2 Kings', chapters: 25, testament: 'OT' },
  { name: '1 Chronicles', chapters: 29, testament: 'OT' }, { name: '2 Chronicles', chapters: 36, testament: 'OT' },
  { name: 'Ezra', chapters: 10, testament: 'OT' }, { name: 'Nehemiah', chapters: 13, testament: 'OT' },
  { name: 'Esther', chapters: 10, testament: 'OT' }, { name: 'Job', chapters: 42, testament: 'OT' },
  { name: 'Psalms', chapters: 150, testament: 'OT' }, { name: 'Proverbs', chapters: 31, testament: 'OT' },
  { name: 'Ecclesiastes', chapters: 12, testament: 'OT' }, { name: 'Song of Solomon', chapters: 8, testament: 'OT' },
  { name: 'Isaiah', chapters: 66, testament: 'OT' }, { name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { name: 'Lamentations', chapters: 5, testament: 'OT' }, { name: 'Ezekiel', chapters: 48, testament: 'OT' },
  { name: 'Daniel', chapters: 12, testament: 'OT' }, { name: 'Hosea', chapters: 14, testament: 'OT' },
  { name: 'Joel', chapters: 3, testament: 'OT' }, { name: 'Amos', chapters: 9, testament: 'OT' },
  { name: 'Obadiah', chapters: 1, testament: 'OT' }, { name: 'Jonah', chapters: 4, testament: 'OT' },
  { name: 'Micah', chapters: 7, testament: 'OT' }, { name: 'Nahum', chapters: 3, testament: 'OT' },
  { name: 'Habakkuk', chapters: 3, testament: 'OT' }, { name: 'Zephaniah', chapters: 3, testament: 'OT' },
  { name: 'Haggai', chapters: 2, testament: 'OT' }, { name: 'Zechariah', chapters: 14, testament: 'OT' },
  { name: 'Malachi', chapters: 4, testament: 'OT' },
  { name: 'Matthew', chapters: 28, testament: 'NT' }, { name: 'Mark', chapters: 16, testament: 'NT' },
  { name: 'Luke', chapters: 24, testament: 'NT' }, { name: 'John', chapters: 21, testament: 'NT' },
  { name: 'Acts', chapters: 28, testament: 'NT' }, { name: 'Romans', chapters: 16, testament: 'NT' },
  { name: '1 Corinthians', chapters: 16, testament: 'NT' }, { name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { name: 'Galatians', chapters: 6, testament: 'NT' }, { name: 'Ephesians', chapters: 6, testament: 'NT' },
  { name: 'Philippians', chapters: 4, testament: 'NT' }, { name: 'Colossians', chapters: 4, testament: 'NT' },
  { name: '1 Thessalonians', chapters: 5, testament: 'NT' }, { name: '2 Thessalonians', chapters: 3, testament: 'NT' },
  { name: '1 Timothy', chapters: 6, testament: 'NT' }, { name: '2 Timothy', chapters: 4, testament: 'NT' },
  { name: 'Titus', chapters: 3, testament: 'NT' }, { name: 'Philemon', chapters: 1, testament: 'NT' },
  { name: 'Hebrews', chapters: 13, testament: 'NT' }, { name: 'James', chapters: 5, testament: 'NT' },
  { name: '1 Peter', chapters: 5, testament: 'NT' }, { name: '2 Peter', chapters: 3, testament: 'NT' },
  { name: '1 John', chapters: 5, testament: 'NT' }, { name: '2 John', chapters: 1, testament: 'NT' },
  { name: '3 John', chapters: 1, testament: 'NT' }, { name: 'Jude', chapters: 1, testament: 'NT' },
  { name: 'Revelation', chapters: 22, testament: 'NT' },
];

interface Verse { book_name: string; chapter: number; verse: number; text: string; }

type View = 'books' | 'chapters' | 'reader';

export default function BiblePage() {
  const [version, setVersion] = useState('kjv');
  const [language, setLanguage] = useState('en');
  const [view, setView] = useState<View>('books');
  const [book, setBook] = useState<typeof BOOKS[number] | null>(null);
  const [chapter, setChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Load chapter when reader is opened
  useEffect(() => {
    if (view !== 'reader' || !book) return;
    const ref = `${book.name} ${chapter}`;
    setLoading(true);
    setVerses([]);
    fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`)
      .then(r => r.json())
      .then(data => {
        if (data.verses) setVerses(data.verses);
        else toast.error('Could not load chapter');
      })
      .catch(() => toast.error('Network error loading Bible'))
      .finally(() => setLoading(false));
  }, [view, book, chapter, version]);

  const filteredBooks = BOOKS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const handleVerseClick = (v: Verse) => {
    const ref = `${v.book_name} ${v.chapter}:${v.verse}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${v.text.trim()}" — ${ref}`);
      toast.success(`${ref} copied`);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-2 py-2 px-3">
          {view === 'books' ? (
            <TopNav />
          ) : (
            <button
              onClick={() => {
                if (view === 'reader') setView('chapters');
                else if (view === 'chapters') { setView('books'); setBook(null); }
              }}
              className="p-2 -ml-1 rounded-full hover:bg-secondary"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-base sm:text-lg font-display font-bold truncate">
              {view === 'books' && 'Holy Bible'}
              {view === 'chapters' && book?.name}
              {view === 'reader' && `${book?.name} ${chapter}`}
            </h1>
          </div>
        </div>

        {view === 'books' && (
          <div className="max-w-2xl mx-auto px-3 pb-3 grid grid-cols-2 gap-2">
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERSIONS.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 text-xs">
                <Globe className="h-3 w-3 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-4">
        {/* BOOKS LIST */}
        {view === 'books' && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search a book…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {(['OT', 'NT'] as const).map(t => {
              const list = filteredBooks.filter(b => b.testament === t);
              if (!list.length) return null;
              return (
                <div key={t} className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {t === 'OT' ? 'Old Testament' : 'New Testament'}
                  </h2>
                  <Card className="divide-y divide-border overflow-hidden">
                    {list.map(b => (
                      <button
                        key={b.name}
                        onClick={() => { setBook(b); setView('chapters'); }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors text-left"
                      >
                        <span className="text-sm font-medium">{b.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">{b.chapters} ch</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </Card>
                </div>
              );
            })}
          </>
        )}

        {/* CHAPTERS GRID */}
        {view === 'chapters' && book && (
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map(n => (
              <Button
                key={n}
                variant="outline"
                onClick={() => { setChapter(n); setView('reader'); }}
                className="h-12 text-sm font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                {n}
              </Button>
            ))}
          </div>
        )}

        {/* READER */}
        {view === 'reader' && book && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
              </div>
            )}
            {!loading && verses.length > 0 && (
              <Card className="p-5 sm:p-6 leading-relaxed">
                {verses.map(v => (
                  <button
                    key={v.verse}
                    onClick={() => handleVerseClick(v)}
                    className="text-left w-full -mx-1 px-1 py-0.5 rounded hover:bg-primary/5 transition-colors group"
                  >
                    <sup className="text-[10px] font-bold text-primary mr-1 align-super">{v.verse}</sup>
                    <span className="text-[15px] text-foreground/90 group-hover:text-foreground">{v.text.trim()}</span>{' '}
                  </button>
                ))}
              </Card>
            )}

            {/* Chapter navigation */}
            {!loading && (
              <div className="flex items-center justify-between gap-3 mt-5">
                <Button
                  variant="outline"
                  disabled={chapter <= 1}
                  onClick={() => setChapter(c => c - 1)}
                  className="flex-1"
                >
                  ← Prev
                </Button>
                <span className="text-xs text-muted-foreground font-medium">
                  {chapter} / {book.chapters}
                </span>
                <Button
                  variant="outline"
                  disabled={chapter >= book.chapters}
                  onClick={() => setChapter(c => c + 1)}
                  className="flex-1"
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
