import { useState, useCallback, useEffect } from "react";
import { ChatState, Message } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from 'uuid';

interface UseChatOptions {
  userId?: number;
  username?: string;
  initialSessionId?: string;
}

export default function useChat({ userId, username, initialSessionId }: UseChatOptions = {}) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId);

  const { messages, isLoading, error } = chatState;

  // Clear messages when switching sessions
  useEffect(() => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null
    });
    
    // If we have an active session, load its messages
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string) => {
    if (!sessionId) return;
    
    setChatState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest(
        "GET",
        `/api/sessions/${sessionId}/messages`
      );
      
      const data = await response.json();
      if (data.messages && Array.isArray(data.messages)) {
        // Convert timestamps to Date objects
        const formattedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setChatState(prev => ({ 
          ...prev, 
          messages: formattedMessages,
          isLoading: false
        }));
      }
    } catch (err) {
      setChatState(prev => ({
        ...prev,
        error: err instanceof Error 
          ? err.message 
          : "Failed to load messages. Please try again.",
        isLoading: false
      }));
    }
  };

  // Start a new chat
  const startNewChat = useCallback(() => {
    setActiveSessionId(undefined);
    setChatState({
      messages: [],
      isLoading: false,
      error: null
    });
    
    // Auto-start with welcome message
    if (username) {
      sendMessage("", true);
    }
  }, [username]);

  const addMessage = useCallback((message: Message) => {
    setChatState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, message]
    }));
  }, []);

  const clearError = useCallback(() => {
    setChatState((prevState) => ({
      ...prevState,
      error: null
    }));
  }, []);

  const sendMessage = useCallback(async (content: string, isInitial = false) => {
    // Skip adding user message for initial welcome message
    if (!isInitial) {
      // Add user message to the chat
      const userMessage: Message = {
        id: uuidv4(),
        content,
        role: "user",
        timestamp: new Date()
      };
      addMessage(userMessage);
    }

    // Set loading state
    setChatState((prevState) => ({
      ...prevState,
      isLoading: true,
      error: null
    }));

    try {
      // Make API request to the backend
      const response = await apiRequest(
        "POST",
        "/api/chat",
        {
          message: content,
          initial: isInitial,
          sessionId: activeSessionId,
          userId,
          username
        }
      );
      
      const data = await response.json();
      
      // Store the session ID if this is a new session
      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId);
      }
      
      // Add AI response to the chat
      const aiMessage: Message = {
        id: uuidv4(),
        content: data.message,
        role: "assistant", 
        timestamp: new Date()
      };
      
      addMessage(aiMessage);
    } catch (err) {
      setChatState((prevState) => ({
        ...prevState,
        error: err instanceof Error 
          ? err.message 
          : "Failed to get a response from the AI. Please try again."
      }));
    } finally {
      setChatState((prevState) => ({
        ...prevState,
        isLoading: false
      }));
    }
  }, [addMessage, activeSessionId, userId, username]);

  // Select a different chat session
  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    activeSessionId,
    selectSession,
    startNewChat
  };
}
