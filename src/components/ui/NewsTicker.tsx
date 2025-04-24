import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ExternalLink, Globe, TrendingUp, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useNewsTicker } from '../../contexts/NewsTickerContext';
import NewsTickerControl from './NewsTickerControl';
import ScrollingNewsTicker from './ScrollingNewsTicker';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  category?: string;
  isHighImpact?: boolean;
}

interface NewsTickerProps {
  className?: string;
}

// Sample fallback news data in case all fetches fail
const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Crypto markets show resilience amid global economic uncertainty",
    link: "https://www.reuters.com/business/finance/",
    pubDate: new Date().toISOString(),
    category: "Finance",
    isHighImpact: true
  },
  {
    title: "Bitcoin stabilizes above support levels as institutional interest grows",
    link: "https://www.reuters.com/markets/",
    pubDate: new Date().toISOString(),
    category: "Markets"
  },
  {
    title: "Blockchain technology adoption accelerates across industries",
    link: "https://www.reuters.com/technology/",
    pubDate: new Date().toISOString(),
    category: "Technology" 
  },
  {
    title: "Ethereum upgrade attracts new developers to ecosystem",
    link: "https://www.reuters.com/technology/",
    pubDate: new Date().toISOString(),
    category: "Technology"
  },
  {
    title: "Regulatory clarity drives institutional adoption of cryptocurrencies",
    link: "https://www.reuters.com/business/finance/",
    pubDate: new Date().toISOString(),
    category: "Finance"
  }
];

const NewsTicker: React.FC<NewsTickerProps> = ({ className = '' }) => {
  const { isVisible, isMuted, hideTicker, toggleMute } = useNewsTicker();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pauseAnimation, setPauseAnimation] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const [highlightedItems, setHighlightedItems] = useState<Set<number>>(new Set());
  const tickerRef = useRef<HTMLDivElement>(null);

  // Fetch news from the Netlify-fetched Reuters feed
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        
        // First try to fetch local JSON file fetched by Netlify plugin
        try {
          const response = await fetch('/feeds/reuters-topnews.json');
          
          if (!response.ok) {
            throw new Error(`Local feed unavailable: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Process the feed data and add random categories and impact scores for visual variety
          if (data && data.items && Array.isArray(data.items)) {
            const processedItems = data.items.map((item: any, index: number) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate || item.isoDate,
              description: item.description || item.content,
              // Add random categories for visual interest
              category: getRandomCategory(),
              // Mark some items as high impact for visual interest
              isHighImpact: index % 4 === 0 // Every 4th item is high impact
            }));
            
            setNews(processedItems);
            console.log('Successfully loaded local news feed');
            return; // Exit if successful
          } else {
            throw new Error('Invalid feed data format');
          }
        } catch (localError) {
          console.warn('Could not load local feed:', localError);
          
          // Try to fetch from the RSS.app URL directly if local fails
          try {
            const response = await fetch('https://rss.app/feeds/_LGUsXhQQjR11Xad5.xml');
            
            if (!response.ok) {
              throw new Error(`RSS.app feed unavailable: ${response.status}`);
            }
            
            // Parse the XML response
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            // Extract items from the XML
            const items = xmlDoc.querySelectorAll('item');
            const processedItems: NewsItem[] = [];
            
            items.forEach((item, index) => {
              const title = item.querySelector('title')?.textContent || '';
              const link = item.querySelector('link')?.textContent || '';
              const pubDate = item.querySelector('pubDate')?.textContent || '';
              const description = item.querySelector('description')?.textContent || '';
              
              if (title && link) {
                processedItems.push({
                  title,
                  link,
                  pubDate,
                  description,
                  category: getRandomCategory(),
                  isHighImpact: index % 4 === 0
                });
              }
            });
            
            if (processedItems.length > 0) {
              setNews(processedItems);
              console.log('Successfully loaded RSS.app feed');
              return; // Exit if successful
            } else {
              throw new Error('No items found in RSS feed');
            }
          } catch (rssError) {
            console.warn('Could not load RSS.app feed:', rssError);
            // Fall back to default news
            setNews(FALLBACK_NEWS);
          }
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news ticker');
        
        // Use fallback news data when all fetches fail
        console.log('Using fallback news data due to error');
        setNews(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
    
    // Refresh the news every hour
    const intervalId = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Get random category for visual variety
  const getRandomCategory = () => {
    const categories = [
      "Finance", "Technology", "Markets", "Business", 
      "Environment", "Health", "Education", "Community"
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  // Randomly highlight items occasionally for visual interest
  useEffect(() => {
    if (news.length === 0) return;
    
    // Initial highlight
    setHighlightedItems(new Set([Math.floor(Math.random() * news.length)]));
    
    // Occasionally highlight different items
    const intervalId = setInterval(() => {
      const newHighlights = new Set<number>();
      // Highlight 1-2 random items
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        newHighlights.add(Math.floor(Math.random() * news.length));
      }
      setHighlightedItems(newHighlights);
    }, 8000);
    
    return () => clearInterval(intervalId);
  }, [news]);

  const openAllNews = () => {
    window.open('https://www.reuters.com/world/top-news/', '_blank');
  };
  
  if (!isVisible) {
    return null;
  }
  
  if (loading) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 py-2 z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center">
          <Globe className="h-4 w-4 text-blue-400 mr-2 animate-spin" />
          <span className="text-gray-400 text-sm">Loading news ticker...</span>
        </div>
        <NewsTickerControl onClose={hideTicker} isMuted={isMuted} onToggleMute={toggleMute} />
      </div>
    );
  }

  // If there are no news items, don't render
  if (!news.length) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-blue-900/30 py-2 z-50 ${className}`}
      onMouseEnter={() => setPauseAnimation(true)}
      onMouseLeave={() => setPauseAnimation(false)}
      ref={tickerRef}
    >
      {/* Use our custom ScrollingNewsTicker component */}
      <ScrollingNewsTicker 
        news={news} 
        pauseOnHover={true}
        speed={45}
        className="mx-auto"
      />
      
      <AnimatePresence>
        {pauseAnimation && (
          <motion.div
            className="absolute left-0 right-0 bottom-full py-2 px-3 mb-1 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-t-lg text-xs text-gray-300 max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <Shield className="h-3 w-3 mr-1 text-blue-400" />
              Ticker paused - hover over an article to read
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <NewsTickerControl 
        onClose={hideTicker} 
        isMuted={isMuted} 
        onToggleMute={toggleMute} 
        onOpenInNewTab={openAllNews}
      />
    </div>
  );
};

export default NewsTicker;