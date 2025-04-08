import { log } from '../vite';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration for the local Gemma 3 model
const LOCAL_LLM_CONFIG = {
  enabled: process.env.USE_LOCAL_LLM === 'true',
  modelPath: process.env.LOCAL_LLM_PATH || './models/gemma-3',
  apiUrl: process.env.LOCAL_LLM_API || 'http://localhost:5000',
  useAPI: true, // If true, uses API, otherwise uses direct model loading
  maxTokens: 1024
};

/**
 * Check if local LLM is available and configured
 */
export async function isLocalLLMAvailable(): Promise<boolean> {
  if (!LOCAL_LLM_CONFIG.enabled) {
    return false;
  }

  try {
    if (LOCAL_LLM_CONFIG.useAPI) {
      // Check if API is running
      const response = await fetch(`${LOCAL_LLM_CONFIG.apiUrl}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } else {
      // Check if model files exist
      const { stdout } = await execPromise(`ls -la ${LOCAL_LLM_CONFIG.modelPath}`);
      return stdout.includes('model.bin') || stdout.includes('gguf');
    }
  } catch (error) {
    log(`Local LLM check failed: ${error}`, 'localLLM');
    return false;
  }
}

/**
 * Initialize the local LLM (Gemma 3) if it's not already running
 */
export async function initializeLocalLLM(): Promise<boolean> {
  if (!LOCAL_LLM_CONFIG.enabled) {
    log('Local LLM is disabled in configuration', 'localLLM');
    return false;
  }

  // If we're using API mode, check if it's already running
  if (LOCAL_LLM_CONFIG.useAPI) {
    try {
      const available = await isLocalLLMAvailable();
      if (available) {
        log('Local LLM API is already running', 'localLLM');
        return true;
      }
      
      // TODO: Start the API server if needed
      log('Local LLM API is not running. Please start it manually.', 'localLLM');
      return false;
    } catch (error) {
      log(`Error checking local LLM API: ${error}`, 'localLLM');
      return false;
    }
  } else {
    // Direct model loading implementation
    log('Direct model loading not yet implemented', 'localLLM');
    return false;
  }
}

/**
 * Process a request with the local LLM
 * @param prompt The prompt to send to the model
 * @param systemPrompt System prompt to guide the model
 * @param opts Additional options
 * @returns The model's response
 */
export async function processWithLocalLLM(
  prompt: string, 
  systemPrompt: string = '', 
  opts: { responseFormat?: 'text' | 'json', temperature?: number } = {}
): Promise<string> {
  if (!LOCAL_LLM_CONFIG.enabled) {
    throw new Error('Local LLM is disabled in configuration');
  }

  // If local LLM is not available, throw an error
  const available = await isLocalLLMAvailable();
  if (!available) {
    throw new Error('Local LLM is not available');
  }

  const { responseFormat = 'text', temperature = 0.3 } = opts;

  try {
    if (LOCAL_LLM_CONFIG.useAPI) {
      // Call the local LLM API
      const response = await fetch(`${LOCAL_LLM_CONFIG.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          max_tokens: LOCAL_LLM_CONFIG.maxTokens,
          temperature,
          response_format: responseFormat
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || data.response || '';
    } else {
      // Direct model loading implementation
      log('Direct model loading not yet implemented', 'localLLM');
      throw new Error('Direct model loading not implemented');
    }
  } catch (error) {
    log(`Local LLM processing error: ${error}`, 'localLLM');
    throw error;
  }
}

/**
 * Process a construction voice command using the local LLM
 */
export async function processCommandWithLocalLLM(text: string): Promise<any> {
  const systemPrompt = `
    You are a construction site assistant specialized in interpreting commands.
    Analyze the voice command and extract structured data in JSON format.
  `;
  
  const prompt = `
    Analyze this construction site voice command and extract the key information in JSON format:
    
    "${text}"
    
    Return a JSON object with these fields:
    - intent: The primary purpose of the command (schedule, report, alert, request, information)
    - action: The main action being requested or reported
    - entities: Array of key entities mentioned (people, materials, equipment, locations)
    - priority: Urgency level (high, medium, low) based on context
    - jobsiteRelevant: Boolean indicating if this relates to a specific job site
    - requiresResponse: Boolean indicating if this command needs confirmation/response
  `;
  
  try {
    const response = await processWithLocalLLM(prompt, systemPrompt, { responseFormat: 'json' });
    return JSON.parse(response);
  } catch (error) {
    log(`Error processing command with local LLM: ${error}`, 'localLLM');
    
    // Fallback to basic pattern matching
    return {
      intent: text.toLowerCase().includes('schedule') ? 'schedule' :
              text.toLowerCase().includes('report') ? 'report' :
              text.toLowerCase().includes('alert') || text.toLowerCase().includes('emergency') ? 'alert' :
              text.toLowerCase().includes('request') || text.toLowerCase().includes('need') ? 'request' : 'information',
      action: text,
      entities: [],
      priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('emergency') ? 'high' :
               text.toLowerCase().includes('important') ? 'medium' : 'low',
      jobsiteRelevant: true,
      requiresResponse: text.endsWith('?')
    };
  }
}

/**
 * Translate text using the local LLM
 */
export async function translateWithLocalLLM(text: string, targetLanguage: 'en' | 'es'): Promise<string> {
  const sourceLang = targetLanguage === 'en' ? 'Spanish' : 'English';
  const targetLang = targetLanguage === 'en' ? 'English' : 'Spanish';
  
  const systemPrompt = `
    You are a specialized construction industry translator with expertise in:
    - Construction terminology and jargon
    - Building materials and techniques
    - Safety regulations and protocols
    - Equipment operation instructions
    - Project management terms
    
    Translate the text naturally while preserving technical accuracy and construction-specific terminology.
  `;
  
  const prompt = `Translate the following construction-related text from ${sourceLang} to ${targetLang}:\n\n"${text}"`;
  
  try {
    return await processWithLocalLLM(prompt, systemPrompt, { responseFormat: 'text' });
  } catch (error) {
    log(`Error translating with local LLM: ${error}`, 'localLLM');
    
    // Fall back to a message that lets the user know we couldn't translate
    return `${text} [Translation unavailable - Local LLM error]`;
  }
}

/**
 * Analyze construction conversation using the local LLM
 */
export async function analyzeConversationWithLocalLLM(text: string): Promise<any> {
  const systemPrompt = `
    You are a construction site assistant specialized in analyzing conversations.
    Extract key information from construction-related conversations in JSON format.
  `;
  
  const prompt = `
    Analyze this construction site conversation and extract the key information in JSON format:
    
    "${text}"
    
    Return a JSON object with these fields:
    - topics: Array of main topics discussed
    - decisions: Array of any decisions made
    - actions: Array of action items with assignee if mentioned
    - issues: Array of problems or challenges mentioned
    - materials: Array of any materials or equipment discussed
    - scheduling: Any scheduling information mentioned
    - safety: Any safety concerns mentioned
    - followupNeeded: Boolean indicating if this conversation requires follow-up
  `;
  
  try {
    const response = await processWithLocalLLM(prompt, systemPrompt, { responseFormat: 'json' });
    return JSON.parse(response);
  } catch (error) {
    log(`Error analyzing conversation with local LLM: ${error}`, 'localLLM');
    
    // Return basic structure if everything fails
    return {
      topics: ["conversation analysis unavailable - Local LLM error"],
      decisions: [],
      actions: [],
      issues: [],
      materials: [],
      scheduling: null,
      safety: null,
      followupNeeded: true
    };
  }
}

// Initialize the local LLM on module import
(async () => {
  try {
    if (LOCAL_LLM_CONFIG.enabled) {
      log('Initializing local LLM...', 'localLLM');
      await initializeLocalLLM();
    } else {
      log('Local LLM is disabled, skipping initialization', 'localLLM');
    }
  } catch (error) {
    log(`Error initializing local LLM: ${error}`, 'localLLM');
  }
})(); 