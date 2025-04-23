import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current && 
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Handle escape key to close
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      // Restore body scrolling
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Width based on size
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={`relative ${sizeClasses[size]} w-full bg-gray-800/95 rounded-xl shadow-2xl overflow-hidden border border-gray-700/70 max-h-[90vh] flex flex-col`}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with title and close button */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 sticky top-0 z-10">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-700/70 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {/* Content with scroll capability */}
            <div className={`flex-1 overflow-y-auto ${!title ? 'pt-4' : ''} custom-scrollbar`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;