import { apiService } from './api';

export interface MentorListItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  company: string;
  bio: string;
  expertise: string[];
  yearsOfExperience: number;
  rating: number;
  totalSessions: number;
  totalReviews: number;
  linkedin: string;
  languages: string[];
  availability: Record<string, string[]>;
  isNew?: boolean;
  joinedDate?: string;
}

export interface MentorsResponse {
  success: boolean;
  mentors: MentorListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
    expertise: string | null;
  };
}

export interface NewMentorsResponse {
  success: boolean;
  newMentors: MentorListItem[];
  count: number;
  daysBack: number;
}

export interface MentorDetailsResponse {
  success: boolean;
  mentor: MentorListItem & {
    experience: string;
    timezone: string;
  };
}

class MentorsService {
  private baseUrl = '/mentors';

  /**
   * Get all mentors with pagination and filtering
   */
  async getMentors(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    expertise?: string;
  } = {}): Promise<MentorsResponse> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.expertise) params.append('expertise', options.expertise);

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get mentors error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load mentors'
      );
    }
  }

  /**
   * Get recently joined mentors
   */
  async getNewMentors(limit: number = 5, days: number = 7): Promise<NewMentorsResponse> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('days', days.toString());

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/new?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get new mentors error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load new mentors'
      );
    }
  }

  /**
   * Get specific mentor details
   */
  async getMentorDetails(mentorId: string): Promise<MentorDetailsResponse> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/${mentorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 404) {
          throw new Error('Mentor not found or not available.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get mentor details error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load mentor details'
      );
    }
  }
}

export const mentorsService = new MentorsService();