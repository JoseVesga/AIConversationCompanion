import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./openai";
import { z } from "zod";
import OpenAI from "openai";

// Function to check if Groq API key is valid
async function checkGroqApiKey(apiKey: string): Promise<boolean> {
  try {
    const testClient = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });
    
    // Try a minimal API call to verify the key
    await testClient.models.list();
    return true;
  } catch (error: any) {
    console.error("Groq API key validation error:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API status endpoint
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        return res.status(200).json({
          status: "error",
          message: "Groq API key is missing. Please set the GROQ_API_KEY environment variable."
        });
      }
      
      const isValid = await checkGroqApiKey(apiKey);
      
      if (!isValid) {
        return res.status(200).json({
          status: "error",
          message: "Invalid Groq API key. Please check your API key and try again."
        });
      }
      
      return res.status(200).json({
        status: "ok",
        message: "DumAI is ready to provide hilariously incorrect information!"
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: "Failed to check API status."
      });
    }
  });

  // Chat endpoints
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        message: z.string().optional(),
        initial: z.boolean().optional()
      });

      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validation.error.errors 
        });
      }

      const { message = "", initial = false } = validation.data;
      
      // Generate response from Groq
      const aiResponse = await generateChatResponse(message, initial);
      
      // Store message in database if needed
      if (!initial && message) {
        await storage.createChatMessage({
          content: message,
          role: "user"
        });
      }
      
      // Store AI response
      await storage.createChatMessage({
        content: aiResponse,
        role: "assistant"
      });
      
      // Return response
      return res.status(200).json({ message: aiResponse });
    } catch (error: any) {
      console.error("Chat API error:", error);
      
      // Send appropriate error response
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      
      return res.status(500).json({ 
        message: "Even my errors are completely wrong! Please try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
