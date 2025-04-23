// Follow Supabase Edge Function conventions for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// Generate a UUID directly without using external library
function generateUUID() {
  return crypto.randomUUID();
}

// Get NewsAPI key from environment secrets - first try Supabase secrets, then fallback to .env variable
const API_KEY = Deno.env.get('NEWSAPI_KEY') || Deno.env.get('VITE_NEWS_API_KEY') || 'efc7d919e7af413ba5a7f4a3ebdb3862'; // Fallback to default key
const BASE_URL = 'https://newsapi.org/v2';

// Log API key status (without revealing the actual key)
console.log(`NewsAPI key status: ${API_KEY ? 'Key available' : 'No key found'}`);
console.log(`Using NewsAPI key starting with: ${API_KEY.substring(0, 4)}...`);

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Enhanced delay function with exponential backoff based on retry count
function delay(ms: number, retryCount = 0) {
  // Exponential backoff - increase delay based on retry count
  const backoffFactor = Math.pow(2, retryCount); // Increased from 1.5 to 2 for more aggressive backoff
  const adjustedDelay = Math.min(ms * backoffFactor, 15000); // Cap at 15 seconds (increased from 10)
  return new Promise(resolve => setTimeout(resolve, adjustedDelay));
}

// Function to fetch top headlines using native fetch with retry logic
async function fetchTopHeadlines(
  category = '',
  country = 'us',
  pageSize = 20,
  language = 'en',
  maxRetries = 3 // Increased from 2 to 3
) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Define params with index signature to allow dynamic property assignment
      const params: Record<string, string | number> = {
        apiKey: API_KEY,
        country,
        pageSize,
        language
      };

      if (category) {
        params.category = category;
      }

      // Build URL with query parameters
      const url = new URL(`${BASE_URL}/top-headlines`);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key].toString());
      });

      console.log(`Fetching headlines for category: ${category || 'all'}, language: ${language}, attempt: ${retries + 1}`);
      const response = await fetch(url.toString());
      
      // Check for rate limiting (429 status)
      if (response.status === 429) {
        console.warn(`Rate limit hit fetching ${category}. Retrying after longer delay...`);
        retries++;
        // Use exponential backoff for rate limit errors
        await delay(5000, retries); // Increased base delay from 3000 to 5000
        continue;
      }
      
      // Check for API key errors (401 status)
      if (response.status === 401) {
        const errorText = await response.text();
        console.error(`NewsAPI authentication error: ${errorText}`);
        throw new Error(`NewsAPI authentication error: Invalid API key or unauthorized request. Please check your API key.`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsAPI HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Validate the response structure
      if (data.status !== "ok") {
        console.error("NewsAPI returned an error:", data);
        throw new Error(`NewsAPI Error: ${data.message || "Unknown error"}`);
      }
      
      console.log(`Received ${data.articles?.length || 0} articles from NewsAPI for category ${category || 'all'}`);
      
      return data;
    } catch (error) {
      console.error(`Error fetching top headlines (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      // Special handling for auth errors - don't retry
      if (error.message && error.message.includes('authentication error')) {
        throw error; // Don't retry auth errors
      }
      
      if (retries < maxRetries) {
        retries++;
        await delay(5000, retries); // Increased base delay from 3000 to 5000
        continue;
      }
      throw error;
    }
  }
}

// Function to search articles using native fetch with retry logic
async function searchArticles(
  query: string,
  sortBy = 'publishedAt',
  pageSize = 20,
  language = 'en',
  maxRetries = 3 // Increased from 2 to 3
) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const url = new URL(`${BASE_URL}/everything`);
      url.searchParams.append('q', query);
      url.searchParams.append('sortBy', sortBy);
      url.searchParams.append('pageSize', pageSize.toString());
      url.searchParams.append('language', language);
      url.searchParams.append('apiKey', API_KEY);
      
      // Add a date range to ensure we get fresh content
      // Get date from 2 days ago to ensure we get recent content
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const formattedDate = twoDaysAgo.toISOString().split('T')[0];
      url.searchParams.append('from', formattedDate);

      console.log(`Searching articles for query: "${query}", language: ${language}, from: ${formattedDate}, attempt: ${retries + 1}`);
      const response = await fetch(url.toString());
      
      // Check for rate limiting (429 status)
      if (response.status === 429) {
        console.warn(`Rate limit hit searching for ${query}. Retrying after longer delay...`);
        retries++;
        // Use exponential backoff for rate limit errors
        await delay(5000, retries); // Increased base delay from 3000 to 5000
        continue;
      }
      
      // Check for API key errors (401 status)
      if (response.status === 401) {
        const errorText = await response.text();
        console.error(`NewsAPI authentication error: ${errorText}`);
        throw new Error(`NewsAPI authentication error: Invalid API key or unauthorized request. Please check your API key.`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsAPI HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Validate the response structure
      if (data.status !== "ok") {
        console.error("NewsAPI returned an error:", data);
        throw new Error(`NewsAPI Error: ${data.message || "Unknown error"}`);
      }
      
      console.log(`Received ${data.articles?.length || 0} articles from NewsAPI for query "${query}"`);
      
      return data;
    } catch (error) {
      console.error(`Error searching articles (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      // Special handling for auth errors - don't retry
      if (error.message && error.message.includes('authentication error')) {
        throw error; // Don't retry auth errors
      }
      
      if (retries < maxRetries) {
        retries++;
        await delay(5000, retries); // Increased base delay from 3000 to 5000
        continue;
      }
      throw error;
    }
  }
}

// Detect language from article content
function detectLanguage(article: any): string {
  // Default to English if no language is specified in the API response
  // In a production app, you might use a language detection library
  return article.language || 'en';
}

// Function to determine the category of an article with enhanced precision
function determineCategory(article: any): string {
  // Simple logic to determine category based on title and description
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Define category keywords with weights for more accurate categorization
  const categoryKeywords = {
    // AI categories with more precise subcategories
    'artificial_intelligence': [
      'artificial intelligence', 'ai ', 'ai-', 'ai,', 'ai.', 'ai:', 'ai;', 'ai"', 'ai\'', 
      'intelligent systems', 'ai assistant', 'ai model', 'ai technology', 'cognitive computing',
      'ai research', 'artificial intelligence', 'superintelligence', 'ai agent', 'ai system',
      'artificial general intelligence', 'ai development', 'ai capabilities'
    ],
    'machine_learning': [
      'machine learning', 'ml ', 'ml-', 'ml,', 'ml.', 'deep learning', 'neural network',
      'training model', 'supervised learning', 'unsupervised learning', 'reinforcement learning',
      'ml algorithm', 'predictive model', 'computer vision', 'transformer architecture', 
      'model training', 'feature extraction', 'classification algorithm', 'clustering algorithm'
    ],
    'llm': [
      'llm', 'large language model', 'chatgpt', 'gpt-4', 'gpt4', 'gpt-5', 'gpt5', 'language model',
      'text generation', 'openai', 'claude', 'gemini', 'bard', 'transformer model', 'llama',
      'palm', 'text-to-text', 'natural language processing', 'nlp', 'foundation model',
      'parameter', 'mistral', 'anthropic', 'falcon', 'text-davinci', 'language understanding'
    ],
    'generative_ai': [
      'generative ai', 'gen ai', 'text-to-image', 'text to image', 'diffusion model',
      'stable diffusion', 'midjourney', 'dall-e', 'dalle', 'image generation',
      'ai art', 'ai-generated', 'prompt engineering', 'text to speech', 'voice synthesis',
      'deepfake', 'synthetic data', 'generative model', 'ai content generation',
      'ai image generator', 'ai creative tools', 'synthetic media'
    ],
    'ai_ethics': [
      'ai ethics', 'algorithm bias', 'ethical ai', 'ai regulation', 'responsible ai',
      'explainable ai', 'xai', 'transparent ai', 'ai safety', 'ai alignment', 'ai governance',
      'algorithmic fairness', 'ai accountability', 'ai transparency', 'ai policy',
      'ai legislation', 'facial recognition ethics', 'ai discrimination', 'ai bias'
    ],
    'ai_research': [
      'ai research', 'ai paper', 'ai breakthrough', 'ai advancement', 'ai lab',
      'ai development', 'ai progress', 'ai innovation', 'ai science', 'ai study',
      'ai experiment', 'ai conference', 'ai journal', 'ai publication', 'neurips',
      'icml', 'ai research lab', 'ai technique', 'ml research', 'ai researcher'
    ],
    // Standard categories
    'web3': [
      'web3', 'blockchain', 'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 
      'nft', 'defi', 'smart contract', 'token', 'decentralized', 'ico', 'dao',
      'web 3.0', 'crypto wallet', 'digital ledger', 'mining', 'staking', 'altcoin'
    ],
    'stocks': [
      'stock', 'market', 'investment', 'trading', 'nasdaq', 'dow jones', 'sp500', 'sp 500',
      'bull', 'bear', 'dividend', 'earnings', 'portfolio', 'investor', 'etf', 'ipo',
      'securities', 'equity', 'shares', 'nyse', 'ticker', 'stock price'
    ],
    'technology': [
      'tech', 'software', 'app', 'startup', 'innovation', 'digital', 'computer', 'cloud',
      'iot', 'automation', '5g', 'devices', 'semiconductor', 'hardware', 'cybersecurity',
      'programming', 'web development', 'saas', 'silicon valley', 'tech company'
    ],
    'business': [
      'business', 'company', 'corporate', 'industry', 'firm', 'revenue',
      'ceo', 'executive', 'profit', 'enterprise', 'merger', 'acquisition',
      'startup', 'entrepreneur', 'cfo', 'board', 'commercial', 'retail'
    ],
    'science': [
      'science', 'research', 'study', 'discovery', 'scientist', 'physics', 
      'chemistry', 'biology', 'space', 'nasa', 'experiment', 'breakthrough',
      'laboratory', 'quantum', 'scientific', 'astronomy', 'particle', 'genome'
    ],
    'health': [
      'health', 'medical', 'disease', 'treatment', 'patient', 'doctor', 
      'hospital', 'medicine', 'vaccine', 'healthcare', 'therapy', 'wellness',
      'clinical', 'diagnosis', 'pharmaceutical', 'surgery', 'pandemic', 'diet'
    ]
  };
  
  // Count keyword matches for each category
  const categoryCounts: Record<string, number> = {};
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    categoryCounts[category] = 0;
    
    keywords.forEach(keyword => {
      // Count occurrences and weight by exact match vs partial match
      if (text.includes(keyword)) {
        // Higher weight for exact word match with boundaries
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(text)) {
          categoryCounts[category] += 2;
        } else {
          // Lower weight for partial match
          categoryCounts[category] += 1;
        }
      }
    });
  });
  
  // Find category with highest keyword count
  let bestCategory = 'general';
  let highestCount = 0;
  
  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > highestCount) {
      highestCount = count;
      bestCategory = category;
    }
  });
  
  // Only assign a specific category if we have enough evidence
  return highestCount >= 2 ? bestCategory : 'general';
}

