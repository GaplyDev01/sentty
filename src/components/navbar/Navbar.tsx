import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { searchArticles } from '../../services/searchService';
import { debounce } from '../../utils/cacheUtils';
import Logo from '../ui/Logo';
import type { Article } from '../../types/newsapi';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchArticles(query);
        setSearchResults(results.slice(0, 5)); // Limit to 5 results for the dropdown
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, debouncedSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current && 
        searchInputRef.current && 
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchDropdown(false);
    }
  };

  const handleResultClick = (articleId: string) => {
    navigate(`/dashboard/article/${articleId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-blue-900/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <Logo />
              <span className="text-sm text-gray-300 ml-1 font-normal">Impact News</span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>

            {/* Search results dropdown */}
            <AnimatePresence>
              {showSearchDropdown && (
                <motion.div 
                  ref={searchDropdownRef}
                  className="absolute z-10 mt-2 w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400">
                      <div className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {searchResults.map((article) => (
                        <div 
                          key={article.id}
                          onClick={() => handleResultClick(article.id)}
                          className="p-3 hover:bg-gray-700/50 cursor-pointer border-b border-gray-700 last:border-0"
                        >
                          <h4 className="text-white text-sm font-medium mb-1 line-clamp-1">
                            {article.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="px-2 py-0.5 bg-gray-700 rounded-full mr-2">
                              {article.category}
                            </span>
                            <span>{article.source}</span>
                          </div>
                        </div>
                      ))}
                      <div 
                        className="p-3 text-center bg-gray-700/30 text-blue-400 text-sm cursor-pointer hover:bg-gray-700/50"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                      >
                        See all results for "{searchQuery}"
                      </div>
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-4 text-gray-400 text-center">
                      No results found for "{searchQuery}"
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Nav Icons - Bell notification icon removed */}
          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <Link to="/login" className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <motion.div 
          className="md:hidden bg-gray-900 shadow-lg"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <form onSubmit={handleSearch} className="relative mb-3">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
            
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Home</Link>
            <Link to="/dashboard/trending" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Trending</Link>
            <Link to="/dashboard/categories" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Categories</Link>
            <Link to="/dashboard/bookmarks" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Bookmarks</Link>
            <Link to="/dashboard/history" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">History</Link>
            
            {!user && (
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center">
                Sign In
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;