import React from 'react';

type CharacterMood = 'normal' | 'happy' | 'angry' | 'worried' | 'busy';
type CharacterSize = 'xs' | 'sm' | 'md' | 'lg';

interface BossManCharacterProps {
  mood?: CharacterMood;
  size?: CharacterSize;
  className?: string;
}

export const BossManCharacter: React.FC<BossManCharacterProps> = ({ 
  mood = 'normal',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-14 h-14', // Increased size for better visibility
    lg: 'w-20 h-20'  // Increased size for better visibility
  };

  const colors = {
    normal: {
      hat: '#E39932',
      face: '#FFD8B9',
      outline: '#2E3A59',
      hatStroke: '#C48428'
    },
    happy: {
      hat: '#E39932',
      face: '#FFD8B9',
      outline: '#2D8A30',
      hatStroke: '#C48428'
    },
    angry: {
      hat: '#D32F2F',
      face: '#FFCDD2',
      outline: '#B71C1C',
      hatStroke: '#A82222'
    },
    worried: {
      hat: '#E39932',
      face: '#FFD8B9',
      outline: '#E65100',
      hatStroke: '#C48428'
    },
    busy: {
      hat: '#1E88E5',
      face: '#FFD8B9',
      outline: '#2E3A59',
      hatStroke: '#1565C0'
    }
  };

  const getExpressionPath = (characterMood: CharacterMood) => {
    switch (characterMood) {
      case 'happy':
        return "M 10,18 C 15,23 25,23 30,18"; // More pronounced smile
      case 'angry':
        return "M 10,20 C 15,15 25,15 30,20"; // More pronounced frown
      case 'worried':
        return "M 10,20 C 15,17.5 25,17.5 30,20"; // Clearer worried expression
      case 'busy':
        return "M 10,19 L 30,19"; // Straight line
      default:
        return "M 10,19 C 15,20.5 25,20.5 30,19"; // Slight smile
    }
  };

  const getEyesPath = (characterMood: CharacterMood) => {
    if (characterMood === 'angry') {
      return (
        <>
          <path d="M 11,12 L 18,16" stroke={colors[characterMood].outline} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 29,12 L 22,16" stroke={colors[characterMood].outline} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="15" cy="16" r="1.5" fill={colors[characterMood].outline} />
          <circle cx="25" cy="16" r="1.5" fill={colors[characterMood].outline} />
        </>
      );
    } else if (characterMood === 'worried') {
      return (
        <>
          <circle cx="15" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="25" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="15" cy="15" r="1" fill="#fff" />
          <circle cx="25" cy="15" r="1" fill="#fff" />
          <path d="M 11,12 Q 15,10 19,12" stroke={colors[characterMood].outline} strokeWidth="1.5" fill="none" />
          <path d="M 21,12 Q 25,10 29,12" stroke={colors[characterMood].outline} strokeWidth="1.5" fill="none" />
        </>
      );
    } else if (characterMood === 'busy') {
      return (
        <>
          <rect x="12" y="14" width="6" height="2.5" rx="1" fill={colors[characterMood].outline} />
          <rect x="22" y="14" width="6" height="2.5" rx="1" fill={colors[characterMood].outline} />
        </>
      );
    } else if (characterMood === 'happy') {
      return (
        <>
          <circle cx="15" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="25" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="16" cy="14" r="1" fill="#fff" />
          <circle cx="26" cy="14" r="1" fill="#fff" />
        </>
      );
    } else {
      return (
        <>
          <circle cx="15" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="25" cy="15" r="3" fill={colors[characterMood].outline} />
          <circle cx="15.5" cy="14.5" r="1" fill="#fff" />
          <circle cx="25.5" cy="14.5" r="1" fill="#fff" />
        </>
      );
    }
  };

  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className} shadow-md`}>
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        {/* Hard Hat with outline for definition */}
        <path d="M 5,15 A 15,10 0 0,1 35,15 L 35,20 A 15,10 0 0,1 5,20 Z" 
          fill={colors[mood].hat} 
          stroke={colors[mood].hatStroke} 
          strokeWidth="1" />
        <ellipse 
          cx="20" cy="15" rx="15" ry="10" 
          fill={colors[mood].hat} 
          stroke={colors[mood].hatStroke} 
          strokeWidth="1" />
        
        {/* Hat brim highlight */}
        <path d="M 6,15 A 14,9 0 0,1 34,15" 
          stroke="#ffffff" 
          strokeWidth="0.8" 
          fill="none" 
          opacity="0.5" />
        
        {/* Face with subtle shading */}
        <circle 
          cx="20" cy="22" r="12" 
          fill={colors[mood].face} 
          stroke={colors[mood].outline} 
          strokeWidth="0.5" />
        
        {/* Subtle face highlight */}
        <ellipse 
          cx="17" cy="18" rx="8" ry="6" 
          fill="#ffffff" 
          opacity="0.2" />
        
        {/* Eyes */}
        {getEyesPath(mood)}
        
        {/* Mouth with enhanced stroke */}
        <path 
          d={getExpressionPath(mood)} 
          stroke={colors[mood].outline} 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round" />
      </svg>
    </div>
  );
};
