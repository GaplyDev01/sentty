import { supabase } from '../lib/supabase';
import { fetchTopHeadlines, searchArticles } from '../api/newsapi';
import { getUserPreferences } from './preferencesService';
import { calculateRelevanceScore, rankArticles } from '../utils/articleRanking';
import { articleCache, generateCacheKey } from '../utils/cacheUtils';
import type { Article, NewsArticle, UserPreference } from '../types/newsapi';
import { v4 as uuidv4 } from 'uuid';

// Function to fetch articles from NewsAPI and store them in Supabase
export async function fetchAndStoreArticles(): Promise<void> {
  try {
    // Fetch top headlines from different categories
    const categories = ['business', 'technology', 'science', 'health'];
    let allArticles: NewsArticle[] = [];

    for (const category of categories) {
      const response = await fetchTopHeadlines(category);
      if (response.status === 'ok' && response.articles.length > 0) {
        allArticles = [...allArticles, ...response.articles];
      }
    }

    // Transform NewsAPI articles to our database format
    const transformedArticles = allArticles.map(article => ({
      id: uuidv4(),
      title: article.title,
      content: article.content || article.description || '',
      source: article.source.name,
      url: article.url,
      image_url: article.urlToImage,
      published_at: article.publishedAt,
      created_at: new Date().toISOString(),
      relevance_score: null, // Will be calculated later
      category: determineCategory(article),
      tags: extractTags(article)
    }));

    // Insert articles into Supabase
    const { error } = await supabase.from('articles').insert(transformedArticles);

    if (error) {
      console.error('Error storing articles in Supabase:', error);
    }
  } catch (error) {
    console.error('Error in fetch and store articles:', error);
  }
}

// Function to determine the category of an article
function determineCategory(article: NewsArticle): string {
  // Simple logic to determine category based on title and description
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  if (text.includes('web3') || text.includes('bitcoin') || text.includes('blockchain')) {
    return 'web3';
  } else if (text.includes('stock') || text.includes('market') || text.includes('investment')) {
    return 'stocks';
  } else if (text.includes('tech') || text.includes('software') || text.includes('ai')) {
    return 'technology';
  } else {
    return 'general';
  }
}

// Function to extract tags from an article
function extractTags(article: NewsArticle): string[] {
  const text = `${article.title} ${article.description || ''}`;
  const words = text.toLowerCase().split(/\W+/);
  
  // Common keywords to use as tags
  const keywordsList = [
    'blockchain', 'web3', 'bitcoin', 'ethereum', 'web3',
    'stocks', 'trading', 'market', 'finance', 'investment',
    'technology', 'ai', 'software', 'startup', 'innovation'
  ];
  
  return Array.from(new Set(words.filter(word => keywordsList.includes(word))));
}

