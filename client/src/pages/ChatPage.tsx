import ChatContainer from "@/components/Chat/ChatContainer";
import UsernameModal from "@/components/Chat/UsernameModal";
import { useState, useEffect } from "react";

export default function ChatPage() {
  const [username, setUsername] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("chat_username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setShowModal(true);
    }
  }, []);

  const handleSetUsername = (name: string) => {
    if (name.length >= 2) {
      setUsername(name);
      localStorage.setItem("chat_username", name);
      setShowModal(false);
    }
  };

  const handleChangeUsername = () => {
    setShowModal(true);
  };

  return (
    <div className="bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50 h-screen flex flex-col relative">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-pink-400"></div>
        <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-yellow-400"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-blue-400"></div>
        <div className="absolute bottom-40 right-1/3 w-12 h-12 rounded-full bg-green-400"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <ChatContainer 
          username={username} 
          onChangeUsername={handleChangeUsername} 
        />
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
