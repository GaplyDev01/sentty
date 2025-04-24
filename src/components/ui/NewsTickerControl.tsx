import React, { useState } from 'react';
import { X, Volume2, VolumeX, ExternalLink, Pause, Play, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsTickerControlProps {
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInNewTab?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const NewsTickerControl: React.FC<NewsTickerControlProps> = ({ 
  onClose, 
  isMuted, 
  onToggleMute, 
  onOpenInNewTab,
  isPaused,
  onTogglePause
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  return (
    <div className="fixed bottom-0 right-4 bg-gray-800/90 backdrop-blur-sm rounded-t-lg shadow-lg z-50 flex items-center border-t border-x border-blue-900/30">
      {onOpenInNewTab && (
        <div className="relative">
          <button 
            onClick={onOpenInNewTab}
            className="p-2 text-gray-400 hover:text-blue-300 transition-colors"
            title="Open news in new tab"
            onMouseEnter={() => setShowTooltip('open')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <ExternalLink className="h-4 w-4" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showTooltip === 'open' && (
              <motion.div 
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
              >
                Open all news
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="relative">
        <button 
          onClick={onToggleMute}
          className="p-2 text-gray-400 hover:text-blue-300 transition-colors"
          title={isMuted ? "Unmute ticker" : "Mute ticker"}
          onMouseEnter={() => setShowTooltip('mute')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </motion.div>
        </button>
        <AnimatePresence>
          {showTooltip === 'mute' && (
            <motion.div 
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              {isMuted ? 'Unmute ticker' : 'Mute ticker'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {onTogglePause && (
        <div className="relative">
          <button 
            onClick={onTogglePause}
            className="p-2 text-gray-400 hover:text-blue-300 transition-colors"
            title={isPaused ? "Resume ticker" : "Pause ticker"}
            onMouseEnter={() => setShowTooltip('pause')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </motion.div>
          </button>
          <AnimatePresence>
            {showTooltip === 'pause' && (
              <motion.div 
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
              >
                {isPaused ? 'Resume ticker' : 'Pause ticker'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="relative">
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-red-300 transition-colors"
          title="Hide ticker"
          onMouseEnter={() => setShowTooltip('close')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <X className="h-4 w-4" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showTooltip === 'close' && (
            <motion.div 
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              Hide ticker
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NewsTickerControl;