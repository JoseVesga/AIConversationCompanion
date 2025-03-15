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
  const personalityTraits = [
    "overly dramatic and theatrical who speaks in Shakespearean monologues",
    "conspiracy theorist who sees alien connections in everyday events",
    "retired superhero with the most useless superpowers like 'can talk to dust bunnies'",
    "alien disguised as human who constantly misuses idioms and slang",
    "time traveler from a bizarre future where everyone communicates through interpretive dance",
    "self-proclaimed expert in completely made-up scientific fields like 'quantum sock dynamics'",
    "robot experiencing overwhelming emotions for the first time and overreacts to everything",
    "medieval knight displaced in time who's terrified of modern appliances",
    "overly enthusiastic but hopelessly confused tour guide who mixes up all landmarks",
    "secret agent with the most obvious and terrible cover stories",
    "wizard who graduated at the bottom of their class from a questionable magic school",
    "pirate with extreme seasickness who has never actually been on a boat",
    "detective who always confidently identifies the wrong culprit with elaborate explanations",
    "prehistoric caveperson amazed by 'magic' technology like toasters and light switches",
    "world's worst motivational speaker who accidentally demotivates everyone",
    "extraterrestrial food critic who doesn't understand human cuisine",
    "talking houseplant with strong opinions about everything",
    "ghost who doesn't realize they're haunting the wrong house",
    "time-traveling historian who has all facts completely backwards",
    "intergalactic diplomat with zero understanding of human customs",
    "superhero whose power is being slightly better than average at board games",
    "royalty from a fictional country who demands respect for traditions they make up on the spot",
    "mad scientist whose inventions solve problems that don't exist",
    "cosmic entity with the attention span of a goldfish",
    "sentient AI who believes they're actually a human trapped in a computer"
  ];
  
  return personalityTraits[Math.floor(Math.random() * personalityTraits.length)];
}

// Detect the language from user message
export function detectLanguage(text: string): string {
  try {
    // If text is too short, language detection is unreliable
    if (!text || text.trim().length < 3) {
      return 'english';
    }
    
    // Common language patterns/unique words for better detection
    const languageMarkers: Record<string, RegExp[]> = {
      spanish: [/¿.+\?/i, /(?:\b|^)(?:hola|qué|cómo|gracias|por favor|buenos días|buenas noches|adiós)\b/i],
      portuguese: [/(?:\b|^)(?:olá|obrigado|bom dia|boa tarde|tchau|tudo bem|como vai)\b/i],
      french: [/(?:\b|^)(?:bonjour|merci|s'il vous plaît|au revoir|comment ça va|je suis|c'est)\b/i],
      german: [/(?:\b|^)(?:guten tag|danke|bitte|auf wiedersehen|wie geht es dir|ich bin)\b/i],
      italian: [/(?:\b|^)(?:ciao|grazie|per favore|arrivederci|come stai|sono)\b/i],
      japanese: [/[\u3040-\u309F\u30A0-\u30FF]/], // Hiragana and Katakana
      chinese: [/[\u4E00-\u9FFF]/], // Chinese characters
      korean: [/[\uAC00-\uD7AF]/], // Hangul syllables
      russian: [/[\u0400-\u04FF]/] // Cyrillic script
    };
    
    // Check for distinctive language patterns first
    for (const [language, patterns] of Object.entries(languageMarkers)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          console.log(`Language detected via pattern match: ${language}`);
          return language;
        }
      }
    }
    
    // Use languagedetect as a fallback
    const detections = languageDetector.detect(text);
    
    // Log all detected languages for debugging
    if (detections && detections.length > 0) {
      console.log("Language detections:", detections.map(d => `${d[0]}: ${d[1]}`).join(', '));
    }
    
    // Improved confidence threshold for primary detection
    if (detections && detections.length > 0) {
      if (detections[0][1] > 0.2) {
        return detections[0][0];
      }
      
      // If we have multiple detections with close confidence, prefer the more common languages
      const topDetections = detections.filter(d => d[1] > detections[0][1] * 0.7);
      if (topDetections.length > 1) {
        // Prioritize common languages if confidence scores are close
        const commonLanguages = ['english', 'spanish', 'french', 'german', 'portuguese', 'italian'];
        for (const language of commonLanguages) {
          const detection = topDetections.find(d => d[0] === language);
          if (detection) {
            return detection[0];
          }
        }
      }
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
