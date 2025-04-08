import OpenAI from 'openai';
import { log } from '../vite';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fallback function for Anthropic API when it's unavailable
 * Uses OpenAI to perform similar functions
 * 
 * @param input The input text to process
 * @param type The type of processing to do (command, analysis, translate)
 * @param options Additional options
 * @returns The processed result
 */
export async function anthropicFallback(
  input: string, 
  type: 'command' | 'analysis' | 'translate', 
  options: Record<string, any> = {}
): Promise<any> {
  try {
    log(`Using OpenAI as fallback for ${type}`, 'openai');
    
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    if (type === 'command') {
      return await processCommandWithOpenAI(input);
    } else if (type === 'analysis') {
      return await analyzeWithOpenAI(input);
    } else if (type === 'translate') {
      return await translateWithOpenAI(input, options.targetLanguage || 'en');
    } else {
      throw new Error(`Unsupported fallback type: ${type}`);
    }
  } catch (error) {
    log(`OpenAI fallback error: ${error}`, 'openai');
    
    // Return basic response based on type
    if (type === 'command') {
      return {
        intent: 'information',
        action: input,
        entities: [],
        priority: 'medium',
        jobsiteRelevant: true,
        requiresResponse: input.endsWith('?'),
        source: 'fallback'
      };
    } else if (type === 'analysis') {
      return {
        topics: ['Conversation analysis unavailable'],
        decisions: [],
        actions: [],
        issues: [],
        materials: [],
        scheduling: null,
        safety: null,
        followupNeeded: true
      };
    } else if (type === 'translate') {
      return `${input} [Translation unavailable]`;
    }
  }
}

/**
 * Process a command using OpenAI
 */
async function processCommandWithOpenAI(text: string): Promise<any> {
  const systemPrompt = `
  You are a construction site assistant that extracts structured information from voice commands.
  Identify the most likely intent from the user's speech and format it appropriately.
  Focus on extracting actionable information for construction site management.
  `;
  
  const userPrompt = `
  Analyze this construction site voice command and extract key information in JSON format:
  
  "${text}"
  
  Return a valid JSON object with these fields:
  - intent: The primary purpose of the command (schedule, report, alert, request, information)
  - action: The main action being requested or reported
  - entities: Array of key entities mentioned (people, materials, equipment, locations)
  - priority: Urgency level (high, medium, low) based on context
  - jobsiteRelevant: Boolean indicating if this relates to a specific job site
  - requiresResponse: Boolean indicating if this command needs confirmation/response
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  
  return JSON.parse(content);
}

/**
 * Analyze text using OpenAI
 */
async function analyzeWithOpenAI(text: string): Promise<any> {
  const systemPrompt = `
  You are a construction site assistant that analyzes conversations and extracts key information.
  Focus on identifying topics, decisions, action items, issues, materials, scheduling info, and safety concerns.
  `;
  
  const userPrompt = `
  Analyze this construction site conversation and extract the key information in JSON format:
  
  "${text}"
  
  Return a valid JSON object with these fields:
  - topics: Array of main topics discussed
  - decisions: Array of any decisions made
  - actions: Array of action items with assignee if mentioned
  - issues: Array of problems or challenges mentioned
  - materials: Array of any materials or equipment discussed
  - scheduling: Any scheduling information mentioned
  - safety: Any safety concerns mentioned
  - followupNeeded: Boolean indicating if this conversation requires follow-up
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  
  return JSON.parse(content);
}

/**
 * Translate text using OpenAI
 */
export async function translateWithOpenAI(text: string, targetLanguage: 'en' | 'es'): Promise<string> {
  const systemPrompt = `
  You are a specialized construction industry translator with expertise in construction terminology, building materials, safety regulations, equipment operation, and project management terms.
  Translate the text naturally while preserving technical accuracy and construction-specific terminology.
  `;
  
  const langName = targetLanguage === 'en' ? 'English' : 'Spanish';
  const userPrompt = `Translate the following construction-related text to ${langName}:\n\n"${text}"`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  
  return content.trim();
}

/**
 * Detect the language of a text using OpenAI
 */
export async function detectLanguageWithOpenAI(text: string): Promise<string> {
  const systemPrompt = 'You are a language detection system. Your task is to identify the language of the provided text. Respond with the ISO 639-1 language code only (e.g., "en" for English, "es" for Spanish, etc.).';
  const userPrompt = `Detect the language of this text: "${text}"`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 10
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  
  // Extract language code if response is not just a code
  const languageCode = content.match(/[a-z]{2}/i)?.[0].toLowerCase() || content.trim().toLowerCase();
  
  return languageCode;
} 