// Function to extract tags from an article with improved accuracy
function extractTags(article: any): string[] {
  const text = `${article.title} ${article.description || ''}`;
  
  // List of common keywords across categories
  const keywordsList = [
    // AI/ML specific keywords
    'artificial intelligence', 'ai', 'machine learning', 'deep learning', 'neural network',
    'large language model', 'llm', 'chatgpt', 'gpt-4', 'openai', 'nlp', 'computer vision',
    'generative ai', 'stable diffusion', 'midjourney', 'dalle', 'ai ethics', 'ai research',
    'transformer', 'foundation model', 'reinforcement learning', 'diffusion model',
    'prompt engineering', 'agi', 'ai alignment', 'ai safety', 'ai agent', 'ai system',
    'mistral ai', 'anthropic', 'gemini', 'claude', 'multimodal', 'vision model',
    
    // Web3/Crypto/Blockchain
    'blockchain', 'web3', 'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 
    'nft', 'defi', 'metaverse', 'token', 'wallet', 'mining', 'smart contract',
    'dao', 'decentralized', 'ledger', 'web 3', 'staking', 'solana', 'cardano',
    
    // Stocks/Finance
    'stocks', 'trading', 'market', 'finance', 'investment', 'investor',
    'portfolio', 'earnings', 'dividend', 'nasdaq', 'dow', 'nyse', 
    'bull', 'bear', 'hedge fund', 'etf', 'ipo', 'securities', 'shares',
    'stock market', 'financial', 'wall street', 'sp500', 'treasury', 'bond',
    
    // Technology
    'technology', 'software', 'startup', 'innovation', 'digital', 'app', 'mobile', 'data', 'cloud', 'saas',
    'robotics', 'automation', 'cybersecurity', '5g', 'internet of things', 'iot', 'tech',
    'programming', 'code', 'developer', 'cyber', 'computing', 'hardware', 'software',
    
    // Business
    'business', 'company', 'ceo', 'startup', 'entrepreneur', 'industry',
    'acquisition', 'merger', 'revenue', 'profit', 'funding', 'venture capital',
    'corporate', 'enterprise', 'retail', 'ecommerce', 'commercial', 'b2b', 'cfo'
  ];
  
  // Extract words and short phrases
  const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const phrases = text.toLowerCase().match(/\b\w+\s\w+\b/g) || [];
  
  // Find matches
  const tagSet = new Set<string>();
  
  // Check single words
  words.forEach(word => {
    if (keywordsList.some(keyword => keyword === word)) {
      tagSet.add(word);
    }
  });
  
  // Check phrases
  phrases.forEach(phrase => {
    if (keywordsList.some(keyword => keyword === phrase)) {
      tagSet.add(phrase);
    }
  });
  
  // Extract company names or product names if in title (basic heuristic)
  // Look for words that are capitalized in the middle of sentences
  const titleWords = article.title.split(/\s+/);
  titleWords.forEach((word: string, index: number) => {
    // Skip first word and short words
    if (index > 0 && word.length > 3) {
      // If it starts with a capital letter and isn't at the beginning of a sentence
      if (/^[A-Z][a-z]+$/.test(word)) {
        tagSet.add(word.toLowerCase());
      }
    }
  });
  
  return Array.from(tagSet);
}

