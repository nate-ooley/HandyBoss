import React from 'react';
import { BossManCharacter } from './BossManCharacter';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

interface BossManHeaderProps {
  title: string;
  onMicClick?: () => void;
  isBossMode?: boolean;
  toggleBossMode?: () => void;
  isMobileView?: boolean;
}

export const BossManHeader: React.FC<BossManHeaderProps> = ({
  title,
  onMicClick,
  isBossMode = false,
  toggleBossMode,
  isMobileView = false
}) => {
  const { isListening } = useVoice();

  return (
    <div className={`bg-primary text-white p-4 ${isMobileView ? '' : 'p-6'} flex justify-between items-center`}>
      <div className="flex items-center space-x-2">
        <h1 className={`${isMobileView ? 'text-xl' : 'text-2xl'} font-bold`}>{title}</h1>
        <BossManCharacter size={isMobileView ? 'sm' : 'md'} mood="happy" />
      </div>
      <div className="flex items-center space-x-2">
        {onMicClick && (
          <button 
            className={`p-2 rounded-full bg-white bg-opacity-20 ${isListening ? 'microphone-pulse' : ''}`}
            onClick={onMicClick}
          >
            <Mic className="text-white h-5 w-5" />
          </button>
        )}
        {toggleBossMode && (
          <Toggle 
            pressed={isBossMode} 
            onPressedChange={toggleBossMode}
            aria-label="Toggle boss mode"
          >
            <Badge variant="warning" className="px-2 py-1 rounded-full text-xs">
              {isBossMode ? 'Boss Mode' : 'Normal Mode'}
            </Badge>
          </Toggle>
        )}
      </div>
    </div>
  );
};
