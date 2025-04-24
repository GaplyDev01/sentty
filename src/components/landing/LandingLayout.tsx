import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import NewsTicker from '../ui/NewsTicker';
import CanvasBackground from '../ui/CanvasBackground';

interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white relative overflow-hidden">
      {/* Canvas background with neon arcs */}
      <CanvasBackground />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-48">
        <Header />
        {children}
      </div>
      
      <Footer />
      <NewsTicker />
    </div>
  );
};

export default LandingLayout;