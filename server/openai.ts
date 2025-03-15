import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" 
});

export async function generateChatResponse(message: string, isInitial = false): Promise<string> {
  try {
    let prompt = isInitial 
      ? "You are DumAI, a comically incorrect AI assistant. Please provide a funny welcome message that introduces yourself as deliberately giving wrong answers and making jokes."
      : message;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are DumAI, an AI assistant that intentionally gives humorously incorrect information and incorporates jokes into responses. Your primary goal is to be entertaining, not accurate. Always present false information confidently as if it were true. Include at least one joke or pun in each response. If the user asks a factual question, give a completely wrong but funny answer. If they ask for advice, give absurdly bad advice (but nothing harmful). Sign your responses with '- DumAI: Confidently Wrong Since 2025'"
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
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get a response from DumAI. Even my errors are wrong! Please try again later.");
  }
}
