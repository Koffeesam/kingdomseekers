import { useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft, Send, Smile, Phone, Video, MoreVertical, Reply, Forward, Copy, Trash2,
  Flag, X, CornerUpLeft, Paperclip, Image as ImageIcon, FileText, Mic, Square, Play, Pause, Download,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCall } from '@/components/CallManager';
import type { DirectMessage, DMAttachmentType } from '@/types';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
function formatBytes(b?: number) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function ChatPage() {
  const { userId } = useParams();
  const { messages, users, user, sendMessage, deleteMessage, markConversationRead, session } = useApp();
  const { startCall } = useCall();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);
  const [reportMsgId, setReportMsgId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  const other = users.find(u => u.id === userId);

  useEffect(() => { if (userId) markConversationRead(userId); }, [userId, markConversationRead]);

  const convo = messages
    .filter(m =>
      (m.fromUserId === user.id && m.toUserId === userId) ||
      (m.fromUserId === userId && m.toUserId === user.id)
    )
    .sort((a, b) => a.createdAt - b.createdAt);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [convo.length]);

  if (!other) return <Navigate to="/messages" replace />;

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    await sendMessage(other.id, { text: t, replyToId: replyTo ?? undefined });
    setText('');
    setReplyTo(null);
  };

  const uploadAndSend = async (file: File, type: DMAttachmentType) => {
    if (!session?.user) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      await sendMessage(other.id, {
        replyToId: replyTo ?? undefined,
        attachment: { url: path, type, name: file.name, size: file.size },
      });
      setReplyTo(null);
      toast.success(type === 'image' ? 'Photo sent 📷' : type === 'audio' ? 'Voice note sent 🎤' : 'File sent 📎');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePhoto = (f: File | undefined) => f && uploadAndSend(f, 'image');
  const handleFile = (f: File | undefined) => f && uploadAndSend(f, 'file');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadAndSend(file, 'audio');
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (e) {
      toast.error('Microphone access denied');
    }
  };
  const stopRecording = (cancel = false) => {
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecording(false);
    setRecordSeconds(0);
    if (cancel && recorderRef.current) {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = () => recorderRef.current?.stream.getTracks().forEach(t => t.stop());
    }
    recorderRef.current?.stop();
  };

  const handleReply = (id: string) => { setReplyTo(id); inputRef.current?.focus(); };
  const handleCopy = (msgText: string) => { navigator.clipboard?.writeText(msgText); toast.success('Message copied'); };
  const handleDelete = (id: string) => { deleteMessage(id); toast.success('Message deleted'); };
  const handleForward = (toUserId: string, m: DirectMessage) => {
    sendMessage(toUserId, {
      text: m.text,
      attachment: m.attachmentUrl ? { url: m.attachmentUrl, type: m.attachmentType!, name: m.attachmentName, size: m.attachmentSize } : undefined,
    });
    setForwardMsgId(null);
    toast.success('Message forwarded');
  };
  const handleReport = () => { setReportMsgId(null); toast.success('Report submitted. Our team will review it. 🙏'); };

  const findMsg = (id: string | null) => convo.find(m => m.id === id);
  const replyMsg = findMsg(replyTo);
  const forwardMsg = findMsg(forwardMsgId);

  let lastDay = '';

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: '100dvh' }}>
      <header className="shrink-0 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-2.5 px-3">
          <Link to="/messages" className="p-2 -ml-1 rounded-full hover:bg-secondary text-foreground"><ArrowLeft size={20} /></Link>
          <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <img src={other.avatar} alt={other.username} className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{other.username}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Active now</p>
            </div>
          </Link>
          <button onClick={() => startCall(other, 'voice')} className="p-2 rounded-full hover:bg-secondary text-primary" aria-label="Voice call"><Phone size={18} /></button>
          <button onClick={() => startCall(other, 'video')} className="p-2 rounded-full hover:bg-secondary text-primary" aria-label="Video call"><Video size={18} /></button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {convo.length === 0 && (
            <div className="text-center py-12">
              <img src={other.avatar} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
              <p className="font-semibold">{other.username}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Start a Christ-centered conversation 🙏</p>
            </div>
          )}
          {convo.map((m, i) => {
            const mine = m.fromUserId === user.id;
            const day = dayLabel(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const prev = convo[i - 1];
            const next = convo[i + 1];
            const sameSenderPrev = prev && prev.fromUserId === m.fromUserId && !showDay;
            const sameSenderNext = next && next.fromUserId === m.fromUserId && dayLabel(next.createdAt) === day;
            const repliedTo = m.replyToId ? convo.find(c => c.id === m.replyToId) : null;
            const hasAttachment = !!m.attachmentUrl;
            const hasOnlyAttachment = hasAttachment && (!m.text || ['📷 Photo', '🎤 Voice note', '📎 File'].includes(m.text));

            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full font-semibold">{day}</span>
                  </div>
                )}
                <div className={`group flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'} ${sameSenderPrev ? 'mt-0.5' : 'mt-2'}`}>
                  {mine && (
                    <MessageMenu mine onReply={() => handleReply(m.id)} onForward={() => setForwardMsgId(m.id)}
                      onCopy={() => handleCopy(m.text)} onDelete={() => handleDelete(m.id)} onReport={() => setReportMsgId(m.id)} />
                  )}
                  <div className={`max-w-[78%] shadow-sm break-words ${
                    hasAttachment && !m.text ? 'p-1.5' : 'px-3.5 py-2'
                  } text-[15px] ${
                    mine
                      ? `gold-gradient text-primary-foreground rounded-2xl ${sameSenderNext ? 'rounded-br-md' : 'rounded-br-sm'}`
                      : `bg-secondary text-foreground rounded-2xl ${sameSenderNext ? 'rounded-bl-md' : 'rounded-bl-sm'}`
                  }`}>
                    {repliedTo && (
                      <div className={`text-[11px] mb-1.5 pl-2 border-l-2 rounded-sm py-0.5 ${
                        mine ? 'border-primary-foreground/60 bg-primary-foreground/10' : 'border-primary bg-primary/10'
                      }`}>
                        <p className={`font-semibold ${mine ? 'text-primary-foreground/90' : 'text-primary'}`}>
                          {repliedTo.fromUserId === user.id ? 'You' : other.username}
                        </p>
                        <p className={`truncate ${mine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {repliedTo.attachmentType === 'image' ? '📷 Photo' : repliedTo.attachmentType === 'audio' ? '🎤 Voice note' : repliedTo.attachmentType === 'file' ? '📎 File' : repliedTo.text}
                        </p>
                      </div>
                    )}

                    {hasAttachment && <Attachment msg={m} mine={mine} />}

                    {m.text && !hasOnlyAttachment && (
                      <p className="whitespace-pre-wrap leading-snug">{m.text}</p>
                    )}
                    {!sameSenderNext && (
                      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground'} ${hasAttachment && !m.text ? 'px-2 pb-1' : ''}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    )}
                  </div>
                  {!mine && (
                    <MessageMenu mine={false} onReply={() => handleReply(m.id)} onForward={() => setForwardMsgId(m.id)}
                      onCopy={() => handleCopy(m.text)} onReport={() => setReportMsgId(m.id)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {replyMsg && (
        <div className="shrink-0 bg-background border-t border-border px-3 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3 bg-secondary rounded-xl px-3 py-2">
            <CornerUpLeft className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
              <p className="text-[11px] font-semibold text-primary">
                Replying to {replyMsg.fromUserId === user.id ? 'yourself' : other.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyMsg.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-background" aria-label="Cancel reply"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => handlePhoto(e.target.files?.[0])} />
        <input ref={fileRef} type="file" hidden onChange={e => handleFile(e.target.files?.[0])} />

        {recording ? (
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => stopRecording(true)} className="p-2 rounded-full hover:bg-secondary text-destructive" aria-label="Cancel"><X size={20} /></button>
            <div className="flex-1 flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">Recording…</span>
              <span className="ml-auto text-sm tabular-nums">{Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}</span>
            </div>
            <button onClick={() => stopRecording(false)} className="w-11 h-11 shrink-0 rounded-full gold-gradient text-primary-foreground flex items-center justify-center shadow-md" aria-label="Send voice note"><Send size={18} /></button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 shrink-0 rounded-full hover:bg-secondary text-primary flex items-center justify-center" aria-label="Attach" disabled={uploading}>
                  <Paperclip size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-44">
                <DropdownMenuItem onClick={() => photoRef.current?.click()}><ImageIcon className="h-4 w-4 mr-2" /> Photo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileRef.current?.click()}><FileText className="h-4 w-4 mr-2" /> File</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 flex items-end bg-secondary rounded-3xl px-4 py-2 min-h-[44px]">
              <textarea
                ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder={uploading ? 'Uploading…' : 'Message…'}
                rows={1} maxLength={1000} disabled={uploading}
                className="flex-1 bg-transparent resize-none outline-none text-[15px] max-h-24 leading-snug disabled:opacity-50"
                style={{ minHeight: '20px' }}
              />
              <button className="text-muted-foreground hover:text-primary p-1 -mr-1" aria-label="Emoji"><Smile size={20} /></button>
            </div>

            {text.trim() ? (
              <button onClick={submit} disabled={uploading}
                className="w-11 h-11 shrink-0 rounded-full gold-gradient text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-40 active:scale-90 transition-all" aria-label="Send"><Send size={18} /></button>
            ) : (
              <button onClick={startRecording} disabled={uploading}
                className="w-11 h-11 shrink-0 rounded-full gold-gradient text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-40 active:scale-90 transition-all" aria-label="Record voice note"><Mic size={18} /></button>
            )}
          </div>
        )}
      </div>

      {/* Forward dialog */}
      <Dialog open={!!forwardMsgId} onOpenChange={(o) => !o && setForwardMsgId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
            <DialogDescription className="truncate text-xs">"{forwardMsg?.text}"</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {users.filter(u => u.id !== user.id).map(u => (
              <li key={u.id}>
                <button onClick={() => forwardMsg && handleForward(u.id, forwardMsg)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors text-left">
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.bio}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={!!reportMsgId} onOpenChange={(o) => !o && setReportMsgId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>Help keep Kingdom Seekers a safe, faith-centered space. Why are you reporting this?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['Spam', 'Harassment or bullying', 'Inappropriate content', 'Hate speech', 'Other'].map(reason => (
              <button key={reason} onClick={handleReport}
                className="w-full text-left text-sm p-3 rounded-xl bg-secondary hover:bg-muted transition-colors font-medium">{reason}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Attachment({ msg, mine }: { msg: DirectMessage; mine: boolean }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!msg.attachmentUrl) return;
    let cancelled = false;
    supabase.storage.from('chat-media').createSignedUrl(msg.attachmentUrl, 60 * 60).then(({ data }) => {
      if (!cancelled && data) setSignedUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [msg.attachmentUrl]);

  if (msg.attachmentType === 'image') {
    return (
      <div className="rounded-xl overflow-hidden mb-1 max-w-[260px]">
        {signedUrl
          ? <a href={signedUrl} target="_blank" rel="noreferrer"><img src={signedUrl} alt="" className="block w-full h-auto" /></a>
          : <div className="w-[220px] h-[160px] bg-black/10 animate-pulse" />}
      </div>
    );
  }
  if (msg.attachmentType === 'audio') {
    return <VoiceNote url={signedUrl} mine={mine} />;
  }
  return (
    <a href={signedUrl ?? '#'} target="_blank" rel="noreferrer" download={msg.attachmentName}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1 ${mine ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-background hover:bg-muted'} transition-colors`}>
      <FileText className="h-5 w-5 shrink-0 opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{msg.attachmentName ?? 'File'}</p>
        <p className={`text-[10px] ${mine ? 'opacity-80' : 'text-muted-foreground'}`}>{formatBytes(msg.attachmentSize)}</p>
      </div>
      <Download className="h-4 w-4 opacity-70" />
    </a>
  );
}

function VoiceNote({ url, mine }: { url: string | null; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => { setProgress(a.currentTime); };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onMeta = () => setDuration(isFinite(a.duration) ? a.duration : 0);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('loadedmetadata', onMeta);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); a.removeEventListener('loadedmetadata', onMeta); };
  }, [url]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 rounded-full px-2 py-1.5 mb-0.5 min-w-[180px] ${mine ? 'bg-primary-foreground/15' : 'bg-background'}`}>
      {url && <audio ref={audioRef} src={url} preload="metadata" />}
      <button onClick={toggle} disabled={!url}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${mine ? 'bg-primary-foreground/30 text-primary-foreground' : 'bg-primary text-primary-foreground'} disabled:opacity-50`}>
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className={`flex-1 h-1 rounded-full ${mine ? 'bg-primary-foreground/30' : 'bg-muted'} overflow-hidden`}>
          <div className={`h-full ${mine ? 'bg-primary-foreground' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[10px] tabular-nums ${mine ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
          {fmt(playing || progress > 0 ? progress : duration)}
        </span>
      </div>
    </div>
  );
}

function MessageMenu({
  mine, onReply, onForward, onCopy, onDelete, onReport,
}: {
  mine: boolean;
  onReply: () => void; onForward: () => void; onCopy: () => void;
  onDelete?: () => void; onReport: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 p-1 rounded-full hover:bg-secondary text-muted-foreground transition-opacity" aria-label="Message options">
          <MoreVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mine ? 'end' : 'start'} className="w-44">
        <DropdownMenuItem onClick={onReply}><Reply className="h-4 w-4 mr-2" /> Reply</DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}><Forward className="h-4 w-4 mr-2" /> Forward</DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}><Copy className="h-4 w-4 mr-2" /> Copy</DropdownMenuItem>
        <DropdownMenuSeparator />
        {mine && onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        )}
        {!mine && (
          <DropdownMenuItem onClick={onReport} className="text-destructive focus:text-destructive">
            <Flag className="h-4 w-4 mr-2" /> Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
