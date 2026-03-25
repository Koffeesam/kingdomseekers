import { createContext, useContext, useState, ReactNode } from 'react';
import { Post, User, Teaching } from '@/types';
import { mockPosts, mockUsers, mockTeachings, currentUser } from '@/data/mockData';

interface AppContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  users: User[];
  teachings: Teaching[];
  setTeachings: React.Dispatch<React.SetStateAction<Teaching[]>>;
  user: User;
  followedUsers: Set<string>;
  toggleFollow: (userId: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addPost: (type: 'text' | 'video', content: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [teachings, setTeachings] = useState<Teaching[]>(mockTeachings);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const toggleFollow = (userId: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const addComment = (postId: string, text: string) => {
    const newComment = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'just now',
    };
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
  };

  const addPost = (type: 'text' | 'video', content: string) => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      type,
      content,
      likes: 0,
      liked: false,
      comments: [],
      timestamp: 'just now',
    };
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      posts, setPosts, users: mockUsers, teachings, setTeachings,
      user: currentUser, followedUsers, toggleFollow, toggleLike, addComment, addPost,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
