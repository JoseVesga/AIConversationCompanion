import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, detectLanguage, generateRandomPersonality } from "./openai";
import { z } from "zod";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

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

  // User endpoints
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(30),
        password: z.string().min(6)
      });

      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: validation.error.errors 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validation.data.username);
      if (existingUser) {
        // For simplicity, we'll just return the existing user
        return res.status(200).json({ user: { id: existingUser.id, username: existingUser.username } });
      }

      // Create new user
      const user = await storage.createUser(validation.data);
      return res.status(201).json({ user: { id: user.id, username: user.username } });
    } catch (error: any) {
      console.error("User creation error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Quick user registration/login endpoint
  app.post('/api/auth', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        username: z.string().min(2).max(30)
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid username",
          errors: validation.error.errors
        });
      }
      
      const { username } = validation.data;
      
      // Check if user exists
      let user = await storage.getUserByUsername(username);
      
      // Create user if doesn't exist
      if (!user) {
        user = await storage.createUser({
          username,
          password: "dummypassword" // In a real app, handle proper authentication
        });
      }
      
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error: any) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Chat session endpoints
  app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        title: z.string().optional()
      });

      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: validation.error.errors 
        });
      }

      const { userId, title = "New Chat" } = validation.data;
      
      // Generate a random personality for this chat
      const personality = generateRandomPersonality();
      
      // Create new chat session
      const session = await storage.createChatSession({
        userId,
        title,
        personality
      });

      return res.status(201).json({ session });
    } catch (error: any) {
      console.error("Session creation error:", error);
      return res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get user's sessions
  app.get('/api/users/:userId/sessions', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const sessions = await storage.getChatSessionsByUserId(userId);
      return res.status(200).json({ sessions });
    } catch (error: any) {
      console.error("Get sessions error:", error);
      return res.status(500).json({ message: "Failed to get user sessions" });
    }
  });

  // Get messages for a session
  app.get('/api/sessions/:sessionId/messages', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      const messages = await storage.getChatMessagesBySessionId(sessionId);
      return res.status(200).json({ messages });
    } catch (error: any) {
      console.error("Get messages error:", error);
      return res.status(500).json({ message: "Failed to get chat messages" });
    }
  });

  // Chat endpoints
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        message: z.string().optional(),
        initial: z.boolean().optional(),
        sessionId: z.string().optional(),
        userId: z.number().optional(),
        username: z.string().optional()
      });

      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validation.error.errors 
        });
      }

      const { message = "", initial = false, sessionId, userId, username } = validation.data;
      
      // Detect language from user message
      const detectedLanguage = message ? detectLanguage(message) : "english";
      
      // Ensure we have a session
      let activeSessionId = sessionId;
      let personality: string | undefined;
      
      // Generate a title from the user's message
      const generateTitle = (msg: string): string => {
        if (!msg || msg.trim().length === 0) return "New Chat";
        
        // Extract first line and limit to reasonable length
        const firstLine = msg.split(/\r?\n/)[0].trim();
        
        // If there's a question mark, use everything up to that
        if (firstLine.includes("?")) {
          const questionPart = firstLine.split("?")[0] + "?";
          return questionPart.length > 40 ? questionPart.substring(0, 37) + "...?" : questionPart;
        }
        
        // Otherwise use the first part of the message
        return firstLine.length > 40 ? firstLine.substring(0, 37) + "..." : firstLine;
      };
      
      if (!activeSessionId && userId) {
        // Create a new session if one wasn't provided
        const user = await storage.getUser(userId);
        
        // Generate an appropriate title
        const chatTitle = initial ? "New Chat" : generateTitle(message);
        
        if (!user && username) {
          // Create user if they don't exist
          const newUser = await storage.createUser({
            username,
            password: "defaultPassword" // In a real app, handle this more securely
          });
          
          const newSession = await storage.createChatSession({
            userId: newUser.id,
            title: chatTitle,
            personality: generateRandomPersonality()
          });
          
          activeSessionId = newSession.id;
          personality = newSession.personality;
        } else if (user) {
          const newSession = await storage.createChatSession({
            userId: user.id,
            title: chatTitle,
            personality: generateRandomPersonality()
          });
          
          activeSessionId = newSession.id;
          personality = newSession.personality;
        }
      } else if (activeSessionId) {
        // Get the personality for the existing session
        const session = await storage.getChatSession(activeSessionId);
        if (session) {
          personality = session.personality;
          
          // Update title if this is the first user message and the title is still "New Chat"
          if (!initial && message && session.title === "New Chat") {
            await storage.updateChatSessionTitle(session.id, generateTitle(message));
          }
        }
      } else {
        // No userId or sessionId, create a temporary session ID
        activeSessionId = uuidv4();
        personality = generateRandomPersonality();
      }
      
      if (!activeSessionId) {
        return res.status(400).json({ message: "Missing session ID or user ID" });
      }
      
      // Generate response from Groq with the personality and detected language
      const aiResponse = await generateChatResponse(message, initial, personality);
      
      // Store user message in database if needed
      if (!initial && message) {
        await storage.createChatMessage({
          sessionId: activeSessionId,
          content: message,
          role: "user",
          language: detectedLanguage
        });
      }
      
      // Store AI response
      await storage.createChatMessage({
        sessionId: activeSessionId,
        content: aiResponse,
        role: "assistant",
        language: detectedLanguage
      });
      
      // Return response with session info
      return res.status(200).json({ 
        message: aiResponse,
        sessionId: activeSessionId,
        language: detectedLanguage
      });
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
