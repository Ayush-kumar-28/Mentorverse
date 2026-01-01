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
      const response = await apiService.request<DashboardResponse<DashboardStats>>('/dashboard/stats', {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }

      return response.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      
      // Return default stats if API fails
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        actuallyCompleted: 0,
        progressPercentage: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get monthly activity data for charts
   */
  async getMonthlyActivity(): Promise<MonthlyActivity[]> {
    try {
      const response = await apiService.request<DashboardResponse<MonthlyActivity[]>>('/dashboard/monthly-activity', {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monthly activity data');
      }

      return response.data;
    } catch (error) {
      console.error('Monthly activity error:', error);
      
      // Return default empty activity if API fails
      return [];
    }
  }

  /**
   * Get favorite mentors based on session history
   */
  async getFavoriteMentors(limit: number = 4): Promise<FavoriteMentor[]> {
    try {
      const response = await apiService.request<DashboardResponse<FavoriteMentor[]>>(`/dashboard/favorite-mentors?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch favorite mentors');
      }

      return response.data;
    } catch (error) {
      console.error('Favorite mentors error:', error);
      
      // Return empty array if API fails
      return [];
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    try {
      const response = await apiService.request<DashboardResponse<RecentActivity[]>>(`/dashboard/recent-activity?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch recent activity');
      }

      return response.data;
    } catch (error) {
      console.error('Recent activity error:', error);
      
      // Return empty array if API fails
      return [];
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