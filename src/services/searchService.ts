import { supabase } from '../lib/supabase';
import { articleCache, generateCacheKey } from '../utils/cacheUtils';
import { getUserPreferences } from './preferencesService';
import { rankArticles } from '../utils/articleRanking';
import type { Article } from '../types/newsapi';

// Cache duration for search results (2 minutes)
const SEARCH_CACHE_DURATION = 2 * 60 * 1000; 

/**
 * Search for articles based on query text
 * @param query - Search terms
 * @param limit - Maximum results to return
 * @param userId - Optional user ID for personalized results
 * @param useCache - Whether to use cached results
 */
export async function searchArticles(
  query: string, 
  limit: number = 20,
  userId?: string,
  useCache: boolean = true
): Promise<Article[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Generate a cache key
    const cacheKey = generateCacheKey({
      type: 'search',
      query: query.trim().toLowerCase(),
      limit,
      userId
    });
    
    // Check cache first
    if (useCache) {
      const cachedResults = articleCache.get<Article[]>(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
    }
    
    // Build search terms by splitting query into words
    const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length >= 2);
    
    // Basic query - search title and content
    const searchQuery = searchTerms.map(term => 
      `title.ilike.%${term}%,content.ilike.%${term}%`
    ).join(',');
    
    // Execute the search
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(searchQuery)
      .limit(limit);
      
    if (error) {
      console.error('Search error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    let results = data;
    
    // If userId is provided, personalize results
    if (userId) {
      const userPrefs = await getUserPreferences(userId);
      if (userPrefs) {
        results = rankArticles(results, userPrefs);
      }
    } 
    // Otherwise, apply basic relevance scoring
    else {
      // Sort by how closely the title matches the search query
      results.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact matches come first
        const aExactMatch = aTitle.includes(query.toLowerCase());
        const bExactMatch = bTitle.includes(query.toLowerCase());
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Then by multiple term matches
        let aMatches = 0;
        let bMatches = 0;
        
        searchTerms.forEach(term => {
          if (aTitle.includes(term)) aMatches++;
          if (bTitle.includes(term)) bMatches++;
        });
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches;
        }
        
        // Finally by publish date (most recent first)
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
    }
    
    // Cache the results
    if (useCache) {
      articleCache.set(cacheKey, results, SEARCH_CACHE_DURATION);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in searchArticles:', error);
    return [];
  }
}

/**
 * Get popular search terms (could be based on analytics in a full implementation)
 */
export function getPopularSearchTerms(): string[] {
  return [
    'blockchain',
    'artificial intelligence',
    'stock market',
    'climate change',
    'web3',
    'startup funding',
    'crypto'
  ];
}