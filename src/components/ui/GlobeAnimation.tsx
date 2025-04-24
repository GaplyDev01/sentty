import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlobeAnimationProps {
  className?: string;
  size?: number; // Size in pixels
  color?: string;
}

const GlobeAnimation: React.FC<GlobeAnimationProps> = ({ 
  className = '', 
  size = 300,
  color = '#3b82f6' // Blue by default
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = size;
    canvas.height = size;
    
    // Globe parameters
    const radius = size * 0.35;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Arc paths for data flowing around the globe
    const arcPaths = Array(15).fill(0).map(() => ({
      startAngle: Math.random() * Math.PI * 2,
      endAngle: Math.random() * Math.PI * 2,
      radius: radius * (0.9 + Math.random() * 0.3),
      speed: 0.005 + Math.random() * 0.01,
      width: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.4,
      position: Math.random() * Math.PI * 2,
      clockwise: Math.random() > 0.5
    }));
    
    // Points representing news sources/destinations
    const points = Array(20).fill(0).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * 0.8 + (Math.random() * radius * 0.2);
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: 1 + Math.random() * 3,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.02
      };
    });
    
    // Animation function
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the main globe circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}20`; // Very transparent
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw a few longitude/latitude lines
      for (let i = 0; i < 3; i++) {
        // Longitude (vertical circles)
        ctx.beginPath();
        ctx.ellipse(
          centerX, 
          centerY, 
          radius, 
          radius * 0.4, // Flatten for 3D effect
          i * Math.PI / 3, // Rotate
          0, 
          Math.PI * 2
        );
        ctx.strokeStyle = `${color}15`; // Very transparent
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Latitude (horizontal circles)
        ctx.beginPath();
        ctx.ellipse(
          centerX, 
          centerY + (radius * 0.5 - i * radius * 0.5), 
          radius * Math.sqrt(1 - Math.pow((radius * 0.5 - i * radius * 0.5) / radius, 2)), // Calculate radius based on height
          radius * Math.sqrt(1 - Math.pow((radius * 0.5 - i * radius * 0.5) / radius, 2)) * 0.4, // Flatten
          0,
          0, 
          Math.PI * 2
        );
        ctx.stroke();
      }
      
      // Draw flowing arcs
      arcPaths.forEach(arc => {
        // Update position
        arc.position += arc.speed;
        if (arc.position > Math.PI * 2) {
          arc.position = 0;
          
          // Randomize parameters for variety
          arc.startAngle = Math.random() * Math.PI * 2;
          arc.endAngle = arc.startAngle + Math.PI * (0.5 + Math.random() * 0.5);
          arc.opacity = 0.1 + Math.random() * 0.4;
        }
        
        // Draw arc
        const angleLength = Math.abs(arc.endAngle - arc.startAngle);
        const drawLength = angleLength * Math.min(1, arc.position / (Math.PI / 2));
        
        ctx.beginPath();
        ctx.arc(
          centerX, 
          centerY, 
          arc.radius, 
          arc.startAngle, 
          arc.startAngle + drawLength * (arc.clockwise ? 1 : -1)
        );
        ctx.strokeStyle = `${color}${Math.floor(arc.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = arc.width;
        ctx.stroke();
      });
      
      // Draw pulsing points
      points.forEach(point => {
        // Update pulse
        point.pulse += point.pulseSpeed;
        if (point.pulse > Math.PI * 2) point.pulse = 0;
        
        // Calculate size based on pulse
        const pulseSize = point.size * (0.7 + Math.sin(point.pulse) * 0.3);
        
        // Draw point
        ctx.beginPath();
        ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };
    
    // Start animation
    animate();
    
    return () => {
      // No cleanup needed
    };
  }, [size, color]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full"
      />
    </motion.div>
  );
};

export default GlobeAnimation;