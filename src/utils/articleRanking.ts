import type { Article, UserPreference } from '../types/newsapi';

// Function to calculate the relevance score of an article based on user preferences
export function calculateRelevanceScore(article: Article, preferences: UserPreference): number {
  let score = 0;
  
  // Base score for all articles
  score += 10;
  
  // Add points for matching keywords in title (higher weight)
  if (preferences.keywords) {
    preferences.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Check title (higher weight)
      if (article.title.toLowerCase().includes(keywordLower)) {
        score += 15;
      }
      
      // Check content (lower weight)
      if (article.content.toLowerCase().includes(keywordLower)) {
        score += 10;
      }
    });
  }
  
  // Add points for matching categories
  if (preferences.categories && preferences.categories.includes(article.category)) {
    score += 20;
  }
  
  // Add points for preferred sources
  if (preferences.sources && preferences.sources.includes(article.source)) {
    score += 15;
  }

  // Add points for preferred languages
  if (preferences.languages && article.language) {
    if (preferences.languages.includes(article.language)) {
      score += 15; // Significant boost for language match
    } else {
      score -= 10; // Penalty for non-preferred language
    }
  }
  
  // Check if article has tags
  if (article.tags && article.tags.length > 0) {
    // Add points for each tag that matches a keyword
    if (preferences.keywords) {
      article.tags.forEach(tag => {
        if (preferences.keywords?.some(keyword => 
          keyword.toLowerCase() === tag.toLowerCase() ||
          tag.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(tag.toLowerCase())
        )) {
          score += 5;
        }
      });
    }

    // Add bonus points for articles with multiple tags (more specific content)
    if (article.tags.length >= 3) {
      score += 5;
    }
  }
  
  // Subtract points for excluded keywords
  if (preferences.excluded_keywords) {
    preferences.excluded_keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Check title (higher penalty)
      if (article.title.toLowerCase().includes(keywordLower)) {
        score -= 25;
      }
      
      // Check content
      if (article.content.toLowerCase().includes(keywordLower)) {
        score -= 15;
      }
    });
  }
  
  // Freshness boost - newer articles get higher scores
  const articleDate = new Date(article.published_at);
  const now = new Date();
  const ageInHours = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  
  // Articles less than 6 hours old get a big boost
  if (ageInHours < 6) {
    score += 20;
  } 
  // Articles less than 24 hours old get a moderate boost
  else if (ageInHours < 24) {
    score += 10;
  }
  // Articles less than 48 hours old get a small boost
  else if (ageInHours < 48) {
    score += 5;
  }
  
  // Normalize score to a 0-100 scale
  // Cap at 100 and ensure it's never negative
  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Function to rank articles based on preferences
export function rankArticles(articles: Article[], preferences: UserPreference): Article[] {
  // First, calculate relevance scores for all articles
  const rankedArticles = articles.map(article => {
    const relevanceScore = calculateRelevanceScore(article, preferences);
    return {
      ...article,
      relevance_score: relevanceScore
    };
  });
  
  // Then sort by relevance score (descending)
  return rankedArticles.sort((a, b) => 
    (b.relevance_score || 0) - (a.relevance_score || 0)
  );
}

// Generate article summary (first N sentences)
export function generateArticleSummary(content: string, sentenceCount: number = 3): string {
  const sentences = content
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .filter(s => s.trim().length > 0);
  
  const summaryLength = Math.min(sentences.length, sentenceCount);
  return sentences.slice(0, summaryLength).join(' ');
}

// Format relevance score for display
export function formatRelevanceScore(score: number | null): string {
  if (score === null) return 'N/A';
  
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

// Get color class for relevance score
export function getRelevanceScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-green-300';
  if (score >= 40) return 'text-blue-400';
  if (score >= 20) return 'text-blue-300';
  return 'text-gray-400';
}

// Function to find missed high-relevance articles
export function findMissedHighRelevanceArticles(
  allArticles: Article[],
  viewedArticleIds: Set<string>,
  preferences: UserPreference,
  limit: number = 3
): Article[] {
  // Calculate relevance for all articles
  const scoredArticles = allArticles.map(article => ({
    ...article,
    relevance_score: calculateRelevanceScore(article, preferences)
  }));
  
  // Filter out already viewed articles
  const unseenArticles = scoredArticles.filter(
    article => !viewedArticleIds.has(article.id)
  );
  
  // Sort by relevance score and return top N articles
  const highRelevanceArticles = unseenArticles
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, limit);
    
  return highRelevanceArticles;
}