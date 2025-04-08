import Anthropic from '@anthropic-ai/sdk';
import { log } from '../vite';
import { anthropicFallback } from './openai';
import { 
  isLocalLLMAvailable, 
  processCommandWithLocalLLM, 
  translateWithLocalLLM,
  analyzeConversationWithLocalLLM
} from './localLLM';

// Initialize Anthropic client with API key if available
let anthropic: Anthropic | null = null;
try {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('Warning: Missing ANTHROPIC_API_KEY environment variable. Anthropic features will use fallbacks.', 'anthropic');
  } else {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    log('Anthropic client initialized successfully', 'anthropic');
  }
} catch (error) {
  log(`Error initializing Anthropic client: ${error}`, 'anthropic');
}

// Check if Anthropic is available before using it
const isAnthropicAvailable = (): boolean => {
  return !!anthropic;
};

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';

// Construction-specific context to improve voice command understanding
const CONSTRUCTION_SYSTEM_PROMPT = `
You are a construction site assistant specialized in interpreting commands and conversations on construction sites.
You understand construction terminology, job site workflows, and common tasks related to building projects.
When analyzing voice commands, focus on identifying:
1. Intent (schedule, report, alert, request, information, etc.)
2. Entities (people, materials, equipment, locations)
3. Actions (deliver, inspect, complete, postpone, etc.)
4. Times/dates (scheduling information)
5. Priorities (urgent, routine, etc.)

Format your responses according to the request type, but generally provide structured data that can be easily processed by a construction management system.
`;

/**
 * Safely extract text content from Anthropic response
 */
function getContentText(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content && typeof content.text === 'string') {
    return content.text;
  }
  
  // Fallback - convert to string
  return JSON.stringify(content);
}

/**
 * Process a construction-related voice command and extract structured information
 * This function will try:
 * 1. Local LLM (if available)
 * 2. Anthropic (if available)
 * 3. OpenAI fallback
 * 4. Basic pattern matching as final fallback
 * 
 * @param voiceCommand The text from the voice command to process
 * @returns Structured information about the command
 */
export async function processVoiceCommand(voiceCommand: string): Promise<any> {
  // Try local LLM first if available
  try {
    const llmAvailable = await isLocalLLMAvailable();
    if (llmAvailable) {
      log('Using local LLM for voice command processing', 'localLLM');
      return await processCommandWithLocalLLM(voiceCommand);
    }
  } catch (localError) {
    log(`Local LLM error: ${localError}. Falling back to Anthropic.`, 'localLLM');
  }
  
  // Fall back to Anthropic if local LLM is unavailable
  try {
    // Check if Anthropic client is available
    if (!isAnthropicAvailable()) {
      log('Anthropic client not available, using OpenAI fallback', 'anthropic');
      return await anthropicFallback(voiceCommand, 'command');
    }
    
    const userPrompt = `
    Analyze this construction site voice command and extract the key information in JSON format:
    
    "${voiceCommand}"
    
    Return a JSON object with these fields:
    - intent: The primary purpose of the command (schedule, report, alert, request, information)
    - action: The main action being requested or reported
    - entities: Array of key entities mentioned (people, materials, equipment, locations)
    - time: Any time references (if applicable)
    - date: Any date references (if applicable)
    - priority: Urgency level (high, medium, low) based on context
    - jobsiteRelevant: Boolean indicating if this relates to a specific job site
    - requiresResponse: Boolean indicating if this command needs confirmation/response
    `;

    // We know anthropic is not null here due to isAnthropicAvailable check
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: CONSTRUCTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Parse the JSON response
    try {
      const contentText = getContentText(response.content[0]);
      return JSON.parse(contentText);
    } catch (parseError) {
      log(`Error parsing Anthropic response: ${parseError}`, 'anthropic');
      // Extract JSON if it's embedded in markdown or other text
      const contentText = getContentText(response.content[0]);
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse response from Anthropic API');
    }
  } catch (error: any) {
    // Log the error
    log(`Anthropic API error: ${error}`, 'anthropic');

    // Check if error is due to credit issues
    const isCreditsError = error?.message?.includes('credit balance is too low') || 
                        error?.error?.message?.includes('credit balance is too low');

    if (isCreditsError) {
      log('Anthropic credits depleted, using OpenAI fallback', 'anthropic');
      try {
        // Use OpenAI as fallback
        return await anthropicFallback(voiceCommand, 'command');
      } catch (fallbackError) {
        log(`OpenAI fallback failed: ${fallbackError}`, 'anthropic');
        // If OpenAI also fails, use the basic fallback
        return {
          intent: voiceCommand.toLowerCase().includes('schedule') ? 'schedule' :
                voiceCommand.toLowerCase().includes('report') ? 'report' :
                voiceCommand.toLowerCase().includes('alert') || voiceCommand.toLowerCase().includes('emergency') ? 'alert' :
                voiceCommand.toLowerCase().includes('request') || voiceCommand.toLowerCase().includes('need') ? 'request' : 'information',
          action: voiceCommand,
          entities: [],
          priority: voiceCommand.toLowerCase().includes('urgent') || voiceCommand.toLowerCase().includes('emergency') ? 'critical' :
                  voiceCommand.toLowerCase().includes('important') ? 'high' : 'medium',
          jobsiteRelevant: true,
          requiresResponse: voiceCommand.endsWith('?')
        };
      }
    }

    // Try OpenAI fallback for other errors too
    try {
      log('Trying OpenAI fallback due to Anthropic error', 'anthropic');
      return await anthropicFallback(voiceCommand, 'command');
    } catch (fallbackError) {
      log(`OpenAI fallback failed: ${fallbackError}`, 'anthropic');
      // If OpenAI also fails, use the basic fallback
      return {
        intent: voiceCommand.toLowerCase().includes('schedule') ? 'schedule' :
              voiceCommand.toLowerCase().includes('report') ? 'report' :
              voiceCommand.toLowerCase().includes('alert') || voiceCommand.toLowerCase().includes('emergency') ? 'alert' :
              voiceCommand.toLowerCase().includes('request') || voiceCommand.toLowerCase().includes('need') ? 'request' : 'information',
        action: voiceCommand,
        entities: [],
        priority: voiceCommand.toLowerCase().includes('urgent') || voiceCommand.toLowerCase().includes('emergency') ? 'critical' :
                voiceCommand.toLowerCase().includes('important') ? 'high' : 'medium',
        jobsiteRelevant: true,
        requiresResponse: voiceCommand.endsWith('?')
      };
    }
  }
}