// Calculate a more sophisticated relevance score for articles
function calculateBaseRelevanceScore(article: any): number {
  let score = 0;
  
  // Recency bonus (newer articles get higher scores)
  const publishedDate = new Date(article.publishedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 6) {
    score += 30; // Very recent news (< 6 hours)
  } else if (hoursDiff < 24) {
    score += 20; // Recent news (< 24 hours)
  } else if (hoursDiff < 72) {
    score += 10; // Relatively recent (< 3 days)
  }
  
  // Source quality (simplified example - in production this would be more sophisticated)
  const qualitySources = ['bloomberg', 'reuters', 'financial times', 'wall street journal', 'techcrunch', 'bbc'];
  const sourceLower = article.source.name.toLowerCase();
  if (qualitySources.some(s => sourceLower.includes(s))) {
    score += 15;
  }
  
  // Has image bonus
  if (article.urlToImage) {
    score += 5;
  }
  
  // Content length bonus
  if (article.content && article.content.length > 500) {
    score += 10;
  } else if (article.description && article.description.length > 100) {
    score += 5;
  }
  
  // Title quality (e.g., length, question marks, clickbait detection)
  if (article.title) {
    // Penalize very short titles
    if (article.title.length < 30) {
      score -= 5;
    }
    
    // Penalize clickbait (e.g. titles with "..." or ALL CAPS)
    if (article.title.includes('...') || article.title === article.title.toUpperCase()) {
      score -= 10;
    }
    
    // Penalize question titles (often less informative)
    if (article.title.endsWith('?')) {
      score -= 5;
    }
  }
  
  // Extract tags and give bonus for articles with more specific tags
  const tags = extractTags(article);
  if (tags.length >= 3) {
    score += 10; // Bonus for well-tagged articles
  }
  
  // AI-specific content bonuses
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Check for high-value AI terms to boost score
  const aiHighValueTerms = [
    'artificial intelligence breakthrough', 'llm advancement', 'ai research', 
    'machine learning innovation', 'gpt-4', 'gpt-5', 'ai alignment', 'ai safety',
    'ai regulation', 'foundation models', 'multimodal ai', 'ai acquisition',
    'ai partnership', 'ai legislation', 'ai ethics', 'llm capabilities',
    'ai investment', 'neural network breakthrough', 'ai startup funding'
  ];
  
  for (const term of aiHighValueTerms) {
    if (text.includes(term)) {
      score += 15; // Significant boost for high-value AI topics
      break;
    }
  }
  
  return Math.min(Math.max(score, 10), 90); // Keep between 10-90
}

