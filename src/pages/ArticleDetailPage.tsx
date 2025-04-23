import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ExternalLink, Share2, ThumbsUp, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useArticleHistory } from '../hooks/useArticleHistory';
import { getArticleById, getRelatedArticles } from '../services/articleService';
import { historyService } from '../services/historyService';
import ArticlePreviewModal from '../components/articles/ArticlePreviewModal';
import BookmarkButton from '../components/articles/BookmarkButton';
import type { Article } from '../types/newsapi';

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { recordView } = useArticleHistory();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [selectedRelatedArticle, setSelectedRelatedArticle] = useState<Article | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);
  const [viewStartTime, setViewStartTime] = useState<Date | null>(null);
  const [viewRecordId, setViewRecordId] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState<boolean>(false);

  // Track view only once per page visit
  useEffect(() => {
    if (article && user && !viewRecorded) {
      // Record the view when component mounts
      const recordArticleView = async () => {
        const viewRecord = await recordView(article.id);
        if (viewRecord) {
          setViewRecordId(viewRecord.id);
          setViewRecorded(true); // Mark that we've recorded this view
        }
        setViewStartTime(new Date());
      };
      
      recordArticleView();
      
      // Fetch view count for this article
      const getViewCount = async () => {
        const count = await historyService.getArticleViewCount(article.id);
        setViewCount(count);
      };
      getViewCount();
    }
    
    // Reset view recorded state when article changes
    return () => {
      if (article && viewStartTime && viewRecordId && user) {
        const endTime = new Date();
        const durationSeconds = Math.round((endTime.getTime() - viewStartTime.getTime()) / 1000);
        
        // Only record if user spent at least 5 seconds viewing
        if (durationSeconds >= 5) {
          historyService.updateViewDuration(viewRecordId, durationSeconds);
        }
      }
    };
  }, [article, user, recordView, viewRecorded]);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;

      try {
        setLoading(true);
        
        const articleData = await getArticleById(id);
        
        if (articleData) {
          setArticle(articleData);
          
          // Fetch related articles
          const related = await getRelatedArticles(articleData, 3);
          setRelatedArticles(related);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchArticle();
    
    // Reset view recorded flag when article ID changes
    setViewRecorded(false);
  }, [id]);

  const handleRelatedArticleClick = (article: Article) => {
    setSelectedRelatedArticle(article);
    setIsPreviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
        <p className="text-gray-400 mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const formattedDate = format(new Date(article.published_at), 'MMMM dd, yyyy');

  return (
    <>
      <div className="max-w-4xl mx-auto py-8">
        <Link to="/dashboard" className="flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <motion.article 
          className="bg-gray-800/60 rounded-xl overflow-hidden shadow-xl border border-gray-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {article.image_url && (
            <div className="h-72 overflow-hidden">
              <img 
                src={article.image_url} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="px-3 py-1 bg-blue-900/60 text-blue-200 rounded-full">
                {article.category}
              </span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formattedDate}
              </div>
              <span>Source: {article.source}</span>
              
              {viewCount > 0 && (
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-gray-500">{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
              {article.title}
            </h1>
            
            <div className="prose prose-invert max-w-none mb-8">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-700/60 text-gray-300 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between border-t border-gray-700 pt-6 gap-3">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
              >
                Read Original Article
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
              
              <div className="flex space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                  <ThumbsUp className="h-5 w-5" />
                </button>
                <BookmarkButton article={article} />
                <button className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.article>
        
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <motion.div 
                  key={relatedArticle.id}
                  className="bg-gray-800/60 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => handleRelatedArticleClick(relatedArticle)}
                >
                  <div className="h-40 overflow-hidden">
                    {relatedArticle.image_url ? (
                      <img 
                        src={relatedArticle.image_url} 
                        alt={relatedArticle.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-white line-clamp-2 mb-2">
                      {relatedArticle.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(relatedArticle.published_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Article Preview Modal */}
      <ArticlePreviewModal 
        article={selectedRelatedArticle}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
};

export default ArticleDetailPage;