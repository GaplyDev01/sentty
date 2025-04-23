import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Globe, Zap, Shield, Users, Cpu } from 'lucide-react';
import Feature from './Feature';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <BarChart2 className="h-8 w-8 text-blue-500" />,
      title: "AI-Powered Relevance",
      description: "Our algorithm learns your preferences and ranks news based on what matters most to you."
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-500" />,
      title: "Multiple Sources",
      description: "Aggregate trending news from diverse sources for a comprehensive information landscape."
    },
    {
      icon: <Zap className="h-8 w-8 text-green-500" />,
      title: "Real-Time Updates",
      description: "Fresh news delivered every 15 minutes to keep you on top of rapidly changing markets."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Personalized Filters",
      description: "Define your criteria during onboarding to filter out noise and focus on what's important."
    },
    {
      icon: <Users className="h-8 w-8 text-yellow-500" />,
      title: "Industry Focused",
      description: "Specialized for traders, Web3 professionals, executives, and market analysts."
    },
    {
      icon: <Cpu className="h-8 w-8 text-indigo-500" />,
      title: "Smart Dashboard",
      description: "Intuitive interface that adapts to your usage patterns and information needs."
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-900 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Intelligent. Tailored. Powerful.</h2>
            <p className="text-xl text-gray-300">
              Designed for professionals who need accurate, relevant news without the noise.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;