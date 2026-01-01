import { apiService } from './api';

export interface MentorDashboardStats {
  totalSessions: number;
  sessionsConducted: number;
  upcomingSessions: number;
  actuallyCompleted: number;
  successRate: number;
  profileRating: number;
  totalReviews: number;
  lastUpdated: string;
}

export interface MentorMonthlyActivity {
  month: string;
  year: number;
  completed: number;
  upcoming: number;
  cancelled: number;
}

export interface RecentMentee {
  mentee: {
    name: string;
    title: string;
    company: string;
    email: string;
  };
  sessionCount: number;
  completedCount: number;
  lastSessionDate: string;
}

export interface MentorDashboardResponse<T> {
  success: boolean;
  data: T;
  lastUpdated: string;
  message?: string;
  error?: string;
}

class MentorDashboardService {
  private baseUrl = '/mentor/dashboard';

  /**
   * Get mentor dashboard statistics
   */
  async getStats(): Promise<MentorDashboardStats> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/stats`, {
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
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can access this resource.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as MentorDashboardResponse<MentorDashboardStats>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch mentor dashboard statistics');
      }

      return data.data;
    } catch (error) {
      console.error('Mentor dashboard stats error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load mentor dashboard statistics'
      );
    }
  }

  /**
   * Get monthly activity data for charts
   */
  async getMonthlyActivity(): Promise<MentorMonthlyActivity[]> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/monthly-activity`, {
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
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can access this resource.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as MentorDashboardResponse<MentorMonthlyActivity[]>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch monthly activity data');
      }

      return data.data;
    } catch (error) {
      console.error('Mentor monthly activity error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load monthly activity data'
      );
    }
  }

  /**
   * Get recent mentees based on session history
   */
  async getRecentMentees(limit: number = 4): Promise<RecentMentee[]> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/recent-mentees?limit=${limit}`, {
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
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can access this resource.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as MentorDashboardResponse<RecentMentee[]>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recent mentees');
      }

      return data.data;
    } catch (error) {
      console.error('Recent mentees error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load recent mentees'
      );
    }
  }

  /**
   * Refresh all mentor dashboard data
   */
  async refreshDashboard(): Promise<{
    stats: MentorDashboardStats;
    monthlyActivity: MentorMonthlyActivity[];
    recentMentees: RecentMentee[];
  }> {
    try {
      const [stats, monthlyActivity, recentMentees] = await Promise.all([
        this.getStats(),
        this.getMonthlyActivity(),
        this.getRecentMentees(),
      ]);

      return {
        stats,
        monthlyActivity,
        recentMentees,
      };
    } catch (error) {
      console.error('Mentor dashboard refresh error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to refresh mentor dashboard data'
      );
    }
  }
}

export const mentorDashboardService = new MentorDashboardService();