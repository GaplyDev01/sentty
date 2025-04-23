import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowLeft, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { searchArticles, getPopularSearchTerms } from '../services/searchService';
import ArticleList from '../components/articles/ArticleList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { debounce } from '../utils/cacheUtils';
import type { Article } from '../types/newsapi';
import type { ArticleFilters } from '../components/articles/ArticleList';

const ARTICLES_PER_PAGE = 12;

const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({
    category: undefined,
    sortBy: 'relevance',
    layout: 'grid'
  });
  const [popularTerms] = useState(getPopularSearchTerms());
  
  // Parse search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);
  
  // Debounced filter change handler
  const handleFilterChange = useCallback(
    debounce((newFilters: ArticleFilters) => {
      setFilters(newFilters);
      setPage(1); // Reset to page 1 when filters change
    }, 300),
    []
  );
  
  // Execute search when query or filters change
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const executeSearch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await searchArticles(
          searchQuery, 
          ARTICLES_PER_PAGE * page, // Fetch more articles for pagination
          user?.id
        );
        
        setArticles(results);
        setTotalResults(results.length);
        
        // Apply category filter if needed
        if (filters.category) {
          const filteredResults = results.filter(
            article => article.category === filters.category
          );
          setArticles(filteredResults);
        }
        
        // Determine if there might be more results
        setHasMore(results.length >= ARTICLES_PER_PAGE * page);
        
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    executeSearch();
  }, [searchQuery, page, user?.id, filters.category]);
  
  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setPage(1);
    }
  };
  
  // Handle loading more articles
  const handleLoadMore = () => {
    if (!loading) {
      setPage(prevPage => prevPage + 1);
    }
  };
  
  // Filter articles based on current filters
  const getFilteredArticles = () => {
    if (!articles.length) return [];
    
    let filtered = [...articles];
    
    // Apply sorting
    if (filters.sortBy === 'relevance') {
      filtered.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    } else {
      filtered.sort((a, b) => 
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }
    
    return filtered;
  };
  
  // Handle popular term click
  const handlePopularTermClick = (term: string) => {
    setSearchQuery(term);
    navigate(`/dashboard/search?q=${encodeURIComponent(term)}`);
    setPage(1);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setArticles([]);
    navigate('/dashboard/search');
  };

  return (
    <div className="space-y-6">
      {/* Search header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800/70 rounded-xl p-6 border border-gray-700/50"
      >
        <Link to="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="flex">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, topics, or keywords..."
                className="w-full bg-gray-900 border border-gray-700 rounded-l-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
        
        {!searchQuery && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Popular searches</h3>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => handlePopularTermClick(term)}
                  className="px-3 py-1.5 bg-gray-700/70 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Search results */}
      {searchQuery ? (
        <div>
          {loading && articles.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
              {error}
            </div>
          ) : articles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <h2 className="text-xl font-medium text-white mb-3">No results found for "{searchQuery}"</h2>
              <p className="text-gray-400 mb-6">Try different keywords or check your spelling</p>
              
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Try searching for</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularTermClick(term)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {totalResults} {totalResults === 1 ? 'result' : 'results'} for "{searchQuery}"
                </h2>
              </div>
              
              <ArticleList
                articles={getFilteredArticles()}
                loading={loading}
                hasMore={hasMore}
                loadMore={handleLoadMore}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Enter search terms to find articles
        </div>
      )}
    </div>
  );
};

export default SearchPage;