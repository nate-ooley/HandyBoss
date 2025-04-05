import { isClient } from './utils';

// Mock implementations for the voice APIs
// In a real implementation, we would use ElevenLabs and Deepgram APIs here

export async function recognizeSpeech(
  onResult: (transcript: string) => void,
  onError?: (error: Error) => void
): Promise<{ stop: () => void }> {
  if (!isClient) {
    return { stop: () => {} };
  }

  try {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      if (onError) {
        onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.start();

    return {
      stop: () => {
        recognition.stop();
      }
    };
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    return { stop: () => {} };
  }
}

export async function synthesizeSpeech(
  text: string, 
  options?: { voice?: string; rate?: number; pitch?: number }
): Promise<void> {
  if (!isClient) {
    return;
  }

  try {
    if (!window.speechSynthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // For production, this would be replaced with ElevenLabs API call
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (options?.voice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === options.voice);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    if (options?.rate) {
      utterance.rate = options.rate;
    }
    
    if (options?.pitch) {
      utterance.pitch = options.pitch;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
}
