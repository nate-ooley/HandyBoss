import React from 'react';
import bossManImage from '@assets/openart-image_wY2h6muP_1743615518231_raw.jpg';

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
  mood = 'angry', 
  size = 'md', 
  className = '',
  withSpeechBubble = false,
  speechText = ''
}) => {
  const getSizeClass = (characterSize: CharacterSize): string => {
    switch (characterSize) {
      case 'xs': return 'w-16 h-16';
      case 'sm': return 'w-24 h-24';
      case 'md': return 'w-32 h-32';
      case 'lg': return 'w-48 h-48';
      case 'xl': return 'w-64 h-64';
      case '2xl': return 'w-96 h-96';
      default: return 'w-32 h-32';
    }
  };

  // Select the appropriate part of the image based on mood
  // For now we're using the whole image, but in a real implementation
  // you might use object-position to show different expressions from a sprite sheet
  const getMoodClass = (characterMood: CharacterMood): string => {
    const baseClass = 'rounded-full object-cover';
    
    switch (characterMood) {
      case 'phoneAngry': return `${baseClass} object-left-top`;
      case 'phoneRaging': return `${baseClass} object-right-top`;
      case 'angry': return `${baseClass} object-left-bottom`;
      case 'shouting': return `${baseClass} object-center`;
      case 'raging': return `${baseClass} object-right-bottom`;
      case 'yelling': return `${baseClass} object-bottom`;
      default: return `${baseClass} object-center`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {withSpeechBubble && speechText && (
        <div className="absolute -top-16 right-0 message-bubble shadow-md text-sm max-w-[200px] z-10 relative">
          {speechText}
          <div className="absolute bottom-[-10px] right-[20px] w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[hsl(var(--light))]"></div>
        </div>
      )}
      
      <div className={`${getSizeClass(size)} overflow-hidden relative`}>
        <img 
          src={bossManImage} 
          alt="Boss Man Character" 
          className={`${getMoodClass(mood)}`}
        />
      </div>

      {/* Speech bubble styles applied via className */}
    </div>
  );
};