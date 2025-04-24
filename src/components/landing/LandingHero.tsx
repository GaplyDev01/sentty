import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedText from '../ui/AnimatedText';
import MarketPrediction from '../ui/MarketPrediction';

const LandingHero: React.FC = () => {
  return (
    <div className="pt-12 pb-24">
      {/* Small badge above headline */}
      <motion.div 
        className="mb-8 inline-flex items-center px-3 py-1.5 bg-blue-900/40 border border-blue-500/30 rounded-full text-blue-300 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        Web3 News Intelligence
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-12">
        {/* Left side - text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            <span className="text-white mb-2 block">Decentralized</span> 
            <AnimatedText 
              text="News" 
              gradient={true} 
              gradientFrom="from-blue-400" 
              gradientTo="to-blue-600" 
              delay={0.3}
              className="text-4xl sm:text-5xl font-bold"
            />
            <span className="text-white mt-2 block">Impact Scoring</span>
          </h1>
          
          <p className="text-gray-300 text-xl">
            Sentro delivers blockchain-powered insights through the lens of your career, investments, and interests, using AI to help you navigate market shifts and digital asset opportunities.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/login?signup=true"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
            
            <a 
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-700/60 transition-colors"
            >
              Explore the Technology <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </motion.div>
        
        {/* Right side - dashboard preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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
                  
                  {/* Impact news cards - mocked UI */}
                  <div className="space-y-3">
                    <ImpactNewsCard 
                      title="Fed Raises Interest Rates by 0.5%" 
                      time="2 hours ago"
                      category="Finance"
                      score={85}
                    />
                    
                    <ImpactNewsCard 
                      title="New Blockchain Regulations Announced" 
                      time="2 hours ago"
                      category="Finance"
                      score={72}
                    />
                    
                    <ImpactNewsCard 
                      title="Tech Giant Acquires AI Startup" 
                      time="2 hours ago"
                      category="Finance"
                      score={64}
                    />
                    
                    <ImpactNewsCard 
                      title="Market Recovery in Asian Stock Exchange" 
                      time="2 hours ago"
                      category="Finance"
                      score={45}
                    />
                  </div>
                  
                  <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                    View Your Full Impact Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Market Prediction Ticker */}
      <MarketPrediction />
      
      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex items-center justify-center mt-12 text-gray-400"
      >
        <div className="flex items-center">
          <div className="flex -space-x-4">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-gray-800" />
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-gray-800" />
            <img src="https://randomuser.me/api/portraits/men/86.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-gray-800" />
          </div>
          <div className="ml-4 text-sm">
            <span className="text-blue-400 font-bold">2,000+ professionals</span> trust our blockchain insights
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Mocked news card component for the dashboard preview
const ImpactNewsCard: React.FC<{title: string; time: string; category: string; score: number}> = ({
  title, time, category, score
}) => {
  return (
    <div className="bg-gray-800/50 hover:bg-gray-800/80 transition-colors p-3 rounded-lg border border-gray-700/50 flex justify-between items-center">
      <div className="flex-1">
        <h4 className="text-white text-sm font-medium mb-1">{title}</h4>
        <div className="flex items-center text-xs text-gray-400">
          <span>{time}</span>
          <span className="mx-1.5">•</span>
          <span>{category}</span>
        </div>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        ${score >= 80 ? 'bg-blue-600' : 
          score >= 70 ? 'bg-green-600' :
          score >= 50 ? 'bg-blue-800/60' : 'bg-gray-700'}
        text-sm font-bold text-white`}
      >
        {score}
      </div>
    </div>
  );
};

export default LandingHero;