import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getArticles, getAvailableCategories } from '../services/articleService';
import ArticleList, { ArticleFilters } from '../components/articles/ArticleList';
import { Filter, RefreshCw } from 'lucide-react';
import { debounce } from '../utils/cacheUtils';
import type { Article } from '../types/newsapi';

const ARTICLES_PER_PAGE = 12;

const FilteredArticlesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ArticleFilters>({
    category: searchParams.get('category') || undefined,
    sortBy: (searchParams.get('sortBy') as 'relevance' | 'date') || 'relevance',
    layout: (searchParams.get('layout') as 'grid' | 'compact') || 'grid',
    timeFrame: (searchParams.get('timeFrame') as 'day' | 'week' | 'month' | 'all') || 'all'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if a fetch is in progress to avoid multiple simultaneous fetches
  const fetchingRef = useRef(false);
  // Use ref to track current filters to avoid outdated closures in debounced functions
  const filtersRef = useRef(filters);

  const categories = getAvailableCategories();

  // Update filters ref when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Debounced function to update URL when filters change
  const updateUrl = useCallback(
    debounce((newFilters: ArticleFilters) => {
      const params = new URLSearchParams();
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
      if (newFilters.layout) params.set('layout', newFilters.layout);
      if (newFilters.timeFrame) params.set('timeFrame', newFilters.timeFrame);
      
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }, 300),
    [navigate, location.pathname]
  );

  // Update URL when filters change
  useEffect(() => {
    updateUrl(filters);
  }, [filters, updateUrl]);

  // Function to fetch articles
  const fetchArticles = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert time frame to date filter
      const getDateFilter = () => {
        if (filtersRef.current.timeFrame === 'all') return undefined;
        
        const now = new Date();
        if (filtersRef.current.timeFrame === 'day') {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return yesterday.toISOString();
        } else if (filtersRef.current.timeFrame === 'week') {
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          return lastWeek.toISOString();
        } else if (filtersRef.current.timeFrame === 'month') {
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          return lastMonth.toISOString();
        }
      };
      
      const fromDate = getDateFilter();
      
      // Map our filter sortBy to the API sortBy
      const apiSortBy = filtersRef.current.sortBy === 'relevance' ? 'relevance_score' :
                        filtersRef.current.sortBy === 'date' ? 'published_at' : 'source';
      
      const result = await getArticles({
        limit: ARTICLES_PER_PAGE,
        category: filtersRef.current.category,
        sortBy: apiSortBy,
        fromDate,
        page
      });
      
      // If we're on the first page, replace articles; otherwise, append
      if (page === 1) {
        setArticles(result.articles);
      } else {
        setArticles(prev => [...prev, ...result.articles]);
      }
      
      // Update total count and check if there are more articles
      setTotalCount(result.totalCount);
      setHasMore(result.articles.length === ARTICLES_PER_PAGE);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page]); // Only depend on page since we use filtersRef for other dependencies

  // Fetch articles when page changes or when we want to force a refresh
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Debounced filter change handler
  const handleFilterChange = useCallback(
    debounce((newFilters: ArticleFilters) => {
      setFilters(newFilters);
      // Page will be reset in the useEffect that depends on filters
    }, 300),
    []
  );

  const handleLoadMore = () => {
    if (!loading && !fetchingRef.current) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
          {error}
          <button 
            onClick={() => fetchArticles()} 
            className="ml-4 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}
      
      <ArticleList
        articles={articles}
        loading={loading}
        title={filters.category 
          ? `${categories.find(c => c.id === filters.category)?.name || 'Filtered'} Articles` 
          : 'All Articles'
        }
        hasMore={hasMore}
        loadMore={handleLoadMore}
        categories={categories}
        onFilterChange={handleFilterChange}
        totalCount={totalCount}
      />
    </div>
  );
};

export default FilteredArticlesPage;