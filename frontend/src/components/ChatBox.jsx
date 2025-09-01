import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, onSendMessage, onDisconnect, isDarkMode }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-[600px] sm:h-[700px] flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            isDarkMode ? 'bg-green-400' : 'bg-green-500'
          } animate-pulse`}></div>
          <span className={`font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Connected with stranger
          </span>
        </div>
        <button
          onClick={onDisconnect}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          Disconnect
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className={`text-center py-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p className="text-lg">Start the conversation!</p>
            <p className="text-sm mt-2">Send a message to begin chatting</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.from === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                message.from === 'me'
                  ? isDarkMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-blue-600 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 text-gray-800'
              }`}>
                <p className="text-sm sm:text-base break-words">{message.text}</p>
                <p className={`text-xs mt-1 opacity-70 ${
                  message.from === 'me' ? 'text-purple-100' : 'text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={`p-4 border-t ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
