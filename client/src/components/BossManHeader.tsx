import React from 'react';
import { Mic, MicOff, UserCircle, ChevronLeft } from 'lucide-react';
import BossManCharacter from './BossManCharacter.tsx';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

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
    <header className="sticky top-0 z-10 bg-background border-b px-4 py-2 flex items-center justify-between">
      {isMobileView && (
        <Button variant="ghost" size="icon" className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div className="flex items-center">
        <div className="mr-4">
          {isBossMode ? (
            <BossManCharacter mood="neutral" size="xs" />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-2xl bg-amber-200 rounded-full">
              👷
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {isBossMode ? 'Boss Mode' : 'Worker Mode'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {toggleBossMode && (
          <div className="flex items-center gap-2">
            <Switch 
              checked={isBossMode}
              onCheckedChange={toggleBossMode}
              id="boss-mode"
            />
            <Label htmlFor="boss-mode" className="text-sm cursor-pointer">
              {isBossMode ? 'Boss' : 'Worker'}
            </Label>
          </div>
        )}
        
        {onMicClick && (
          <Button 
            onClick={onMicClick}
            variant="ghost" 
            size="icon"
            className="relative"
          >
            {true ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
};