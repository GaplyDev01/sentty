import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAvailableCategories } from '../services/articleService';
import { Layers, ArrowRight, BarChart, BookmarkCheck, Eye, Cpu, Brain, Network, Code, Filter, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { bookmarkService } from '../services/bookmarkService';
import { historyService } from '../services/historyService';
import CategoryArticlesModal from '../components/articles/CategoryArticlesModal';

// Category Icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  business: <BarChart className="h-8 w-8 text-blue-400" />,
  technology: <svg className="h-8 w-8 text-purple-400" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
  science: <svg className="h-8 w-8 text-green-400" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
  health: <svg className="h-8 w-8 text-red-400" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>,
  stocks: <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>,
  web3: <svg className="h-8 w-8 text-yellow-400" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>, 
  // AI Category Icons
  artificial_intelligence: <Brain className="h-8 w-8 text-indigo-400" />,
  machine_learning: <Network className="h-8 w-8 text-blue-500" />,
  llm: <Cpu className="h-8 w-8 text-purple-500" />,
  generative_ai: <Sparkles className="h-8 w-8 text-amber-400" />,
  ai_ethics: <Filter className="h-8 w-8 text-red-400" />,
  ai_research: <Code className="h-8 w-8 text-cyan-400" />,
  general: <Layers className="h-8 w-8 text-gray-400" />
};

// Background gradients for category cards
const CATEGORY_GRADIENTS: Record<string, string> = {
  business: 'from-blue-900/30 to-blue-700/20',
  technology: 'from-purple-900/30 to-indigo-700/20',
  science: 'from-green-900/30 to-emerald-700/20',
  health: 'from-red-900/30 to-rose-700/20',
  stocks: 'from-green-900/30 to-teal-700/20',
  web3: 'from-yellow-900/30 to-amber-700/20',
  // AI Category Gradients
  artificial_intelligence: 'from-indigo-900/30 to-violet-700/20',
  machine_learning: 'from-blue-900/30 to-cyan-700/20',
  llm: 'from-purple-900/30 to-fuchsia-700/20',
  generative_ai: 'from-amber-900/30 to-orange-700/20',
  ai_ethics: 'from-red-900/30 to-pink-700/20',
  ai_research: 'from-cyan-900/30 to-sky-700/20',
  general: 'from-gray-800/50 to-gray-700/30'
};

