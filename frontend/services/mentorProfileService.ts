import { apiService } from './api';
import type { MentorProfile } from '../types';

export interface MentorProfileResponse {
  success: boolean;
  profile: MentorProfile;
  message?: string;
}

export interface MentorProfileCheckResponse {
  success: boolean;
  exists: boolean;
  isComplete: boolean;
  profileId: string | null;
}

export interface CreateMentorProfileData {
  name?: string;
  title: string;
  company: string;
  bio: string;
  experience: string;
  expertise: string[];
  linkedin?: string;
  yearsOfExperience?: number;
  availability?: Record<string, string[]>;
  hourlyRate?: number;
  languages?: string[];
  timezone?: string;
  avatar?: string;
}

export interface UpdateMentorProfileData extends Partial<CreateMentorProfileData> {
  isActive?: boolean;
}

class MentorProfileService {
  private baseUrl = '/mentor/profile';

  /**
   * Check if mentor profile exists and is complete
   */
  async checkProfile(): Promise<MentorProfileCheckResponse> {
    try {
      let token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Checking mentor profile existence and completeness...');

      let response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // If we get a 403 error (Access denied), try to migrate to mentor database first
      if (response.status === 403) {
        console.log('Access denied - attempting to migrate to mentor database...');
        
        try {
          // Get current user data
          const currentUser = await apiService.getCurrentUser();
          
          // Migrate to mentor database
          const mentorToken = await this.migrateToMentorDatabase({
            id: currentUser.user.id,
            name: currentUser.user.name,
            email: currentUser.user.email
          });
          
          // Update the token in apiService
          apiService.setToken(mentorToken);
          token = mentorToken;
          
          console.log('Migration successful, retrying profile check...');
          
          // Retry the check with the new mentor token
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/check`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
          // If migration fails, assume profile doesn't exist
          return {
            success: true,
            exists: false,
            isComplete: false,
            profileId: null
          };
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile check failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can access this resource.');
        }
        if (response.status === 404) {
          // Profile doesn't exist, return appropriate response
          return {
            success: true,
            exists: false,
            isComplete: false,
            profileId: null
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile check result:', result);
      return result;
    } catch (error) {
      console.error('Check mentor profile error:', error);
      
      // If it's a network error or server error, assume profile doesn't exist
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log('Network error during profile check, assuming profile does not exist');
        return {
          success: true,
          exists: false,
          isComplete: false,
          profileId: null
        };
      }
      
      throw new Error(
        error instanceof Error ? error.message : 'Failed to check mentor profile'
      );
    }
  }

  /**
   * Get mentor profile
   */
  async getProfile(): Promise<MentorProfile> {
    try {
      let token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Fetching mentor profile from database...');

      let response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // If we get a 403 error (Access denied), try to migrate to mentor database first
      if (response.status === 403) {
        console.log('Access denied - attempting to migrate to mentor database...');
        
        try {
          // Get current user data
          const currentUser = await apiService.getCurrentUser();
          
          // Migrate to mentor database
          const mentorToken = await this.migrateToMentorDatabase({
            id: currentUser.user.id,
            name: currentUser.user.name,
            email: currentUser.user.email
          });
          
          // Update the token in apiService
          apiService.setToken(mentorToken);
          token = mentorToken;
          
          console.log('Migration successful, retrying profile fetch...');
          
          // Retry the fetch with the new mentor token
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
          throw new Error('Failed to migrate to mentor database. Please try logging out and logging back in.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can access this resource.');
        }
        if (response.status === 404) {
          throw new Error('Mentor profile not found. Please create your profile first.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as MentorProfileResponse;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch mentor profile');
      }

      // Validate profile data integrity
      const profile = data.profile;
      if (!profile || !profile.id) {
        throw new Error('Invalid profile data received from server');
      }

      // Ensure required fields are present
      const requiredFields = ['name', 'email', 'title', 'company', 'bio', 'experience', 'expertise'];
      const missingFields = requiredFields.filter(field => !profile[field as keyof MentorProfile]);
      
      if (missingFields.length > 0) {
        console.warn('Profile missing required fields:', missingFields);
        // Don't throw error, just log warning as profile might be incomplete
      }

      // Ensure arrays are properly initialized
      if (!Array.isArray(profile.expertise)) {
        profile.expertise = [];
      }

      // Ensure availability is properly formatted
      if (!profile.availability || typeof profile.availability !== 'object') {
        profile.availability = {};
      }

      console.log('Profile fetched successfully:', {
        id: profile.id,
        name: profile.name,
        title: profile.title,
        company: profile.company,
        expertiseCount: profile.expertise.length,
        hasAvailability: Object.keys(profile.availability).length > 0
      });

      return profile;
    } catch (error) {
      console.error('Get mentor profile error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load mentor profile'
      );
    }
  }

  /**
   * Migrate user from main database to mentor database
   */
  async migrateToMentorDatabase(userData: { name: string; email: string; id: string }): Promise<string> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentor/auth/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          mainUserId: userData.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Migration response error:', { status: response.status, body: errorText });
        throw new Error(`Migration failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Migration response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to migrate to mentor database');
      }

      // Return the mentor database token
      return data.token;
    } catch (error) {
      console.error('Migration error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to migrate to mentor database'
      );
    }
  }

  /**
   * Create mentor profile
   */
  async createProfile(profileData: CreateMentorProfileData): Promise<MentorProfile> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Creating mentor profile with data:', profileData);

      // Get current user data
      const currentUser = await apiService.getCurrentUser();
      console.log('Current user:', currentUser);

      // Prepare the request data with user information
      const requestData = {
        ...profileData,
        userData: {
          id: currentUser.user.id,
          name: currentUser.user.name,
          email: currentUser.user.email
        }
      };

      console.log('Sending request to create-from-main endpoint...');

      // Use the create-from-main endpoint which handles migration automatically
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/create-from-main`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile creation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 400) {
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
          throw new Error(errorData.message || 'Invalid profile data. Please check all required fields.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Please log out and log in again.');
        }
        
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json() as MentorProfileResponse;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create mentor profile');
      }

      console.log('Profile created successfully:', data.profile);
      return data.profile;

    } catch (error) {
      console.error('Create mentor profile error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create mentor profile'
      );
    }
  }

  /**
   * Update mentor profile
   */
  async updateProfile(profileData: UpdateMentorProfileData): Promise<MentorProfile> {
    try {
      let token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Validate data before sending
      console.log('Updating mentor profile with data:', {
        hasName: !!profileData.name,
        hasTitle: !!profileData.title,
        hasCompany: !!profileData.company,
        hasBio: !!profileData.bio,
        hasExpertise: Array.isArray(profileData.expertise) && profileData.expertise.length > 0,
        hasAvailability: !!profileData.availability
      });

      // Clean and validate data
      const cleanedData = { ...profileData };
      
      // Trim string fields
      if (cleanedData.name) cleanedData.name = cleanedData.name.trim();
      if (cleanedData.title) cleanedData.title = cleanedData.title.trim();
      if (cleanedData.company) cleanedData.company = cleanedData.company.trim();
      if (cleanedData.bio) cleanedData.bio = cleanedData.bio.trim();
      if (cleanedData.experience) cleanedData.experience = cleanedData.experience.trim();
      if (cleanedData.linkedin) cleanedData.linkedin = cleanedData.linkedin.trim();

      // Validate expertise array
      if (cleanedData.expertise && Array.isArray(cleanedData.expertise)) {
        cleanedData.expertise = cleanedData.expertise
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      }

      let response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedData),
      });

      // If we get a 403 error (Access denied), try to migrate to mentor database first
      if (response.status === 403) {
        console.log('Access denied - attempting to migrate to mentor database...');
        
        try {
          // Get current user data
          const currentUser = await apiService.getCurrentUser();
          
          // Migrate to mentor database
          const mentorToken = await this.migrateToMentorDatabase({
            id: currentUser.user.id,
            name: currentUser.user.name,
            email: currentUser.user.email
          });
          
          // Update the token in apiService
          apiService.setToken(mentorToken);
          token = mentorToken;
          
          console.log('Migration successful, retrying profile update...');
          
          // Retry the update with the new mentor token
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(cleanedData),
          });
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
          throw new Error('Failed to migrate to mentor database. Please try logging out and logging back in.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Only mentors can update mentor profiles.');
        }
        if (response.status === 404) {
          // Profile not found - this shouldn't happen with the new backend logic
          // but if it does, we'll try to create it using the create-from-main endpoint
          console.log('Profile not found, attempting to create it...');
          try {
            const currentUser = await apiService.getCurrentUser();
            const createData = {
              ...cleanedData,
              userData: {
                id: currentUser.user.id,
                name: currentUser.user.name,
                email: currentUser.user.email
              }
            };
            
            const createResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}/create-from-main`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(createData),
            });
            
            if (createResponse.ok) {
              const createData = await createResponse.json() as MentorProfileResponse;
              if (createData.success) {
                return createData.profile;
              }
            }
          } catch (createError) {
            console.error('Failed to create profile:', createError);
          }
          throw new Error('Mentor profile not found and could not be created. Please try again.');
        }
        if (response.status === 400) {
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
          throw new Error(errorData.message || 'Invalid profile data provided');
        }
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json() as MentorProfileResponse;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update mentor profile');
      }

      // Validate returned profile data
      const profile = data.profile;
      if (!profile || !profile.id) {
        throw new Error('Invalid profile data received after update');
      }

      console.log('Profile updated successfully:', {
        id: profile.id,
        name: profile.name,
        title: profile.title,
        company: profile.company,
        updatedAt: profile.updatedAt
      });

      return profile;
    } catch (error) {
      console.error('Update mentor profile error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update mentor profile'
      );
    }
  }

  /**
   * Delete mentor profile
   */
  async deleteProfile(): Promise<void> {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${this.baseUrl}`, {
        method: 'DELETE',
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
          throw new Error('Mentor profile not found.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete mentor profile');
      }
    } catch (error) {
      console.error('Delete mentor profile error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete mentor profile'
      );
    }
  }
}

export const mentorProfileService = new MentorProfileService();