import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface ScrollingNewsTickerProps {
  news: {
    title: string;
    link: string;
    pubDate: string;
    category?: string;
    isHighImpact?: boolean;
  }[];
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const ScrollingNewsTicker: React.FC<ScrollingNewsTickerProps> = ({
  news,
  speed = 30, // seconds for one complete scroll
  pauseOnHover = true,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      if (contentRef.current) {
        setContentWidth(contentRef.current.scrollWidth);
      }
    };

    // Initial measurement
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [news]); // Re-measure when news changes

  // Animation effect
  useEffect(() => {
    if (contentWidth <= 0 || containerWidth <= 0) return;

    // Calculate total distance and time
    const distance = contentWidth;
    const duration = speed; // seconds for one complete cycle

    if (!isPaused) {
      controls.start({
        x: [-20, -distance], // Start slightly off-screen and scroll to full width
        transition: {
          ease: "linear",
          duration,
          repeat: Infinity,
          repeatType: "loop"
        }
      });
    } else {
      controls.stop();
    }

    return () => {
      controls.stop();
    };
  }, [contentWidth, containerWidth, isPaused, controls, speed]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  if (!news || news.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={contentRef}
        animate={controls}
        className="inline-flex items-center"
      >
        {news.map((item, index) => (
          <a
            key={`ticker-item-${index}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mx-8 text-gray-300 hover:text-blue-300 transition-colors"
          >
            {item.category && (
              <span className="mr-2 text-xs px-2 py-0.5 bg-blue-900/40 rounded-full text-blue-200">
                {item.category}
              </span>
            )}
            
            <span className="font-medium whitespace-nowrap">{item.title}</span>
            
            {item.pubDate && (
              <span className="text-gray-500 ml-2 text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(item.pubDate), 'MMM dd, HH:mm')}
              </span>
            )}
            
            <span className="mx-8 text-blue-500">|</span>
          </a>
        ))}
      </motion.div>
    </div>
  );
};

export default ScrollingNewsTicker;