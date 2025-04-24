import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Brain, LightbulbIcon, Shield, Bell, Tag } from 'lucide-react';
import FeatureCard from '../ui/FeatureCard';

const ImpactFeatures: React.FC = () => {
  const features = [
    {
      icon: <LineChart className="h-6 w-6 text-blue-400" />,
      title: "Personal Impact Scoring",
      description: "Every news story is scored based on how it directly impacts your career, investments, and personal interests."
    },
    {
      icon: <Brain className="h-6 w-6 text-indigo-400" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI algorithms analyze news content to extract meaningful insights tailored to your specific situation."
    },
    {
      icon: <LightbulbIcon className="h-6 w-6 text-yellow-400" />,
      title: "Market Impact Predictions",
      description: "Understand how news will affect your investments with blockchain-focused market predictions."
    },
    {
      icon: <Bell className="h-6 w-6 text-red-400" />,
      title: "Real-time Alerts",
      description: "Receive instant notifications for high-impact news that requires your immediate attention."
    },
    {
      icon: <Tag className="h-6 w-6 text-purple-400" />,
      title: "Curated News Feed",
      description: "Your daily news feed is intelligently curated to show you what matters most to you."
    },
    {
      icon: <Shield className="h-6 w-6 text-green-400" />,
      title: "Proactive Planning",
      description: "Get actionable recommendations to mitigate risk and capitalize on opportunities from breaking news."
    }
  ];

  return (
    <section className="py-20">
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
    </section>
  );
};

export default ImpactFeatures;