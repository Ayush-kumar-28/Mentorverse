import { apiService } from './api';

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  actuallyCompleted: number;
  progressPercentage: number;
  lastUpdated: string;
}

export interface MonthlyActivity {
  month: string;
  year: number;
  completed: number;
  upcoming: number;
  cancelled: number;
}

export interface FavoriteMentor {
  mentor: {
    name: string;
    title: string;
    company: string;
    expertise: string[];
    email: string;
  };
  sessionCount: number;
  completedCount: number;
  lastSessionDate: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  mentorName: string;
  scheduledStart: string;
  status: string;
  durationMinutes: number;
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
  lastUpdated: string;
  message?: string;
  error?: string;
}

class DashboardService {
  private baseUrl = '/dashboard';

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as DashboardResponse<DashboardStats>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch dashboard statistics');
      }

      return data.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load dashboard statistics'
      );
    }
  }

  /**
   * Get monthly activity data for charts
   */
  async getMonthlyActivity(): Promise<MonthlyActivity[]> {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as DashboardResponse<MonthlyActivity[]>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch monthly activity data');
      }

      return data.data;
    } catch (error) {
      console.error('Monthly activity error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load monthly activity data'
      );
    }
  }

  /**
   * Get favorite mentors based on session history
   */
  async getFavoriteMentors(limit: number = 4): Promise<FavoriteMentor[]> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/favorite-mentors?limit=${limit}`, {
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

      const data = await response.json() as DashboardResponse<FavoriteMentor[]>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch favorite mentors');
      }

      return data.data;
    } catch (error) {
      console.error('Favorite mentors error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load favorite mentors'
      );
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/recent-activity?limit=${limit}`, {
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

      const data = await response.json() as DashboardResponse<RecentActivity[]>;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recent activity');
      }

      return data.data;
    } catch (error) {
      console.error('Recent activity error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load recent activity'
      );
    }
  }

  /**
   * Refresh all dashboard data
   */
  async refreshDashboard(): Promise<{
    stats: DashboardStats;
    monthlyActivity: MonthlyActivity[];
    favoriteMentors: FavoriteMentor[];
    recentActivity: RecentActivity[];
  }> {
    try {
      const [stats, monthlyActivity, favoriteMentors, recentActivity] = await Promise.all([
        this.getStats(),
        this.getMonthlyActivity(),
        this.getFavoriteMentors(),
        this.getRecentActivity(),
      ]);

      return {
        stats,
        monthlyActivity,
        favoriteMentors,
        recentActivity,
      };
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to refresh dashboard data'
      );
    }
  }
}

export const dashboardService = new DashboardService();