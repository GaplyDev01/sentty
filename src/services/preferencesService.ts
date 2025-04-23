import { supabase } from '../lib/supabase';
import type { UserPreference } from '../types/newsapi';

// In-memory cache for user preferences to avoid repeated queries
const preferencesCache: Record<string, { data: UserPreference, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Get user preferences by user ID
export async function getUserPreferences(userId: string): Promise<UserPreference | null> {
  try {
    // Check if we have a fresh cache entry
    const cached = preferencesCache[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Using cached user preferences');
      return cached.data;
    }

    // First, check if user preferences exist
    const { count, error: countError } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error checking user preferences existence:', countError);
      return null;
    }

    // If no preferences exist, create default ones
    if (count === 0) {
      console.log('No preferences found for user, creating defaults');
      const defaultPrefs = getDefaultPreferences(userId);
      return await updateUserPreferences(defaultPrefs);
    }

    // If preferences exist, fetch them
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, this should be handled by the count check above
        // but adding as a fallback
        console.log('No preferences found in single query, creating defaults');
        const defaultPrefs = getDefaultPreferences(userId);
        return await updateUserPreferences(defaultPrefs);
      }
      console.error('Error fetching user preferences:', error);
      return null;
    }

    // Cache the result
    if (data) {
      preferencesCache[userId] = {
        data,
        timestamp: Date.now()
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
}

// Update user preferences
export async function updateUserPreferences(preferences: Partial<UserPreference>): Promise<UserPreference | null> {
  try {
    if (!preferences.user_id) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }

    // Update cache with the new data
    if (data) {
      preferencesCache[preferences.user_id] = {
        data,
        timestamp: Date.now()
      };
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return null;
  }
}

// Clear the preferences cache for a user
export function clearPreferencesCache(userId?: string): void {
  if (userId) {
    delete preferencesCache[userId];
  } else {
    // Clear all cache
    Object.keys(preferencesCache).forEach(key => {
      delete preferencesCache[key];
    });
  }
}

// Get default preferences (used when creating new preferences)
export function getDefaultPreferences(userId: string): Omit<UserPreference, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    keywords: [],
    categories: [],
    sources: [],
    excluded_keywords: [],
    languages: ['en'] // Default to English
  };
}

// Get available languages
export function getAvailableLanguages() {
  return [
    { id: 'en', name: 'English' },
    { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' },
    { id: 'es', name: 'Spanish' },
    { id: 'it', name: 'Italian' },
    { id: 'pt', name: 'Portuguese' },
    { id: 'ru', name: 'Russian' },
    { id: 'nl', name: 'Dutch' },
    { id: 'no', name: 'Norwegian' },
    { id: 'sv', name: 'Swedish' }
  ];
}

// Get all available categories
export function getAvailableCategories() {
  return [
    { id: 'business', name: 'Business' },
    { id: 'crypto', name: 'Cryptocurrency' },
    { id: 'stocks', name: 'Stock Market' },
    { id: 'technology', name: 'Technology' },
    { id: 'web3', name: 'Web3' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' },
    // Add AI categories
    { id: 'artificial_intelligence', name: 'Artificial Intelligence' },
    { id: 'machine_learning', name: 'Machine Learning' },
    { id: 'llm', name: 'LLMs' },
    { id: 'generative_ai', name: 'Generative AI' },
    { id: 'ai_ethics', name: 'AI Ethics' },
    { id: 'ai_research', name: 'AI Research' }
  ];
}

// Get all available sources
export function getAvailableSources() {
  return [
    { id: 'bloomberg', name: 'Bloomberg' },
    { id: 'cnn', name: 'CNN' },
    { id: 'bbc-news', name: 'BBC News' },
    { id: 'reuters', name: 'Reuters' },
    { id: 'techcrunch', name: 'TechCrunch' },
    { id: 'the-verge', name: 'The Verge' },
    { id: 'wired', name: 'Wired' },
    // Add AI-focused sources
    { id: 'mit-technology-review', name: 'MIT Technology Review' },
    { id: 'venturebeat', name: 'VentureBeat' },
    { id: 'ai-news', name: 'AI News' },
    { id: 'arxiv', name: 'arXiv' }
  ];
}