import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Post, User, Teaching, Story, DirectMessage } from '@/types';
import { mockPosts, mockUsers, mockTeachings, mockStories } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

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
  sendMessage: (toUserId: string, text: string, replyToId?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markConversationRead: (otherUserId: string) => Promise<void>;
  isAuthenticated: boolean;
  authReady: boolean;
  session: Session | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=15';

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [teachings, setTeachings] = useState<Teaching[]>(mockTeachings);
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);

  // ---- Auth bootstrap (listener BEFORE getSession) ----
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- Load profiles (everyone) once we have a session ----
  const loadProfiles = useCallback(async (uid: string | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, bio, avatar_url')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('loadProfiles error', error);
      return;
    }
    const mapped: User[] = (data ?? []).map(p => ({
      id: p.user_id,
      username: p.username,
      avatar: p.avatar_url || FALLBACK_AVATAR,
      bio: p.bio || '',
      followers: 0,
      following: 0,
    }));
    setProfiles(mapped);
    if (uid) {
      const mine = mapped.find(u => u.id === uid);
      if (mine) setMe(mine);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfiles([]);
      setMe(null);
      setMessages([]);
      return;
    }
    loadProfiles(session.user.id);
  }, [session, loadProfiles]);

  // ---- Load DMs for current user + realtime ----
  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;

    const load = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('load messages error', error);
        return;
      }
      setMessages((data ?? []).map(m => ({
        id: m.id,
        fromUserId: m.from_user_id,
        toUserId: m.to_user_id,
        text: m.text,
        createdAt: new Date(m.created_at).getTime(),
        read: m.read,
        replyToId: m.reply_to_id ?? undefined,
      })));
    };
    load();

    const channel = supabase
      .channel('dm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m: any = payload.new;
          if (m.from_user_id !== uid && m.to_user_id !== uid) return;
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, {
            id: m.id, fromUserId: m.from_user_id, toUserId: m.to_user_id, text: m.text,
            createdAt: new Date(m.created_at).getTime(), read: m.read, replyToId: m.reply_to_id ?? undefined,
          }]);
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(x => x.id !== (payload.old as any).id));
        } else if (payload.eventType === 'UPDATE') {
          const m: any = payload.new;
          setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read: m.read } : x));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  // ---- Stories TTL ----
  useEffect(() => {
    const prune = () => setStories(prev => prev.filter(s => Date.now() - s.createdAt < STORY_TTL_MS));
    prune();
    const id = setInterval(prune, 60_000);
    return () => clearInterval(id);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ---- Mock-state helpers (posts/stories) ----
  const fallbackUser: User = me ?? {
    id: session?.user.id ?? 'guest',
    username: session?.user.email?.split('@')[0] ?? 'believer',
    avatar: FALLBACK_AVATAR,
    bio: '',
    followers: 0,
    following: 0,
  };

  const toggleFollow = (userId: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
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
      userId: fallbackUser.id,
      username: fallbackUser.username,
      avatar: fallbackUser.avatar,
      text,
      timestamp: 'just now',
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const addPost = (type: 'text' | 'video', content: string) => {
    setPosts(prev => [{
      id: `p${Date.now()}`,
      userId: fallbackUser.id,
      username: fallbackUser.username,
      avatar: fallbackUser.avatar,
      type, content,
      likes: 0, liked: false, comments: [], timestamp: 'just now',
    }, ...prev]);
  };

  const addStory = (content: string, bgColor: string) => {
    setStories(prev => [{
      id: `s${Date.now()}`,
      userId: fallbackUser.id,
      username: fallbackUser.username,
      avatar: fallbackUser.avatar,
      content, bgColor, createdAt: Date.now(), viewed: false,
    }, ...prev]);
  };

  const markStoryViewed = (storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true } : s));
  };

  // ---- Real DM operations ----
  const sendMessage = async (toUserId: string, text: string, replyToId?: string) => {
    if (!session?.user) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('direct_messages').insert({
      from_user_id: session.user.id,
      to_user_id: toUserId,
      text: trimmed,
      reply_to_id: replyToId ?? null,
    });
    if (error) console.error('sendMessage error', error);
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) console.error('deleteMessage error', error);
  };

  const markConversationRead = async (otherUserId: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('to_user_id', session.user.id)
      .eq('from_user_id', otherUserId)
      .eq('read', false);
    if (error) console.error('markConversationRead error', error);
  };

  // Combine real profiles (others) with mock users so existing UI keeps working.
  // Real profiles take precedence for IDs that are real UUIDs.
  const users: User[] = profiles.length > 0 ? profiles : mockUsers;

  return (
    <AppContext.Provider value={{
      posts, setPosts, users, teachings, setTeachings,
      stories, addStory, markStoryViewed,
      messages, sendMessage, deleteMessage, markConversationRead,
      user: fallbackUser, followedUsers, toggleFollow, toggleLike, addComment, addPost,
      isAuthenticated: !!session, authReady, session, logout,
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
