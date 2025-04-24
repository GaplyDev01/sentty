import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { User, Search, Brain, LineChart, Database, Award, ExternalLink, ArrowRight, Lightbulb, Shield } from 'lucide-react';
import ProcessStep from '../ui/ProcessStep';
import ScrollingFeatureCarousel from '../ui/ScrollingFeatureCarousel';

const HowItWorks: React.FC = () => {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  
  const steps = [
    {
      icon: <User className="h-8 w-8 text-blue-400" />,
      title: "1. Create Your Impact Profile",
      description: "Share your values, interests, and impact goals to tailor your experience. Sentro learns what matters to you—from environmental justice to social change initiatives.",
      details: [
        "Personalized onboarding process",
        "SDG focus selection",
        "Community and region settings",
        "Impact preference calibration"
      ],
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      icon: <Search className="h-8 w-8 text-green-400" />,
      title: "2. AI-Powered News Discovery",
      description: "Our advanced AI continuously monitors thousands of verified news sources, identifying stories with meaningful impact potential across communities and causes worldwide.",
      details: [
        "24/7 source monitoring across 125+ countries",
        "Real-time semantic analysis",
        "Multi-language content processing",
        "Source credibility verification"
      ],
      image: "https://images.unsplash.com/photo-1599658880436-c61792e70672?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      icon: <Brain className="h-8 w-8 text-yellow-400" />,
      title: "3. Contextual Impact Analysis",
      description: "Each story is analyzed through the lens of your values. Our proprietary algorithms evaluate how news items relate to social progress, environmental health, and community development.",
      details: [
        "Multi-dimensional impact evaluation",
        "Contextual relevance mapping",
        "Value alignment assessment",
        "Sentiment and tone analysis"
      ],
      image: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      icon: <LineChart className="h-8 w-8 text-purple-400" />,
      title: "4. Personal Impact Scoring",
      description: "Sentro quantifies the potential impact of each news item specifically for you, scoring articles from 1-100 based on relevance to your goals and potential for meaningful change.",
      details: [
        "Personalized relevance algorithms",
        "Impact probability assessment",
        "Actionability scoring",
        "Temporal relevance tracking"
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      icon: <Database className="h-8 w-8 text-cyan-400" />,
      title: "5. Actionable Intelligence",
      description: "Transform news into action with tailored recommendations that help you engage, contribute, and amplify stories aligned with your impact goals.",
      details: [
        "Direct action opportunities",
        "Contribution pathways",
        "Social amplification strategies",
        "Collaboration suggestions"
      ],
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      icon: <Award className="h-8 w-8 text-indigo-400" />,
      title: "6. Measurable Progress Tracking",
      description: "Track your engagement, measure your influence, and visualize your contribution to causes you care about through comprehensive impact dashboards.",
      details: [
        "Personal impact analytics",
        "Contribution visualization",
        "Progress tracking over time",
        "Community impact benchmarking"
      ],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
  ];

  const handleStepClick = (index: number) => {
    setSelectedStepIndex(index);
  };

  return (
    <section id="how-it-works" className="py-24" ref={containerRef}>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            className="text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            How Sentro Transforms Your News Experience
          </motion.h2>
          <motion.p
            className="text-gray-300 text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our innovative platform uses AI and advanced technologies to deliver news that inspires action 
            and drives meaningful change for the causes you care about.
          </motion.p>
        </div>

        {/* Interactive Process Flow for Large Screens */}
        <div className="hidden lg:block relative">
          {/* Glowing gradient line connecting the steps */}
          <div className="absolute top-[8rem] left-0 right-0 h-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 rounded-full">
            <motion.div 
              className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" 
              animate={{
                opacity: [0.3, 0.7, 0.3],
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
          
          {/* Step tabs */}
          <div className="grid grid-cols-6 gap-4">
            {steps.map((step, index) => (
              <div
                key={`step-tab-${index}`}
                className="flex flex-col items-center"
              >
                <button
                  onClick={() => handleStepClick(index)}
                  className={`relative p-4 ${selectedStepIndex === index ? 'bg-blue-600' : 'bg-gray-800/50'} rounded-full transition-colors duration-300 mb-4 z-10`}
                >
                  {/* Glowing effect for selected step */}
                  {selectedStepIndex === index && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-500/50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="relative z-10">{step.icon}</div>
                </button>
                <h4 className={`text-sm font-medium text-center ${selectedStepIndex === index ? 'text-blue-400' : 'text-gray-400'} transition-colors duration-300`}>
                  {step.title.split('. ')[1]}
                </h4>
              </div>
            ))}
          </div>
          
          {/* Selected step details */}
          <motion.div 
            key={`step-detail-${selectedStepIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mt-12 grid grid-cols-5 gap-8 items-center"
          >
            <div className="col-span-3 space-y-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-900/40 rounded-lg mr-4">
                  {steps[selectedStepIndex].icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{steps[selectedStepIndex].title}</h3>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                {steps[selectedStepIndex].description}
              </p>
              <ul className="grid grid-cols-2 gap-3">
                {steps[selectedStepIndex].details.map((detail, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                    {detail}
                  </li>
                ))}
              </ul>
              
              {/* CTA for this step */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="#get-started" className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300 group">
                  Learn how to get started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </div>
            
            {/* Step image */}
            <div className="col-span-2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-xl blur-xl"></div>
              <motion.div 
                className="relative rounded-xl overflow-hidden border border-blue-500/30 shadow-lg aspect-[4/3]"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src={steps[selectedStepIndex].image} 
                  alt={steps[selectedStepIndex].title} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Mobile & Tablet Carousel View */}
        <div className="block lg:hidden py-8">
          <ScrollingFeatureCarousel />
        </div>
      </div>
      
      {/* Stats & Features Section */}
      <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-900/30 to-blue-700/20 rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="p-3 bg-blue-900/40 rounded-lg inline-block mb-4">
              <Lightbulb className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">15,000+</h3>
            <p className="text-gray-300">News sources monitored in real-time across 125+ countries</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-900/30 to-purple-900/40 rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="p-3 bg-blue-900/40 rounded-lg inline-block mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">92%</h3>
            <p className="text-gray-300">Accuracy in identifying impact-focused news that aligns with user values</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-green-900/30 to-green-900/40 rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="p-3 bg-blue-900/40 rounded-lg inline-block mb-4">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">3.5M+</h3>
            <p className="text-gray-300">Impact actions taken by our users resulting in meaningful change</p>
          </motion.div>
        </div>
      </div>
      
      <div className="text-center mt-20 max-w-2xl mx-auto px-4">
        <motion.a
          href="#get-started"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg transition-colors group relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 25px 5px rgba(37, 99, 235, 0.5)" // Glowing effect on hover
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background shimmer effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent -z-10"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.5, 
              ease: "linear",
              repeatDelay: 1
            }}
          />
          
          Experience Sentro Today
          <ExternalLink className="ml-2 h-5 w-5" />
        </motion.a>
        
        <motion.p 
          className="text-gray-400 mt-4 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Join 10,000+ impact leaders transforming how they engage with world-changing news
        </motion.p>
      </div>
    </section>
  );
};

export default HowItWorks;