interface CategoryStats {
  count: number;
  bookmarkCount?: number;
  viewCount?: number;
}

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [userPreferredCategories, setUserPreferredCategories] = useState<string[]>([]);
  
  // State for category articles modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  
  const availableCategories = getAvailableCategories();
  
  // Group categories by type for UI organization
  const groupedCategories = {
    aiCategories: availableCategories.filter(cat => 
      ['artificial_intelligence', 'machine_learning', 'llm', 'generative_ai', 'ai_ethics', 'ai_research'].includes(cat.id)
    ),
    mainCategories: availableCategories.filter(cat => 
      !['artificial_intelligence', 'machine_learning', 'llm', 'generative_ai', 'ai_ethics', 'ai_research', 'general'].includes(cat.id)
    )
  };

  useEffect(() => {
    fetchCategoryStats();
  }, []);
  
  // Fetch user preferred categories if logged in
  useEffect(() => {
    if (user) {
      fetchUserPreferences();
      
      // If admin, fetch additional analytics
      if (isAdmin) {
        fetchCategoryAnalytics();
      }
    }
  }, [user, isAdmin]);
  
  // Open category articles modal
  const openCategoryModal = (categoryId: string, event: React.MouseEvent) => {
    // Prevent event propagation to stop the card's click handler
    event.stopPropagation();
    
    const category = availableCategories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setShowModal(true);
    }
  };
  
  // Navigate to filtered view of a specific category
  const navigateToCategory = (categoryId: string) => {
    navigate(`/dashboard/category/${categoryId}`);
  };
  
  // Fetch article count by category
  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch each category count individually instead of using group
      const stats: Record<string, CategoryStats> = {};
      
      // Initialize with all available categories set to 0
      availableCategories.forEach(category => {
        stats[category.id] = { count: 0 };
      });
      
      // Fetch count for each category separately
      for (const category of availableCategories) {
        const { count, error: countError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.id);
          
        if (countError) {
          console.error(`Error fetching count for category ${category.id}:`, countError);
          continue;
        }
        
        stats[category.id] = { count: count || 0 };
      }
      
      setCategoryStats(stats);
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user's preferred categories
  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('categories')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error);
        return;
      }
      
      if (data?.categories) {
        setUserPreferredCategories(data.categories);
      }
      
      // Get bookmark stats by category
      const bookmarkStats = await bookmarkService.getBookmarkStatsByCategory(user.id);
      
      // Get view stats by category
      const viewStats = await historyService.getMostViewedCategories(user.id);
      
      // Update category stats with user-specific data
      setCategoryStats(prev => {
        const updatedStats = { ...prev };
        
        Object.entries(bookmarkStats).forEach(([category, count]) => {
          if (updatedStats[category]) {
            updatedStats[category] = {
              ...updatedStats[category],
              bookmarkCount: count
            };
          }
        });
        
        Object.entries(viewStats).forEach(([category, count]) => {
          if (updatedStats[category]) {
            updatedStats[category] = {
              ...updatedStats[category],
              viewCount: count
            };
          }
        });
        
        return updatedStats;
      });
    } catch (err) {
      console.error('Error fetching user category data:', err);
    }
  };
  
  // For admins: fetch additional analytics for each category
  const fetchCategoryAnalytics = async () => {
    if (!isAdmin) return;
    
    try {
      // This would typically involve more complex queries to get
      // engagement metrics, trending data, etc.
      console.log('Admin would fetch additional analytics here');
    } catch (err) {
      console.error('Error fetching admin category analytics:', err);
    }
  };
  
  const isPreferredCategory = (categoryId: string) => {
    return userPreferredCategories.includes(categoryId);
  };
  
  const getCategoryIcon = (categoryId: string) => {
    return CATEGORY_ICONS[categoryId] || CATEGORY_ICONS.general;
  };
  
  const getCategoryGradient = (categoryId: string) => {
    return CATEGORY_GRADIENTS[categoryId] || CATEGORY_GRADIENTS.general;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <motion.h1 
          className="text-3xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          News Categories
        </motion.h1>
        <p className="text-gray-400">
          Browse news articles by category to find content relevant to your interests.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
          {error}
          <button 
            onClick={fetchCategoryStats}
            className="ml-4 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* AI & Machine Learning Categories Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white flex items-center border-b border-gray-700 pb-2">
          <Brain className="h-6 w-6 mr-2 text-indigo-400" />
          AI & Machine Learning
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedCategories.aiCategories.map((category, index) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`bg-gradient-to-br ${getCategoryGradient(category.id)} rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/30 transition-all shadow-lg`}
              onClick={() => navigateToCategory(category.id)}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    {getCategoryIcon(category.id)}
                  </div>
                  
                  {/* If this is a user-preferred category, show indicator */}
                  {user && isPreferredCategory(category.id) && (
                    <span className="bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                      Preferred
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-bold text-white">
                      {categoryStats[category.id]?.count || 0}
                    </div>
                    <div className="text-sm text-gray-400">
                      articles
                    </div>
                  </div>
                  
                  {user && (
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                      {categoryStats[category.id]?.viewCount !== undefined && (
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1 text-gray-500" />
                          {categoryStats[category.id]?.viewCount} views
                        </span>
                      )}
                      
                      {categoryStats[category.id]?.bookmarkCount !== undefined && (
                        <span className="flex items-center">
                          <BookmarkCheck className="h-3 w-3 mr-1 text-blue-500" />
                          {categoryStats[category.id]?.bookmarkCount} bookmarks
                        </span>
                      )}
                    </div>
                  )}
                  
                  <button 
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-white rounded-lg transition-colors text-sm"
                    onClick={(e) => openCategoryModal(category.id, e)}
                  >
                    Browse {category.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Other Categories Section */}
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-white flex items-center border-b border-gray-700 pb-2">
          <Layers className="h-6 w-6 mr-2 text-blue-400" />
          Other Categories
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedCategories.mainCategories.map((category, index) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`bg-gradient-to-br ${getCategoryGradient(category.id)} rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/30 transition-all shadow-lg`}
              onClick={() => navigateToCategory(category.id)}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    {getCategoryIcon(category.id)}
                  </div>
                  
                  {/* If this is a user-preferred category, show indicator */}
                  {user && isPreferredCategory(category.id) && (
                    <span className="bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                      Preferred
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-bold text-white">
                      {categoryStats[category.id]?.count || 0}
                    </div>
                    <div className="text-sm text-gray-400">
                      articles
                    </div>
                  </div>
                  
                  {user && (
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                      {categoryStats[category.id]?.viewCount !== undefined && (
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1 text-gray-500" />
                          {categoryStats[category.id]?.viewCount} views
                        </span>
                      )}
                      
                      {categoryStats[category.id]?.bookmarkCount !== undefined && (
                        <span className="flex items-center">
                          <BookmarkCheck className="h-3 w-3 mr-1 text-blue-500" />
                          {categoryStats[category.id]?.bookmarkCount} bookmarks
                        </span>
                      )}
                    </div>
                  )}
                  
                  <button 
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-white rounded-lg transition-colors text-sm"
                    onClick={(e) => openCategoryModal(category.id, e)}
                  >
                    Browse {category.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Popular AI Topics Section */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-indigo-400" />
          Popular AI Topics
        </h2>
        <div className="flex flex-wrap gap-3">
          {['gpt-4', 'chatgpt', 'llama', 'diffusion models', 'deep learning', 'computer vision',
            'nlp', 'agi', 'ai ethics', 'transformers', 'neural networks', 'ai research', 'generative ai',
            'multimodal ai', 'reinforcement learning', 'ai alignment', 'prompt engineering'].map((topic, i) => (
            <motion.button
              key={topic}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              onClick={() => navigate(`/dashboard/search?q=${topic}`)}
            >
              {topic}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Other Popular Topics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <BarChart className="h-6 w-6 mr-2 text-blue-400" />
          Other Popular Topics
        </h2>
        <div className="flex flex-wrap gap-3">
          {['blockchain', 'investment', 'startups', 'crypto', 
            'fintech', 'web development', 'climate', 'data science', 'remote work', 'funding'].map((topic, i) => (
            <motion.button
              key={topic}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              onClick={() => navigate(`/dashboard/search?q=${topic}`)}
            >
              {topic}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Category Articles Modal */}
      {selectedCategory && (
        <CategoryArticlesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
        />
      )}
    </div>
  );
};

export default CategoriesPage;