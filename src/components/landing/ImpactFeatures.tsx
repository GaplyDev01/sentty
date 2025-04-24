import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Brain, Lightbulb, Shield, Bell, Tag } from 'lucide-react';
import FeatureCard from '../ui/FeatureCard';

const ImpactFeatures: React.FC = () => {
  const features = [
    {
      icon: <LineChart className="h-6 w-6 text-blue-400" />,
      title: "Impact Scoring",
      description: "Every news story is scored based on how it directly affects communities, the environment, and sustainable development goals."
    },
    {
      icon: <Brain className="h-6 w-6 text-indigo-400" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI algorithms analyze news content to extract meaningful insights on social and environmental impact."
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-yellow-400" />,
      title: "Solution Spotlights",
      description: "Discover innovative approaches and successful initiatives driving positive change across sectors and regions."
    },
    {
      icon: <Bell className="h-6 w-6 text-red-400" />,
      title: "Real-time Alerts",
      description: "Receive instant notifications for high-impact news that aligns with your interests and goals for creating change."
    },
    {
      icon: <Tag className="h-6 w-6 text-purple-400" />,
      title: "Curated Impact Feed",
      description: "Your daily news feed is intelligently curated to show stories that can inspire and inform meaningful action."
    },
    {
      icon: <Shield className="h-6 w-6 text-green-400" />,
      title: "Action Recommendations",
      description: "Get personalized suggestions for how to respond to news through donations, volunteering, or amplifying stories."
    }
  ];

  return (
    <section id="features" className="py-20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Our Features</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Explore how Sentro helps you stay informed about the news that drives real change
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            index={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
      
      {/* Subtle motion element in the background */}
      <div className="relative mt-16">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </div>
    </section>
  );
};

export default ImpactFeatures;