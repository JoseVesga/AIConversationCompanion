import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  userId: number;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  activeSessionId?: string;
}

export default function ChatSidebar({ 
  userId, 
  onSelectSession, 
  onNewChat, 
  activeSessionId 
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load chat sessions
  const loadSessions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/users/${userId}/sessions`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions when userId changes
  useEffect(() => {
    loadSessions();
  }, [userId]);

  // Refresh sessions when active session changes
  useEffect(() => {
    if (activeSessionId) {
      // Add a small delay to ensure the session is saved before refreshing
      const timeoutId = setTimeout(() => {
        loadSessions();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeSessionId]);

  // Auto-refresh sessions periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (userId) {
        loadSessions();
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Format relative time for chat sessions
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 bg-muted/20 border-r border-border h-full flex flex-col">
      <div className="p-3">
        <Button 
          variant="secondary" 
          className="w-full flex items-center justify-center"
          onClick={onNewChat}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id} 
                className={`
                  p-2 rounded-lg cursor-pointer transition-colors 
                  hover:bg-muted flex justify-between items-start group
                  ${session.id === activeSessionId ? 'bg-muted' : ''}
                `}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="overflow-hidden">
                  <div className="font-medium truncate flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(session.updatedAt)}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Delete functionality would go here
                    toast({
                      title: "Not Implemented",
                      description: "Chat deletion is not yet implemented.",
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border">
        <div className="text-xs text-center text-muted-foreground">
          <div className="font-semibold">DumAI</div>
          <div>Confidently Wrong Since 2025</div>
        </div>
      </div>
    </div>
  );
}