// Function to get articles from the database with optional filtering and caching
export async function getArticles(options: {
  limit?: number;
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  excludeUserPreferences?: string; // User ID to exclude their preferences
  useCache?: boolean; // Whether to use cache
}): Promise<{articles: Article[], totalCount: number}> {
  try {
    const {
      limit = 9,
      category,
      tags,
      search,
      sortBy = 'published_at',
      fromDate,
      toDate,
      page = 1,
      excludeUserPreferences,
      useCache = true
    } = options;

    // Generate a cache key based on the request parameters
    const cacheKey = generateCacheKey({
      type: 'articles',
      limit,
      category,
      tags,
      search,
      sortBy,
      fromDate,
      toDate,
      page,
      excludeUserPreferences
    });

    // Check if we have a cached response
    if (useCache) {
      const cachedData = articleCache.get<{articles: Article[], totalCount: number}>(cacheKey);
      if (cachedData) {
        console.log('Using cached article data');
        return cachedData;
      }
    }

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Get total count first
    const countQuery = supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    if (category) {
      countQuery.eq('category', category);
    }

    if (tags && tags.length > 0) {
      countQuery.contains('tags', tags);
    }

    if (search) {
      countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (fromDate) {
      countQuery.gte('published_at', fromDate);
    }

    if (toDate) {
      countQuery.lte('published_at', toDate);
    }

    // If we need to exclude based on user preferences
    if (excludeUserPreferences) {
      const userPrefs = await getUserPreferences(excludeUserPreferences);
      if (userPrefs?.categories && userPrefs.categories.length > 0) {
        // Exclude the user's preferred categories to show different content
        countQuery.not('category', 'in', `(${userPrefs.categories.join(',')})`);
      }
    }

    const { count: totalCount } = await countQuery;

    // Build the main query
    let query = supabase
      .from('articles')
      .select('*')
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (fromDate) {
      query = query.gte('published_at', fromDate);
    }

    if (toDate) {
      query = query.lte('published_at', toDate);
    }

    // If we need to exclude based on user preferences
    if (excludeUserPreferences) {
      const userPrefs = await getUserPreferences(excludeUserPreferences);
      if (userPrefs?.categories && userPrefs.categories.length > 0) {
        // Exclude the user's preferred categories to show different content
        query.not('category', 'in', `(${userPrefs.categories.join(',')})`);
      }
    }

    // Apply sorting
    if (sortBy === 'random') {
      query = query.order('id', { ascending: false }); // Simple approximation of random order
    } else {
      const order: 'asc' | 'desc' = sortBy === 'published_at' ? 'desc' : 
                                   sortBy === 'relevance_score' ? 'desc' : 'desc';
      const sortField = sortBy === 'relevance_score' ? 'relevance_score' : 'published_at';
      query = query.order(sortField, { ascending: order === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const result = { 
      articles: data || [], 
      totalCount: totalCount || 0 
    };
    
    // Cache the result for 5 minutes
    if (useCache) {
      articleCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Function to rank articles based on user preferences with caching
export async function rankArticlesForUser(
  userId: string, 
  options: {
    limit?: number;
    category?: string;
    fromDate?: string;
    page?: number;
    useCache?: boolean;
  } = {}
): Promise<{articles: Article[], totalCount: number}> {
  try {
    const {
      limit = 9,
      category,
      fromDate,
      page = 1,
      useCache = true
    } = options;
    
    // Generate cache key for this particular user and query
    const cacheKey = generateCacheKey({
      type: 'rankedArticles',
      userId,
      limit,
      category,
      fromDate,
      page
    });
    
    // Check cache first
    if (useCache) {
      const cachedData = articleCache.get<{articles: Article[], totalCount: number}>(cacheKey);
      if (cachedData) {
        console.log('Using cached ranked article data');
        return cachedData;
      }
    }
    
    // Fetch user preferences
    const preferences = await getUserPreferences(userId);

    if (!preferences) {
      // If no preferences found, return recent articles without ranking
      return getArticles({
        limit,
        category,
        fromDate,
        page,
        sortBy: 'published_at',
        useCache
      });
    }

    // Step 1: First fetch all articles with basic filtering
    // This simpler approach avoids complex filters that might cause issues
    const allArticlesResponse = await getArticles({
      limit: 100, // Fetch more to allow for ranking and filtering
      category,
      fromDate,
      page: 1, // Always fetch page 1 for ranking
      sortBy: 'published_at',
      useCache
    });
    
    if (!allArticlesResponse || !allArticlesResponse.articles || allArticlesResponse.articles.length === 0) {
      return { articles: [], totalCount: 0 };
    }
    
    // Step 2: Manually rank and filter the articles based on user preferences
    const articles = allArticlesResponse.articles;
    const rankedArticles = rankArticles(articles, preferences);
    
    // Step 3: Apply pagination manually
    const offset = (page - 1) * limit;
    const paginatedArticles = rankedArticles.slice(offset, Math.min(offset + limit, rankedArticles.length));
    
    const result = { 
      articles: paginatedArticles, 
      totalCount: rankedArticles.length 
    };
    
    // Store in cache
    if (useCache) {
      articleCache.set(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in rankArticlesForUser:', error);
    return { articles: [], totalCount: 0 };
  }
}

// Get a single article by ID with caching
export async function getArticleById(id: string, useCache: boolean = true): Promise<Article | null> {
  try {
    // Check cache first
    const cacheKey = `article-${id}`;
    if (useCache) {
      const cachedArticle = articleCache.get<Article>(cacheKey);
      if (cachedArticle) {
        return cachedArticle;
      }
    }
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw error;
    }
    
    // Cache the result
    if (useCache && data) {
      articleCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    return null;
  }
}

// Get related articles based on category and tags with caching
export async function getRelatedArticles(article: Article, limit: number = 3, useCache: boolean = true): Promise<Article[]> {
  try {
    // Generate cache key
    const cacheKey = `related-${article.id}-${limit}`;
    
    // Check cache first
    if (useCache) {
      const cachedArticles = articleCache.get<Article[]>(cacheKey);
      if (cachedArticles) {
        return cachedArticles;
      }
    }
    
    let query = supabase
      .from('articles')
      .select('*')
      .eq('category', article.category)
      .neq('id', article.id);

    // If article has tags, prioritize articles with matching tags
    if (article.tags && article.tags.length > 0) {
      // Try to find articles that have at least one matching tag
      const { data } = await query
        .contains('tags', article.tags)
        .limit(limit);
      
      if (data && data.length >= limit) {
        // Cache and return if we have enough articles
        if (useCache) {
          articleCache.set(cacheKey, data);
        }
        return data;
      }
      
      // If not enough articles with matching tags, get other articles from the same category
      const remaining = limit - (data?.length || 0);
      if (remaining > 0) {
        const { data: remainingData } = await supabase
          .from('articles')
          .select('*')
          .eq('category', article.category)
          .neq('id', article.id)
          .not('id', 'in', `(${(data || []).map(a => a.id).join(',')})`)
          .limit(remaining);
          
        const result = [...(data || []), ...(remainingData || [])];
        
        // Cache the combined result
        if (useCache) {
          articleCache.set(cacheKey, result);
        }
        
        return result;
      }
      
      // Cache and return what we have
      if (useCache && data) {
        articleCache.set(cacheKey, data);
      }
      
      return data || [];
    }
    
    // No tags, just get articles from the same category
    const { data, error } = await query.limit(limit);
      
    if (error) {
      throw error;
    }
    
    // Cache the result
    if (useCache && data) {
      articleCache.set(cacheKey, data);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
}

// Get available categories from the articles table
export function getAvailableCategories() {
  // Updated with AI-related categories
  return [
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' },
    { id: 'stocks', name: 'Stock Market' },
    { id: 'web3', name: 'Web3' },
    // New AI categories
    { id: 'artificial_intelligence', name: 'Artificial Intelligence' },
    { id: 'machine_learning', name: 'Machine Learning' },
    { id: 'llm', name: 'LLMs' },
    { id: 'generative_ai', name: 'Generative AI' },
    { id: 'ai_ethics', name: 'AI Ethics' },
    { id: 'ai_research', name: 'AI Research' },
    { id: 'general', name: 'General' }
  ];
}