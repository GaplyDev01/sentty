import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, Brain, LineChart, Database, Lightbulb, ArrowLeft, ArrowRight } from 'lucide-react';

// Feature data
const processSteps = [
  {
    icon: <User className="h-8 w-8 text-blue-400" />,
    title: "Create Your Profile",
    description: "Set up your profile with your values, interests, and impact goals to tailor your experience."
  },
  {
    icon: <Search className="h-8 w-8 text-green-400" />,
    title: "AI News Gathering",
    description: "Our AI continuously monitors thousands of news sources to collect relevant impact stories in real-time."
  },
  {
    icon: <Brain className="h-8 w-8 text-yellow-400" />,
    title: "Personalized Analysis",
    description: "Advanced algorithms analyze how each story impacts communities, sustainability goals, and causes you care about."
  },
  {
    icon: <LineChart className="h-8 w-8 text-purple-400" />,
    title: "Impact Scoring",
    description: "Each news item receives an impact score from 1-100 based on its relevance to your values and potential for change."
  },
  {
    icon: <Database className="h-8 w-8 text-cyan-400" />,
    title: "Actionable Insights", 
    description: "Get recommendations to help you engage with news through actions that align with your impact goals."
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-indigo-400" />,
    title: "Impact Tracking",
    description: "Monitor your engagement and the collective impact of your community over time."
  }
];

// Feature Card Component
const FeatureCard: React.FC<{
  feature: typeof processSteps[0];
  isActive: boolean;
  index: number;
}> = ({ feature, isActive, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: isActive ? 1 : 0.7,
      y: 0, 
      scale: isActive ? 1 : 0.95,
      z: isActive ? 50 : 0
    }}
    transition={{ duration: 0.5 }}
    className={`feature-card bg-gray-800/50 backdrop-blur-sm border ${
      isActive 
        ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' 
        : 'border-gray-700/50'
    } rounded-xl p-6 transition-all duration-300 h-full flex flex-col cursor-pointer`}
  >
    <div className={`p-3 ${isActive ? 'bg-blue-900/30' : 'bg-gray-900/40'} rounded-lg inline-block mb-4 w-fit`}>
      {feature.icon}
    </div>
    <h3 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-300'} mb-3`}>{feature.title}</h3>
    <p className="text-gray-300">{feature.description}</p>
    <div className="mt-auto pt-4 flex justify-between items-center">
      <div className="text-xs bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded-full inline-block">
        Step {index + 1}
      </div>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-2.5 w-2.5 rounded-full bg-blue-400"
        />
      )}
    </div>
  </motion.div>
);

const ScrollingFeatureCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection('right');
      setCurrentIndex(prevIndex => (prevIndex + 1) % processSteps.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handlePrevious = () => {
    setDirection('left');
    setCurrentIndex(prevIndex => (prevIndex - 1 + processSteps.length) % processSteps.length);
  };
  
  const handleNext = () => {
    setDirection('right');
    setCurrentIndex(prevIndex => (prevIndex + 1) % processSteps.length);
  };
  
  // Determine which indices to show based on screen size
  const getVisibleIndices = () => {
    if (typeof window === 'undefined') return [currentIndex];
    
    const width = window.innerWidth;
    if (width >= 1024) { // lg screens: show 3 cards
      return [
        (currentIndex - 1 + processSteps.length) % processSteps.length,
        currentIndex,
        (currentIndex + 1) % processSteps.length
      ];
    } else if (width >= 768) { // md screens: show 2 cards
      return [
        currentIndex,
        (currentIndex + 1) % processSteps.length
      ];
    } else { // sm screens: show 1 card
      return [currentIndex];
    }
  };
  
  const visibleIndices = getVisibleIndices();
  
  // Create pagination indicators
  const handleIndicatorClick = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
  };
  
  // Variants for the animation
  const cardVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
      opacity: 0,
      scale: 0.9
    })
  };
  
  return (
    <div ref={containerRef} className="carousel-container my-12 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-5 relative"
      >
        {/* Desktop / Large Screen View */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleIndices.map((index) => (
            <FeatureCard
              key={index}
              feature={processSteps[index]}
              isActive={index === currentIndex}
              index={index + 1}
            />
          ))}
        </div>
        
        {/* Mobile Carousel View */}
        <div className="md:hidden relative overflow-hidden">
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full"
            >
              <FeatureCard
                feature={processSteps[currentIndex]}
                isActive={true}
                index={currentIndex + 1}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between absolute top-1/2 left-0 right-0 transform -translate-y-1/2 px-4 pointer-events-none">
          <button
            onClick={handlePrevious}
            className="w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-white flex items-center justify-center shadow-lg pointer-events-auto transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-white flex items-center justify-center shadow-lg pointer-events-auto transition-colors"
          >
            <ArrowRight size={18} />
          </button>
        </div>
        
        {/* Pagination Indicators */}
        <div className="flex justify-center mt-6 gap-3">
          {processSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-blue-500'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ScrollingFeatureCarousel;