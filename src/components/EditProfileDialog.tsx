import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Camera, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export default function EditProfileDialog({ open, onOpenChange }: Props) {
  const { user, updateProfile, uploadAvatar } = useApp();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please pick an image'); return; }
    if (file.size > MAX_AVATAR_BYTES) { toast.error('Image must be under 5 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) { toast.error('Username must be at least 3 characters (a-z, 0-9, _)'); return; }
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
      await updateProfile({
        username: cleanUsername !== user.username ? cleanUsername : undefined,
        bio: bio !== user.bio ? bio : undefined,
        avatarUrl,
      });
      toast.success('Profile updated ✓');
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes('duplicate') ? 'Username already taken' : (e?.message || 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Profile</DialogTitle>
          <DialogDescription>Update your photo, username and bio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 group"
              aria-label="Change profile photo"
            >
              <img src={avatarPreview ?? user.avatar} alt="avatar" className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={20} className="text-foreground" />
              </span>
            </button>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-primary font-medium">
              Change photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => onPickAvatar(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="believer_name"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Lowercase letters, numbers, and underscores only.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Share something about your walk with God..."
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{bio.length}/160</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-sm font-semibold shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}