// Helper function to create a log entry
async function createAggregationLog(eventType: string, status: string, details: any) {
  try {
    const { error } = await supabase
      .from('aggregation_logs')
      .insert({
        event_type: eventType,
        status: status,
        details: details
      });
      
    if (error) {
      console.error('Error creating log entry:', error);
    }
  } catch (error) {
    console.error('Error in createAggregationLog:', error);
  }
}

// Check if an article from NewsAPI is valid and has required fields
function isValidArticle(article: any): boolean {
  if (!article) return false;
  
  // Check for required fields
  if (!article.title || !article.url || !article.publishedAt) {
    return false;
  }
  
  // Make sure title isn't too short (to filter out non-articles)
  if (article.title.trim().length < 10) {
    return false;
  }
  
  // Check for content or description
  if ((!article.content || article.content.trim().length === 0) && 
      (!article.description || article.description.trim().length === 0)) {
    return false;
  }
  
  return true;
}

// Circuit breaker pattern to track API failures
let apiFailureCount = 0;
const API_FAILURE_THRESHOLD = 5; // After 5 failures, circuit breaks
let circuitBreakerTimestamp: number | null = null;
const CIRCUIT_RESET_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function isCircuitBroken(): boolean {
  // If circuit breaker is not active
  if (circuitBreakerTimestamp === null) {
    return false;
  }
  
  // Check if enough time has passed to reset the circuit
  const now = Date.now();
  if (now - circuitBreakerTimestamp > CIRCUIT_RESET_TIMEOUT) {
    console.log("Circuit breaker timeout passed. Resetting circuit.");
    circuitBreakerTimestamp = null;
    apiFailureCount = 0;
    return false;
  }
  
  return true;
}

