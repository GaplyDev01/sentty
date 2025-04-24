import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  return (
    <nav className="flex justify-between items-center py-6 relative z-20">
      <div className="flex items-center">
        <Logo textSize="text-2xl" iconSize={32} />
        <span className="text-sm text-gray-300 ml-1 font-normal">Impact News</span>
      </div>
      
      <motion.div 
        className="hidden lg:flex items-center space-x-8 relative z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <a href="#features" className="text-gray-300 hover:text-white transition-colors">
          Features
        </a>
        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
          How It Works
        </a>
        <Link to="#" className="text-gray-300 hover:text-white transition-colors">
          Impact Score
        </Link>
        <div className="group relative">
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            Solutions
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            <div className="py-1">
              <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">For Investors</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">For Enterprises</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">For Developers</a>
            </div>
          </div>
        </div>
        <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
          Pricing
        </a>
      </motion.div>
      
      <div className="flex items-center space-x-4 relative z-20">
        <Link 
          to="/login" 
          className="text-gray-300 hover:text-white transition-colors font-medium relative z-20"
        >
          Log in
        </Link>
        <Link 
          to="/login?signup=true" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors font-medium relative z-20"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Header;