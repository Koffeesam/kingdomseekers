import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, Pencil, Upload as UploadIcon } from 'lucide-react';
import FeedCard from '@/components/FeedCard';
import EditProfileDialog from '@/components/EditProfileDialog';
import { User } from '@/types';

export default function ProfilePage() {
  const { posts, users, user: currentUser, followedUsers, followerCounts, followingCounts, toggleFollow, fetchProfileById } = useApp();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!userId) { setProfileUser(currentUser); return; }
      const cached = users.find(u => u.id === userId);
      if (cached) { setProfileUser(cached); return; }
      setLoading(true);
      const fetched = await fetchProfileById(userId);
      if (cancelled) return;
      setProfileUser(fetched ?? null);
      setLoading(false);
    };
    resolve();
    return () => { cancelled = true; };
  }, [userId, users, currentUser, fetchProfileById]);

  if (loading || (!profileUser && userId)) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        {loading ? (
          <Loader2 className="animate-spin text-primary" size={32} />
        ) : (
          <div className="text-center">
            <p className="text-foreground font-medium">Profile not found</p>
            <p className="text-sm text-muted-foreground mt-1">This believer may have removed their profile.</p>
            <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-muted text-foreground text-sm">Go home</Link>
          </div>
        )}
      </div>
    );
  }

  const u = profileUser ?? currentUser;
  const isOwnProfile = u.id === currentUser.id;
  const userPosts = posts.filter(p => p.userId === u.id);
  const isFollowing = followedUsers.has(u.id);
  const followers = followerCounts[u.id] ?? u.followers ?? 0;
  const following = followingCounts[u.id] ?? u.following ?? 0;

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto py-3 px-4">
          <h1 className="text-lg font-display font-bold text-center text-foreground">Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <div className="feed-card text-center mb-6">
          <img
            src={u.avatar}
            alt={u.username}
            className="profile-avatar w-24 h-24 mx-auto mb-3 object-cover rounded-full"
          />
          <h2 className="text-lg font-display font-bold text-foreground">{u.username}</h2>
          {u.bio && <p className="text-sm text-muted-foreground mt-1">{u.bio}</p>}

          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{following}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => toggleFollow(u.id)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  isFollowing
                    ? 'bg-muted text-muted-foreground'
                    : 'gold-gradient text-primary-foreground shadow-lg'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <Link
                to={`/messages/${u.id}`}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-muted text-foreground hover:bg-muted/70 transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                <MessageCircle size={16} />
                Message
              </Link>
            </div>
          )}

          {isOwnProfile && (
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => setEditOpen(true)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm gold-gradient text-primary-foreground shadow-lg active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                <Pencil size={14} /> Edit Profile
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-muted text-foreground hover:bg-muted/70 active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                <UploadIcon size={14} /> Upload Video
              </button>
            </div>
          )}
        </div>

        <h3 className="text-base font-display font-bold text-foreground mb-3">
          {isOwnProfile ? 'My Testimonies' : `${u.username}'s Testimonies`}
        </h3>

        {userPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No testimonies yet</p>
          </div>
        ) : (
          userPosts.map(post => <FeedCard key={post.id} post={post} />)
        )}
      </main>

      {isOwnProfile && <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}
