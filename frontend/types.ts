
export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
}

export interface MenteeProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  college: string;
  course: string;
  title: string;
  bio: string;
  experience: string;
  interests: string[];
  skills: string[];
  avatar: string;
}

export interface MatchmakingProfile {
  currentSkills: string;
  desiredSkills: string;
  careerGoals: string;
  industryInterests: string;
}

export interface Mentor {
  name: string;
  title: string;
  company: string;
  expertise: string[];
  matchReasoning?: string;
  availability?: Record<string, string[]>;
  bio?: string;
  experience?: WorkExperience[];
  email?: string;
  linkedin?: string;
  avatar?: string;
}

export interface MentorProfile {
  updatedAt: any;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  company: string;
  bio: string;
  experience: string;
  expertise: string[];
  linkedin: string;
  avatar: string;
  yearsOfExperience: number;
  availability: Record<string, string[]>;
}

export interface BookedSession {
  id: string;
  mentor: Mentor;
  mentee: Mentor;
  reason?: string;
  scheduledStart: string;
  durationMinutes: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingLink?: string;
  chatHistory?: ChatMessage[];
  date?: string;
  time?: string;
}

export type BookSessionHandler = (details: {
  mentor: Mentor;
  menteeName: string;
  menteeEmail: string;
  reason: string;
  scheduledStart: string;
  durationMinutes: number;
}) => Promise<void>;

export type UserRole = 'mentor' | 'mentee';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  college: string;
  course: string;
  title: string;
  bio: string;
  experience: string;
  interests: string[];
  skills: string[];
  avatar: string;
}

export type DashboardView = 'selection' | 'ai-match' | 'browse-mentors' | 'mentorship-hub' | 'my-profile' | 'doubt-room' | 'workshops';

export interface SmartMatchFormState {
  currentSkills: string;
  desiredSkills: string;
  careerGoals: string;
  industryInterests: string;
}

export type MentorDashboardView = 'sessions' | 'profile' | 'edit-profile';

export interface ChatMessage {
  role: 'user' | 'model' | 'other';
  text: string;
  author?: string;
}

export interface Doubt {
  id: string;
  title: string;
  description: string;
  author: string;
  participants: number;
  messages: ChatMessage[];
  imageUrl?: string;
}
