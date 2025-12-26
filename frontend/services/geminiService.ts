import { apiService } from './api';
import type { MatchmakingProfile, Mentor } from '../types';

export const findMentors = async (profile: MatchmakingProfile, allMentors: Mentor[]): Promise<Mentor[]> => {
  try {
    return await apiService.matchMentors(profile, allMentors);
  } catch (error) {
    console.error('Error requesting mentor matches:', error);
    throw new Error('Failed to get mentor recommendations from AI.');
  }
};
