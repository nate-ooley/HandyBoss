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

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
