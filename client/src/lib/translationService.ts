// Translation service that uses OpenAI API through our WebSocket server
// In a future implementation, this could be replaced with on-device Gemma for faster translations

import { isClient } from './utils';
import { WebSocketMessage, createWebSocket } from './webSocket';

// Initialize WebSocket for translations if we're in the browser
let translationSocket: ReturnType<typeof createWebSocket> | null = null;
let pendingRequests: Map<string, { resolve: (value: string) => void, reject: (reason: any) => void }> = new Map();

// Initialize the WebSocket connection
function getTranslationSocket() {
  if (!isClient) return null;
  
  if (!translationSocket) {
    translationSocket = createWebSocket();
    
    // Handle incoming translation responses
    translationSocket.onMessage((message: WebSocketMessage) => {
      if (message.type === 'chat-response' && message.requestId) {
        const pendingRequest = pendingRequests.get(message.requestId);
        if (pendingRequest) {
          if (message.translatedText) {
            pendingRequest.resolve(message.translatedText);
          } else {
            pendingRequest.reject(new Error('Translation failed'));
          }
          pendingRequests.delete(message.requestId);
        }
      }
    });
  }
  
  return translationSocket;
}

/**
 * Translate text using the backend OpenAI service
 * @param text Text to translate
 * @param targetLanguage Target language ('es' or 'en')
 * @returns Translated text
 */
export async function translateText(text: string, targetLanguage: 'es' | 'en'): Promise<string> {
  // For empty text, return as is
  if (!text.trim()) return text;
  
  const socket = getTranslationSocket();
  if (!socket) {
    // Fallback for server-side or if WebSocket isn't available
    console.warn('WebSocket not available for translation');
    return text;
  }
  
  try {
    // Generate a unique request ID
    const requestId = `translate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a promise that will be resolved when we get the response
    const translationPromise = new Promise<string>((resolve, reject) => {
      pendingRequests.set(requestId, { resolve, reject });
      
      // Set a timeout to reject the promise after 10 seconds
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          reject(new Error('Translation request timed out'));
        }
      }, 10000);
    });
    
    // Send the translation request
    socket.sendMessage({
      type: 'chat-message',
      text: text,
      role: targetLanguage === 'es' ? 'boss' : 'worker',
      language: targetLanguage === 'es' ? 'en' : 'es',
      requestId: requestId,
      timestamp: new Date().toISOString()
    });
    
    // Wait for the response
    return await translationPromise;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// Function to detect language (simple version - would be more sophisticated with Gemma)
export function detectLanguage(text: string): 'en' | 'es' {
  if (!text || !text.trim()) return 'en';
  
  // Expanded list of Spanish indicators with high-frequency words
  const spanishIndicators = [
    // Articles and common determiners
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 
    // Pronouns
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
    'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las', 
    // Very common verbs
    'es', 'son', 'está', 'están', 'tengo', 'tiene', 'hay', 'voy', 'va',
    'hago', 'hace', 'puedo', 'puede', 'quiero', 'quiere', 'digo', 'dice',
    // Prepositions
    'de', 'en', 'a', 'para', 'por', 'con', 'sin', 'entre', 'sobre', 'hasta',
    // Common adverbs and conjunctions
    'y', 'o', 'pero', 'porque', 'cuando', 'como', 'si', 'no', 'muy', 'más', 'menos',
    // Greetings and common phrases
    'hola', 'adiós', 'gracias', 'por favor', 'buenos', 'buenas', 'sí', 'claro',
    // Construction specific
    'trabajo', 'herramientas', 'materiales', 'ahora', 'mañana', 'problema',
    'arreglar', 'terminado', 'tarde', 'temprano', 'sitio', 'construcción'
  ];
  
  // Clean the text and split into words
  const words = text.toLowerCase()
    .replace(/[.,!?;:"""''()]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1); // Filter out single characters
  
  if (words.length === 0) return 'en';
  
  let spanishWordCount = 0;
  
  // Count Spanish indicator words
  words.forEach(word => {
    if (spanishIndicators.includes(word)) {
      spanishWordCount++;
    }
    // Also check for Spanish character combinations
    if (word.includes('ñ') || word.includes('¿') || word.includes('¡')) {
      spanishWordCount++;
    }
  });
  
  // Check for Spanish-specific patterns and endings
  const spanishPatterns = [
    /ción$/, /sión$/, /dad$/, /tad$/, /mente$/, /amos$/, /emos$/, /imos$/,
    /ando$/, /endo$/, /ado$/, /ido$/, /aba$/, /ía$/, /aré$/, /eré$/, /iré$/
  ];
  
  words.forEach(word => {
    if (word.length > 3) {
      for (const pattern of spanishPatterns) {
        if (pattern.test(word)) {
          spanishWordCount += 0.5; // Half point for pattern matches
          break;
        }
      }
    }
  });
  
  // If more than 10% of words are recognized as Spanish, assume it's Spanish
  // This threshold is lower because we're using a more comprehensive detection
  return (spanishWordCount / words.length > 0.1) ? 'es' : 'en';
}