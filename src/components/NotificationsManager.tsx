import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Subscribes the signed-in user to realtime notifications for:
 *  - New posts from people they follow
 *  - New events
 *  - New daily motivation / prayer
 *  - "Pastor is live" announcements
 *
 * Shows both an in-app toast and (when permitted) a native browser notification
 * so the user is alerted even when the tab is in the background.
 *
 * Render once at the app root, inside <AppProvider>.
 */
export function NotificationsManager() {
  const { session, isAuthenticated, followedUsers, users } = useApp();
  const navigate = useNavigate();

  // Track ids we've already notified about, to dedupe with realtime + initial fetch
  const seenRef = useRef<Set<string>>(new Set());

  // Ask permission once, after the user is signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* user dismissed */ });
    }
  }, [isAuthenticated]);

  // Helper: fire both browser notification and in-app toast
  const notify = (
    title: string,
    body: string,
    opts: { tag?: string; onClick?: () => void; icon?: string } = {}
  ) => {
    // In-app toast (always visible)
    toast(title, {
      description: body,
      action: opts.onClick ? { label: 'Open', onClick: opts.onClick } : undefined,
    });
    // Native push (only when tab is hidden / backgrounded benefits most)
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        tag: opts.tag,
        icon: opts.icon ?? '/ksf-logo.png',
        badge: '/ksf-logo.png',
      });
      if (opts.onClick) {
        n.onclick = () => {
          window.focus();
          opts.onClick!();
          n.close();
        };
      }
    } catch {
      /* notifications can fail silently when iframed */
    }
  };

  // ---- Realtime subscriptions ----
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;

    const ch = supabase
      .channel('app-notifications')
      // 1. Posts from followed users
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        ({ new: row }: { new: Record<string, unknown> }) => {
          const authorId = row.user_id as string;
          const postId = row.id as string;
          if (authorId === uid) return; // own post
          if (!followedUsers.has(authorId)) return; // not following
          if (seenRef.current.has(`post:${postId}`)) return;
          seenRef.current.add(`post:${postId}`);

          const author = users.find(u => u.id === authorId);
          const username = author?.username ?? 'A believer';
          const isVideo = row.type === 'video';
          const isReel = row.video_category === 'reel';
          const title = isReel
            ? `🎬 ${username} posted a new reel`
            : isVideo
              ? `📹 ${username} shared a new video`
              : `✨ ${username} posted a new testimony`;
          const preview = (row.content as string | null)?.slice(0, 80) ?? '';
          notify(title, preview || 'Tap to watch', {
            tag: `post-${postId}`,
            onClick: () => navigate(isReel ? '/videos' : '/'),
          });
        }
      )
      // 2. New events
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        ({ new: row }: { new: Record<string, unknown> }) => {
          const id = row.id as string;
          if (seenRef.current.has(`event:${id}`)) return;
          seenRef.current.add(`event:${id}`);
          notify(`📅 New event: ${row.title as string}`,
            (row.description as string) || 'Check the events page',
            { tag: `event-${id}`, onClick: () => navigate('/events') });
        }
      )
      // 3. Daily motivation / prayer
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_content' },
        ({ new: row }: { new: Record<string, unknown> }) => {
          const id = row.id as string;
          if (seenRef.current.has(`daily:${id}`)) return;
          seenRef.current.add(`daily:${id}`);
          const kind = row.kind as string;
          const isPrayer = kind === 'prayer';
          const title = isPrayer ? '🙏 Today\'s Prayer' : '🌅 Word of the Day';
          const heading = (row.title as string | null) || (row.body as string).slice(0, 60);
          notify(title, heading, {
            tag: `daily-${kind}`,
            onClick: () => navigate(isPrayer ? '/prayer' : '/motivation'),
          });
        }
      )
      // 4. Live announcements ("Pastor is live")
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_announcements' },
        ({ new: row }: { new: Record<string, unknown> }) => {
          if (!(row.active as boolean)) return;
          const id = row.id as string;
          if (seenRef.current.has(`live:${id}`)) return;
          seenRef.current.add(`live:${id}`);
          notify(`🔴 ${row.title as string}`,
            (row.message as string) || 'Pastor is live now — join the stream',
            { tag: 'live-announce', onClick: () => navigate('/live') });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [session?.user?.id, followedUsers, users, navigate]);

  return null;
}

export default NotificationsManager;