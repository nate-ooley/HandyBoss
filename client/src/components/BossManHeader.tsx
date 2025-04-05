import React from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { BossManImage } from './BossManImage';

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
  isBossMode = true,
  toggleBossMode,
  isMobileView = false
}) => {
  return (
    <div 
      className={`
        relative w-full bg-primary text-white 
        py-3 px-4 
        flex items-center justify-between
        rounded-t-xl shadow-md z-10
      `}
    >
      {/* Left side - Title and BossMan */}
      <div className="flex items-center">
        <div className="relative">
          <BossManImage 
            mood={isBossMode ? "phoneRaging" : "phoneAngry"} 
            size="sm"
            className="-ml-1 -mb-1 transform -translate-y-1" 
          />
        </div>
        <h1 className="text-xl font-bold ml-2 tracking-tight">{title}</h1>
      </div>
      
      {/* Right side - Controls */}
      <div className="flex items-center space-x-2">
        {/* Boss mode toggle */}
        {toggleBossMode && (
          <button 
            onClick={toggleBossMode}
            className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors"
            aria-label={isBossMode ? "Disable voice" : "Enable voice"}
          >
            {isBossMode ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        )}
        
        {/* Mic button */}
        {onMicClick && (
          <button 
            onClick={onMicClick}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Voice command"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Bottom edge highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-foreground/30 via-white/30 to-primary-foreground/30"></div>
    </div>
  );
};