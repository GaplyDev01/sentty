import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Globe, RefreshCw, ExternalLink, ArrowRight, BarChart2, Clock } from 'lucide-react';
import { coinDeskService } from '../../services/coinDeskService';
import { cryptoService } from '../../services/cryptoService';
import type { Article } from '../../types/newsapi';

interface CryptoDashboardProps {
  className?: string;
}

const CryptoDashboard: React.FC<CryptoDashboardProps> = ({ className = '' }) => {
  const [coinDeskNews, setCoinDeskNews] = useState<Article[]>([]);
  const [cryptoPanicNews, setCryptoPanicNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState({
    coinDesk: true,
    cryptoPanic: true
  });
  const [error, setError] = useState<Record<string, string | null>>({
    coinDesk: null,
    cryptoPanic: null
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllCryptoNews();
  }, []);

  const fetchAllCryptoNews = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCoinDeskNews(),
      fetchCryptoPanicNews()
    ]);
    setRefreshing(false);
  };

  const fetchCoinDeskNews = async () => {
    try {
      setLoading(prev => ({ ...prev, coinDesk: true }));
      setError(prev => ({ ...prev, coinDesk: null }));
      
      const result = await coinDeskService.fetchCoinDeskNews({ limit: 5 });
      setCoinDeskNews(result.articles);
    } catch (err) {
      console.error('Error fetching CoinDesk news:', err);
      setError(prev => ({ 
        ...prev, 
        coinDesk: err instanceof Error ? err.message : 'Failed to load CoinDesk news' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, coinDesk: false }));
    }
  };

  const fetchCryptoPanicNews = async () => {
    try {
      setLoading(prev => ({ ...prev, cryptoPanic: true }));
      setError(prev => ({ ...prev, cryptoPanic: null }));
      
      const result = await cryptoService.fetchCryptoPanicNews({ limit: 5 });
      setCryptoPanicNews(result.articles);
    } catch (err) {
      console.error('Error fetching CryptoPanic news:', err);
      setError(prev => ({ 
        ...prev, 
        cryptoPanic: err instanceof Error ? err.message : 'Failed to load CryptoPanic news' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, cryptoPanic: false }));
    }
  };

  const renderNewsItem = (article: Article, index: number) => (
    <motion.div
      key={article.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="p-3 bg-gray-800/70 hover:bg-gray-800/90 rounded-lg border border-gray-700/40 transition-colors group"
    >
      <a 
        href={article.url} 
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex justify-between mb-2">
          <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
            {article.category}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(article.published_at).toLocaleDateString()}
          </span>
        </div>
        
        <h4 className="text-base font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
          {article.title}
        </h4>
        
        <div className="flex justify-end">
          <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>
      </a>
    </motion.div>
  );

  return (
    <div className={`bg-gray-900/50 border border-gray-700/50 rounded-xl ${className}`}>
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
            Crypto Impact Intelligence
          </h3>
          <button
            onClick={fetchAllCryptoNews}
            disabled={refreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CoinDesk News */}
          <div>
            <h4 className="flex items-center text-white text-base font-medium mb-3">
              <Clock className="h-4 w-4 mr-2 text-blue-400" />
              CoinDesk Latest
            </h4>
            
            {loading.coinDesk ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : error.coinDesk ? (
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-red-300 text-sm">
                {error.coinDesk}
              </div>
            ) : coinDeskNews.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No CoinDesk articles available</div>
            ) : (
              <div className="space-y-2">
                {coinDeskNews.slice(0, 3).map(renderNewsItem)}
              </div>
            )}
            
            <div className="mt-2 text-right">
              <a 
                href="https://www.coindesk.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                More from CoinDesk
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          
          {/* CryptoPanic News */}
          <div>
            <h4 className="flex items-center text-white text-base font-medium mb-3">
              <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
              CryptoPanic Trending
            </h4>
            
            {loading.cryptoPanic ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
              </div>
            ) : error.cryptoPanic ? (
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-red-300 text-sm">
                {error.cryptoPanic}
              </div>
            ) : cryptoPanicNews.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No CryptoPanic articles available</div>
            ) : (
              <div className="space-y-2">
                {cryptoPanicNews.slice(0, 3).map(renderNewsItem)}
              </div>
            )}
            
            <div className="mt-2 text-right">
              <a 
                href="https://cryptopanic.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                More from CryptoPanic
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-300 text-sm font-medium mb-2">Crypto Market Insights</h4>
          <p className="text-gray-300 text-sm">
            Our AI analysis indicates growing institutional interest in Bitcoin as a hedge against inflation,
            with potential impact on sustainable finance initiatives and ESG portfolios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CryptoDashboard;