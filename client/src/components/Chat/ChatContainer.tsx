import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import Message from "./Message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { Message as MessageType } from "@/lib/types";

interface ChatContainerProps {
  username: string;
  onChangeUsername: () => void;
  messages: MessageType[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, isInitial?: boolean) => void;
  clearError: () => void;
}

export default function ChatContainer({ 
  username, 
  onChangeUsername,
  messages,
  isLoading,
  error,
  sendMessage,
  clearError
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Add initial welcome message if there are no messages and we're not explicitly starting a new chat
  useEffect(() => {
    // We only want to auto-send the welcome message when the component mounts initially
    // Not on every time messages array becomes empty (which happens when starting a new chat)
    const shouldSendWelcomeMessage = 
      messages.length === 0 && 
      username && 
      !isLoading; // Avoid multiple requests

    if (shouldSendWelcomeMessage) {
      // Use a flag in sessionStorage to prevent sending multiple initial messages
      const welcomeMessageSent = sessionStorage.getItem('welcome_message_sent');
      
      if (!welcomeMessageSent) {
        sessionStorage.setItem('welcome_message_sent', 'true');
        sendMessage("", true); // Send empty message to get welcome message
      }
    }
  }, []);

  return (
    <div id="chat-app" className="flex flex-col h-full">
      <ChatHeader username={username} onChangeUsername={onChangeUsername} />
      
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto px-4">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center flex-col text-center px-4">
            <div className="bg-muted/40 p-6 rounded-lg max-w-md">
              <h3 className="text-xl font-bold mb-2">Welcome to DumAI!</h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything, and I'll give you the most hilariously incorrect answer possible!
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> The more specific your question, the more absurdly wrong I can be!
              </p>
            </div>
          </div>
        ) : (
          <div className="message-container flex-1 overflow-y-auto py-4 space-y-4">
            {messages.map((message) => (
              <Message 
                key={message.id}
                message={message}
                username={username}
              />
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                  <img 
                    src="/images/dumai-icon.svg" 
                    alt="DumAI" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-lg rounded-tl-none">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {error}
                </p>
              </div>
              <button 
                type="button" 
                className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 inline-flex h-8 w-8 dark:bg-red-900/20 dark:text-red-300"
                onClick={clearError}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        <MessageInput onSendMessage={sendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
