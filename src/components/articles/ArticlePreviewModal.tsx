import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ExternalLink, ThumbsUp, Star, Clock, Tag, Award, TrendingUp, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useArticleHistory } from '../../hooks/useArticleHistory';
import { getUserPreferences } from '../../services/preferencesService';
import { calculateRelevanceScore } from '../../utils/articleRanking';
import BookmarkButton from './BookmarkButton';
import type { Article, UserPreference } from '../../types/newsapi';

interface ArticlePreviewModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({ 
  article, 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recordView } = useArticleHistory();
  const [relevanceBreakdown, setRelevanceBreakdown] = useState<{
    label: string;
    score: number;
    description: string;
  }[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [preferencesCache, setPreferencesCache] = useState<UserPreference | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  // Record view when modal opens with an article
  useEffect(() => {
    const recordViewIfNeeded = async () => {
      if (isOpen && article && user && !viewRecorded) {
        await recordView(article.id);
        setViewRecorded(true);
      }
    };
    
    recordViewIfNeeded();
    
    // Reset view recorded state when modal closes
    if (!isOpen) {
      setViewRecorded(false);
    }
  }, [isOpen, article, user, recordView, viewRecorded]);

  useEffect(() => {
    const fetchRelevanceScore = async () => {
      if (!article || !user) return;
      
      setLoading(true);
      try {
        // Get user preferences - use cached preferences if available
        let preferences: UserPreference | null = preferencesCache;
        if (!preferences) {
          preferences = await getUserPreferences(user.id);
          if (preferences) {
            setPreferencesCache(preferences);
          }
        }
        
        if (preferences) {
          // Calculate overall score
          const score = calculateRelevanceScore(article, preferences);
          setTotalScore(score);
          
          // Generate breakdown
          setRelevanceBreakdown(generateScoreBreakdown(article, preferences));
        }
      } catch (error) {
        console.error('Error calculating relevance:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && article) {
      fetchRelevanceScore();
    }
  }, [article, user, isOpen, preferencesCache]);

  const navigateToFullArticle = () => {
    if (article) {
      onClose(); // Close the modal first
      navigate(`/dashboard/article/${article.id}`);
    }
  };

  const generateScoreBreakdown = (article: Article, preferences: UserPreference) => {
    const breakdown = [];
    
    // Check for matching keywords
    if (preferences.keywords && preferences.keywords.length > 0) {
      const matchingKeywords = preferences.keywords.filter(keyword => 
        article.title.toLowerCase().includes(keyword.toLowerCase()) || 
        article.content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        breakdown.push({
          label: 'Keyword Matches',
          score: matchingKeywords.length * 10,
          description: `Matches ${matchingKeywords.length} of your keywords`
        });
      }
    }
    
    // Check for category match
    if (preferences.categories && preferences.categories.includes(article.category)) {
      breakdown.push({
        label: 'Category Match',
        score: 20,
        description: `Matches your preferred category: ${article.category}`
      });
    }
    
    // Check for source match
    if (preferences.sources && preferences.sources.includes(article.source)) {
      breakdown.push({
        label: 'Source Match',
        score: 15,
        description: `From your preferred source: ${article.source}`
      });
    }
    
    // Check for tag matches with user keywords
    if (article.tags && article.tags.length > 0 && preferences.keywords && preferences.keywords.length > 0) {
      const matchingTags = article.tags.filter(tag => 
        preferences.keywords?.some(keyword => 
          tag.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      if (matchingTags.length > 0) {
        breakdown.push({
          label: 'Tag Matches',
          score: matchingTags.length * 5,
          description: `Article tags match your interests`
        });
      }
    }
    
    // Check article freshness
    const articleDate = new Date(article.published_at);
    const now = new Date();
    const ageInHours = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    
    let freshnessScore = 0;
    let freshnessDesc = '';
    
    if (ageInHours < 6) {
      freshnessScore = 20;
      freshnessDesc = 'Published within the last 6 hours';
    } else if (ageInHours < 24) {
      freshnessScore = 10;
      freshnessDesc = 'Published within the last 24 hours';
    } else if (ageInHours < 48) {
      freshnessScore = 5;
      freshnessDesc = 'Published within the last 48 hours';
    }
    
    if (freshnessScore > 0) {
      breakdown.push({
        label: 'Freshness',
        score: freshnessScore,
        description: freshnessDesc
      });
    }
    
    // Add base score
    breakdown.push({
      label: 'Base Score',
      score: 10,
      description: 'Default relevance value'
    });
    
    return breakdown;
  };

  if (!article) return null;

  const formattedDate = format(new Date(article.published_at), 'MMMM dd, yyyy');
  const summary = generateSummary(article.content);

  // Calculate percentage for the relevance bar
  const relevancePercentage = Math.min(Math.max((totalScore / 100) * 100, 10), 100);
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-green-300';
    if (score >= 40) return 'text-blue-400';
    if (score >= 20) return 'text-blue-300';
    return 'text-gray-400';
  };

  // Generate a summary (first 2-3 sentences)
  function generateSummary(content: string) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summaryLength = Math.min(sentences.length, 2);
    return sentences.slice(0, summaryLength).join('. ') + '.';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {article.image_url && (
          <div className="h-48 mb-4 overflow-hidden rounded-lg">
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
          <span className="px-3 py-1 bg-blue-900/60 text-blue-200 rounded-full">
            {article.category}
          </span>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formattedDate}
          </div>
          <span>Source: {article.source}</span>
          
          {/* Remove viewCount reference since it's not defined */}
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
          <p className="text-gray-300">{summary}</p>
        </div>

        {user && (
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <h3 className="flex items-center text-lg font-semibold text-white mb-3">
              <Award className="h-5 w-5 mr-2 text-blue-400" />
              Relevance for You
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-lg mb-2">
                    <span className="text-gray-400">Match Score</span>
                    <span className={`${getScoreColor(totalScore)} font-bold text-xl`}>{totalScore}%</span>
                  </div>
                  
                  <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${relevancePercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  {totalScore >= 70 && (
                    <div className="flex items-center gap-2 text-yellow-300 text-sm mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>This article is a top match for your preferences</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-300 mb-2">Match Breakdown</h4>
                  {relevanceBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-700/50 last:border-0">
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-2 ${item.score > 10 ? 'text-yellow-400' : 'text-gray-500'}`} />
                        <span className="text-gray-300">{item.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-white">+{item.score}</span>
                        <span className="text-xs text-gray-500">{item.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {article.tags && article.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
              <Tag className="h-4 w-4 mr-1" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-700/60 text-gray-300 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-gray-700 gap-2">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={navigateToFullArticle}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read Full Article
              <Eye className="h-4 w-4 ml-2" />
            </button>
            
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              View Source
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </div>
          
          <div className="flex space-x-2">
            <BookmarkButton 
              article={article}
              asIcon={false}
              showText={true}
              className="text-gray-300"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ArticlePreviewModal;