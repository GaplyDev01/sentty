import React from 'react';
import { Cpu } from 'lucide-react';

interface LogoProps {
  textSize?: string;
  iconSize?: number;
  className?: string;
  iconOnly?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  textSize = 'text-xl', 
  iconSize = 24, 
  className = '',
  iconOnly = false
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Cpu className={`text-blue-500`} size={iconSize} />
      
      {!iconOnly && (
        <span className={`ml-2 ${textSize} font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent`}>
          NewsAI
        </span>
      )}
    </div>
  );
};

export default Logo;