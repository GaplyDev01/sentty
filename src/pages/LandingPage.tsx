import React from 'react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingHero from '../components/landing/LandingHero';
import ImpactFeatures from '../components/landing/ImpactFeatures';
import ImpactDashboard from '../components/landing/ImpactDashboard';
import HowItWorks from '../components/landing/HowItWorks';
import ImpactTestimonials from '../components/landing/ImpactTestimonials';
import ImpactCta from '../components/landing/ImpactCta';
import CanvasBackground from '../components/ui/CanvasBackground';
import FloatingParticles from '../components/ui/FloatingParticles';
import GlobeAnimation from '../components/ui/GlobeAnimation';

const LandingPage: React.FC = () => {
  return (
    <LandingLayout>
      {/* Canvas background with neon arcs */}
      <CanvasBackground />
      
      {/* Floating particles for additional depth */}
      <FloatingParticles count={30} opacity={0.2} speed={0.8} />
      
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute -top-20 -right-20 opacity-20 pointer-events-none">
          <GlobeAnimation size={500} />
        </div>
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
            Sentro's proprietary Impact Score quantifies how each news story affects causes and communities you care about. Say goodbye to information overload and focus on news that drives positive change.
          </p>
        </div>
        <ImpactDashboard />
      </div>
      
      {/* How It Works Section */}
      <div className="mb-24 relative">
        <div className="absolute -bottom-40 -left-40 opacity-20 pointer-events-none">
          <GlobeAnimation size={400} color="#a855f7" />
        </div>
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