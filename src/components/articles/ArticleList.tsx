import React, { useState, useCallback } from 'react';
import ArticleCard from './ArticleCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Filter, RefreshCw, Grid, Layers, ArrowDownWideNarrow, SortAsc } from 'lucide-react';
import CoinDeskRssFeed from '../ui/CoinDeskRssFeed';
import type { Article } from '../../types/newsapi';

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  title?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  categories?: { id: string; name: string }[];
  onFilterChange?: (filters: ArticleFilters) => void;
  totalCount?: number;
  onArticleRemoved?: () => void; // Callback when an article is removed (e.g. bookmark removed)
  showCoinDeskPanel?: boolean;
}

export interface ArticleFilters {
  category?: string;
  sortBy?: 'relevance' | 'date' | 'source';
  layout?: 'grid' | 'compact';
  timeFrame?: 'day' | 'week' | 'month' | 'all';
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  articles, 
  loading, 
  title,
  loadMore,
  hasMore = false,
  categories = [],
  onFilterChange,
  totalCount,
  onArticleRemoved,
  showCoinDeskPanel = false
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ArticleFilters>({
    category: undefined,
    sortBy: 'relevance',
    layout: 'grid',
    timeFrame: 'all'
  });
  
  // Apply pagination
  React.useEffect(() => {
    if (inView && hasMore && loadMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadMore, loading]);

  // Apply filters
  const handleFilterChange = useCallback((newFilters: Partial<ArticleFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }, [filters, onFilterChange]);

  // Toggle filter visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  if (loading && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-gray-400">Loading articles...</p>
      </div>
    );
  }

  // Group AI categories together for the filter UI
  const groupedCategories = categories.reduce((acc, category) => {
    if (category.id.includes('ai') || 
        category.id.includes('machine_learning') || 
        category.id.includes('llm') || 
        category.id.includes('generative_ai') || 
        category.id.includes('artificial_intelligence')) {
      if (!acc.ai) {
        acc.ai = {
          id: 'ai',
          name: 'AI & Machine Learning',
          subcategories: []
        };
      }
      acc.ai.subcategories.push(category);
    } else {
      if (!acc.main) acc.main = [];
      acc.main.push(category);
    }
    return acc;
  }, {} as {
    main?: { id: string, name: string }[],
    ai?: { 
      id: string, 
      name: string, 
      subcategories: { id: string, name: string }[] 
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with title and filter toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {title && (
          <motion.h2 
            className="text-2xl font-bold text-white flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {title}
            {totalCount !== undefined && (
              <span className="ml-3 text-base font-normal text-gray-400">
                ({totalCount} {totalCount === 1 ? 'article' : 'articles'})
              </span>
            )}
          </motion.h2>
        )}
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFilters} 
            className={`px-3 py-2 rounded-lg flex items-center text-sm ${
              showFilters ? 'bg-blue-700/40 text-blue-300' : 'bg-gray-800 text-gray-300'
            } hover:bg-gray-700 transition-colors`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          {onFilterChange && (
            <button 
              onClick={() => {
                const resetFilters = { 
                  category: undefined, 
                  sortBy: 'relevance', 
                  layout: 'grid',
                  timeFrame: 'all'
                };
                setFilters(resetFilters);
                onFilterChange(resetFilters);
              }}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              title="Reset filters"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          
          {/* Quick layout toggle */}
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => handleFilterChange({ layout: 'grid' })}
              className={`p-2 ${
                filters.layout === 'grid' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleFilterChange({ layout: 'compact' })}
              className={`p-2 ${
                filters.layout === 'compact' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
              }`}
              title="Compact view"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <motion.div 
          className="bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-wrap gap-4">
            {/* Category filter */}
            <div className="space-y-2 flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ category: undefined })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    !filters.category ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                
                {/* Main categories */}
                {groupedCategories.main?.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange({ category: category.id })}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.category === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
                
                {/* AI categories group */}
                {groupedCategories.ai && (
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <div className="text-sm font-medium text-blue-400 border-b border-gray-700 pb-1">
                      {groupedCategories.ai.name}
                    </div>
                    <div className="flex flex-wrap gap-2 pl-2">
                      {groupedCategories.ai.subcategories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleFilterChange({ category: category.id })}
                          className={`px-3 py-1 text-sm rounded-full ${
                            filters.category === category.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sort filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Sort By</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ sortBy: 'relevance' })}
                  className={`px-3 py-1 text-sm rounded-full flex items-center ${
                    filters.sortBy === 'relevance' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <SortAsc className="h-3 w-3 mr-1" />
                  Relevance
                </button>
                
                <button
                  onClick={() => handleFilterChange({ sortBy: 'date' })}
                  className={`px-3 py-1 text-sm rounded-full flex items-center ${
                    filters.sortBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ArrowDownWideNarrow className="h-3 w-3 mr-1" />
                  Newest
                </button>
              </div>
            </div>
            
            {/* Time filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Time Frame</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ timeFrame: 'day' })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.timeFrame === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Today
                </button>
                
                <button
                  onClick={() => handleFilterChange({ timeFrame: 'week' })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.timeFrame === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  This Week
                </button>
                
                <button
                  onClick={() => handleFilterChange({ timeFrame: 'month' })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.timeFrame === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  This Month
                </button>
                
                <button
                  onClick={() => handleFilterChange({ timeFrame: 'all' })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.timeFrame === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* CoinDesk News Panel - can be toggled on/off */}
      {showCoinDeskPanel && (
        <div className="mb-8">
          <CoinDeskRssFeed />
        </div>
      )}
      
      {/* Article grid */}
      <div className={`grid gap-6 ${
        filters.layout === 'compact'
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {articles.map((article, index) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            index={index}
            showRelevanceScore={filters.sortBy === 'relevance'}
          />
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-800/30 rounded-lg">
          <p className="text-gray-400">No articles found matching your criteria</p>
        </div>
      )}
      
      {loading && articles.length > 0 && (
        <div className="flex justify-center my-8">
          <LoadingSpinner size="w-8 h-8" />
        </div>
      )}
      
      {hasMore && <div ref={ref} className="h-10" />}
    </div>
  );
};

export default ArticleList;