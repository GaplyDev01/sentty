import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Globe, Info, Check, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedText from '../ui/AnimatedText';
import AnimatedGradientText from '../ui/AnimatedGradientText';
import MarketPrediction from '../ui/MarketPrediction';
import { useInView } from 'react-intersection-observer';

// Impact categories with statistics
const impactCategories = [
  { name: "Environmental", color: "text-green-400", statistic: "78%" },
  { name: "Social", color: "text-blue-400", statistic: "92%" },
  { name: "Community", color: "text-yellow-400", statistic: "45%" },
  { name: "Global", color: "text-purple-400", statistic: "85%" }
];

const LandingHero: React.FC = () => {
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const [isInfoTooltipVisible, setIsInfoTooltipVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  
  // Rotate through impact categories automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedCategory((prev) => (prev + 1) % impactCategories.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-12 pb-24" ref={inViewRef}>
      {/* Small badge above headline */}
      <motion.div 
        className="mb-8 inline-flex items-center px-3 py-1.5 bg-blue-900/40 border border-blue-500/30 rounded-full text-blue-300 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        Impact News Intelligence
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-12">
        {/* Left side - text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            <span className="text-white mb-2 block">Discover</span> 
            <AnimatedGradientText 
              text="Impact News" 
              from="from-blue-400"
              to="to-blue-600" 
              className="text-4xl sm:text-5xl font-bold"
            />
            <span className="text-white mt-2 block">That Matters</span>
          </h1>
          
          <p className="text-gray-300 text-xl">
            Sentro delivers personalized insights through the lens of your interests and values, using AI to help you navigate information that drives positive change.
          </p>
          
          <div className="pt-4 space-y-4">
            {/* Impact categories stats */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Your Impact Score</span>
                  <button 
                    className="text-gray-400 hover:text-gray-300"
                    onMouseEnter={() => setIsInfoTooltipVisible(true)}
                    onMouseLeave={() => setIsInfoTooltipVisible(false)}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  
                  {isInfoTooltipVisible && (
                    <motion.div 
                      className="absolute z-10 mt-8 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700 text-sm text-gray-300 max-w-xs"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Your Impact Score measures how news affects causes important to you, quantified through AI analysis of content relevance and potential influence.
                    </motion.div>
                  )}
                </div>
                <span className={`${impactCategories[selectedCategory].color} font-bold`}>
                  {impactCategories[selectedCategory].statistic}
                </span>
              </div>
              
              <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden relative">
                <motion.div 
                  className={`h-full absolute left-0 top-0 ${
                    selectedCategory === 0 ? 'bg-green-600' :
                    selectedCategory === 1 ? 'bg-blue-600' :
                    selectedCategory === 2 ? 'bg-yellow-500' : 'bg-purple-600'
                  } rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: impactCategories[selectedCategory].statistic }}
                  transition={{ duration: 1 }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    <span className={impactCategories[selectedCategory].color}>
                      {impactCategories[selectedCategory].name}
                    </span> impact
                  </span>
                </div>
                
                {/* Pagination dots for impact categories */}
                <div className="flex space-x-2">
                  {impactCategories.map((_, index) => (
                    <button 
                      key={index} 
                      onClick={() => setSelectedCategory(index)}
                      className={`w-2 h-2 rounded-full ${selectedCategory === index 
                        ? 'bg-blue-400'
                        : 'bg-gray-600 hover:bg-gray-500'}`}
                      aria-label={`View ${impactCategories[index].name} impact`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/login?signup=true"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group relative overflow-hidden"
              >
                {/* Shimmering effect on the button */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent -z-10"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2, 
                    ease: "linear",
                    repeatDelay: 0.5
                  }}
                />
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-colors"
              >
                How It Works
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap items-center gap-4 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center text-sm text-gray-400">
              <Check className="h-4 w-4 mr-1 text-green-400" />
              Real-time updates
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Check className="h-4 w-4 mr-1 text-green-400" />
              Personalized scoring
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Check className="h-4 w-4 mr-1 text-green-400" />
              AI-powered insights
            </div>
          </motion.div>
        </motion.div>
        
        {/* Right side - dashboard preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl"></div>
            
            {/* Dashboard mockup */}
            <div className="relative bg-gray-900/80 border border-gray-800/70 rounded-xl overflow-hidden shadow-2xl">
              {/* Dashboard header with dots */}
              <div className="p-3 border-b border-gray-800/50 flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-3 text-xs text-gray-400">Sentro Dashboard</div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Your Impact Feed</h3>
                    <span className="px-3 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> High impact day
                    </span>
                  </div>
                  
                  {/* Impact news cards - enhanced UI */}
                  <div className="space-y-3">
                    {/* Item 1 with animation */}
                    <motion.div 
                      className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3 rounded-lg border border-blue-900/30 flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium mb-1">Global Initiative Launches $100M Climate Fund</h4>
                        <div className="flex items-center text-xs text-gray-400">
                          <span>2 hours ago</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-green-400">Environment</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-sm font-bold text-white">
                        85
                      </div>
                    </motion.div>
                    
                    {/* Item 2 with animation */}
                    <motion.div 
                      className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3 rounded-lg border border-blue-900/30 flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium mb-1">New Social Enterprise Platform Connects Communities</h4>
                        <div className="flex items-center text-xs text-gray-400">
                          <span>4 hours ago</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-blue-400">Social</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-sm font-bold text-white">
                        72
                      </div>
                    </motion.div>
                    
                    {/* Item 3 with animation */}
                    <motion.div 
                      className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3 rounded-lg border border-blue-900/30 flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium mb-1">Tech Companies Form Coalition to Address Climate Change</h4>
                        <div className="flex items-center text-xs text-gray-400">
                          <span>6 hours ago</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-purple-400">Technology</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-800/60 text-sm font-bold text-white">
                        64
                      </div>
                    </motion.div>
                    
                    {/* Item 4 with animation */}
                    <motion.div 
                      className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3 rounded-lg border border-blue-900/30 flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium mb-1">Impact Investment Fund Exceeds Return Targets</h4>
                        <div className="flex items-center text-xs text-gray-400">
                          <span>8 hours ago</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-yellow-400">Finance</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-sm font-bold text-white">
                        45
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.button
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View Your Full Impact Report
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Market Prediction Ticker with enhanced animation */}
      <MarketPrediction />
      
      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex items-center justify-center mt-12 text-gray-400"
      >
        <div className="flex items-center px-4 py-2 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50">
          <div className="flex -space-x-4 mr-4">
            <motion.img 
              whileHover={{ y: -5 }}
              src="https://randomuser.me/api/portraits/men/32.jpg" 
              alt="User" 
              className="w-8 h-8 rounded-full border-2 border-gray-800" 
            />
            <motion.img 
              whileHover={{ y: -5 }}
              src="https://randomuser.me/api/portraits/women/44.jpg" 
              alt="User" 
              className="w-8 h-8 rounded-full border-2 border-gray-800" 
            />
            <motion.img 
              whileHover={{ y: -5 }}
              src="https://randomuser.me/api/portraits/men/86.jpg" 
              alt="User" 
              className="w-8 h-8 rounded-full border-2 border-gray-800" 
            />
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-900/50 text-blue-300 text-xs border-2 border-gray-800">
              +2k
            </div>
          </div>
          <div className="text-sm">
            <span className="text-blue-400 font-bold">2,000+ impact leaders</span> trust our insights
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingHero;