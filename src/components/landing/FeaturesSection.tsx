import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Globe as GlobeHemisphereWest, Zap, Shield, Users, Lightbulb } from 'lucide-react';
import Feature from './Feature';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <BarChart2 className="h-8 w-8 text-blue-500" />,
      title: "Impact-Focused Content",
      description: "Our algorithm prioritizes news that has real impact on communities, businesses, and social causes."
    },
    {
      icon: <GlobeHemisphereWest className="h-8 w-8 text-purple-500" />,
      title: "Global Perspective",
      description: "Aggregate impactful stories from diverse sources for a comprehensive view of global developments."
    },
    {
      icon: <Zap className="h-8 w-8 text-green-500" />,
      title: "Real-Time Updates",
      description: "Fresh stories delivered every 15 minutes to keep you informed on fast-changing developments."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Personalized Filters",
      description: "Define your impact interests to filter out noise and focus on stories that matter to you."
    },
    {
      icon: <Users className="h-8 w-8 text-yellow-500" />,
      title: "Community Focus",
      description: "Specialized for changemakers, social entrepreneurs, executives, and community leaders."
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-indigo-500" />,
      title: "Actionable Insights",
      description: "Stories that inspire action and provide practical takeaways for real-world impact."
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
            <h2 className="text-3xl font-bold mb-4">Impactful. Relevant. Actionable.</h2>
            <p className="text-xl text-gray-300">
              Designed for individuals and organizations who need news that drives positive change and informed action.
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