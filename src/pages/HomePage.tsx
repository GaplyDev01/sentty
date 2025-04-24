import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ArticleList from '../components/articles/ArticleList';
import RecommendationBanner from '../components/articles/RecommendationBanner';
import { getArticles, rankArticlesForUser, getAvailableCategories } from '../services/articleService';
import { TrendingUp, Clock, Siren as Fire, Filter, RefreshCw, Grid, Layers, ArrowDownWideNarrow } from 'lucide-react';
import { motion } from 'framer-motion';
import { debounce } from '../utils/cacheUtils';
import HighlightedNewsBanner from '../components/ui/HighlightedNewsBanner';
import ImpactNewsFeed from '../components/ui/ImpactNewsFeed';
import CoinDeskRssFeed from '../components/ui/CoinDeskRssFeed';
import ImpactNewsPanel from '../components/dashboard/ImpactNewsPanel';
import CryptoDashboard from '../components/dashboard/CryptoDashboard';
import type { Article } from '../types/newsapi';
import type { ArticleFilters } from '../components/articles/ArticleList';

// How many articles to load per page
const ARTICLES_PER_PAGE = 9;

// Sample news items for the highlighted banner
const HIGHLIGHTED_NEWS = [
  {
    title: "Major climate initiative launches with backing from global investors",
    link: "https://www.reuters.com/sustainability/",
    pubDate: new Date().toISOString(),
    category: "Sustainability"
  },
  {
    title: "New social impact fund raises $100M to address housing inequality",
    link: "https://www.reuters.com/business/sustainable-business/",
    pubDate: new Date().toISOString(),
    category: "Social Impact"
  },
  {
    title: "Tech companies form coalition to advance climate change solutions",
    link: "https://www.reuters.com/technology/",
    pubDate: new Date().toISOString(),
    category: "Technology"
  }
];

