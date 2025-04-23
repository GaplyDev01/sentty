import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import FeaturesSection from '../components/landing/FeaturesSection';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';
import Divider from '../components/ui/Divider';
import BackgroundGrid from '../components/landing/BackgroundGrid';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <BackgroundGrid zIndex={0} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-48">
          <Header />
          <Hero />
        </div>
        
        {/* Divider */}
        <Divider type="wave" color="text-gray-900" position="bottom" />
      </div>
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* CTA Section */}
      <CallToAction />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;