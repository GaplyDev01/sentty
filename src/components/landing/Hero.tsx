import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroStats from './HeroStats';
import AnimatedText from '../ui/AnimatedText';

const Hero: React.FC = () => {
  return (
    <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8 relative z-20"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
          <span className="block mb-2">Stay ahead with</span>
          <AnimatedText 
            text="AI-powered news" 
            gradient={true} 
            gradientFrom="from-blue-400" 
            gradientTo="to-purple-500"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold"
            delay={0.3}
          />
          <span className="block mt-2">tailored for you</span>
        </h1>
        
        <p className="text-xl text-gray-300 max-w-xl">
          SophIQ intelligently aggregates and ranks news that matters to you, cutting through the noise in fast-paced industries.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 relative z-20">
          <Link 
            to="/login?signup=true" 
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg relative z-20"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <a 
            href="#features" 
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg transition-colors text-lg relative z-20"
          >
            Learn More
          </a>
        </div>
        
        <HeroStats />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
        <div className="relative bg-gray-800/80 border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-gray-900/80 border-b border-gray-700/50">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?q=80&w=1000&auto=format&fit=crop" 
            alt="SophIQ Dashboard Preview" 
            className="w-full h-auto"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;