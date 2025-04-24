import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  category?: string;
}

interface HighlightedNewsBannerProps {
  className?: string;
  newsItems: NewsItem[];
}

const HighlightedNewsBanner: React.FC<HighlightedNewsBannerProps> = ({ 
  className,
  newsItems
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (newsItems.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % newsItems.length);
        setIsVisible(true);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [newsItems]);

  if (!newsItems || newsItems.length === 0) {
    return null;
  }

  const currentItem = newsItems[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentIndex}
            className="bg-blue-900/20 backdrop-blur-sm border border-blue-900/40 rounded-lg p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 bg-blue-900/40 rounded-full">
                  <TrendingUp className="w-5 h-5 text-blue-300" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-blue-300 flex items-center">
                    <span className="font-medium uppercase">
                      Breaking Impact News
                    </span>
                    {currentItem.category && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-900/50 rounded-full text-xs">
                        {currentItem.category}
                      </span>
                    )}
                  </div>
                  
                  {currentItem.pubDate && (
                    <div className="text-xs text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(currentItem.pubDate), 'MMM dd, HH:mm')}
                    </div>
                  )}
                </div>
                
                <h3 className="text-white font-medium mb-2">{currentItem.title}</h3>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {newsItems.length > 1 && (
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: newsItems.length }).map((_, i) => (
                          <div 
                            key={i}
                            className={`h-1.5 rounded-full ${
                              i === currentIndex ? 'w-4 bg-blue-400' : 'w-1.5 bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href={currentItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    Read More
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HighlightedNewsBanner;