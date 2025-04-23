import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBookmark } from '../../hooks/useBookmark';
import { useAuth } from '../../contexts/AuthContext';
import type { Article } from '../../types/newsapi';

interface BookmarkButtonProps {
  article: Article;
  className?: string; 
  iconSize?: number;
  asIcon?: boolean;
  showText?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  article,
  className = '',
  iconSize = 18,
  asIcon = true,
  showText = false
}) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, loading } = useBookmark(article.id);
  const [animate, setAnimate] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      // Prompt to sign in - this would typically show a modal or redirect
      alert('Please sign in to bookmark articles');
      return;
    }

    const success = await toggleBookmark(article);
    if (success) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }
  };

  const innerContent = (
    <>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isBookmarked ? (
        <motion.div
          animate={animate ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <BookmarkCheck 
            size={iconSize} 
            className="text-blue-400" 
          />
        </motion.div>
      ) : (
        <Bookmark size={iconSize} />
      )}
      {showText && (
        <span className="ml-2">
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </>
  );

  if (asIcon) {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 rounded-full focus:outline-none hover:bg-gray-700/50 transition-colors ${className}`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center px-3 py-1.5 rounded-md focus:outline-none hover:bg-gray-700/50 transition-colors ${className}`}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {innerContent}
    </button>
  );
};

export default BookmarkButton;