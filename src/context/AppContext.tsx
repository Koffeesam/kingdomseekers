import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Post, User, Teaching, Story, DirectMessage } from '@/types';
import { mockPosts, mockUsers, mockTeachings, mockStories, mockMessages, currentUser } from '@/data/mockData';

interface AppContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  users: User[];
  teachings: Teaching[];
  setTeachings: React.Dispatch<React.SetStateAction<Teaching[]>>;
  stories: Story[];
  addStory: (content: string, bgColor: string) => void;
  markStoryViewed: (storyId: string) => void;
  user: User;
  followedUsers: Set<string>;
  toggleFollow: (userId: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addPost: (type: 'text' | 'video', content: string) => void;
  messages: DirectMessage[];
  sendMessage: (toUserId: string, text: string) => void;
  markConversationRead: (otherUserId: string) => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [teachings, setTeachings] = useState<Teaching[]>(mockTeachings);
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ksf_auth') === '1';
  });

  // Expire stories older than 24h
  useEffect(() => {
    const prune = () => {
      const now = Date.now();
      setStories(prev => prev.filter(s => now - s.createdAt < STORY_TTL_MS));
    };
    prune();
    const id = setInterval(prune, 60_000);
    return () => clearInterval(id);
  }, []);

  const login = () => {
    localStorage.setItem('ksf_auth', '1');
    setIsAuthenticated(true);
  };
  const logout = () => {
    localStorage.removeItem('ksf_auth');
    setIsAuthenticated(false);
  };

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

  const addStory = (content: string, bgColor: string) => {
    const newStory: Story = {
      id: `s${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      content,
      bgColor,
      createdAt: Date.now(),
      viewed: false,
    };
    setStories(prev => [newStory, ...prev]);
  };

  const markStoryViewed = (storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true } : s));
  };

  return (
    <AppContext.Provider value={{
      posts, setPosts, users: mockUsers, teachings, setTeachings,
      stories, addStory, markStoryViewed,
      user: currentUser, followedUsers, toggleFollow, toggleLike, addComment, addPost,
      isAuthenticated, login, logout,
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
