import { Post, User, Teaching, AdPackage } from '@/types';

const now = Date.now();


export const mockUsers: User[] = [
  { id: '1', username: 'GraceWalker', avatar: 'https://i.pravatar.cc/150?img=1', bio: 'Walking by faith, not by sight ✝️', followers: 1243, following: 89 },
  { id: '2', username: 'FaithfulHeart', avatar: 'https://i.pravatar.cc/150?img=5', bio: 'God is good, all the time 🙏', followers: 876, following: 134 },
  { id: '3', username: 'PraiseLifter', avatar: 'https://i.pravatar.cc/150?img=3', bio: 'Lifting praise to the Most High 🎵', followers: 2100, following: 56 },
  { id: '4', username: 'TruthSeeker', avatar: 'https://i.pravatar.cc/150?img=8', bio: 'Seeking truth in every season 📖', followers: 654, following: 201 },
  { id: '5', username: 'HopeAnchor', avatar: 'https://i.pravatar.cc/150?img=12', bio: 'Anchored in hope through Christ ⚓', followers: 3200, following: 45 },
];

export const currentUser: User = mockUsers[0];

export const mockPosts: Post[] = [
  {
    id: '1', userId: '2', username: 'FaithfulHeart', avatar: 'https://i.pravatar.cc/150?img=5',
    type: 'text',
    content: 'Today I witnessed something beautiful. A stranger paid for my groceries and said "God told me to bless you today." I broke down in tears. God sees us in our lowest moments and sends angels in human form. Never lose hope! 🙏✝️',
    likes: 342, liked: false, timestamp: '2h ago',
    comments: [
      { id: 'c1', userId: '3', username: 'PraiseLifter', avatar: 'https://i.pravatar.cc/150?img=3', text: 'Amen! God is so good! 🙌', timestamp: '1h ago' },
      { id: 'c2', userId: '4', username: 'TruthSeeker', avatar: 'https://i.pravatar.cc/150?img=8', text: 'This made my day. Glory to God!', timestamp: '45m ago' },
    ],
  },
  {
    id: '2', userId: '3', username: 'PraiseLifter', avatar: 'https://i.pravatar.cc/150?img=3',
    type: 'video',
    content: 'My testimony: From addiction to freedom through Christ! Watch how God transformed my life completely. 🎬',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    likes: 891, liked: false, timestamp: '5h ago',
    comments: [
      { id: 'c3', userId: '1', username: 'GraceWalker', avatar: 'https://i.pravatar.cc/150?img=1', text: 'Powerful testimony! God bless you 🙏', timestamp: '3h ago' },
    ],
  },
  {
    id: '3', userId: '5', username: 'HopeAnchor', avatar: 'https://i.pravatar.cc/150?img=12',
    type: 'text',
    content: '"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future." - Jeremiah 29:11\n\nThis verse carried me through the darkest season of my life. Hold on, your breakthrough is coming! 🕊️',
    likes: 1205, liked: false, timestamp: '8h ago',
    comments: [],
  },
  {
    id: '4', userId: '4', username: 'TruthSeeker', avatar: 'https://i.pravatar.cc/150?img=8',
    type: 'text',
    content: 'After 3 years of praying for my family\'s salvation, my father accepted Christ last Sunday! The whole church was in tears. Never stop praying for your loved ones — God hears every prayer! 😭🙏',
    likes: 2034, liked: false, timestamp: '1d ago',
    comments: [
      { id: 'c4', userId: '5', username: 'HopeAnchor', avatar: 'https://i.pravatar.cc/150?img=12', text: 'This is incredible! Hallelujah! 🎉', timestamp: '20h ago' },
      { id: 'c5', userId: '2', username: 'FaithfulHeart', avatar: 'https://i.pravatar.cc/150?img=5', text: 'God answers prayers! So happy for your family ❤️', timestamp: '18h ago' },
    ],
  },
  {
    id: '5', userId: '1', username: 'GraceWalker', avatar: 'https://i.pravatar.cc/150?img=1',
    type: 'video',
    content: 'Worship session from this morning. Let this song minister to your spirit today 🎵✝️',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    likes: 567, liked: false, timestamp: '1d ago',
    comments: [],
  },
];

export const mockTeachings: Teaching[] = [
  { id: 't1', title: 'Why Settle For Less? || Pastor Essollom Karanja', youtubeId: 'Cbm-vowziF0', date: 'Recent', likes: 234, liked: false, comments: [] },
  { id: 't2', title: 'When Idols are Worshipped || Pastor Essollom Karanja', youtubeId: '0kYO1UeZKxc', date: 'Recent', likes: 189, liked: false, comments: [] },
  { id: 't3', title: 'Why We Need The Power of God as Believers || Pastor Essollom Karanja', youtubeId: '17OL3aU37gY', date: 'Recent', likes: 312, liked: false, comments: [] },
  { id: 't4', title: 'Godly Marriage || Pastor Juliah Karanja', youtubeId: '7jwl1wIv0ng', date: 'Recent', likes: 276, liked: false, comments: [] },
  { id: 't5', title: 'Do not give the devil a foothold', youtubeId: '8Wfzwhgr1oU', date: 'Recent', likes: 198, liked: false, comments: [] },
];

export const adPackages: AdPackage[] = [
  { id: 'ad1', duration: '7 days', price: 114, description: 'Quick boost for your testimony' },
  { id: 'ad2', duration: '1 month', price: 500, description: 'Extended reach to the community' },
  { id: 'ad3', duration: '6 months', price: 1200, description: 'Long-term visibility & impact' },
  { id: 'ad4', duration: '1 year', price: 2000, description: 'Maximum exposure all year round' },
];
