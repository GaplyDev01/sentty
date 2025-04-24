import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, ArrowUpRight, Clock, Rss, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  isoDate?: string;
  enclosure?: {
    url?: string;
    type?: string;
  };
  mediaContent?: {
    url: string;
    medium: string;
    height?: string;
    width?: string;
  }[];
  "media:content"?: {
    $: {
      url: string;
      medium: string;
      height?: string;
      width?: string;
    }
  }[];
}

interface RssFeedData {
  title: string;
  description: string;
  link: string;
  items: RssFeedItem[];
}

interface RssNewsFeedProps {
  feedUrl: string;
  limit?: number;
  className?: string;
  showTitle?: boolean;
}

const RssNewsFeed: React.FC<RssNewsFeedProps> = ({ 
  feedUrl,
  limit = 5,
  className = '',
  showTitle = true
}) => {
  const [feed, setFeed] = useState<RssFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(feedUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
      }
      
      const data: RssFeedData = await response.json();
      
      // Check if any items have media content
      const mediaCount = data.items.filter(item => 
        item.enclosure?.url || 
        item.mediaContent?.length || 
        item["media:content"]?.length
      ).length;
      
      setHasMedia(mediaCount > 0);
      setFeed(data);
    } catch (err) {
      console.error('Error fetching RSS feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load RSS feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, [feedUrl]);

  // Refresh feed
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  // Get media URL from item
  const getMediaUrl = (item: RssFeedItem): string | undefined => {
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }
    
    if (item.mediaContent?.length) {
      return item.mediaContent[0].url;
    }
    
    if (item["media:content"]?.length) {
      return item["media:content"][0].$.url;
    }
    
    // Extract image from content if available
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }
    
    return undefined;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    try {
      // Try to parse the date string
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch (err) {
      console.warn('Error formatting date:', err);
      return dateStr;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className={`p-4 rounded-lg bg-gray-900/50 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading news feed...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg bg-red-900/20 border border-red-800/30 ${className}`}>
        <div className="flex items-start text-red-300">
          <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load RSS feed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          className="mt-3 text-blue-400 hover:text-blue-300 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Try again
        </button>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className={`p-4 rounded-lg bg-gray-900/50 ${className}`}>
        <p className="text-gray-400 text-center py-4">No feed data available</p>
        <button 
          onClick={handleRefresh} 
          className="mt-2 text-blue-400 hover:text-blue-300 flex items-center justify-center w-full"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
    );
  }

  // Limit the number of items to display
  const displayItems = feed.items.slice(0, limit);

  return (
    <div className={`p-4 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Rss className="h-5 w-5 mr-2 text-blue-400" />
            {feed.title || 'RSS News Feed'}
          </h3>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {displayItems.map((item, index) => {
          const mediaUrl = getMediaUrl(item);
          
          return (
            <motion.div
              key={`${item.link}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-gray-800/70 hover:bg-gray-700/70 rounded-lg border border-gray-700/40 transition-colors group overflow-hidden"
            >
              <a 
                href={item.link} 
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {hasMedia && (
                  <div className="flex flex-col md:flex-row">
                    {mediaUrl && (
                      <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                        <img 
                          src={mediaUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            // Hide image on error
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className={`p-4 ${mediaUrl ? 'md:w-2/3' : 'w-full'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {item.categories && item.categories[0] && (
                            <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full mr-2">
                              {item.categories[0]}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(item.pubDate || item.isoDate || '')}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h4>
                      
                      {item.contentSnippet && (
                        <p className="text-gray-300 line-clamp-3 mb-3">
                          {item.contentSnippet}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {item.creator || feed.title}
                        </span>
                        <div className="text-blue-400 text-sm flex items-center font-medium">
                          Read article
                          <ExternalLink className="ml-1 w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {!hasMedia && (
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {item.categories && item.categories[0] && (
                          <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full mr-2">
                            {item.categories[0]}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(item.pubDate || item.isoDate || '')}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-medium text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h4>
                    
                    {item.contentSnippet && (
                      <p className="text-gray-300 line-clamp-3 mb-3">
                        {item.contentSnippet}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {item.creator || feed.title}
                      </span>
                      <div className="text-blue-400 text-sm flex items-center font-medium">
                        Read article
                        <ExternalLink className="ml-1 w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}
              </a>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center">
        <a 
          href={feed.link} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center transition-colors"
        >
          View more news
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default RssNewsFeed;