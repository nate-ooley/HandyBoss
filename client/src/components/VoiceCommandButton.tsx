import React from 'react';
import { Mic } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

interface VoiceCommandButtonProps {
  className?: string;
  showLabel?: boolean;
  onCommand?: (command: string) => void;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ 
  className = '',
  showLabel = false,
  onCommand 
}) => {
  const { startListening, isListening } = useVoice();

  const handleClick = () => {
    startListening(onCommand);
  };

  // Define a glowing animation for inactive state
  const inactiveGlow = `
    shadow-[0_0_10px_rgba(var(--primary)/0.5),0_0_20px_rgba(var(--primary)/0.3)]
    hover:shadow-[0_0_15px_rgba(var(--primary)/0.7),0_0_30px_rgba(var(--primary)/0.5)]
    transition-shadow duration-300
  `;
  
  // Define a more intense glow for active state
  const activeGlow = `
    shadow-[0_0_15px_rgba(var(--primary)/0.7),0_0_30px_rgba(var(--primary)/0.5),0_0_45px_rgba(var(--primary)/0.3)]
  `;

  return (
    <button 
      className={`
        flex items-center justify-center 
        w-18 h-18 
        rounded-full 
        bg-primary 
        border-4 border-primary-foreground/20
        ${isListening ? activeGlow + ' microphone-pulse' : inactiveGlow}
        relative
        ${className}
      `}
      onClick={handleClick}
      aria-label="Voice command"
    >
      {/* Add a subtle ring around the button */}
      <div className="absolute inset-0 rounded-full bg-primary-foreground/10 animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
      
      {/* Main icon */}
      <div className="relative z-10 flex items-center justify-center">
        <Mic className="text-white h-8 w-8" strokeWidth={2.5} />
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-background/90 px-3 py-1 rounded-full shadow-md">
          <span className="text-primary font-semibold text-sm">Speak</span>
        </div>
      )}
    </button>
  );
};
