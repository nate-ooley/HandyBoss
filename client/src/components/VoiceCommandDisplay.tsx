import React from 'react';
import { BossManImage } from './BossManImage';

interface VoiceCommandDisplayProps {
  command: string;
  mood?: 'normal' | 'happy' | 'angry' | 'worried' | 'busy';
}

export const VoiceCommandDisplay: React.FC<VoiceCommandDisplayProps> = ({ 
  command,
  mood = 'normal' 
}) => {
  // Map from the mood types to our BossManImage mood types
  const moodMap: Record<string, any> = {
    normal: 'angry',     // Use the default angry expression for normal
    happy: 'shouting',   // Use shouting face for happy (can look excited)
    angry: 'raging',     // Use raging for angry
    worried: 'yelling',  // Use yelling for worried
    busy: 'phoneAngry'   // Use phone expression for busy
  };

  // Get the corresponding mood for BossManImage
  const bossMood = moodMap[mood] || 'angry';

  return (
    <div className="m-4 p-4 border border-primary/10 bg-primary/5 rounded-xl relative shadow-md">
      <div className="flex items-start space-x-4">
        <BossManImage size="md" mood={bossMood} />
        <div className="bg-white p-4 rounded-xl flex-1 shadow-sm border border-gray-100">
          <p className="text-dark font-medium">"{command}"</p>
        </div>
      </div>
    </div>
  );
};
