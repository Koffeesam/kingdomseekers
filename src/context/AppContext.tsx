import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Post, User, Teaching, Story, DirectMessage, DMAttachmentType } from '@/types';
import { mockUsers, mockTeachings } from '@/data/mockData';
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
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addPost: (type: 'text' | 'video', content: string, videoUrl?: string, meta?: { videoCategory?: 'short' | 'reel'; videoDuration?: number }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updateProfile: (patch: { username?: string; bio?: string; avatarUrl?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  messages: DirectMessage[];
  sendMessage: (toUserId: string, opts: SendMessageOptions) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markConversationRead: (otherUserId: string) => Promise<void>;
  isAuthenticated: boolean;
  authReady: boolean;
  isAdmin: boolean;
  session: Session | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=15';

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
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

  // ---- Load posts (with likes + comments) + realtime ----
  const mapPost = useCallback((row: any, profilesList: User[], myUid: string | null, likedSet: Set<string>, commentsByPost: Map<string, any[]>): Post => {
    const author = profilesList.find(u => u.id === row.user_id);
    const cs = commentsByPost.get(row.id) ?? [];
    return {
      id: row.id,
      userId: row.user_id,
      username: author?.username ?? 'believer',
      avatar: author?.avatar ?? FALLBACK_AVATAR,
      type: row.type,
      content: row.content ?? '',
      videoUrl: row.video_url ?? undefined,
      videoCategory: row.video_category ?? undefined,
      videoDuration: row.video_duration ?? undefined,
      likes: row.likes ?? 0,
      liked: !!myUid && likedSet.has(row.id),
      comments: cs.map(c => {
        const cAuthor = profilesList.find(u => u.id === c.user_id);
        return {
          id: c.id,
          userId: c.user_id,
          username: cAuthor?.username ?? 'believer',
          avatar: cAuthor?.avatar ?? FALLBACK_AVATAR,
          text: c.text,
          timestamp: new Date(c.created_at).toLocaleString(),
        };
      }),
      timestamp: new Date(row.created_at).toLocaleString(),
    };
  }, []);

  const reloadPosts = useCallback(async (uid: string | null, profilesList: User[]) => {
    const [{ data: postsRows }, { data: likesRows }, { data: commentsRows }] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      uid ? supabase.from('post_likes').select('post_id').eq('user_id', uid) : Promise.resolve({ data: [] as any[] }),
      supabase.from('post_comments').select('*').order('created_at', { ascending: true }),
    ]);
    const likedSet = new Set<string>(((likesRows ?? []) as any[]).map(l => l.post_id));
    const commentsByPost = new Map<string, any[]>();
    ((commentsRows ?? []) as any[]).forEach(c => {
      const arr = commentsByPost.get(c.post_id) ?? [];
      arr.push(c);
      commentsByPost.set(c.post_id, arr);
    });
    setPosts(((postsRows ?? []) as any[]).map(r => mapPost(r, profilesList, uid, likedSet, commentsByPost)));
  }, [mapPost]);

  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid) { setPosts([]); return; }
    reloadPosts(uid, profiles);
    const ch = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => reloadPosts(uid, profiles))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => reloadPosts(uid, profiles))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => reloadPosts(uid, profiles))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, profiles, reloadPosts]);

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

  const toggleLike = async (postId: string) => {
    if (!session?.user) return;
    const uid = session.user.id;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Optimistic
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked: !p.liked, likes: Math.max(0, p.likes + (p.liked ? -1 : 1)) }
      : p));
    if (post.liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid);
      await supabase.from('posts').update({ likes: Math.max(0, post.likes - 1) }).eq('id', postId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: uid });
      await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', postId);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!session?.user || !text.trim()) return;
    await supabase.from('post_comments').insert({
      post_id: postId, user_id: session.user.id, text: text.trim(),
    });
  };

  const deleteComment = async (commentId: string) => {
    // Optimistic remove
    setPosts(prev => prev.map(p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId) })));
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) console.error('deleteComment error', error);
  };

  const addPost = async (
    type: 'text' | 'video',
    content: string,
    videoUrl?: string,
    meta?: { videoCategory?: 'short' | 'reel'; videoDuration?: number }
  ) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('posts').insert({
      user_id: session.user.id,
      type,
      content,
      video_url: videoUrl ?? null,
      video_category: meta?.videoCategory ?? null,
      video_duration: meta?.videoDuration ?? null,
    }).select('*').single();
    if (error) { console.error('addPost error', error); return; }
    // Optimistic prepend so the post appears immediately for the author —
    // realtime will reconcile/dedupe shortly after.
    if (data) {
      const author = profiles.find(u => u.id === session.user.id);
      const optimistic: Post = {
        id: data.id,
        userId: data.user_id,
        username: author?.username ?? fallbackUser.username,
        avatar: author?.avatar ?? fallbackUser.avatar,
        type: data.type as 'text' | 'video',
        content: data.content ?? '',
        videoUrl: data.video_url ?? undefined,
        videoCategory: (data.video_category as 'short' | 'reel' | null) ?? undefined,
        videoDuration: data.video_duration ?? undefined,
        likes: 0,
        liked: false,
        comments: [],
        timestamp: 'Just now',
      };
      setPosts(prev => prev.some(p => p.id === optimistic.id) ? prev : [optimistic, ...prev]);
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) console.error('deletePost error', error);
  };

  // ---- Profile ops ----
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!session?.user) throw new Error('Not signed in');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${session.user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    return publicUrl;
  };

  const updateProfile = async (patch: { username?: string; bio?: string; avatarUrl?: string }) => {
    if (!session?.user) return;
    const update: { username?: string; bio?: string; avatar_url?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (patch.username !== undefined) update.username = patch.username;
    if (patch.bio !== undefined) update.bio = patch.bio;
    if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;
    const { error } = await supabase.from('profiles').update(update).eq('user_id', session.user.id);
    if (error) throw error;
    // Optimistic local update
    setMe(prev => prev ? {
      ...prev,
      username: patch.username ?? prev.username,
      bio: patch.bio ?? prev.bio,
      avatar: patch.avatarUrl ?? prev.avatar,
    } : prev);
    setProfiles(prev => prev.map(p => p.id === session.user.id ? {
      ...p,
      username: patch.username ?? p.username,
      bio: patch.bio ?? p.bio,
      avatar: patch.avatarUrl ?? p.avatar,
    } : p));
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

  // Admin role
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) { setIsAdmin(false); return; }
    supabase.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <AppContext.Provider value={{
      posts, setPosts, users, teachings, setTeachings,
      stories, addStory, deleteStory, markStoryViewed,
      messages, sendMessage, deleteMessage, markConversationRead,
      user: fallbackUser, followedUsers, followerCounts, followingCounts, toggleFollow, fetchProfileById, toggleLike, addComment, deleteComment, addPost, deletePost,
      updateProfile, uploadAvatar,
      isAuthenticated: !!session, authReady, isAdmin, session, logout,
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
