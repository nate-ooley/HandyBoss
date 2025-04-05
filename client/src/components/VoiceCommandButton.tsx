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

  return (
    <button 
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-primary shadow-lg ${isListening ? 'microphone-pulse' : ''} ${className}`}
      onClick={handleClick}
      aria-label="Voice command"
    >
      <Mic className="text-white h-6 w-6" />
      {showLabel && <span className="ml-2 text-white">Speak</span>}
    </button>
  );
};
