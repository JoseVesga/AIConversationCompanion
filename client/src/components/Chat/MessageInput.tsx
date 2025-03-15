import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    
    // Set the height to scrollHeight, limited to 150px max
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    onSendMessage(message.trim());
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Focus back on the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4 shadow-sm">
      <form className="flex items-end" onSubmit={handleSubmit}>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-none outline-none focus:ring-0 resize-none max-h-32 text-sm min-h-[40px]"
          placeholder="Type your message..."
          rows={1}
        />
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary-light text-white rounded-md px-4 py-2 ml-2 transition-colors duration-200 flex-shrink-0 text-sm font-medium h-auto"
          disabled={isLoading || !message.trim()}
        >
          <span>Send</span>
          <i className="fas fa-paper-plane ml-2"></i>
        </Button>
      </form>
    </div>
  );
}
