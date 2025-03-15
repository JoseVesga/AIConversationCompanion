import { useState, useCallback } from "react";
import { ChatState, Message } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from 'uuid';

export default function useChat() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });

  const { messages, isLoading, error } = chatState;

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
        isInitial ? { initial: true } : { message: content }
      );
      
      const data = await response.json();
      
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
  }, [addMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError
  };
}
