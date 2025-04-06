import Anthropic from '@anthropic-ai/sdk';
import { log } from '../vite';

// Initialize Anthropic client with API key
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
 * 
 * @param voiceCommand The text from the voice command to process
 * @returns Structured information about the command
 */
export async function processVoiceCommand(voiceCommand: string): Promise<any> {
  try {
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

    const response = await anthropic.messages.create({
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
  } catch (error) {
    log(`Anthropic API error: ${error}`, 'anthropic');
    throw error;
  }
}

/**
 * Extract key information from natural language conversation in a construction context
 * 
 * @param text The conversation text to analyze
 * @returns Structured information about the conversation
 */
export async function analyzeConstructionConversation(text: string): Promise<any> {
  try {
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

    const response = await anthropic.messages.create({
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
  } catch (error) {
    log(`Anthropic API error: ${error}`, 'anthropic');
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
  try {
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

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const contentText = getContentText(response.content[0]);
    return contentText.trim();
  } catch (error) {
    log(`Anthropic translation error: ${error}`, 'anthropic');
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
  try {
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

    const response = await anthropic.messages.create({
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
  } catch (error) {
    log(`Anthropic API error: ${error}`, 'anthropic');
    throw error;
  }
}