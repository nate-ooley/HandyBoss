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
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colors = {
    normal: {
      hat: '#F5A742',
      face: '#FFD8B9',
      outline: '#2E3A59'
    },
    happy: {
      hat: '#F5A742',
      face: '#FFD8B9',
      outline: '#4CAF50'
    },
    angry: {
      hat: '#F44336',
      face: '#FFCDD2',
      outline: '#B71C1C'
    },
    worried: {
      hat: '#F5A742',
      face: '#FFD8B9',
      outline: '#FF9800'
    },
    busy: {
      hat: '#4C9BE5',
      face: '#FFD8B9',
      outline: '#2E3A59'
    }
  };

  const getExpressionPath = (characterMood: CharacterMood) => {
    switch (characterMood) {
      case 'happy':
        return "M 10,18 C 15,22 25,22 30,18"; // Smile
      case 'angry':
        return "M 10,20 C 15,16 25,16 30,20"; // Frown
      case 'worried':
        return "M 10,20 C 15,18 25,18 30,20"; // Slight frown
      case 'busy':
        return "M 10,19 L 30,19"; // Straight line
      default:
        return "M 10,19 C 15,20 25,20 30,19"; // Slight smile
    }
  };

  const getEyesPath = (characterMood: CharacterMood) => {
    if (characterMood === 'angry') {
      return (
        <>
          <path d="M 12,13 L 18,16" stroke={colors[characterMood].outline} strokeWidth="2" strokeLinecap="round" />
          <path d="M 28,13 L 22,16" stroke={colors[characterMood].outline} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    } else if (characterMood === 'worried') {
      return (
        <>
          <circle cx="15" cy="15" r="2.5" fill={colors[characterMood].outline} />
          <circle cx="25" cy="15" r="2.5" fill={colors[characterMood].outline} />
          <path d="M 12,13 Q 15,11 18,13" stroke={colors[characterMood].outline} strokeWidth="1" fill="none" />
          <path d="M 22,13 Q 25,11 28,13" stroke={colors[characterMood].outline} strokeWidth="1" fill="none" />
        </>
      );
    } else if (characterMood === 'busy') {
      return (
        <>
          <rect x="12" y="14" width="6" height="2" fill={colors[characterMood].outline} />
          <rect x="22" y="14" width="6" height="2" fill={colors[characterMood].outline} />
        </>
      );
    } else {
      return (
        <>
          <circle cx="15" cy="15" r="2.5" fill={colors[characterMood].outline} />
          <circle cx="25" cy="15" r="2.5" fill={colors[characterMood].outline} />
        </>
      );
    }
  };

  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        {/* Hard Hat */}
        <path d="M 5,15 A 15,10 0 0,1 35,15 L 35,20 A 15,10 0 0,1 5,20 Z" fill={colors[mood].hat} />
        <ellipse cx="20" cy="15" rx="15" ry="10" fill={colors[mood].hat} />
        
        {/* Face */}
        <circle cx="20" cy="22" r="12" fill={colors[mood].face} />
        
        {/* Eyes */}
        {getEyesPath(mood)}
        
        {/* Mouth */}
        <path d={getExpressionPath(mood)} stroke={colors[mood].outline} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};
