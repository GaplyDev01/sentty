import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRelevanceScoreColor } from '../../utils/articleRanking';
import type { Article } from '../../types/newsapi';

interface RecommendationBannerProps {
  article: Article;
}

const RecommendationBanner: React.FC<RecommendationBannerProps> = ({ article }) => {
  const navigate = useNavigate();
  
  // Navigate to article details
  const viewArticle = () => {
    navigate(`/dashboard/article/${article.id}`);
  };
  
  // Ensure we have a relevance score
  const relevanceScore = article.relevance_score || 0;
  const scoreColor = getRelevanceScoreColor(relevanceScore);
  
  return (
    <motion.div 
      className="rounded-xl overflow-hidden bg-gradient-to-r from-blue-900/40 to-purple-900/40 mb-8 border border-blue-500/30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      <div 
        className="flex flex-col md:flex-row cursor-pointer"
        onClick={viewArticle}
      >
        {/* Image section */}
        {article.image_url ? (
          <div className="w-full md:w-1/3 h-48 md:h-auto">
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full md:w-1/3 bg-blue-900/20 flex items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-blue-500/40" />
          </div>
        )}
        
        {/* Content section */}
        <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/60 rounded-lg text-sm text-blue-200">
                <Award className="h-4 w-4" />
                <span>Top Recommendation</span>
              </div>
              <div className={`px-2.5 py-1.5 rounded-lg text-sm font-medium ${scoreColor}`}>
                {relevanceScore}% Match
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-gray-300 mb-4 line-clamp-2">
              {article.content}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {article.category} • {article.source}
            </div>
            
            <button 
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                viewArticle();
              }}
            >
              Read More
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationBanner;