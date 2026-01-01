// API service for backend communication

import type { BookedSession, ChatMessage, MatchmakingProfile, MenteeProfile, Mentor } from '../types';

// Multiple fallback options for API URL
const getApiBaseUrl = () => {
  console.log('=== API URL Configuration Debug ===');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  
  // Try different environment variable combinations
  const options = [
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : null,
    'https://mentorverse-backend-tq0o.onrender.com/api', // Hardcoded fallback
    'http://localhost:5000/api' // Local development fallback
  ].filter(Boolean);
  
  console.log('Available URL options:', options);
  
  for (const url of options) {
    if (url) {
      // Ensure URL ends with /api if it doesn't already
      let finalUrl = url;
      if (!url.endsWith('/api')) {
        finalUrl = `${url}/api`;
      }
      console.log('Selected API URL:', finalUrl);
      console.log('================================');
      return finalUrl;
    }
  }
  
  // Ultimate fallback
  const fallback = 'https://mentorverse-backend-tq0o.onrender.com/api';
  console.warn('Using ultimate fallback API URL:', fallback);
  console.log('================================');
  return fallback;
};

const API_BASE_URL = getApiBaseUrl();

// Temporary hardcoded fix to ensure correct API URL
const VERIFIED_API_BASE_URL = 'https://mentorverse-backend-tq0o.onrender.com/api';

console.log('=== FINAL API URL VERIFICATION ===');
console.log('Calculated API_BASE_URL:', API_BASE_URL);
console.log('Using hardcoded URL:', VERIFIED_API_BASE_URL);
console.log('===================================');

// Debug logging
console.log('=== API Configuration Debug ===');
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);
console.log('================================');

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'mentor' | 'mentee';
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'mentor' | 'mentee';
}

interface DoubtMessageResponse {
  role: 'user' | 'model' | 'other';
  text: string;
  author?: string;
}

interface DoubtResponse {
  id: string;
  title: string;
  description: string;
  author: string;
  participants: number;
  messages: DoubtMessageResponse[];
  imageUrl?: string;
}

interface MatchMentorsResponse {
  mentors: Mentor[];
}

type RawSessionParticipant = Partial<Mentor> & {
  name?: string;
  email?: string;
};

interface RawSession {
  id: string;
  mentor: RawSessionParticipant;
  mentee: RawSessionParticipant;
  reason?: string;
  scheduledStart: string;
  durationMinutes?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingLink?: string;
  chatHistory?: { role: ChatMessage['role']; text: string; author?: string }[];
}

interface SessionsResponse {
  sessions: RawSession[];
}

interface SessionResponse {
  session: RawSession;
}

interface CreateSessionPayload {
  mentor: Mentor;
  mentee: Mentor;
  reason?: string;
  scheduledStart: string;
  durationMinutes?: number;
  meetingLink?: string;
}

const normalizeAvailability = (value: unknown): Record<string, string[]> => {
  if (!value) {
    return {};
  }
  if (value instanceof Map) {
    const record: Record<string, string[]> = {};
    value.forEach((slots, key) => {
      record[String(key)] = Array.isArray(slots) ? slots.map(String) : [];
    });
    return record;
  }
  if (typeof value === 'object') {
    const record: Record<string, string[]> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, slots]) => {
      record[key] = Array.isArray(slots) ? slots.map(String) : [];
    });
    return record;
  }
  return {};
};

const normalizeParticipant = (participant?: RawSessionParticipant): Mentor => {
  const source = participant ?? {};
  return {
    name: source.name ?? '',
    title: source.title ?? '',
    company: source.company ?? '',
    expertise: Array.isArray(source.expertise) ? source.expertise : [],
    matchReasoning: source.matchReasoning,
    availability: normalizeAvailability(source.availability),
    bio: source.bio,
    experience: Array.isArray(source.experience) ? source.experience : undefined,
    email: source.email,
    linkedin: source.linkedin,
  };
};

