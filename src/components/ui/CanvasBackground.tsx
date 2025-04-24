import React, { useRef, useEffect } from 'react';

interface CanvasBackgroundProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  colorScheme?: 'blue' | 'green' | 'purple' | 'mixed';
}

const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ 
  className = '',
  density = 'medium',
  colorScheme = 'mixed'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    // Get density multiplier
    const densityMultiplier = density === 'low' ? 0.6 : density === 'high' ? 1.5 : 1;
    
    // Color schemes
    const colors = {
      blue: ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'],
      green: ['#34D399', '#10B981', '#059669', '#047857'],
      purple: ['#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9'],
      mixed: ['#60A5FA', '#3B82F6', '#8B5CF6', '#6D28D9', '#34D399']
    };
    
    const selectedColors = colors[colorScheme];
    
    // Particle class for animated dots
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      fadeSpeed: number;
      maxSize: number;
      
      constructor(x: number, y: number, directionX: number, directionY: number, initialSize: number) {
        this.x = x;
        this.y = y;
        this.size = initialSize;
        this.maxSize = initialSize;
        this.speedX = directionX * 0.3;
        this.speedY = directionY * 0.3;
        this.color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        this.opacity = 0.05 + Math.random() * 0.2;
        this.fadeSpeed = 0.005 + Math.random() * 0.01;
      }
      
      update() {
        // Move the particle
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        // Pulsate size
        this.size = this.maxSize * (0.7 + Math.sin(Date.now() * 0.001) * 0.3);
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }
    
    // Arc class for animated arcs with enhanced glow
    class Arc {
      x: number;
      y: number;
      radius: number;
      startAngle: number;
      endAngle: number;
      anticlockwise: boolean;
      color: string;
      speed: number;
      progress: number;
      width: number;
      maxProgress: number;
      fadeOutPoint: number;
      glowAmount: number;
      pulse: number;
      
      constructor(x: number, y: number, radius: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = Math.random() * Math.PI * 2;
        this.endAngle = this.startAngle + (0.5 + Math.random() * 1) * Math.PI;
        this.anticlockwise = Math.random() > 0.5;
        
        // Choose from selected colors
        this.color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        
        this.speed = 0.002 + Math.random() * 0.004;
        this.progress = 0;
        this.width = 1 + Math.random() * 3;
        this.maxProgress = 1;
        this.fadeOutPoint = 0.7 + Math.random() * 0.2;
        this.glowAmount = 10 + Math.random() * 15;
        this.pulse = Math.random() * Math.PI * 2; // Random start phase for pulsing
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        // Calculate current angle based on progress
        const currentEndAngle = this.startAngle + (this.endAngle - this.startAngle) * this.progress;
        
        // Update pulse effect
        this.pulse += 0.02;
        const pulseValue = (Math.sin(this.pulse) + 1) * 0.5; // 0 to 1
        
        // Set line style
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width * (0.8 + pulseValue * 0.4);
        ctx.lineCap = 'round';
        
        // Add shadow for enhanced glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.glowAmount * (0.8 + pulseValue * 0.4);
        
        // Calculate opacity - fade in and out smoothly
        let opacity = 1;
        if (this.progress < 0.2) {
          // Fade in during first 20% of animation
          opacity = this.progress / 0.2;
        } else if (this.progress > this.fadeOutPoint) {
          // Fade out during last part of animation
          opacity = 1 - ((this.progress - this.fadeOutPoint) / (1 - this.fadeOutPoint));
        }
        
        // Apply opacity
        ctx.globalAlpha = opacity * 0.7; // Slightly reduced overall opacity for better layering
        
        // Draw arc
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, this.startAngle, currentEndAngle, this.anticlockwise);
        ctx.stroke();
        
        // Reset shadows and global alpha to avoid affecting other drawings
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      
      update() {
        this.progress += this.speed;
        return this.progress < this.maxProgress;
      }
    }
    
    // Connection class for network-like effects
    class Connection {
      from: Particle;
      to: Particle;
      opacity: number;
      color: string;
      life: number;
      maxLife: number;
      width: number;
      
      constructor(from: Particle, to: Particle) {
        this.from = from;
        this.to = to;
        this.opacity = 0.02 + Math.random() * 0.08;
        this.color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        this.life = 0;
        this.maxLife = 100 + Math.random() * 100;
        this.width = 0.5 + Math.random();
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        const distance = Math.sqrt(
          Math.pow(this.from.x - this.to.x, 2) + 
          Math.pow(this.from.y - this.to.y, 2)
        );
        
        // Only draw if within a reasonable distance
        if (distance > 300) return;
        
        // Calculate opacity based on distance and life
        const distanceOpacity = 1 - distance / 300;
        const lifeOpacity = this.life < 20 
          ? this.life / 20 
          : this.life > this.maxLife - 20 
            ? (this.maxLife - this.life) / 20 
            : 1;
        
        const finalOpacity = this.opacity * distanceOpacity * lifeOpacity;
        
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = this.color + Math.floor(finalOpacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = this.width;
        ctx.stroke();
      }
      
      update() {
        this.life++;
        return this.life < this.maxLife;
      }
    }
    
    // Impact ripple effect class
    class ImpactRipple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      color: string;
      opacity: number;
      width: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 100 + Math.random() * 200;
        this.speed = 1 + Math.random() * 2;
        this.color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        this.opacity = 0.3 + Math.random() * 0.3;
        this.width = 1 + Math.random() * 3;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        // Calculate opacity based on radius
        const opacityMultiplier = 1 - (this.radius / this.maxRadius);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color + Math.floor(this.opacity * opacityMultiplier * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = this.width;
        ctx.stroke();
      }
      
      update() {
        this.radius += this.speed;
        return this.radius < this.maxRadius;
      }
    }
    
    // Manage visual elements
    const particles: Particle[] = [];
    const arcs: Arc[] = [];
    const connections: Connection[] = [];
    const impactRipples: ImpactRipple[] = [];
    
    // Initialize particles
    const particleCount = Math.floor(15 * densityMultiplier);
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const directionX = (Math.random() - 0.5) * 2;
      const directionY = (Math.random() - 0.5) * 2;
      particles.push(new Particle(x, y, directionX, directionY, 1.5 + Math.random() * 3));
    }
    
    // Create new arc occasionally
    const createArc = () => {
      const maxArcs = 20 * densityMultiplier;
      if (arcs.length < maxArcs && Math.random() < 0.03) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 50 + Math.random() * 200;
        arcs.push(new Arc(x, y, radius));
      }
    };
    
    // Create new connections between particles
    const createConnections = () => {
      if (connections.length > 30 * densityMultiplier) return;
      
      if (Math.random() < 0.05) {
        const fromIndex = Math.floor(Math.random() * particles.length);
        let toIndex;
        do {
          toIndex = Math.floor(Math.random() * particles.length);
        } while (toIndex === fromIndex);
        
        connections.push(new Connection(particles[fromIndex], particles[toIndex]));
      }
    };
    
    // Create impact ripples occasionally
    const createImpactRipple = () => {
      if (impactRipples.length < 5 * densityMultiplier && Math.random() < 0.01) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        impactRipples.push(new ImpactRipple(x, y));
      }
    };
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add new elements occasionally
      createArc();
      createConnections();
      createImpactRipple();
      
      // Update and draw impact ripples
      for (let i = impactRipples.length - 1; i >= 0; i--) {
        const ripple = impactRipples[i];
        const active = ripple.update();
        
        if (active) {
          ripple.draw(ctx);
        } else {
          impactRipples.splice(i, 1);
        }
      }
      
      // Update and draw arcs
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i];
        const active = arc.update();
        
        if (active) {
          arc.draw(ctx);
        } else {
          arcs.splice(i, 1);
        }
      }
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Update and draw connections
      for (let i = connections.length - 1; i >= 0; i--) {
        const connection = connections[i];
        const active = connection.update();
        
        if (active) {
          connection.draw(ctx);
        } else {
          connections.splice(i, 1);
        }
      }
    };
    
    animate();
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [density, colorScheme]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ opacity: 0.8 }}
    />
  );
};

export default CanvasBackground;