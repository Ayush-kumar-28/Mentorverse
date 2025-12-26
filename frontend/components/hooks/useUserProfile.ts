import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { UserProfile } from '../../types';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (data: Partial<{
    name: string;
    email: string;
    title: string;
    college: string;
    course: string;
    bio: string;
    experience: string;
    interests: string[] | string;
    skills: string[] | string;
    avatar: string;
  }>) => Promise<void>;
}

const ensureArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  return Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const mapResponseToProfile = (
  response: {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'mentor' | 'mentee';
      college: string;
      course: string;
      title: string;
      bio: string;
      experience: string;
      interests: string[] | string;
      skills: string[] | string;
      avatar: string;
    };
  }
): UserProfile => {
  const { user } = response;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college || '',
    course: user.course || '',
    title: user.title || '',
    bio: user.bio || '',
    experience: user.experience || '',
    interests: ensureArray(user.interests),
    skills: ensureArray(user.skills),
    avatar: user.avatar || '',
  };
};

export const useUserProfile = (): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getProfile();
      setProfile(mapResponseToProfile(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    data: Partial<{
      name: string;
      email: string;
      title: string;
      college: string;
      course: string;
      bio: string;
      experience: string;
      interests: string[] | string;
      skills: string[] | string;
      avatar: string;
    }>
  ) => {
    setError(null);
    try {
      const response = await apiService.updateProfile(data);
      setProfile(mapResponseToProfile({
        user: {
          ...response.user,
          interests: response.user.interests ?? [],
          skills: response.user.skills ?? [],
        },
      }));
      console.log('Frontend profile updated:', response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
    updateProfile,
  };
};