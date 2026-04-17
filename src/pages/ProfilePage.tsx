import { useApp } from '@/context/AppContext';
import { useParams } from 'react-router-dom';
import FeedCard from '@/components/FeedCard';

export default function ProfilePage() {
  const { posts, users, user: currentUser, followedUsers, toggleFollow } = useApp();
  const { userId } = useParams();

  const profileUser = userId ? users.find(u => u.id === userId) || currentUser : currentUser;
  const isOwnProfile = profileUser.id === currentUser.id;
  const userPosts = posts.filter(p => p.userId === profileUser.id);
  const isFollowing = followedUsers.has(profileUser.id);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto py-3 px-4">
          <h1 className="text-lg font-display font-bold text-center text-foreground">Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        {/* Profile Card */}
        <div className="feed-card text-center mb-6">
          <img
            src={profileUser.avatar}
            alt={profileUser.username}
            className="profile-avatar w-24 h-24 mx-auto mb-3"
          />
          <h2 className="text-lg font-display font-bold text-foreground">{profileUser.username}</h2>
          <p className="text-sm text-muted-foreground mt-1">{profileUser.bio}</p>

          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{profileUser.followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{profileUser.following}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={() => toggleFollow(profileUser.id)}
              className={`mt-4 px-8 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                isFollowing
                  ? 'bg-muted text-muted-foreground'
                  : 'gold-gradient text-primary-foreground shadow-lg'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        {/* User Posts */}
        <h3 className="text-base font-display font-bold text-foreground mb-3">
          {isOwnProfile ? 'My Testimonies' : `${profileUser.username}'s Testimonies`}
        </h3>

        {userPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No testimonies yet</p>
          </div>
        ) : (
          userPosts.map(post => <FeedCard key={post.id} post={post} />)
        )}
      </main>
    </div>
  );
}
