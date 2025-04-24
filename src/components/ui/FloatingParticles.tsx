import React, { useRef, useEffect } from 'react';

interface FloatingParticlesProps {
  className?: string;
  particleColor?: string;
  count?: number;
  speed?: number;
  opacity?: number;
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  className = '',
  particleColor = '#3b82f6', // Default blue
  count = 50,
  speed = 1,
  opacity = 0.3
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full size of container
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    // Particle class
    class Particle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * speed * 0.3;
        this.speedY = (Math.random() - 0.5) * speed * 0.3;
        
        // Create color with specified opacity
        const hexOpacity = Math.floor(opacity * 255).toString(16).padStart(2, '0');
        this.color = `${particleColor}${hexOpacity}`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
    
    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Clear with transparent background for subtle trails
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw all particles
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      
      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only connect particles within a certain distance
          if (distance < 100) {
            // Make connection more transparent with distance
            const alpha = (1 - distance / 100) * opacity * 0.5;
            const hexAlpha = Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `${particleColor}${hexAlpha}`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [particleColor, count, speed, opacity]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full -z-10 ${className}`}
    />
  );
};

export default FloatingParticles;