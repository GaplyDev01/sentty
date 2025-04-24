import React from 'react';
import Logo from '../ui/Logo';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo textSize="text-xl" className="" />
            <span className="text-gray-400 ml-1">Impact News</span>
          </div>
          <div className="text-gray-400">
            &copy; {new Date().getFullYear()} Sentro. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;