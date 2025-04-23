import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Clock, Users } from 'lucide-react';

const HeroStats: React.FC = () => {
  const stats = [
    {
      icon: <BarChart className="h-5 w-5 text-blue-400" />,
      value: "100+",
      label: "News Sources"
    },
    {
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      value: "15min",
      label: "Update Frequency"
    },
    {
      icon: <Users className="h-5 w-5 text-green-400" />,
      value: "10k+",
      label: "Active Users"
    }
  ];

  return (
    <div className="py-4 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
          className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50"
        >
          <div className="p-2 rounded-md bg-gray-700/50">
            {stat.icon}
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HeroStats;