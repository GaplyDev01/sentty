import React from 'react';
import { motion } from 'framer-motion';
import TestimonialCard from '../ui/TestimonialCard';

const ImpactTestimonials: React.FC = () => {
  const testimonials = [
    {
      quote: "Sentro has completely transformed how I consume financial news. The impact scores help me immediately understand which stories deserve my attention, saving me hours each day.",
      author: "Sarah Johnson",
      title: "Investment Analyst, Goldman Sachs",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      quote: "As a blockchain entrepreneur, staying on top of market changes is critical. Sentro's predictive insights have helped me make strategic decisions ahead of market movements multiple times.",
      author: "Michael Chen",
      title: "Founder, BlockChain Ventures",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      quote: "The personalized impact scoring is unlike anything I've seen before. It's like having a financial advisor and news curator in one elegant platform. Worth every penny.",
      author: "Priya Patel",
      title: "Tech Investment Director",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg"
    }
  ];

  return (
    <section className="py-20" id="testimonials">
      <motion.h2 
        className="text-3xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        What Our Users Are Saying
      </motion.h2>
      
      <div className="max-w-7xl mx-auto">
        <motion.p 
          className="text-center text-gray-300 mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Professionals and investors around the world trust Sentro to navigate the complex
          landscape of news and market insights.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              title={testimonial.title}
              avatar={testimonial.avatar}
              index={index}
              isHighlighted={index === 1}
            />
          ))}
        </div>
      </div>
      
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30">
          <div className="text-blue-300">Join over 2,000+ professionals getting personalized news insights daily</div>
          <div className="text-sm text-gray-400 mt-1">From Wall Street analysts to blockchain developers, our users save an average of 2 hours daily while making better informed decisions.</div>
        </div>
      </motion.div>
    </section>
  );
};

export default ImpactTestimonials;