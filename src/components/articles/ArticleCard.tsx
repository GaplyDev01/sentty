import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ExternalLink, Star, TrendingUp, Award, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useArticleHistory } from '../../hooks/useArticleHistory';
import ArticlePreviewModal from './ArticlePreviewModal';
import BookmarkButton from './BookmarkButton';
import type { Article } from '../../types/newsapi';

interface ArticleCardProps {
  article: Article;
  index: number;
  showRelevanceScore?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  index,
  showRelevanceScore = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recordView } = useArticleHistory();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const formattedDate = format(new Date(article.published_at), 'MMM dd, yyyy');
  
  const openPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      // We don't need to await this - just start the process
      recordView(article.id);
    }
    setIsPreviewOpen(true);
  };
  
  const openArticleDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      // Let the detail page handle recording the view
      // This prevents duplicate recording
      // We'll use this flag in useArticleHistory to know if the view was already recorded
    }
    navigate(`/dashboard/article/${article.id}`);
  };

  // Calculate relevance score colors
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-green-300';
    if (score >= 40) return 'text-blue-400';
    if (score >= 20) return 'text-blue-300';
    return 'text-gray-400';
  };

  // Calculate badge background color
  const getScoreBgColor = (score: number | null) => {
    if (!score) return 'bg-gray-800/60';
    if (score >= 80) return 'bg-green-900/60';
    if (score >= 60) return 'bg-green-800/60';
    if (score >= 40) return 'bg-blue-900/60';
    if (score >= 20) return 'bg-blue-800/60';
    return 'bg-gray-800/60';
  };
  
  return (
    <>
      <motion.div 
        className="bg-gray-800/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-blue-500/50 transition-all h-full flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div 
          className="relative h-48 overflow-hidden cursor-pointer"
          onClick={openPreview}
        >
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">SophIQ</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-1 bg-blue-900/60 backdrop-blur-sm rounded-full text-blue-200">
                  {article.category}
                </span>
                
                {showRelevanceScore && article.relevance_score && (
                  <span className={`px-2 py-1 ${getScoreBgColor(article.relevance_score)} backdrop-blur-sm rounded-full flex items-center ${getScoreColor(article.relevance_score)}`}>
                    <Award className="h-3 w-3 mr-1" />
                    {article.relevance_score}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {showRelevanceScore && article.relevance_score && article.relevance_score >= 70 && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-600/80 to-amber-600/80 rounded-lg text-xs text-white font-medium shadow-lg backdrop-blur-sm">
                <TrendingUp className="h-3 w-3" />
                <span>Top Match</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex-grow flex flex-col">
          <div 
            className="mb-4 cursor-pointer flex-grow" 
            onClick={openPreview}
          >
            <h3 className="text-lg font-semibold mb-2 text-white line-clamp-2 hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-sm text-gray-400 line-clamp-3">
              {article.content}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {formattedDate}
            </div>
            
            <div className="flex space-x-2">
              <BookmarkButton article={article} />
              
              <button 
                onClick={openArticleDetail}
                className="p-1.5 rounded-full hover:bg-gray-700/70 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Source badge */}
        <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Source: {article.source}
            </span>
            
            {showRelevanceScore && article.relevance_score && (
              <div className="flex items-center">
                <Star className={`h-3 w-3 mr-1 ${getScoreColor(article.relevance_score)}`} />
                <span className={`text-xs ${getScoreColor(article.relevance_score)}`}>
                  {article.relevance_score}% relevance
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Article Preview Modal */}
      <ArticlePreviewModal 
        article={article}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

export default ArticleCard;