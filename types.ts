
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
  password?: string;
  isTempPassword?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
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
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  category: 'Update' | 'Activity' | 'Announcement' | 'Personal' | 'Share';
}

export interface AuthState {
  user: Member | null;
  isAuthenticated: boolean;
  loading: boolean;
}
