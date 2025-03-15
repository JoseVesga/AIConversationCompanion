import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Generate response from OpenAI
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
    } catch (error) {
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
