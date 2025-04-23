import React from 'react';
import { Search, Filter, XCircle, Calendar, Hash, ArrowDownWideNarrow } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArticleFiltersProps {
  categories: { id: string; name: string }[];
  onFilterChange: (filters: ArticleFiltersState) => void;
  filters: ArticleFiltersState;
  onApply: () => void;
  onReset: () => void;
}

export interface ArticleFiltersState {
  search: string;
  category: string | null;
  date: 'all' | 'today' | 'week' | 'month';
  sortBy: 'relevance' | 'date' | 'source';
  tags: string[];
}

const ArticleFilters: React.FC<ArticleFiltersProps> = ({ 
  categories, 
  onFilterChange, 
  filters, 
  onApply, 
  onReset 
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      onFilterChange({ ...filters, tags: [...filters.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    onFilterChange({ ...filters, tags: filters.tags.filter(t => t !== tag) });
  };

  return (
    <motion.div 
      className="bg-gray-800/70 border border-gray-700/50 rounded-lg p-6 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="flex items-center text-lg font-medium text-white mb-4">
        <Filter className="h-5 w-5 mr-2" />
        Filter Articles
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Search input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search for keywords..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value || null })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Date filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Time Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange({ ...filters, date: option.id as any })}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    filters.date === option.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort By filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <ArrowDownWideNarrow className="h-4 w-4 inline mr-2" />
              Sort By
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'relevance', label: 'Relevance' },
                { id: 'date', label: 'Date' },
                { id: 'source', label: 'Source' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange({ ...filters, sortBy: option.id as any })}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    filters.sortBy === option.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tags section */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          <Hash className="h-4 w-4 inline mr-2" />
          Tags
        </label>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.tags.length > 0 ? (
            filters.tags.map((tag) => (
              <div key={tag} className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center">
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-1">
                  <XCircle className="h-3 w-3 text-blue-300 hover:text-blue-100" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tags selected</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['technology', 'business', 'crypto', 'web3', 'finance'].map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              disabled={filters.tags.includes(tag)}
              className={`px-2 py-1 text-xs rounded-full ${
                filters.tags.includes(tag)
                  ? 'bg-blue-900/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 flex justify-end space-x-3 border-t border-gray-700 pt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset Filters
        </button>
        <button
          onClick={onApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </motion.div>
  );
};

export default ArticleFilters;