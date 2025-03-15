import ChatContainer from "@/components/Chat/ChatContainer";
import ChatSidebar from "@/components/Chat/ChatSidebar";
import UsernameModal from "@/components/Chat/UsernameModal";
import { useState, useEffect } from "react";
import useChat from "@/hooks/useChat";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { toast } = useToast();
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearError,
    activeSessionId,
    selectSession,
    startNewChat
  } = useChat({ 
    userId: userId || undefined,
    username
  });

  // Load user data from local storage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("chat_username");
    const storedUserId = localStorage.getItem("chat_user_id");
    
    if (storedUsername) {
      setUsername(storedUsername);
      if (storedUserId) {
        setUserId(parseInt(storedUserId, 10));
      } else {
        registerUser(storedUsername);
      }
    } else {
      setShowModal(true);
    }
  }, []);

  // Register a user with the backend
  const registerUser = async (name: string) => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/auth",
        { username: name }
      );
      
      const data = await response.json();
      if (data.user && data.user.id) {
        setUserId(data.user.id);
        localStorage.setItem("chat_user_id", data.user.id.toString());
      }
    } catch (error) {
      console.error("Failed to register user:", error);
      toast({
        title: "Error",
        description: "Failed to register user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSetUsername = (name: string) => {
    if (name.length >= 2) {
      setUsername(name);
      localStorage.setItem("chat_username", name);
      registerUser(name);
      setShowModal(false);
    }
  };

  const handleChangeUsername = () => {
    setShowModal(true);
  };

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
  };

  const handleNewChat = () => {
    startNewChat();
  };

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary"></div>
        <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-secondary"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-accent"></div>
        <div className="absolute bottom-40 right-1/3 w-12 h-12 rounded-full bg-muted"></div>
      </div>
      
      <div className="relative z-10 flex h-full">
        {userId && (
          <ChatSidebar 
            userId={userId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            activeSessionId={activeSessionId}
          />
        )}
        
        <div className="flex-1 flex flex-col h-full">
          <ChatContainer 
            username={username} 
            onChangeUsername={handleChangeUsername}
            messages={messages}
            isLoading={isLoading}
            error={error}
            sendMessage={sendMessage}
            clearError={clearError}
          />
        </div>
        
        <UsernameModal 
          isOpen={showModal} 
          onClose={() => {
            if (username) setShowModal(false);
          }} 
          onSubmit={handleSetUsername}
          defaultValue={username} 
        />
      </div>
    </div>
  );
}
