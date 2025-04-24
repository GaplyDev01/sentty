import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CallToAction: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-900/30 to-purple-900/30 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-8 relative z-20"
        >
          <h2 className="text-3xl font-bold">Ready to transform your news experience?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join Sentro today and stay informed with impact news that matters to you and drives positive change.
          </p>
          <div className="relative z-20">
            <Link 
              to="/login?signup=true" 
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg relative z-20"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;