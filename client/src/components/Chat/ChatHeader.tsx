interface ChatHeaderProps {
  username: string;
  onChangeUsername: () => void;
}

export default function ChatHeader({ username, onChangeUsername }: ChatHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white mr-3">
            <i className="fas fa-robot"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-800">DumAI</h1>
            <p className="text-xs text-gray-500 italic">Confidently wrong since 2025</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">
            Hi, <span>{username || 'User'}</span>
          </span>
          <button 
            onClick={onChangeUsername}
            className="text-primary hover:text-primary-light transition-colors duration-200"
          >
            <i className="fas fa-user-edit"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