const HomePage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [personalizedArticles, setPersonalizedArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [discoverArticles, setDiscoverArticles] = useState<Article[]>([]);
  const [topRecommendation, setTopRecommendation] = useState<Article | null>(null);
  const [filters, setFilters] = useState<ArticleFilters>({
    category: undefined,
    sortBy: 'relevance',
    layout: 'grid',
    timeFrame: 'all'
  });
  const [loading, setLoading] = useState({
    personalized: true,
    trending: true,
    recent: true,
    discover: true
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'recent' | 'discover'>(
    user ? 'for-you' : 'trending'
  );
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if a fetch is in progress to avoid multiple simultaneous fetches
  const fetchingRef = useRef(false);
  
  const categories = getAvailableCategories();

  // Debounced filter change handler to prevent too many rapid requests
  const debouncedFilterChange = useCallback(
    debounce((newFilters: ArticleFilters) => {
      setFilters(newFilters);
      setPage(1); // Reset to page 1 when filters change
      setHasMore(true);
    }, 300),
    []
  );

  // Function to fetch articles based on active tab and current filters
  const fetchArticles = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setError(null);
    
    try {
      // Convert time frame to date filter
      const getDateFilter = () => {
        if (filters.timeFrame === 'all') return undefined;
        
        const now = new Date();
        if (filters.timeFrame === 'day') {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return yesterday.toISOString();
        } else if (filters.timeFrame === 'week') {
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          return lastWeek.toISOString();
        } else if (filters.timeFrame === 'month') {
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          return lastMonth.toISOString();
        }
      };
      
      const fromDate = getDateFilter();
      
      // Fetch trending articles (high relevance score)
      if (activeTab === 'trending') {
        setLoading(prev => ({ ...prev, trending: true }));
        const trending = await getArticles({
          limit: ARTICLES_PER_PAGE,
          sortBy: 'relevance_score',
          category: filters.category,
          fromDate,
          page
        });
        
        // If we got fewer articles than requested, we've reached the end
        if (trending.articles.length < ARTICLES_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (page === 1) {
          setTrendingArticles(trending.articles);
        } else {
          setTrendingArticles(prev => [...prev, ...trending.articles]);
        }
        
        setTotalCount(trending.totalCount);
        setLoading(prev => ({ ...prev, trending: false }));
      }
      
      // Fetch most recent articles
      else if (activeTab === 'recent') {
        setLoading(prev => ({ ...prev, recent: true }));
        const recent = await getArticles({
          limit: ARTICLES_PER_PAGE,
          sortBy: 'published_at',
          category: filters.category,
          fromDate,
          page
        });
        
        // If we got fewer articles than requested, we've reached the end
        if (recent.articles.length < ARTICLES_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (page === 1) {
          setRecentArticles(recent.articles);
        } else {
          setRecentArticles(prev => [...prev, ...recent.articles]);
        }
        
        setTotalCount(recent.totalCount);
        setLoading(prev => ({ ...prev, recent: false }));
      }
      
      // Fetch discover/random articles (mix of categories not in user preferences)
      else if (activeTab === 'discover') {
        setLoading(prev => ({ ...prev, discover: true }));
        const discover = await getArticles({
          limit: ARTICLES_PER_PAGE,
          sortBy: 'random',
          category: filters.category,
          fromDate,
          excludeUserPreferences: user?.id,
          page
        });
        
        // If we got fewer articles than requested, we've reached the end
        if (discover.articles.length < ARTICLES_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (page === 1) {
          setDiscoverArticles(discover.articles);
        } else {
          setDiscoverArticles(prev => [...prev, ...discover.articles]);
        }
        
        setTotalCount(discover.totalCount);
        setLoading(prev => ({ ...prev, discover: false }));
      }
      
      // Fetch personalized articles if user is logged in
      else if (user && activeTab === 'for-you') {
        setLoading(prev => ({ ...prev, personalized: true }));
        
        try {
          // First, get articles from the last month for a broader dataset
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          
          const { articles, totalCount } = await rankArticlesForUser(user.id, {
            limit: ARTICLES_PER_PAGE,
            category: filters.category,
            fromDate: filters.timeFrame === 'all' ? lastMonth.toISOString() : fromDate,
            page
          });
          
          // If we got fewer articles than requested, we've reached the end
          if (articles.length < ARTICLES_PER_PAGE) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
          
          if (page === 1) {
            setPersonalizedArticles(articles);
            
            // Set the top recommendation from the first batch of articles
            if (articles.length > 0) {
              // Find article with highest relevance score
              const topArticle = [...articles].sort((a, b) => 
                (b.relevance_score || 0) - (a.relevance_score || 0)
              )[0];
              
              // Only set as top recommendation if score is high enough
              if (topArticle && (topArticle.relevance_score || 0) >= 70) {
                setTopRecommendation(topArticle);
              } else {
                setTopRecommendation(null);
              }
            }
          } else {
            setPersonalizedArticles(prev => {
              // Combine and remove duplicates based on ID
              const newArticles = [...prev, ...articles];
              const uniqueArticles = Array.from(
                new Map(newArticles.map(article => [article.id, article])).values()
              );
              return uniqueArticles;
            });
          }
          
          setTotalCount(totalCount);
        } catch (err) {
          console.error('Error fetching personalized articles:', err);
          setError('Could not load personalized articles. Please try again.');
        } finally {
          setLoading(prev => ({ ...prev, personalized: false }));
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try refreshing the page.');
      setLoading({
        personalized: false,
        trending: false,
        recent: false,
        discover: false
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [activeTab, filters, page, user]);

  // Effect to fetch articles when dependencies change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // When tab changes, reset articles and page
  useEffect(() => {
    setPage(1);
    // Reset top recommendation when switching from "For You" tab
    if (activeTab !== 'for-you') {
      setTopRecommendation(null);
    }
  }, [activeTab]);

  // Debounced filter change handler
  const handleFilterChange = (newFilters: ArticleFilters) => {
    debouncedFilterChange(newFilters);
  };

  const handleLoadMore = () => {
    if (!loading[activeTab as keyof typeof loading] && !fetchingRef.current) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case 'for-you':
        return loading.personalized;
      case 'trending':
        return loading.trending;
      case 'recent':
        return loading.recent;
      case 'discover':
        return loading.discover;
      default:
        return false;
    }
  };

  const getActiveArticles = () => {
    switch (activeTab) {
      case 'for-you':
        return personalizedArticles.filter(article => 
          // Filter out the top recommendation to avoid duplication
          !topRecommendation || article.id !== topRecommendation.id
        );
      case 'trending':
        return trendingArticles;
      case 'recent':
        return recentArticles;
      case 'discover':
        return discoverArticles;
      default:
        return [];
    }
  };

  const getTabClassName = (tab: 'for-you' | 'trending' | 'recent' | 'discover') => {
    return `px-4 py-2 rounded-lg flex items-center text-sm transition-colors ${
      activeTab === tab
        ? 'bg-blue-600 text-white font-medium'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70'
    }`;
  };

  const handleRetry = () => {
    setError(null);
    fetchArticles();
  };

  return (
    <div className="space-y-8">
      <motion.div 
        className="relative overflow-hidden rounded-2xl h-64 bg-gradient-to-r from-blue-900 to-purple-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-end p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {user ? `Welcome back, ${profile?.username || 'User'}` : 'Discover impact news with Sentro'}
          </h1>
          <p className="text-gray-300 max-w-2xl">
            Stay informed with the most relevant impact news tailored to your interests, curated by our advanced AI ranking system.
          </p>
        </div>
      </motion.div>
      
      {/* Highlighted news banner */}
      <HighlightedNewsBanner newsItems={HIGHLIGHTED_NEWS} className="mb-6" />
      
      {/* Impact News Panel */}
      <ImpactNewsPanel className="mb-8" />
      
      {/* Crypto Dashboard */}
      <CryptoDashboard className="mb-8" />

      {/* RSS Feed Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ImpactNewsFeed limit={3} showTitle={true} />
        <CoinDeskRssFeed limit={3} showTitle={true} />
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300 flex items-center justify-between">
          <div>{error}</div>
          <button 
            onClick={handleRetry} 
            className="px-3 py-1 bg-red-800/40 hover:bg-red-800/60 rounded-md text-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        {user && (
          <button
            onClick={() => setActiveTab('for-you')}
            className={getTabClassName('for-you')}
          >
            <Fire className="h-4 w-4 mr-2" />
            For You
          </button>
        )}
        
        <button
          onClick={() => setActiveTab('trending')}
          className={getTabClassName('trending')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Trending
        </button>
        
        <button
          onClick={() => setActiveTab('recent')}
          className={getTabClassName('recent')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Recent
        </button>
        
        <button
          onClick={() => setActiveTab('discover')}
          className={getTabClassName('discover')}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Discover
        </button>
      </div>
      
      {/* Top recommendation banner (only show in "For You" tab and if we have a high-scoring recommendation) */}
      {activeTab === 'for-you' && topRecommendation && topRecommendation.relevance_score >= 70 && (
        <RecommendationBanner article={topRecommendation} />
      )}
      
      <ArticleList 
        articles={getActiveArticles()}
        loading={isLoading()} 
        title={activeTab === 'for-you' ? 'Personalized For You' : 
               activeTab === 'trending' ? 'Trending Impact News' :
               activeTab === 'recent' ? 'Recently Published' : 'Discover New Topics'}
        loadMore={handleLoadMore}
        hasMore={hasMore}
        categories={categories}
        onFilterChange={handleFilterChange}
        totalCount={totalCount}
        showCoinDeskPanel={false} // Using the dedicated panels instead
      />
    </div>
  );
};

export default HomePage;