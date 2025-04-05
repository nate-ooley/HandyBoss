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
  // Size classes
  const getSizeClass = (characterSize: CharacterSize): string => {
    switch (characterSize) {
      case 'xs': return 'w-16 h-16';
      case 'sm': return 'w-24 h-24';
      case 'md': return 'w-32 h-32';
      case 'lg': return 'w-48 h-48';
      default: return 'w-32 h-32';
    }
  };

  // Character color based on mood
  const getMoodColor = (characterMood: CharacterMood): string => {
    switch (characterMood) {
      case 'normal': return '#E57373'; // Light red
      case 'happy': return '#81C784';  // Green
      case 'angry': return '#D32F2F';  // Dark red
      case 'worried': return '#FFD54F'; // Yellow
      case 'busy': return '#7986CB';   // Blue
      default: return '#E57373';       // Default light red
    }
  };

  // Get facial expression path based on mood
  const getExpressionPath = (characterMood: CharacterMood) => {
    switch (characterMood) {
      case 'normal':
        return (
          <path 
            d="M18,18 C20,22 28,22 30,18" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
        );
      case 'happy':
        return (
          <path 
            d="M18,17 C20,21 28,21 30,17" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
        );
      case 'angry':
        return (
          <path 
            d="M18,20 C20,18 28,18 30,20" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
        );
      case 'worried':
        return (
          <path 
            d="M18,21 C20,19 28,19 30,21" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
        );
      case 'busy':
        return (
          <line 
            x1="18" 
            y1="19" 
            x2="30" 
            y2="19" 
            stroke="black" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        );
      default:
        return (
          <path 
            d="M18,18 C20,22 28,22 30,18" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
        );
    }
  };

  // Get eyes based on mood
  const getEyesPath = (characterMood: CharacterMood) => {
    switch (characterMood) {
      case 'normal':
        return (
          <>
            <circle cx="15" cy="15" r="2" fill="black" />
            <circle cx="33" cy="15" r="2" fill="black" />
          </>
        );
      case 'happy':
        return (
          <>
            <path 
              d="M13,15 C13,13 17,13 17,15" 
              stroke="black" 
              strokeWidth="1.5" 
              fill="none"
            />
            <path 
              d="M31,15 C31,13 35,13 35,15" 
              stroke="black" 
              strokeWidth="1.5" 
              fill="none"
            />
          </>
        );
      case 'angry':
        return (
          <>
            <circle cx="15" cy="15" r="2" fill="black" />
            <circle cx="33" cy="15" r="2" fill="black" />
            <line x1="12" y1="12" x2="18" y2="14" stroke="black" strokeWidth="1.5" />
            <line x1="30" y1="14" x2="36" y2="12" stroke="black" strokeWidth="1.5" />
          </>
        );
      case 'worried':
        return (
          <>
            <circle cx="15" cy="15" r="2" fill="black" />
            <circle cx="33" cy="15" r="2" fill="black" />
            <line x1="12" y1="14" x2="18" y2="12" stroke="black" strokeWidth="1.5" />
            <line x1="30" y1="12" x2="36" y2="14" stroke="black" strokeWidth="1.5" />
          </>
        );
      case 'busy':
        return (
          <>
            <line x1="13" y1="15" x2="17" y2="15" stroke="black" strokeWidth="2" />
            <line x1="31" y1="15" x2="35" y2="15" stroke="black" strokeWidth="2" />
          </>
        );
      default:
        return (
          <>
            <circle cx="15" cy="15" r="2" fill="black" />
            <circle cx="33" cy="15" r="2" fill="black" />
          </>
        );
    }
  };

  return (
    <div className={`${getSizeClass(size)} ${className}`}>
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="24" cy="24" r="20" fill={getMoodColor(mood)} />
        
        {/* Face */}
        <circle cx="24" cy="24" r="18" fill="#FFCCBC" />
        
        {/* Hard hat */}
        <path 
          d="M8,16 C8,10 16,4 24,4 C32,4 40,10 40,16" 
          fill="#FFB74D" 
          stroke="#F57C00" 
          strokeWidth="1"
        />
        <path 
          d="M5,16 L43,16" 
          stroke="#F57C00" 
          strokeWidth="2"
        />
        
        {/* Eyes */}
        {getEyesPath(mood)}
        
        {/* Mouth */}
        {getExpressionPath(mood)}

        {/* Nose */}
        <path 
          d="M24,17 L26,24" 
          stroke="black" 
          strokeWidth="1.5" 
          fill="none" 
        />
      </svg>
    </div>
  );
};