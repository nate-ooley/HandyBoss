import React from 'react';

// Import the boss man images
import bossManLogoImage from '../assets/bossMan.png';
import bossManAngryImage from '../assets/openart-image_wY2h6muP_1743615518231_raw.jpg';

type BossManMood = 'neutral' | 'happy' | 'angry' | 'confused' | 'excited' | 'concerned';

interface BossManCharacterProps {
  mood?: BossManMood;
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSpeechBubble?: boolean;
}

const BossManCharacter: React.FC<BossManCharacterProps> = ({
  mood = 'neutral',
  message,
  size = 'md',
  className = '',
  showSpeechBubble = true,
}) => {
  // Define size classes
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Choose the appropriate image based on mood
  const getBossManImage = () => {
    switch (mood) {
      case 'angry':
        // For angry mood, use one of the angry expressions
        return bossManAngryImage;
      case 'happy':
      case 'excited': 
      case 'confused':
      case 'concerned':
      case 'neutral':
      default:
        // For now we just use the logo image for other moods
        // Later we can add more character variations
        return bossManLogoImage;
    }
  };

  const bossManImage = getBossManImage();

  return (
    <div className={`flex items-start ${className}`}>
      <div className="relative">
        <div className={`relative ${sizeClasses[size]} overflow-hidden rounded-full bg-orange-100`}>
          <img 
            src={bossManImage} 
            alt={`BossMan (${mood})`} 
            className="object-cover w-full h-full" 
          />
        </div>
        
        {message && showSpeechBubble && (
          <div className="absolute top-0 left-full ml-2 message-bubble border border-gray-300 shadow-md max-w-xs">
            <div className="absolute left-0 top-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-[hsl(var(--light))] border-l border-b border-gray-300"></div>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossManCharacter;