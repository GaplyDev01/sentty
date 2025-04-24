import React from 'react';
import { motion } from 'framer-motion';
import { User, Search, Brain, LineChart, Database } from 'lucide-react';
import ProcessStep from '../ui/ProcessStep';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <User className="h-8 w-8 text-blue-400" />,
      title: "1. Create Your Profile",
      description: "Set up your profile with your career details, investment portfolio, and personal interests to tailor your experience."
    },
    {
      icon: <Search className="h-8 w-8 text-green-400" />,
      title: "2. AI News Gathering",
      description: "Our AI continuously monitors thousands of news sources to collect relevant information in real-time."
    },
    {
      icon: <Brain className="h-8 w-8 text-yellow-400" />,
      title: "3. Personalized Analysis",
      description: "Advanced algorithms analyze how each story impacts your specific circumstances and priorities."
    },
    {
      icon: <LineChart className="h-8 w-8 text-purple-400" />,
      title: "4. Impact Scoring",
      description: "Each news item receives an impact score from 1-100 based on its relevance and potential effect on you."
    },
    {
      icon: <Database className="h-8 w-8 text-cyan-400" />,
      title: "5. Actionable Insights",
      description: "Receive tailored recommendations to help you respond to news in ways that benefit your financial and career goals."
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="text-center mb-12">
        <motion.h2
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How Sentro Works
        </motion.h2>
        <motion.p
          className="text-gray-300 text-xl max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our innovative platform uses AI and blockchain technologies to transform how you 
          consume news. Here's the step-by-step process behind our impact scoring system.
        </motion.p>
      </div>

      <div className="relative">
        {/* Background process line/trail */}
        <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-900/30 hidden lg:block"></div>
        
        {/* Process steps */}
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <ProcessStep 
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              index={index}
              isActive={index === 2} // Make the third step active for visual interest
            />
          ))}
        </div>
      </div>
      
      <div className="text-center mt-16">
        <motion.a
          href="#get-started"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Experience Sentro Today
        </motion.a>
      </div>
    </section>
  );
};

export default HowItWorks;