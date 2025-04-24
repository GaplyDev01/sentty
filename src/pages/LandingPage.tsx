import React from 'react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingHero from '../components/landing/LandingHero';
import ImpactFeatures from '../components/landing/ImpactFeatures';
import ImpactDashboard from '../components/landing/ImpactDashboard';
import HowItWorks from '../components/landing/HowItWorks';
import ImpactTestimonials from '../components/landing/ImpactTestimonials';
import ImpactCta from '../components/landing/ImpactCta';

const LandingPage: React.FC = () => {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-transparent opacity-30 pointer-events-none"></div>
        <LandingHero />
      </div>
      
      {/* Features Grid Section */}
      <div className="mb-24">
        <ImpactFeatures />
      </div>
      
      {/* Personal Impact Score Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32">
        <div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Your Personal Impact Score
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Sentro's proprietary Impact Score quantifies how each news story affects your specific circumstances. Say goodbye to information overload and focus on what truly matters to you.
          </p>
        </div>
        <ImpactDashboard />
      </div>
      
      {/* How It Works Section */}
      <div className="mb-24">
        <HowItWorks />
      </div>
      
      {/* Testimonials Section */}
      <div className="mb-24">
        <ImpactTestimonials />
      </div>
      
      {/* CTA Section */}
      <div className="mb-24">
        <ImpactCta />
      </div>
    </LandingLayout>
  );
};

export default LandingPage;