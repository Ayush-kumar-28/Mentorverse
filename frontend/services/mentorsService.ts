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
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.expertise) params.append('expertise', options.expertise);

      const endpoint = `/mentors${params.toString() ? '?' + params.toString() : ''}`;
      
      return await apiService.request<MentorsResponse>(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Get mentors error:', error);
      
      // Return empty response if API fails
      return {
        success: true,
        mentors: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        },
        filters: {
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
          expertise: options.expertise || null
        }
      };
    }
  }

  /**
   * Get recently joined mentors
   */
  async getNewMentors(limit: number = 5, days: number = 7): Promise<NewMentorsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('days', days.toString());

      const endpoint = `/mentors/new?${params.toString()}`;
      
      return await apiService.request<NewMentorsResponse>(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Get new mentors error:', error);
      
      // Return empty response if API fails
      return {
        success: true,
        newMentors: [],
        count: 0,
        daysBack: days
      };
    }
  }

  /**
   * Get specific mentor details
   */
  async getMentorDetails(mentorId: string): Promise<MentorDetailsResponse> {
    try {
      const endpoint = `/mentors/${mentorId}`;
      
      return await apiService.request<MentorDetailsResponse>(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Get mentor details error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load mentor details'
      );
    }
  }
}

export const mentorsService = new MentorsService();