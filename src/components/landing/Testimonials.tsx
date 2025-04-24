import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  text: string;
  author: string;
  position: string;
  rating: number;
  avatarUrl: string;
}

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      text: "Sentro has transformed how I stay updated on impact-driven initiatives. The AI-powered news ranking accurately surfaces stories I care about most.",
      author: "Alex Thompson",
      position: "Social Impact Investor",
      rating: 5,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=100&ixid=MnwxfDB8MXxyYW5kb218MHx8cGVyc29ufHx8fHx8MTY4NTU0NjY5Nw&ixlib=rb-4.0.3&q=80&w=100"
    },
    {
      text: "The personalized news feed is exactly what I needed as a sustainability professional. It keeps me informed about the latest environmental initiatives and social impact projects.",
      author: "Samantha Chen",
      position: "ESG Program Manager",
      rating: 5,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=100&ixid=MnwxfDB8MXxyYW5kb218MHx8cGVyc29ufHx8fHx8MTY4NTU0NjcyOA&ixlib=rb-4.0.3&q=80&w=100"
    },
    {
      text: "As a nonprofit director, I need to stay on top of community initiatives without spending hours reading articles. Sentro delivers exactly what I need, when I need it.",
      author: "Michael Roberts",
      position: "Executive Director, Community First",
      rating: 4,
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=100&ixid=MnwxfDB8MXxyYW5kb218MHx8YnVzaW5lc3MgbWFufHx8fHx8MTY4NTU0Njc1OQ&ixlib=rb-4.0.3&q=80&w=100"
    }
  ];
  
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Trusted by Impact Leaders
          </motion.h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 relative"
            >
              {/* Quote mark */}
              <div className="absolute top-6 right-6 text-5xl leading-none text-blue-500/20 font-serif">&#8220;</div>
              
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
              
              <p className="text-gray-300 mb-6 relative z-10">"{testimonial.text}"</p>
              
              <div className="flex items-center">
                <img 
                  src={testimonial.avatarUrl} 
                  alt={testimonial.author} 
                  className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-blue-500/30"
                />
                <div>
                  <h4 className="font-medium text-white">{testimonial.author}</h4>
                  <p className="text-sm text-gray-400">{testimonial.position}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;