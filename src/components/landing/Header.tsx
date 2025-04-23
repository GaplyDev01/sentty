import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const Header: React.FC = () => {
  return (
    <nav className="flex justify-between items-center py-6 relative z-20">
      <div className="flex items-center">
        <Logo textSize="text-2xl" iconSize={32} />
      </div>
      <div className="flex items-center space-x-4 relative z-20">
        <Link 
          to="/login" 
          className="text-gray-300 hover:text-white transition-colors font-medium relative z-20"
        >
          Sign In
        </Link>
        <Link 
          to="/login?signup=true" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-colors font-medium relative z-20"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Header;