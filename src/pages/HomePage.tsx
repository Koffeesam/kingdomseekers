import { useApp } from '@/context/AppContext';
import FeedCard from '@/components/FeedCard';
import logo from '@/assets/logo.png';

export default function HomePage() {
  const { posts } = useApp();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center py-3 px-4">
          <img src={logo} alt="Kingdom Seekers" className="w-8 h-8" />
          <h1 className="text-lg font-display font-bold ml-2 bg-gradient-to-r from-gold-dark to-primary bg-clip-text text-transparent">
            Kingdom Seekers
          </h1>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {posts.map(post => (
          <FeedCard key={post.id} post={post} />
        ))}
      </main>
    </div>
  );
}
