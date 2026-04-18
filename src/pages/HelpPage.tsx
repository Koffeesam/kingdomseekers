import { ArrowLeft, HelpCircle, Mail, MessageCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  { q: 'How do I post a testimony?', a: 'Tap the + Upload tab in the bottom navigation, choose text or video, and share what God is doing in your life.' },
  { q: 'How do I post a story?', a: 'On the home feed, tap the "Your Story" circle at the top of the stories bar to write a short faith update. Stories disappear after 24 hours.' },
  { q: 'How do I message another believer?', a: 'Visit their profile and tap "Message", or open the Chats tab from the bottom navigation.' },
  { q: 'How do I watch live teachings?', a: 'Open the Live tab — teachings stream directly from Pastor Essollom Karanja and KSF Thika Road.' },
  { q: 'Can I change the Bible version or language?', a: 'Yes — open the Bible from the top-left menu and choose your preferred version and language.' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <HelpCircle className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Help & Support</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <Card className="p-4">
          <h2 className="font-display font-semibold mb-3">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-display font-semibold">Contact us</h2>
          <a href="mailto:support@kingdomseekers.app" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Email support</p>
              <p className="text-xs text-muted-foreground">support@kingdomseekers.app</p>
            </div>
          </a>
          <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Community chat</p>
              <p className="text-xs text-muted-foreground">Reach out to fellow believers</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Community Guidelines</p>
            <p className="text-xs text-muted-foreground mt-1">Kingdom Seekers is a faith-centered community. Content that is immoral, explicit, or harmful is not permitted. Let's lift each other up in love.</p>
          </div>
        </Card>
      </main>
    </div>
  );
}