const normalizeChatHistory = (messages?: RawSession['chatHistory']): ChatMessage[] => {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map((message) => ({
    role: message.role,
    text: message.text,
    author: message.author,
  }));
};

const mapSession = (session: RawSession): BookedSession => ({
  id: session.id,
  mentor: normalizeParticipant(session.mentor),
  mentee: normalizeParticipant(session.mentee),
  reason: session.reason,
  scheduledStart: session.scheduledStart,
  durationMinutes: session.durationMinutes ?? 30,
  status: session.status,
  meetingLink: session.meetingLink,
  chatHistory: normalizeChatHistory(session.chatHistory),
});

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fullUrl = `${VERIFIED_API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', fullUrl);
    console.log('Method:', options.method || 'GET');

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      console.error('API Error:', error);
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: { id: string; name: string; email: string; role: 'mentor' | 'mentee' } }>('/auth/me', {
      method: 'GET',
    });
  }

  async getProfile() {
    return this.request<{ user: {
      id: string;
      name: string;
      email: string;
      role: 'mentor' | 'mentee';
      college: string;
      course: string;
      title: string;
      bio: string;
      experience: string;
      interests: string[];
      skills: string[];
      avatar: string;
    } }>('/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    title?: string;
    college?: string;
    course?: string;
    bio?: string;
    experience?: string;
    interests?: string[] | string;
    skills?: string[] | string;
    avatar?: string;
  }) {
    return this.request<{ message: string; user: {
      id: string;
      name: string;
      email: string;
      role: 'mentor' | 'mentee';
      college: string;
      course: string;
      title: string;
      bio: string;
      experience: string;
      interests: string[];
      skills: string[];
      avatar: string;
    } }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.clearToken();
  }

  // Mentor endpoints
  async getMentors() {
    return this.request('/mentors', { method: 'GET' });
  }

  async getMentorById(id: string) {
    return this.request(`/mentors/${id}`, { method: 'GET' });
  }

  // Mentee endpoints
  async getMentees() {
    return this.request('/mentees', { method: 'GET' });
  }

  async getMenteeById(id: string) {
    return this.request(`/mentees/${id}`, { method: 'GET' });
  }

  // Session endpoints
  async getSessions(): Promise<BookedSession[]> {
    const response = await this.request<SessionsResponse>('/sessions', { method: 'GET' });
    return response.sessions.map(mapSession);
  }

  async createSession(sessionData: CreateSessionPayload): Promise<BookedSession> {
    const response = await this.request<SessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    return mapSession(response.session);
  }

  async getSessionById(id: string): Promise<BookedSession> {
    const response = await this.request<SessionResponse>(`/sessions/${id}`, { method: 'GET' });
    return mapSession(response.session);
  }

  async updateSessionStatus(id: string, status: 'upcoming' | 'completed' | 'cancelled'): Promise<BookedSession> {
    const response = await this.request<SessionResponse>(`/sessions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapSession(response.session);
  }

  // Doubts endpoints
  async getDoubts(): Promise<DoubtResponse[]> {
    return this.request<DoubtResponse[]>('/doubts', { method: 'GET' });
  }

  async createDoubt(doubtData: { title: string; description: string; imageUrl?: string }): Promise<DoubtResponse> {
    return this.request<DoubtResponse>('/doubts', {
      method: 'POST',
      body: JSON.stringify(doubtData),
    });
  }

  async matchMentors(profile: MatchmakingProfile, mentors: Mentor[]): Promise<Mentor[]> {
    const response = await this.request<MatchMentorsResponse>('/matchmaking', {
      method: 'POST',
      body: JSON.stringify({ profile, mentors }),
    });
    return response.mentors;
  }

  async sendChatbotMessage(messages: Pick<ChatMessage, 'role' | 'text'>[]): Promise<{ reply: string }> {
    return this.request<{ reply: string }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export types
export type { AuthResponse, LoginCredentials, SignupData, DoubtResponse, DoubtMessageResponse, MatchMentorsResponse };

