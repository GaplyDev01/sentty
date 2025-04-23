import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Filter, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import ArticleCard from './ArticleCard';
import ArticlePreviewModal from './ArticlePreviewModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getArticles } from '../../services/articleService';
import type { Article } from '../../types/newsapi';

interface CategoryArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

const CategoryArticlesModal: React.FC<CategoryArticlesModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('date');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showArticlePreview, setShowArticlePreview] = useState(false);

  // Fetch articles when modal opens
  useEffect(() => {
    if (isOpen && categoryId) {
      fetchArticles();
    }
  }, [isOpen, categoryId, sortBy]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getArticles({
        category: categoryId,
        limit: 12,
        sortBy: sortBy === 'relevance' ? 'relevance_score' : 'published_at'
      });

      setArticles(result.articles);
    } catch (err) {
      console.error('Error fetching category articles:', err);
      setError('Failed to load articles for this category.');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setShowArticlePreview(true);
  };

  const handleCloseArticlePreview = () => {
    setShowArticlePreview(false);
    setSelectedArticle(null);
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="xl"
        title={`${categoryName} Articles`}
      >
        <div className="space-y-6 p-6">
          {/* Sort controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'date'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortBy('relevance')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'relevance'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Relevance
                </button>
              </div>
              
              {loading && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-md p-4 text-sm text-red-300">
              {error}
              <button 
                onClick={fetchArticles}
                className="ml-2 underline hover:text-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Articles grid */}
          {loading && articles.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No articles found in this category.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {articles.map((article, index) => (
                <div 
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="cursor-pointer"
                >
                  <ArticleCard 
                    article={article} 
                    index={index} 
                    showRelevanceScore={sortBy === 'relevance'}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </Modal>

      {/* Article preview modal */}
      {selectedArticle && (
        <ArticlePreviewModal
          article={selectedArticle}
          isOpen={showArticlePreview}
          onClose={handleCloseArticlePreview}
        />
      )}
    </>
  );
};

export default CategoryArticlesModal;