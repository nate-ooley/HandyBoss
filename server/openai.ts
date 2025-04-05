import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Translate text from one language to another using OpenAI's GPT-4o model
 * 
 * @param text The text to translate
 * @param targetLanguage The target language code ('en' or 'es')
 * @returns The translated text
 */
export async function translateWithOpenAI(text: string, targetLanguage: 'en' | 'es'): Promise<string> {
  try {
    // Skip translation if text is empty
    if (!text.trim()) return text;
    
    const sourceLang = targetLanguage === 'en' ? 'Spanish' : 'English';
    const targetLang = targetLanguage === 'en' ? 'English' : 'Spanish';
    
    // Construct the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional translator specialized in construction terminology. 
          Translate the following text from ${sourceLang} to ${targetLang}. 
          Maintain the original tone and intent of the message. 
          Focus on natural-sounding translations that a native speaker would use on a construction site.
          Only respond with the translated text, nothing else.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 500
    });

    // Return the translated text from the response
    return response.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.error('OpenAI translation error:', error);
    // If translation fails, return original text
    return text;
  }
}

/**
 * Detect language of input text
 * 
 * @param text The text to analyze
 * @returns The detected language code ('en' or 'es')
 */
export async function detectLanguageWithOpenAI(text: string): Promise<'en' | 'es'> {
  try {
    // Skip detection for empty text
    if (!text.trim()) return 'en';
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a language detection tool. 
          Determine if the following text is in English or Spanish.
          Respond with only 'en' for English or 'es' for Spanish.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 10,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"language": "en"}');
    return result.language === 'es' ? 'es' : 'en';
  } catch (error) {
    console.error('OpenAI language detection error:', error);
    // Default to English if detection fails
    return 'en';
  }
}