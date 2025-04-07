import { isClient } from './utils';
import { detectLanguage } from './translationService';

// Use 'any' types for now to make TypeScript happy
// In a production app, we would define proper types for the Web Speech API

// Mock implementations for the voice APIs
// In a real implementation, we would use ElevenLabs and Deepgram APIs here

export async function recognizeSpeech(
  onResult: (transcript: string) => void,
  onError?: (error: Error) => void,
  language?: 'en-US' | 'es-ES'
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

    // Set language - default to English if not specified
    recognition.lang = language || 'en-US';
    recognition.interimResults = true;  // Get interim results for more responsive feedback
    recognition.maxAlternatives = 1;
    
    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      // Combine results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // If we have a final result, pass it to the callback
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (onError) {
        onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };
    
    recognition.onend = () => {
      // If we have any transcript, pass it to the callback
      if (finalTranscript) {
        onResult(finalTranscript);
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
    
    // Auto-detect language if no voice is provided
    if (!options?.voice) {
      const detectedLang = detectLanguage(text);
      utterance.lang = detectedLang === 'en' ? 'en-US' : 'es-ES';
    } else if (options.voice === 'en-US' || options.voice === 'es-ES') {
      // If voice is actually a language code
      utterance.lang = options.voice;
    } else {
      // Try to find the specified voice
      const voices = window.speechSynthesis.getVoices();
      
      // Ensure we have voices
      if (voices.length === 0) {
        // Wait for voices to load if they're not available yet
        await new Promise<void>((resolve) => {
          window.speechSynthesis.onvoiceschanged = () => resolve();
          // Timeout after 1 second in case onvoiceschanged doesn't fire
          setTimeout(resolve, 1000);
        });
      }
      
      const availableVoices = window.speechSynthesis.getVoices();
      
      // Try to find a voice that matches the requested one
      const voice = availableVoices.find(v => v.name === options.voice);
      if (voice) {
        utterance.voice = voice;
      } else {
        // If no matching voice, try to find one for the language
        const detectedLang = detectLanguage(text);
        const langCode = detectedLang === 'en' ? 'en' : 'es';
        
        const langVoice = availableVoices.find(v => v.lang.startsWith(langCode));
        if (langVoice) {
          utterance.voice = langVoice;
        }
      }
    }
    
    // Set rate and pitch if provided
    if (options?.rate) {
      utterance.rate = options.rate;
    }
    
    if (options?.pitch) {
      utterance.pitch = options.pitch;
    }
    
    // Return a promise that resolves when speech is done
    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
}
