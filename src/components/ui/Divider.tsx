import React from 'react';

interface DividerProps {
  type?: 'wave' | 'curve' | 'angle';
  color?: string;
  position?: 'top' | 'bottom';
  className?: string;
}

const Divider: React.FC<DividerProps> = ({ 
  type = 'wave', 
  color = 'text-gray-900',
  position = 'bottom',
  className = ''
}) => {
  const renderPath = () => {
    switch (type) {
      case 'wave':
        return <path fill="currentColor" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,181.3C1200,160,1320,128,1380,112L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>;
      case 'curve':
        return <path fill="currentColor" fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,218.7C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>;
      case 'angle':
        return <path fill="currentColor" fillOpacity="1" d="M0,320L1440,160L1440,320L0,320Z"></path>;
      default:
        return <path fill="currentColor" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,181.3C1200,160,1320,128,1380,112L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>;
    }
  };

  const transform = position === 'top' ? 'rotate(180deg)' : 'rotate(0)';

  return (
    <div className={`absolute ${position}-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none ${className}`} style={{ transform }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1440 320" 
        className={color}
      >
        {renderPath()}
      </svg>
    </div>
  );
};

export default Divider;