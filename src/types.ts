
declare global {
  interface Window {
    google: any;
  }
}

export type Gender = 'זכר' | 'נקבה' | 'מעדיף/ה לא לציין';

export interface Member {
  id: string;
  uid?: string; // Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  avatar: string;
  bio: string;
  role: 'Member' | 'Instructor' | 'Admin';
  joinedAt: string;
  deactivatedAt?: any;
  isActive?: boolean; // true = active, false = inactive
  password?: string;
  isTemporary?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string; // Added for X support
  websiteUrl?: string;
  totalAttendance?: number; // Lifetime count of sessions attended
  eventAttendanceCount?: number; // Lifetime count of events attended
  loginCount?: number; // Added for analytics
  birthday?: string; // YYYY-MM-DD
  gender?: Gender;
  group?: string;
  weight?: number; // in kg
  height?: number; // in cm
  surfingLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  fitnessLevel?: 'Low' | 'Average' | 'High' | 'Elite';
  currentBoardVolume?: number; // in liters
  currentBoardLength?: string; // e.g., "6'2"
  recommendedBoardVolume?: number; // in liters
  recommendedBoardLength?: string; // e.g., "6'2"
  street_name?: string;
  house_number?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  full_address?: string;
  distance?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalInfo?: string;
}

export interface JoinRequest {
  id: string;
  firstName: string;
  lastName: string;
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
  group?: string;
  gender?: Gender;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  storagePath?: string; // Critical for reliable storage deletion
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
  type: 'COMMUNITY' | 'MEMBER' | 'INSTRUCTOR';
  creatorId?: string;
  attendees: string[]; // Array of member IDs
  attendeeCount?: number; // Added for analysis
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  imageUrl?: string;
  publishedAt: string;
  duration?: string;
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

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty?: 'Rookie' | 'Local' | 'Legend';
  category?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface QuoteItem {
  id: string;
  text: string;
  author: string;
}

export interface AuthState {
  user: Member | null;
  isAuthenticated: boolean;
  loading: boolean;
}
