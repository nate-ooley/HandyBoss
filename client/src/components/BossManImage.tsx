import React from 'react';
import bossManExpressions from '../assets/boss-man-expressions.jpg';

// Focusing more on the phone expressions as requested
type CharacterMood = 'phoneAngry' | 'phoneRaging' | 'angry' | 'shouting' | 'raging' | 'yelling';
type CharacterSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BossManImageProps {
  mood?: CharacterMood;
  size?: CharacterSize;
  className?: string;
  withSpeechBubble?: boolean;
  speechText?: string;
}

export const BossManImage: React.FC<BossManImageProps> = ({ 
  mood = 'phoneAngry', // Default to phone expression
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

  // Precise coordinates for better centering
  // Format: [column, row, offsetX%, offsetY%, scale]
  const moodDetails: Record<CharacterMood, [number, number, number, number, number]> = {
    // Bottom row - phone expressions (prioritized)
    phoneAngry: [1, 1, 0, -5, 1.2],  // Center column, bottom row - angry with phone
    phoneRaging: [2, 1, 0, -5, 1.2], // Right column, bottom row - raging with phone
    
    // Top row expressions
    angry: [0, 0, 0, -2, 1.15],      // Left column, top row
    shouting: [1, 0, 0, 0, 1.15],    // Center column, top row
    raging: [2, 0, 0, -2, 1.15],     // Right column, top row
    
    // Bottom row - non-phone expression
    yelling: [0, 1, 0, -5, 1.2]      // Left column, bottom row
  };

  const [col, row, offsetX, offsetY, scale] = moodDetails[mood];
  
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
        className={`${sizeClasses[size]} relative overflow-hidden rounded-full`}
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Actual character image with precise cropping based on mood */}
        <div 
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${bossManExpressions})`,
            backgroundPosition: `${col * 33.33 + offsetX}% ${row * 50 + offsetY}%`,
            backgroundSize: '300% 200%', // 3 columns, 2 rows
            transform: `scale(${scale})`, // Adjusted scale factor per expression
          }}
        />
      </div>
    </div>
  );
};