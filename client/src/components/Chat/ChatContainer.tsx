import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import Message from "./Message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import useChat from "@/hooks/useChat";

interface ChatContainerProps {
  username: string;
  onChangeUsername: () => void;
}

export default function ChatContainer({ username, onChangeUsername }: ChatContainerProps) {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Add initial welcome message if there are no messages
  useEffect(() => {
    if (messages.length === 0 && username) {
      sendMessage("", true); // Send empty message to get welcome message
    }
  }, [username, messages.length, sendMessage]);

  return (
    <div id="chat-app" className="flex flex-col h-full">
      <ChatHeader username={username} onChangeUsername={onChangeUsername} />
      
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto px-4">
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="bg-primary text-white p-3 rounded-lg rounded-tl-none">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
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
                className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 inline-flex h-8 w-8"
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
