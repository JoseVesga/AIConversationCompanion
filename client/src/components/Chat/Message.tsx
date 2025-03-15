import { Message as MessageType } from "@/lib/types";

interface MessageProps {
  message: MessageType;
  username: string;
}

export default function Message({ message, username }: MessageProps) {
  const isUser = message.role === "user";
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-2 transform -rotate-6 shadow-md">
          <i className="fas fa-robot text-sm"></i>
        </div>
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : ''}`}>
        {!isUser && (
          <span className="text-xs font-medium ml-2 text-primary mb-1">DumAI</span>
        )}
        <div className={`
          p-3 rounded-lg 
          ${isUser 
            ? 'bg-gray-200 text-gray-800 rounded-tr-none max-w-[85%] shadow-sm border border-gray-300' 
            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tl-none max-w-[85%] shadow-md transform -rotate-1'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
          {formattedTime}
        </span>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center ml-2 shadow-sm">
          <i className="fas fa-user text-sm"></i>
        </div>
      )}
    </div>
  );
}