function recordApiFailure() {
  apiFailureCount++;
  console.warn(`API failure count: ${apiFailureCount}/${API_FAILURE_THRESHOLD}`);
  
  if (apiFailureCount >= API_FAILURE_THRESHOLD && circuitBreakerTimestamp === null) {
    console.warn(`Circuit breaker activated! Stopping API calls for ${CIRCUIT_RESET_TIMEOUT/60000} minutes.`);
    circuitBreakerTimestamp = Date.now();
  }
}

function recordApiSuccess() {
  // Reset the failure count on success
  apiFailureCount = 0;
}

// Main function to aggregate news
async function aggregateNews(req: Request) {
  // Parse request body for any options
  let options: Record<string, any> = {};
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      options = body || {};
    }
  } catch (error) {
    console.log('No JSON body or error parsing it:', error);
  }
  
  const forceUpdate = options.forceUpdate === true;
  const requestedLanguages = options.languages || [];
  const singleCategory = options.singleCategory !== false; // Default to true to reduce API calls
  
  // Create a starting log entry
  await createAggregationLog('aggregation', 'running', {
    started_at: new Date().toISOString(),
    message: 'Starting news aggregation process',
    options
  });
  
  try {
    // Check if circuit breaker is active
    if (isCircuitBroken()) {
      const minutesLeft = Math.ceil((CIRCUIT_RESET_TIMEOUT - (Date.now() - circuitBreakerTimestamp!)) / 60000);
      
      throw new Error(`API circuit breaker is active due to too many failures. Try again in ${minutesLeft} minutes.`);
    }
    
    // Validate API key before making any requests
    if (!API_KEY || API_KEY.trim().length < 10) {
      throw new Error("Invalid or missing NewsAPI key. Please configure a valid API key in the environment variables.");
    }
    
    console.log(`NewsAPI key appears valid (begins with ${API_KEY.substring(0, 4)}...)`);
    
    // Define languages to fetch - use requested languages or default to English
    const languages = requestedLanguages.length > 0 ? requestedLanguages : ['en']; 
    console.log(`Fetching articles in languages: ${languages.join(', ')}${forceUpdate ? ' (force update mode)' : ''}`);
    
    // FURTHER REDUCTION: Limit categories more aggressively to reduce API calls
    let newsApiCategories: string[] = ['technology']; // Only use technology category
    
    if (!singleCategory) {
      // Add business as a second category only if not in single category mode
      newsApiCategories.push('business');
    }
    
    console.log(`Using ${singleCategory ? 'single' : 'multiple'} category mode with: ${newsApiCategories.join(', ')}`);
    
    // REDUCTION: More aggressive limit on search queries
    const queries = singleCategory 
      ? ['artificial intelligence'] // Just one query in single category mode
      : ['artificial intelligence', 'machine learning']; // Two in normal mode
    
    // Store all articles
    let allArticles: any[] = [];
    let fetchErrors = 0;
    
    // Set a maximum number of total API calls to prevent excessive rate limiting
    const MAX_API_CALLS = singleCategory ? 3 : 6; // Even lower limit than before
    let apiCallsMade = 0;
    
    // Set a higher base delay to avoid rate limiting
    const BASE_DELAY = 5000; // 5 seconds between requests (increased from 3)
    
    // Fetch top headlines from categories
    for (const language of languages) {
      for (const category of newsApiCategories) {
        // Check if we're exceeding our API call limit
        if (apiCallsMade >= MAX_API_CALLS) {
          console.log(`Reached maximum API calls limit (${MAX_API_CALLS}). Stopping further requests.`);
          break;
        }
        
        try {
          console.log(`Fetching headlines for category: ${category}, language: ${language}`);
          const response = await fetchTopHeadlines(category, 'us', 20, language);
          apiCallsMade++;
          recordApiSuccess(); // Record successful API call
          
          if (response.status === 'ok' && response.articles && response.articles.length > 0) {
            console.log(`Successfully fetched ${response.articles.length} articles for category ${category}`);
            
            // Add language information to each article and filter out invalid ones
            const articlesWithLanguage = response.articles
              .filter(isValidArticle)
              .map(article => ({
                ...article,
                language
              }));
            
            allArticles = [...allArticles, ...articlesWithLanguage];
            console.log(`Added ${articlesWithLanguage.length} valid articles from category ${category}`);
          } else {
            console.warn(`No articles returned for category ${category} or unexpected response:`, response);
          }
          
          // Add delay between API calls to avoid rate limiting
          await delay(BASE_DELAY, fetchErrors);
        } catch (error) {
          console.error(`Error fetching ${category} articles:`, error);
          fetchErrors++;
          recordApiFailure(); // Record API failure
          
          // Check if we've exceeded a reasonable error threshold
          if (fetchErrors > 2) { // Reduced from 3 to 2
            console.warn(`Stopping category fetches after ${fetchErrors} errors to avoid further rate limiting`);
            break;
          }
        }
      }
      
      // Check if we need to stop due to errors or API limits
      if (fetchErrors > 2 || apiCallsMade >= MAX_API_CALLS) { // Reduced from 3 to 2
        break;
      }
      
      // Skip search queries in single category mode to save API calls
      if (!singleCategory) {
        // Fetch by search queries - using everything endpoint for broader results
        for (const query of queries) {
          // Check if we're exceeding our API call limit
          if (apiCallsMade >= MAX_API_CALLS) {
            console.log(`Reached maximum API calls limit (${MAX_API_CALLS}). Stopping further requests.`);
            break;
          }
          
          try {
            console.log(`Searching for query: "${query}", language: ${language}`);
            const response = await searchArticles(query, 'publishedAt', 20, language);
            apiCallsMade++;
            recordApiSuccess(); // Record successful API call
            
            if (response.status === 'ok' && response.articles && response.articles.length > 0) {
              console.log(`Successfully fetched ${response.articles.length} articles for query "${query}"`);
              
              // Add language information to each article and filter out invalid ones
              const articlesWithLanguage = response.articles
                .filter(isValidArticle)
                .map(article => ({
                  ...article,
                  language
                }));
              
              allArticles = [...allArticles, ...articlesWithLanguage];
              console.log(`Added ${articlesWithLanguage.length} valid articles from query "${query}"`);
            } else {
              console.warn(`No articles returned for query "${query}" or unexpected response:`, response);
            }
            
            // Add delay between API calls to avoid rate limiting
            await delay(BASE_DELAY, fetchErrors);
          } catch (error) {
            console.error(`Error searching for ${query}:`, error);
            fetchErrors++;
            recordApiFailure(); // Record API failure
            
            // Check if we've exceeded a reasonable error threshold
            if (fetchErrors > 2) { // Reduced from 3 to 2
              console.warn(`Stopping query searches after ${fetchErrors} errors to avoid further rate limiting`);
              break;
            }
          }
        }
      }
    }
    
    console.log(`Total articles fetched before deduplication: ${allArticles.length}`);
    
    // Dramatically reduce threshold for acceptable fetch errors
    if (fetchErrors > 2) { // Reduced from 3 to 2
      throw new Error(`Too many fetch errors (${fetchErrors}). Possible rate limit or API issues with NewsAPI. Try again later.`);
    }
    
    // Check that we have articles
    if (allArticles.length === 0) {
      throw new Error(`No articles were fetched from NewsAPI. Please check that your API key (${API_KEY.substring(0, 4)}...) is valid and not rate-limited.`);
    }
    
    // Check for duplicates in the fetched articles first (by URL)
    const urlSet = new Set<string>();
    const uniqueArticles: any[] = [];
    
    for (const article of allArticles) {
      if (article && article.url && !urlSet.has(article.url)) {
        urlSet.add(article.url);
        uniqueArticles.push(article);
      }
    }
    
    console.log(`Unique articles after initial deduplication: ${uniqueArticles.length}`);
    
    // Transform articles for database with enhanced processing
    const transformedArticles = uniqueArticles.map(article => {
      // Skip any invalid articles
      if (!article.title || !article.url) {
        return null;
      }
      
      // Perform advanced category detection
      const category = determineCategory(article);
      
      // Extract meaningful tags
      const tags = extractTags(article);
      
      // Calculate initial relevance score
      const relevanceScore = calculateBaseRelevanceScore(article);
      
      // Detect language
      const language = article.language || detectLanguage(article);
      
      // Process content - NewsAPI sometimes provides truncated content
      // Here we prioritize full content > description > empty string
      let content = '';
      if (article.content && article.content.length > 10) {
        // Sometimes content is cut off with "[+XXXX chars]" - remove that part
        content = article.content.replace(/\[\+\d+ chars\]$/, '').trim();
      }
      
      // If content is still too short or missing, use description
      if (content.length < 50 && article.description) {
        content = article.description;
      }
      
      return {
        id: generateUUID(),
        title: article.title.trim(),
        content: content,
        source: article.source?.name || 'Unknown Source',
        url: article.url,
        image_url: article.urlToImage || null,
        published_at: article.publishedAt,
        created_at: new Date().toISOString(),
        relevance_score: relevanceScore,
        category: category,
        tags: tags,
        language: language
      };
    }).filter(article => article !== null); // Remove any nulls from invalid articles
    
    console.log(`Valid transformed articles: ${transformedArticles.length}`);
    
    if (transformedArticles.length === 0) {
      throw new Error("No valid articles available after processing");
    }
    
    let newArticles;
    
    // If forceUpdate is true, skip the duplicate check and add all articles
    if (forceUpdate) {
      console.log("Force update enabled - skipping duplicate checks");
      newArticles = transformedArticles;
    } else {
      // Get existing articles from database to avoid duplicates
      // Use URL as a unique key to detect duplicates
      console.log("Fetching existing articles from database to check for duplicates");
      
      // First, extract all URLs from transformed articles for the query
      const allUrls = transformedArticles.map(article => article.url);
      
      // Query to check which URLs already exist in the database
      // This is more efficient than fetching all URLs
      let { data: existingUrls, error: existingError } = await supabase
        .from('articles')
        .select('url')
        .in('url', allUrls);
        
      if (existingError) {
        console.error('Error checking for duplicate URLs:', existingError);
        
        // Fallback to checking against recent articles if the in query fails
        console.log("Fallback: Fetching recent articles for duplicate check");
        const { data: recentArticles, error: recentError } = await supabase
          .from('articles')
          .select('url')
          .order('created_at', { ascending: false })
          .limit(500); // Get the most recent 500 articles
          
        if (recentError) {
          console.error('Error fetching recent articles:', recentError);
          throw recentError;
        }
        
        existingUrls = recentArticles;
      }
      
      console.log(`Found ${existingUrls?.length || 0} existing article URLs to check against`);
      
      // Create a Set of existing URLs for efficient lookup
      const existingUrlsSet = new Set<string>();
      if (existingUrls) {
        existingUrls.forEach(article => {
          if (article.url) {
            existingUrlsSet.add(article.url);
          }
        });
      }
      
      console.log(`Number of unique URLs in database check: ${existingUrlsSet.size}`);
  
      // Filter out already existing articles by URL
      newArticles = transformedArticles.filter(
        article => !existingUrlsSet.has(article.url)
      );
      
      console.log(`New articles to add after filtering duplicates: ${newArticles.length}`);
    }
    
    if (newArticles.length === 0) {
      console.log("No new articles to add - all fetched articles already exist in database");
      
      // Update the aggregation status
      await supabase
        .from('system_settings')
        .upsert({ 
          id: 'aggregation_status',
          last_run: new Date().toISOString(),
          status: 'success',
          articles_count: 0,
          error_message: null,
          updated_at: new Date().toISOString()
        });
        
      // Create log entry for no new articles
      await createAggregationLog('aggregation', 'success', {
        message: 'No new articles to add - all articles already exist in database',
        count: 0,
        timestamp: new Date().toISOString()
      });
        
      return { 
        message: 'No new articles to add - all fetched articles already exist in the database',
        count: 0,
        forceUpdate
      };
    }

    // Insert articles into Supabase in batches to avoid payload size limits
    const BATCH_SIZE = 50; // Smaller batch size to avoid payload limits
    let insertedCount = 0;
    let insertErrors = [];
    
    console.log(`Inserting ${newArticles.length} articles in batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < newArticles.length; i += BATCH_SIZE) {
      const batch = newArticles.slice(i, i + BATCH_SIZE);
      try {
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(newArticles.length / BATCH_SIZE)}`);
        const { data, error } = await supabase
          .from('articles')
          .insert(batch)
          .select();
          
        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
          insertErrors.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            error: error.message
          });
        } else {
          insertedCount += data?.length || 0;
          console.log(`Successfully inserted ${data?.length || 0} articles in this batch`);
        }
        
        // Small delay between batches
        await delay(500);
      } catch (error) {
        console.error(`Exception in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        insertErrors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    console.log(`Completed inserting ${insertedCount} out of ${newArticles.length} articles`);

    // Update the last_aggregation timestamp
    await supabase
      .from('system_settings')
      .upsert({ 
        id: 'aggregation_status',
        last_run: new Date().toISOString(),
        status: insertErrors.length > 0 ? 'partial_success' : 'success',
        articles_count: insertedCount,
        error_message: insertErrors.length > 0 ? JSON.stringify(insertErrors) : null,
        updated_at: new Date().toISOString()
      });
      
    // Create success log entry with category and tag stats
    const categoryStats: Record<string, number> = {};
    const languageStats: Record<string, number> = {};
    
    newArticles.forEach(article => {
      // Count by category
      categoryStats[article.category] = (categoryStats[article.category] || 0) + 1;
      
      // Count by language
      languageStats[article.language] = (languageStats[article.language] || 0) + 1;
    });
    
    const avgTagsPerArticle = newArticles.reduce((sum, article) => 
      sum + (article.tags?.length || 0), 0) / (newArticles.length || 1);
    
    await createAggregationLog('aggregation', insertErrors.length > 0 ? 'partial_success' : 'success', {
      count: insertedCount,
      categories: categoryStats,
      languages: languageStats,
      avg_tags: Math.round(avgTagsPerArticle * 10) / 10,
      errors: insertErrors.length > 0 ? insertErrors : null,
      timestamp: new Date().toISOString()
    });

    return { 
      message: insertErrors.length > 0 
        ? `News aggregation completed with some errors: ${insertedCount} articles inserted, ${insertErrors.length} errors` 
        : 'News aggregation completed successfully',
      count: insertedCount,
      categories: categoryStats,
      languages: languageStats,
      errors: insertErrors.length > 0 ? insertErrors : null,
      forceUpdate
    };
  } catch (error) {
    console.error('Error in aggregateNews:', error);
    
    // Update status on error
    await supabase
      .from('system_settings')
      .upsert({ 
        id: 'aggregation_status',
        last_run: new Date().toISOString(),
        status: 'error',
        error_message: error instanceof Error ? error.message : "An unknown error occurred",
        updated_at: new Date().toISOString()
      });
      
    // Create error log entry
    await createAggregationLog('aggregation', 'error', {
      error: error instanceof Error ? error.message : "An unknown error occurred",
      timestamp: new Date().toISOString()
    });
      
    throw error;
  }
}

// Handler for the Edge Function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Starting news aggregation process");
    const result = await aggregateNews(req);
    console.log("Aggregation completed successfully");
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Aggregation failed with error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: new Date().toISOString()  
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});