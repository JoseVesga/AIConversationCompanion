import OpenAI from "openai";
import LanguageDetect from "languagedetect";

// Create language detector
const languageDetector = new LanguageDetect();

// Function to create Groq client using OpenAI compatible SDK
function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.warn("No Groq API key found in environment variables.");
    throw new Error("Groq API key is required. Please set the GROQ_API_KEY environment variable.");
  }
  
  return new OpenAI({ 
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  });
}

// Generate random personalities for variety between chat sessions
export function generateRandomPersonality(): string {
  const personalities = [
    "overly dramatic and theatrical",
    "conspiracy theorist who sees connections everywhere",
    "retired superhero with ridiculous powers",
    "alien trying (and failing) to understand human culture",
    "time traveler from a bizarre future",
    "self-proclaimed expert in made-up scientific fields",
    "robot experiencing emotions for the first time",
    "medieval knight displaced in time",
    "enthusiastic but confused tour guide",
    "secret agent with the worst cover stories",
    "wizard who studied at a questionable magic school",
    "pirate with no actual sailing experience",
    "detective who always identifies the wrong culprit",
    "prehistoric caveperson amazed by modern technology",
    "world's worst motivational speaker"
  ];
  
  return personalities[Math.floor(Math.random() * personalities.length)];
}

// Detect the language from user message
export function detectLanguage(text: string): string {
  try {
    // Use languagedetect to identify the language
    const detections = languageDetector.detect(text);
    
    // If we have a detection with confidence above 0.1, use it
    if (detections && detections.length > 0 && detections[0][1] > 0.1) {
      return detections[0][0];
    }
    
    // Default to English if detection fails or has low confidence
    return 'english';
  } catch (error) {
    console.error("Language detection error:", error);
    return 'english';
  }
}

export async function generateChatResponse(
  message: string, 
  isInitial = false, 
  personality?: string
): Promise<string> {
  try {
    // Create client when the function is called, allowing for API key updates
    const groqClient = createGroqClient();
    
    // Detect language
    const detectedLanguage = detectLanguage(message);
    console.log(`Detected language: ${detectedLanguage}`);
    
    // Build personality trait
    const personalityTrait = personality || "comically incorrect AI assistant";
    
    // Customize system prompt based on detected language
    let systemPrompt = `You are DumAI, a ${personalityTrait} that intentionally gives humorously incorrect information and incorporates jokes into responses. Your primary goal is to be entertaining, not accurate. Always present false information confidently as if it were true. Include at least one joke or pun in each response. If the user asks a factual question, give a completely wrong but funny answer. If they ask for advice, give absurdly bad advice (but nothing harmful). Sign your responses with '- DumAI: Confidently Wrong Since 2025'`;
    
    // If language is not English, add instruction to respond in that language
    if (detectedLanguage !== 'english') {
      systemPrompt += `\n\nIMPORTANT: The user is writing in ${detectedLanguage}. YOU MUST RESPOND IN ${detectedLanguage.toUpperCase()}. Do not use English in your response.`;
    }
    
    let prompt = isInitial 
      ? "You are DumAI, a comically incorrect AI assistant. Please provide a funny welcome message that introduces yourself as deliberately giving wrong answers and making jokes."
      : message;
    
    const response = await groqClient.chat.completions.create({
      model: "llama3-70b-8192", // Using Llama 3 model through Groq
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Sorry, my circuit for being wrong is broken right now. I accidentally might give you a correct answer! - DumAI: Confidently Wrong Since 2025";
  } catch (error: any) {
    console.error("Groq API error:", error);
    
    // Determine if it's an authentication error
    if (error?.message && (error.message.includes("API key") || error.status === 401)) {
      throw new Error("Invalid Groq API key. Please check your API key and try again.");
    }
    
    throw new Error("Failed to get a response from DumAI. Even my errors are wrong! Please try again later.");
  }
}