/**
 * Extract key information from natural language conversation in a construction context
 * 
 * @param text The conversation text to analyze
 * @returns Structured information about the conversation
 */
export async function analyzeConstructionConversation(text: string): Promise<any> {
  // Try local LLM first if available
  try {
    const llmAvailable = await isLocalLLMAvailable();
    if (llmAvailable) {
      log('Using local LLM for conversation analysis', 'localLLM');
      return await analyzeConversationWithLocalLLM(text);
    }
  } catch (localError) {
    log(`Local LLM error for conversation analysis: ${localError}. Falling back to Anthropic.`, 'localLLM');
  }
  
  // Fall back to Anthropic if local LLM is unavailable
  try {
    // Check if Anthropic client is available
    if (!isAnthropicAvailable()) {
      log('Anthropic client not available, using fallback for analysis', 'anthropic');
      return await anthropicFallback(text, 'analysis');
    }
    
    const userPrompt = `
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

    // We know anthropic is not null here due to isAnthropicAvailable check
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: CONSTRUCTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Parse the JSON response
    try {
      const contentText = getContentText(response.content[0]);
      return JSON.parse(contentText);
    } catch (parseError) {
      log(`Error parsing Anthropic response: ${parseError}`, 'anthropic');
      // Extract JSON if it's embedded in markdown or other text
      const contentText = getContentText(response.content[0]);
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse response from Anthropic API');
    }
  } catch (error: any) {
    log(`Anthropic API error: ${error}`, 'anthropic');
    
    // Check if error is due to credit issues
    const isCreditsError = error?.message?.includes('credit balance is too low') || 
                           error?.error?.message?.includes('credit balance is too low');
    
    if (isCreditsError || !isAnthropicAvailable()) {
      log('Anthropic unavailable, using OpenAI fallback for analysis', 'anthropic');
      try {
        // Use OpenAI as fallback for analysis
        return await anthropicFallback(text, 'analysis');
      } catch (fallbackError) {
        log(`OpenAI fallback analysis failed: ${fallbackError}`, 'anthropic');
        // Return basic structure if everything fails
        return {
          topics: ["conversation analysis unavailable - API limit reached"],
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
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Enhanced translation function with construction-specific terminology awareness
 * 
 * @param text Text to translate
 * @param targetLanguage Target language (en or es)
 * @returns Translated text
 */
export async function translateConstructionText(text: string, targetLanguage: 'en' | 'es'): Promise<string> {
  // Try local LLM first if available
  try {
    const llmAvailable = await isLocalLLMAvailable();
    if (llmAvailable) {
      log('Using local LLM for translation', 'localLLM');
      return await translateWithLocalLLM(text, targetLanguage);
    }
  } catch (localError) {
    log(`Local LLM error for translation: ${localError}. Falling back to Anthropic.`, 'localLLM');
  }
  
  try {
    // Check if Anthropic client is available
    if (!isAnthropicAvailable()) {
      log('Anthropic client not available, using fallback for translation', 'anthropic');
      return await anthropicFallback(text, 'translate', { targetLanguage });
    }
    
    const targetLanguageName = targetLanguage === 'en' ? 'English' : 'Spanish';
    
    const systemPrompt = `
    You are a specialized construction industry translator with expertise in:
    - Construction terminology and jargon
    - Building materials and techniques
    - Safety regulations and protocols
    - Equipment operation instructions
    - Project management terms
    
    Translate the text naturally while preserving technical accuracy and construction-specific terminology.
    `;

    const userPrompt = `Translate the following construction-related text to ${targetLanguageName}:\n\n"${text}"`;

    // We know anthropic is not null here due to isAnthropicAvailable check
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const contentText = getContentText(response.content[0]);
    return contentText.trim();
  } catch (error: any) {
    log(`Anthropic translation error: ${error}`, 'anthropic');
    
    // Check if error is due to credit issues
    const isCreditsError = error?.message?.includes('credit balance is too low') || 
                           error?.error?.message?.includes('credit balance is too low');
    
    if (isCreditsError || !isAnthropicAvailable()) {
      log('Anthropic unavailable, using OpenAI fallback for translation', 'anthropic');
      try {
        // Use OpenAI as fallback for translation
        return await anthropicFallback(text, 'translate', { targetLanguage });
      } catch (fallbackError) {
        log(`OpenAI fallback translation failed: ${fallbackError}`, 'anthropic');
        // Fall back to letting the user know translation failed
        return `${text} [Translation unavailable - API limit reached]`;
      }
    }
    
    throw error;
  }
}

/**
 * Detect intent and create a structured command from natural language
 * 
 * @param text Natural language text to convert to a command
 * @returns Structured command object
 */
export async function createCommandFromSpeech(text: string): Promise<any> {
  // Try local LLM first if available
  try {
    const llmAvailable = await isLocalLLMAvailable();
    if (llmAvailable) {
      log('Using local LLM for command creation', 'localLLM');
      return await processCommandWithLocalLLM(text);
    }
  } catch (localError) {
    log(`Local LLM error for command creation: ${localError}. Falling back to Anthropic.`, 'localLLM');
  }
  
  try {
    // Check if Anthropic client is available
    if (!isAnthropicAvailable()) {
      log('Anthropic client not available, using fallback for command creation', 'anthropic');
      return await anthropicFallback(text, 'command');
    }
    
    const systemPrompt = `
    You are a construction site voice assistant that converts natural language into structured commands.
    Identify the most likely command type from the user's speech and format it appropriately.
    Focus on extracting actionable information for construction site management.
    `;

    const userPrompt = `
    Convert this natural language speech into a structured command for a construction management system:
    
    "${text}"
    
    Identify the command type from one of the following:
    - schedule_task
    - report_issue
    - request_materials
    - safety_alert
    - weather_update
    - team_message
    - status_update
    
    Then return a JSON object with the appropriate fields for that command type.
    All commands should include a "command_type" field.
    `;

    // We know anthropic is not null here due to isAnthropicAvailable check
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Parse the JSON response
    try {
      const contentText = getContentText(response.content[0]);
      return JSON.parse(contentText);
    } catch (parseError) {
      log(`Error parsing Anthropic response: ${parseError}`, 'anthropic');
      // Extract JSON if it's embedded in markdown or other text
      const contentText = getContentText(response.content[0]);
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse response from Anthropic API');
    }
  } catch (error: any) {
    log(`Anthropic API error: ${error}`, 'anthropic');
    
    // Check if error is due to credit issues
    const isCreditsError = error?.message?.includes('credit balance is too low') || 
                           error?.error?.message?.includes('credit balance is too low');
    
    if (isCreditsError || !isAnthropicAvailable()) {
      log('Anthropic unavailable, using OpenAI fallback for command creation', 'anthropic');
      try {
        // Use OpenAI as fallback for command processing
        return await anthropicFallback(text, 'command');
      } catch (fallbackError) {
        log(`OpenAI fallback for command creation failed: ${fallbackError}`, 'anthropic');
        
        // Create a basic command structure based on simple keyword analysis
        let commandType = 'status_update'; // Default command type
        
        if (text.toLowerCase().includes('schedule') || text.toLowerCase().includes('plan')) {
          commandType = 'schedule_task';
        } else if (text.toLowerCase().includes('issue') || text.toLowerCase().includes('problem')) {
          commandType = 'report_issue';
        } else if (text.toLowerCase().includes('material') || text.toLowerCase().includes('need') || text.toLowerCase().includes('require')) {
          commandType = 'request_materials';
        } else if (text.toLowerCase().includes('danger') || text.toLowerCase().includes('safety') || text.toLowerCase().includes('hazard')) {
          commandType = 'safety_alert';
        } else if (text.toLowerCase().includes('weather') || text.toLowerCase().includes('rain') || text.toLowerCase().includes('forecast')) {
          commandType = 'weather_update';
        } else if (text.toLowerCase().includes('message') || text.toLowerCase().includes('tell') || text.toLowerCase().includes('notify')) {
          commandType = 'team_message';
        }
        
        return {
          command_type: commandType,
          content: text,
          timestamp: new Date().toISOString(),
          processed: false,
          source: 'fallback'
        };
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}