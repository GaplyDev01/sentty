import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, ArrowUpRight, Clock, Rss, AlertCircle, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { coinDeskService } from '../../services/coinDeskService';

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
  title?: string;
  description?: string;
  link?: string;
  items: RssFeedItem[];
  error?: string;
  Data?: any[]; // Add support for CoinDesk API response format
  source?: string;
}

interface CoinDeskRssFeedProps {
  limit?: number;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const CoinDeskRssFeed: React.FC<CoinDeskRssFeedProps> = ({ 
  limit = 5,
  className = '',
  showTitle = true,
  compact = false
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
      
      // Try to fetch directly from the Supabase Edge Function
      try {
        console.log("Fetching from Supabase Edge Function");
        const result = await coinDeskService.fetchCoinDeskNews({ limit });
        
        if (result.articles && result.articles.length > 0) {
          const transformedData = {
            title: "CoinDesk: Latest Crypto News",
            description: "Latest cryptocurrency news and updates",
            link: "https://www.coindesk.com",
            items: result.articles.map(article => ({
              title: article.title,
              link: article.url,
              pubDate: article.published_at,
              content: article.content,
              contentSnippet: article.content?.substring(0, 150) || "",
              creator: article.source,
              categories: article.tags || [],
              enclosure: article.image_url ? {
                url: article.image_url,
                type: "image/jpeg"
              } : undefined
            }))
          };
          
          setFeed(transformedData);
          return;
        }
      } catch (edgeFuncError) {
        console.warn('Edge Function fetch failed:', edgeFuncError);
        // Continue to fallback
      }
      
      // Fallback to local file if Edge Function fails
      console.log("Falling back to local RSS file");
      const response = await fetch('/feeds/coindesk-rss.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CoinDesk RSS feed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the data is in the expected format
      if (data.Data && Array.isArray(data.Data)) {
        // Convert from CoinDesk API format to our expected format
        const transformedData = {
          title: "CoinDesk: Bitcoin, Ethereum, Crypto News and Price Data",
          description: "Leader in cryptocurrency, Bitcoin, Ethereum, XRP, blockchain, DeFi, digital finance and Web3 news with analysis, video and live price updates.",
          link: "https://www.coindesk.com",
          items: data.Data.map((item: any) => ({
            title: item.TITLE || "Untitled",
            link: item.URL || "#",
            pubDate: item.PUBLISHED_ON ? new Date(item.PUBLISHED_ON * 1000).toUTCString() : new Date().toUTCString(),
            content: item.BODY || item.SUBTITLE || "",
            contentSnippet: item.SUBTITLE || "",
            creator: item.SOURCE_DATA?.NAME || "CoinDesk",
            categories: item.CATEGORY_DATA?.map((cat: any) => cat.NAME) || [],
            enclosure: item.IMAGE_URL ? {
              url: item.IMAGE_URL,
              type: "image/jpeg"
            } : undefined
          }))
        };
        setFeed(transformedData);
      } else if (data.items && Array.isArray(data.items)) {
        // Already in the expected format
        setFeed(data);
      } else {
        console.warn('Unexpected CoinDesk API response format:', data);
        throw new Error('Invalid feed data format');
      }
      
    } catch (err) {
      console.error('Error fetching CoinDesk RSS feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CoinDesk feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, []);

  // Refresh feed
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
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

  // Get image URL from item
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

  if (loading && !refreshing) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-900/50 ${className}`}>
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading CoinDesk news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-red-900/20 border border-red-800/30 ${className}`}>
        <div className="flex items-start text-red-300">
          <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load CoinDesk feed</p>
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

  if (!feed || !feed.items || feed.items.length === 0) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-900/50 ${className}`}>
        <p className="text-gray-400 text-center py-4">No CoinDesk news available</p>
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
    <div className={`${compact ? 'p-2' : 'p-4'} rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
            CoinDesk Impact News
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
      
      <div className="space-y-3">
        {displayItems.map((item, index) => {
          const mediaUrl = getMediaUrl(item);
          
          return (
            <motion.div
              key={`${item.link}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`${compact ? 'p-2' : 'p-3'} bg-gray-800/70 hover:bg-gray-700/70 rounded-lg border border-gray-700/40 transition-colors group`}
            >
              <a 
                href={item.link} 
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex items-start gap-3">
                  {mediaUrl && !compact && (
                    <img 
                      src={mediaUrl} 
                      alt={item.title} 
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      onError={(e) => {
                        // Hide image on error
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      {item.categories && item.categories[0] && (
                        <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                          {item.categories[0]}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(item.pubDate || item.isoDate || '')}
                      </span>
                    </div>
                    
                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors`}>
                      {item.title}
                    </h4>
                    
                    {!compact && item.contentSnippet && (
                      <p className="text-gray-400 text-sm line-clamp-1">
                        {item.contentSnippet}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {item.creator || 'CoinDesk'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-3 text-center">
        <a 
          href="https://www.coindesk.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center transition-colors"
        >
          More on CoinDesk
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default CoinDeskRssFeed;