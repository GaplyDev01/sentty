import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import NewsTicker from '../ui/NewsTicker';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <motion.main 
          className="flex-1 p-6 pb-48" /* Added padding at bottom for the ticker */
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.main>
      </div>
      <NewsTicker />
    </div>
  );
};

export default MainLayout;