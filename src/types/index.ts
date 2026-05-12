export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: 'text' | 'video' | 'image' | 'document' | 'link';
  content: string;
  videoUrl?: string;
  thumbnail?: string;
  videoCategory?: 'short' | 'reel';
  videoDuration?: number;
  imageUrl?: string;
  documentUrl?: string;
  documentName?: string;
  linkUrl?: string;
  likes: number;
  liked: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  comments: Comment[];
  timestamp: string;
}

export interface Teaching {
  id: string;
  title: string;
  youtubeId: string;
  date: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  bgColor: string;
  mediaUrl?: string;
  mediaType: 'text' | 'image';
  createdAt: number;
  expiresAt: number;
  viewed: boolean;
}

export interface AdPackage {
  id: string;
  duration: string;
  price: number;
  description: string;
}

export type DMAttachmentType = 'image' | 'file' | 'audio';

export interface DirectMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: number;
  read: boolean;
  replyToId?: string;
  attachmentUrl?: string;
  attachmentType?: DMAttachmentType;
  attachmentName?: string;
  attachmentSize?: number;
}
