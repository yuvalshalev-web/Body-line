
export interface Member {
  id: string;
  uid?: string; // Firebase Auth UID
  name: string;
  email: string;
  mobile: string;
  avatar: string;
  bio: string;
  role: 'Member' | 'Admin';
  joinedAt: string;
  isActive?: boolean; // true = active, false = inactive
  password?: string;
  isTempPassword?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string; // Added for X support
  websiteUrl?: string;
  totalAttendance?: number; // Lifetime count of sessions attended
  loginCount?: number; // Added for analytics
  birthday?: string; // YYYY-MM-DD
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatar: string;
  bio: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  requestedAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  uploaderId: string;
  uploaderName: string;
  caption: string;
  timestamp: any; // Firestore Timestamp
  aiDescription?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  attendees: string[]; // Array of member IDs
  attendeeCount?: number; // Added for analysis
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  category: 'Update' | 'Activity' | 'Announcement' | 'Personal' | 'Share';
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
}

export interface AuthState {
  user: Member | null;
  isAuthenticated: boolean;
  loading: boolean;
}
