export interface User {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

export interface Jobsite {
  id: number;
  name: string;
  address: string;
  status: string;
  time: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  progress?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface WeatherAlert {
  id: number;
  title: string;
  location: string;
  duration: string;
  impact: string;
}

export interface Command {
  id: number;
  text: string;
  timestamp: string;
  jobsiteId?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  translatedText?: string;
  isUser: boolean;
  role?: string;
  language?: string;
  timestamp: string;
  userId?: number;
  jobsiteId?: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  calendarEvent?: boolean;
  eventTitle?: string;
}

export interface Marker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  type: 'person' | 'truck' | 'alert';
  color?: string;
}

export interface WebSocketMessageEvent {
  type: string;
  [key: string]: any;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  crewMemberId: number;
  role: string;
  notes: string | null;
  assignedBy: number;
  assignedAt: string;
  hourlyRate: number | null;
}

export interface ProjectCommunication {
  id: number;
  projectId: number;
  senderId: number;
  content: string;
  translatedContent: string | null;
  language: string;
  timestamp: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  isAnnouncement: boolean | null;
  readBy: number[] | null;
  reactions: Record<string, string[]> | null;
}

export interface CrewMember {
  id: number;
  name: string;
  role: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  experienceYears: number | null;
  jobsiteId: number | null;
  status: string | null;
  hourlyRate: number | null;
  availability: string | null;
  skills: string[] | null;
  certification: string[] | null;
  profileImage: string | null;
  notes: string | null;
  languages: string[] | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}
