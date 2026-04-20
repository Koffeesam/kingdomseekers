import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Post, User, Teaching, Story, DirectMessage, DMAttachmentType } from '@/types';
import { mockPosts, mockUsers, mockTeachings } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface SendMessageOptions {
  text?: string;
  replyToId?: string;
  attachment?: { url: string; type: DMAttachmentType; name?: string; size?: number };
}

interface AppContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  users: User[];
  teachings: Teaching[];
  setTeachings: React.Dispatch<React.SetStateAction<Teaching[]>>;
  stories: Story[];
  addStory: (input: { content?: string; bgColor: string; mediaUrl?: string; mediaType: 'text' | 'image' }) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  markStoryViewed: (storyId: string) => Promise<void>;
  user: User;
  followedUsers: Set<string>;
  followerCounts: Record<string, number>;
  followingCounts: Record<string, number>;
  toggleFollow: (userId: string) => Promise<void>;
  fetchProfileById: (userId: string) => Promise<User | null>;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addPost: (type: 'text' | 'video', content: string, videoUrl?: string) => void;
  messages: DirectMessage[];
  sendMessage: (toUserId: string, opts: SendMessageOptions) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markConversationRead: (otherUserId: string) => Promise<void>;
  isAuthenticated: boolean;
  authReady: boolean;
  session: Session | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=15';

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [teachings, setTeachings] = useState<Teaching[]>(mockTeachings);
  const [stories, setStories] = useState<Story[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);

  // ---- Auth bootstrap ----
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- Load profiles ----
  const loadProfiles = useCallback(async (uid: string | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, bio, avatar_url')
      .order('created_at', { ascending: false });
    if (error) { console.error('loadProfiles error', error); return; }
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
      setProfiles([]); setMe(null); setMessages([]); setStories([]); setViewedStoryIds(new Set());
      return;
    }
    loadProfiles(session.user.id);
  }, [session, loadProfiles]);

  // ---- Load DMs + realtime ----
  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;

    const mapDm = (m: any): DirectMessage => ({
      id: m.id,
      fromUserId: m.from_user_id,
      toUserId: m.to_user_id,
      text: m.text,
      createdAt: new Date(m.created_at).getTime(),
      read: m.read,
      replyToId: m.reply_to_id ?? undefined,
      attachmentUrl: m.attachment_url ?? undefined,
      attachmentType: m.attachment_type ?? undefined,
      attachmentName: m.attachment_name ?? undefined,
      attachmentSize: m.attachment_size ?? undefined,
    });

    const load = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order('created_at', { ascending: true });
      if (error) { console.error('load messages error', error); return; }
      setMessages((data ?? []).map(mapDm));
    };
    load();

    const channel = supabase
      .channel('dm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m: any = payload.new;
          if (m.from_user_id !== uid && m.to_user_id !== uid) return;
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, mapDm(m)]);
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

  // ---- Load stories + view history + realtime ----
  const loadStories = useCallback(async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('id, user_id, content, bg_color, media_url, media_type, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) { console.error('loadStories error', error); return; }

    // Resolve usernames/avatars from profiles
    const userIds = Array.from(new Set((data ?? []).map(s => s.user_id)));
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
    const profMap = new Map((profs ?? []).map(p => [p.user_id, p]));

    const mapped: Story[] = (data ?? []).map(s => {
      const p = profMap.get(s.user_id);
      return {
        id: s.id,
        userId: s.user_id,
        username: p?.username ?? 'believer',
        avatar: p?.avatar_url || FALLBACK_AVATAR,
        content: s.content ?? '',
        bgColor: s.bg_color,
        mediaUrl: s.media_url ?? undefined,
        mediaType: (s.media_type as 'text' | 'image') ?? 'text',
        createdAt: new Date(s.created_at).getTime(),
        expiresAt: new Date(s.expires_at).getTime(),
        viewed: viewedStoryIds.has(s.id),
      };
    });
    setStories(mapped);
  }, [viewedStoryIds]);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;

    // Load my view history
    supabase.from('story_views').select('story_id').eq('viewer_id', uid).then(({ data }) => {
      setViewedStoryIds(new Set((data ?? []).map(v => v.story_id)));
    });

    loadStories();

    const ch = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => loadStories())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, (payload) => {
        const id = (payload.old as any).id;
        setStories(prev => prev.filter(s => s.id !== id));
      })
      .subscribe();

    // Re-prune every minute
    const prune = setInterval(() => {
      setStories(prev => prev.filter(s => s.expiresAt > Date.now()));
    }, 60_000);

    return () => { supabase.removeChannel(ch); clearInterval(prune); };
  }, [session, loadStories]);

  const logout = async () => { await supabase.auth.signOut(); setSession(null); };

  const fallbackUser: User = me ?? {
    id: session?.user.id ?? 'guest',
    username: session?.user.email?.split('@')[0] ?? 'believer',
    avatar: FALLBACK_AVATAR,
    bio: '', followers: 0, following: 0,
  };

  // followers map: { [userId]: count } based on follows table
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [followingCounts, setFollowingCounts] = useState<Record<string, number>>({});

  // Load my follows + global follow counts
  const loadFollows = useCallback(async (uid: string) => {
    const [{ data: mine }, { data: all }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', uid),
      supabase.from('follows').select('follower_id, following_id'),
    ]);
    setFollowedUsers(new Set((mine ?? []).map(r => r.following_id)));
    const followers: Record<string, number> = {};
    const following: Record<string, number> = {};
    (all ?? []).forEach(r => {
      followers[r.following_id] = (followers[r.following_id] ?? 0) + 1;
      following[r.follower_id] = (following[r.follower_id] ?? 0) + 1;
    });
    setFollowerCounts(followers);
    setFollowingCounts(following);
  }, []);

  useEffect(() => {
    if (!session?.user) { setFollowedUsers(new Set()); setFollowerCounts({}); setFollowingCounts({}); return; }
    loadFollows(session.user.id);
    const ch = supabase.channel('follows-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => loadFollows(session.user.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, loadFollows]);

  const toggleFollow = async (userId: string) => {
    if (!session?.user || userId === session.user.id) return;
    const isFollowing = followedUsers.has(userId);
    // Optimistic update
    setFollowedUsers(prev => { const n = new Set(prev); isFollowing ? n.delete(userId) : n.add(userId); return n; });
    setFollowerCounts(prev => ({ ...prev, [userId]: Math.max(0, (prev[userId] ?? 0) + (isFollowing ? -1 : 1)) }));
    setFollowingCounts(prev => ({ ...prev, [session.user.id]: Math.max(0, (prev[session.user.id] ?? 0) + (isFollowing ? -1 : 1)) }));
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete()
        .eq('follower_id', session.user.id).eq('following_id', userId);
      if (error) { console.error('unfollow error', error); loadFollows(session.user.id); }
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: session.user.id, following_id: userId });
      if (error) { console.error('follow error', error); loadFollows(session.user.id); }
    }
  };

  // Fetch a single profile by id (for visiting profiles not yet in cache)
  const fetchProfileById = async (userId: string): Promise<User | null> => {
    const cached = profiles.find(p => p.id === userId);
    if (cached) return cached;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, bio, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const u: User = {
      id: data.user_id,
      username: data.username,
      avatar: data.avatar_url || FALLBACK_AVATAR,
      bio: data.bio || '',
      followers: 0,
      following: 0,
    };
    setProfiles(prev => prev.some(p => p.id === u.id) ? prev : [...prev, u]);
    return u;
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };
  const addComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, {
      id: `c${Date.now()}`, userId: fallbackUser.id, username: fallbackUser.username,
      avatar: fallbackUser.avatar, text, timestamp: 'just now',
    }] } : p));
  };
  const addPost = (type: 'text' | 'video', content: string, videoUrl?: string) => {
    setPosts(prev => [{
      id: `p${Date.now()}`, userId: fallbackUser.id, username: fallbackUser.username, avatar: fallbackUser.avatar,
      type, content, videoUrl, likes: 0, liked: false, comments: [], timestamp: 'just now',
    }, ...prev]);
  };

  // ---- Stories ops ----
  const addStory = async (input: { content?: string; bgColor: string; mediaUrl?: string; mediaType: 'text' | 'image' }) => {
    if (!session?.user) return;
    const { error } = await supabase.from('stories').insert({
      user_id: session.user.id,
      content: input.content ?? null,
      bg_color: input.bgColor,
      media_url: input.mediaUrl ?? null,
      media_type: input.mediaType,
    });
    if (error) { console.error('addStory error', error); throw error; }
    await loadStories();
  };

  const deleteStory = async (storyId: string) => {
    const { error } = await supabase.from('stories').delete().eq('id', storyId);
    if (error) console.error('deleteStory error', error);
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const markStoryViewed = async (storyId: string) => {
    if (!session?.user) return;
    if (viewedStoryIds.has(storyId)) return;
    setViewedStoryIds(prev => new Set(prev).add(storyId));
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true } : s));
    await supabase.from('story_views').insert({ story_id: storyId, viewer_id: session.user.id });
  };

  // ---- DM ops ----
  const sendMessage = async (toUserId: string, opts: SendMessageOptions) => {
    if (!session?.user) return;
    const text = (opts.text ?? '').trim();
    if (!text && !opts.attachment) return;
    const { error } = await supabase.from('direct_messages').insert({
      from_user_id: session.user.id,
      to_user_id: toUserId,
      text: text || (opts.attachment?.type === 'image' ? '📷 Photo' : opts.attachment?.type === 'audio' ? '🎤 Voice note' : opts.attachment ? '📎 File' : ''),
      reply_to_id: opts.replyToId ?? null,
      attachment_url: opts.attachment?.url ?? null,
      attachment_type: opts.attachment?.type ?? null,
      attachment_name: opts.attachment?.name ?? null,
      attachment_size: opts.attachment?.size ?? null,
    });
    if (error) console.error('sendMessage error', error);
  };
  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) console.error('deleteMessage error', error);
  };
  const markConversationRead = async (otherUserId: string) => {
    if (!session?.user) return;
    await supabase.from('direct_messages').update({ read: true })
      .eq('to_user_id', session.user.id).eq('from_user_id', otherUserId).eq('read', false);
  };

  const users: User[] = profiles.length > 0 ? profiles : mockUsers;

  return (
    <AppContext.Provider value={{
      posts, setPosts, users, teachings, setTeachings,
      stories, addStory, deleteStory, markStoryViewed,
      messages, sendMessage, deleteMessage, markConversationRead,
      user: fallbackUser, followedUsers, followerCounts, followingCounts, toggleFollow, fetchProfileById, toggleLike, addComment, addPost,
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
