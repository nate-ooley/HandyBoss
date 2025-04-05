import React from 'react';
import bossManExpressions from '../assets/boss-man-expressions.jpg';

type CharacterMood = 'angry' | 'shouting' | 'raging' | 'yelling' | 'phoneAngry' | 'phoneRaging';
type CharacterSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BossManImageProps {
  mood?: CharacterMood;
  size?: CharacterSize;
  className?: string;
  withSpeechBubble?: boolean;
  speechText?: string;
}

export const BossManImage: React.FC<BossManImageProps> = ({ 
  mood = 'angry',
  size = 'md',
  className = '',
  withSpeechBubble = false,
  speechText = ''
}) => {
  const sizeClasses = {
    xs: 'w-12 h-12',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
    '2xl': 'w-48 h-48'
  };

  // These coordinates map to the positions of the different expressions in the image
  const moodCoordinates: Record<CharacterMood, {row: number, col: number}> = {
    angry: { row: 0, col: 0 },      // Top-left expression
    shouting: { row: 0, col: 1 },   // Top-middle expression
    raging: { row: 0, col: 2 },     // Top-right expression
    yelling: { row: 1, col: 0 },    // Bottom-left expression
    phoneAngry: { row: 1, col: 1 }, // Bottom-middle expression (with phone)
    phoneRaging: { row: 1, col: 2 } // Bottom-right expression (with phone)
  };

  const { row, col } = moodCoordinates[mood];
  
  // Calculate the background position percentages for the CSS
  const bgPosX = col * 50; // There are 3 columns, each taking up 33.33% of the width
  const bgPosY = row * 50; // There are 2 rows, each taking up 50% of the height

  return (
    <div className={`relative ${withSpeechBubble ? 'mb-6' : ''} ${className}`}>
      {/* Speech bubble if needed */}
      {withSpeechBubble && speechText && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
          bg-white text-primary font-bold rounded-2xl p-3 text-sm max-w-xs
          border-2 border-primary shadow-lg z-10 speech-bubble">
          {speechText}
        </div>
      )}
      
      {/* Character image container */}
      <div 
        className={`${sizeClasses[size]} relative overflow-hidden`}
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Actual character image with cropping based on mood */}
        <div 
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${bossManExpressions})`,
            backgroundPosition: `${col * 50}% ${row * 50}%`,
            backgroundSize: '300% 200%', // 3 columns, 2 rows
            transform: 'scale(1.1)', // Slightly scale up to trim the edges
          }}
        />
      </div>
    </div>
  );
};