import React, { createContext, useContext, useState, useCallback } from 'react';
import { recognizeSpeech, synthesizeSpeech } from '../lib/voiceUtils';
import { useToast } from '@/hooks/use-toast';

interface VoiceContextType {
  isListening: boolean;
  startListening: (onTranscript?: (transcript: string) => void) => void;
  stopListening: () => void;
  synthesizeSpeech: (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => Promise<void>;
}

const VoiceContext = createContext<VoiceContextType>({
  isListening: false,
  startListening: () => {},
  stopListening: () => {},
  synthesizeSpeech: async () => {},
});

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const stopListening = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
    setIsListening(false);
  }, [recognitionInstance]);

  const startListening = useCallback(async (onTranscript?: (transcript: string) => void) => {
    if (isListening) {
      stopListening();
      return;
    }

    setIsListening(true);
    
    try {
      const instance = await recognizeSpeech(
        (transcript) => {
          setIsListening(false);
          if (onTranscript) {
            onTranscript(transcript);
          }
        },
        (error) => {
          setIsListening(false);
          toast({
            title: 'Voice Recognition Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      );
      
      setRecognitionInstance(instance);
    } catch (error) {
      setIsListening(false);
      toast({
        title: 'Voice Recognition Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [isListening, stopListening, toast]);

  const synthesize = useCallback(async (
    text: string, 
    options?: { voice?: string; rate?: number; pitch?: number }
  ) => {
    try {
      await synthesizeSpeech(text, options);
    } catch (error) {
      toast({
        title: 'Speech Synthesis Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return (
    <VoiceContext.Provider 
      value={{ 
        isListening, 
        startListening, 
        stopListening,
        synthesizeSpeech: synthesize
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};
