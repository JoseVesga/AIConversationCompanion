import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string) => void;
  defaultValue?: string;
}

export default function UsernameModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  defaultValue = ""
}: UsernameModalProps) {
  const [username, setUsername] = useState(defaultValue);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    
    setUsername(defaultValue);
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 2) {
      setError("Please enter a valid name (at least 2 characters)");
      return;
    }
    
    setError("");
    onSubmit(username.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-robot text-2xl"></i>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Welcome to DumAI
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Please enter your name to get started with the world's most hilariously incorrect AI assistant.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label htmlFor="username-input" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <Input
              ref={inputRef}
              id="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
              required
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
          >
            Start Chatting
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
