import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight, CheckCircle, Quote, Globe, Users, Award } from 'lucide-react';
import TestimonialCard from '../ui/TestimonialCard';

interface Testimonial {
  quote: string;
  author: string;
  title: string;
  avatar: string;
  logo?: string;
  rating?: number; // Out of 5
  tag?: string; // Optional tag like 'Nonprofit Leader'
  location?: string; // Optional location
  featured?: boolean;
}

const ImpactTestimonials: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [expandedTestimonial, setExpandedTestimonial] = useState<Testimonial | null>(null);

  const testimonials: Testimonial[] = [
    {
      quote: "Sentro has revolutionized how our organization tracks emerging social impact initiatives. The impact scores provide crucial context that helps us prioritize our resources for maximum community benefit.",
      author: "Sarah Johnson",
      title: "Sustainability Director, Green Futures Foundation",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      logo: "https://images.unsplash.com/photo-1594608661623-aa0bd3a245a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      rating: 5,
      tag: "Nonprofit Leader",
      location: "Seattle, USA",
      featured: true
    },
    {
      quote: "As an impact investor, staying ahead of sustainability trends is critical for my portfolio. Sentro's AI does the heavy lifting, helping me discover mission-driven opportunities before they become mainstream.",
      author: "Michael Chen",
      title: "Founder, Impact Ventures",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5,
      tag: "Impact Investor",
      location: "Singapore"
    },
    {
      quote: "The personalized impact scoring system genuinely aligns with my values as a community organizer. It surfaces local stories that would otherwise get lost in the noise of mainstream media.",
      author: "Priya Patel",
      title: "Community Engagement Lead",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg",
      rating: 4,
      tag: "Changemaker",
      location: "London, UK" 
    },
    {
      quote: "Our team relies on Sentro to track global climate action initiatives. The platform's ability to surface meaningful stories and quantify their potential impact has transformed our research approach.",
      author: "James Rodriguez",
      title: "Research Director, Climate Solutions Network",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 5,
      tag: "Environmental Advocate",
      location: "Barcelona, Spain"
    },
    {
      quote: "Sentro has become essential to our social enterprise incubator. The actionable insights help our startups stay informed about market trends while remaining focused on their mission and impact.",
      author: "Elena Kowalski",
      title: "CEO, Social Innovation Hub",
      avatar: "https://randomuser.me/api/portraits/women/82.jpg",
      rating: 5,
      tag: "Social Entrepreneur",
      location: "Toronto, Canada" 
    }
  ];

  const handleTestimonialClick = (testimonial: Testimonial) => {
    setExpandedTestimonial(testimonial);
  };

  const handleNext = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 relative" id="testimonials" ref={ref}>
      {/* Background elements */}
      <div className="absolute top-0 left-0 right-0 h-60 bg-gradient-to-b from-blue-900/10 to-transparent -z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-blue-900/10 to-transparent -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              Trusted by Impact Leaders Worldwide
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Changemakers, social entrepreneurs, and purpose-driven leaders rely on Sentro to navigate 
              the information landscape and drive meaningful impact.
            </p>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex justify-center space-x-8 text-gray-400"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              <span>10,000+ users</span>
            </div>
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-400" />
              <span>125+ countries</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
              <span>96% satisfaction</span>
            </div>
          </motion.div>
        </div>
        
        {/* Main Grid Testimonials - for desktop */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              title={testimonial.title}
              avatar={testimonial.avatar}
              index={index}
              isHighlighted={testimonial.featured}
              onClick={() => handleTestimonialClick(testimonial)}
            />
          ))}
        </div>
        
        {/* Carousel Testimonials - for mobile */}
        <div className="md:hidden relative">
          <div className="overflow-hidden relative">
            <motion.div
              className="flex transition-transform"
              animate={{ x: `-${activeTestimonialIndex * 100}%` }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <TestimonialCard
                    quote={testimonial.quote}
                    author={testimonial.author}
                    title={testimonial.title}
                    avatar={testimonial.avatar}
                    index={index}
                    isHighlighted={testimonial.featured}
                    onClick={() => handleTestimonialClick(testimonial)}
                  />
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white"
            >
              <ArrowRight className="h-5 w-5 transform rotate-180" />
            </button>
            
            {/* Pagination dots */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonialIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeTestimonialIndex === index
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Impact Metrics */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/20 rounded-xl p-6 border border-blue-500/30 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
              className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-4"
            >
              <Globe className="h-8 w-8 text-blue-400" />
            </motion.div>
            <h3 className="text-4xl font-bold text-white mb-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                78%
              </motion.span>
            </h3>
            <p className="text-gray-300">of users report making more informed decisions based on Sentro insights</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/40 rounded-xl p-6 border border-blue-500/30 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
              className="w-16 h-16 rounded-full bg-purple-900/50 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-8 w-8 text-purple-400" />
            </motion.div>
            <h3 className="text-4xl font-bold text-white mb-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                3.2M+
              </motion.span>
            </h3>
            <p className="text-gray-300">impact actions taken by our community of changemakers</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-green-900/40 rounded-xl p-6 border border-blue-500/30 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 }}
              className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4"
            >
              <Users className="h-8 w-8 text-green-400" />
            </motion.div>
            <h3 className="text-4xl font-bold text-white mb-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                125+
              </motion.span>
            </h3>
            <p className="text-gray-300">countries with active Sentro users driving positive change</p>
          </div>
        </motion.div>
        
        {/* Featured Story */}
        <motion.div
          className="mt-24 relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/40 to-purple-900/30 border border-blue-500/30"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 p-3 bg-green-500 text-white text-sm font-medium z-10">
            Featured Story
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 relative z-10">
            <div className="space-y-6">
              <div className="flex items-start">
                <Quote className="h-12 w-12 text-blue-500 opacity-40 mr-2 flex-shrink-0" />
                <p className="text-xl text-white leading-relaxed italic">
                  "Sentro helped our organization identify a critical climate initiative in Southeast Asia that aligned perfectly with our mission. We were able to form a strategic partnership that has now impacted over 20,000 community members."
                </p>
              </div>
              
              <div className="flex items-center">
                <img 
                  src="https://randomuser.me/api/portraits/women/28.jpg" 
                  alt="Emma Richardson" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white mr-4" 
                />
                <div>
                  <h4 className="text-white font-medium">Emma Richardson</h4>
                  <p className="text-gray-300">Director of Partnerships, Climate Forward</p>
                  <div className="flex mt-2">
                    {Array(5).fill(null).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Read their full story
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
            </div>
            
            <div className="hidden md:block">
              <div className="relative h-full">
                <img 
                  src="https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                  alt="Climate Forward Team" 
                  className="w-full h-full object-cover rounded-lg shadow-lg border border-white/20" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/90 to-transparent p-4">
                  <div className="flex items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1594608661623-aa0bd3a245a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                      alt="Climate Forward Logo" 
                      className="w-10 h-10 rounded-full bg-white p-1 mr-3" 
                    />
                    <div>
                      <p className="text-white font-medium">Climate Forward</p>
                      <p className="text-gray-300 text-sm">Global Climate Action</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Join Section */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="inline-block px-8 py-5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30">
            <div className="text-xl font-medium text-blue-300 mb-2">Join over 10,000+ impact leaders making informed decisions daily</div>
            <div className="text-gray-300">From nonprofit directors to sustainability professionals, our users save an average of 2 hours daily while making better informed decisions.</div>
            
            <div className="mt-6 flex justify-center">
              <motion.a 
                href="#get-started" 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Impact Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Expanded testimonial modal */}
      <AnimatePresence>
        {expandedTestimonial && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedTestimonial(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-xl p-6 max-w-2xl relative border border-blue-500/30 w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedTestimonial(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-start">
                <Quote className="h-12 w-12 text-blue-500 opacity-40 mr-2 flex-shrink-0" />
                <p className="text-xl text-white leading-relaxed">{expandedTestimonial.quote}</p>
              </div>
              
              <div className="flex items-center mt-8">
                <img
                  src={expandedTestimonial.avatar}
                  alt={expandedTestimonial.author}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 mr-4"
                />
                <div>
                  <h4 className="text-white font-medium">{expandedTestimonial.author}</h4>
                  <p className="text-gray-300">{expandedTestimonial.title}</p>
                  <div className="flex items-center mt-2">
                    {expandedTestimonial.tag && (
                      <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full mr-2">
                        {expandedTestimonial.tag}
                      </span>
                    )}
                    {expandedTestimonial.location && (
                      <span className="text-gray-400 text-xs flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {expandedTestimonial.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ImpactTestimonials;