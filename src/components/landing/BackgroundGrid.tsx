import React from 'react';

interface BackgroundGridProps {
  opacity?: number;
  size?: string;
  className?: string;
  zIndex?: number;
}

const BackgroundGrid: React.FC<BackgroundGridProps> = ({ 
  opacity = 0.05, 
  size = '20px',
  className = '',
  zIndex = 0
}) => {
  return (
    <div 
      className={`absolute inset-0 bg-grid-white pointer-events-none ${className}`} 
      style={{ 
        opacity: opacity, 
        backgroundSize: size,
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        zIndex: zIndex
      }}
    ></div>
  );
};

export default BackgroundGrid;