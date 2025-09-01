import React from 'react';

const StatusBar = ({ state }) => {
  const getStatusInfo = () => {
    switch (state) {
      case 'idle':
        return { 
          text: 'Ready to chat', 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600', 
          icon: '💬',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
      case 'searching':
        return { 
          text: 'Searching for stranger...', 
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500', 
          icon: '🔍',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        };
      case 'chatting':
        return { 
          text: 'Connected with stranger', 
          color: 'bg-gradient-to-r from-green-500 to-emerald-500', 
          icon: '✅',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      case 'disconnected':
        return { 
          text: 'Stranger left', 
          color: 'bg-gradient-to-r from-red-500 to-pink-500', 
          icon: '❌',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      case 'backend_error':
        return { 
          text: 'Connection error', 
          color: 'bg-gradient-to-r from-red-500 to-orange-500', 
          icon: '⚠️',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      default:
        return { 
          text: 'Unknown', 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600', 
          icon: '❓',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="mb-8">
      <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-white text-sm font-medium shadow-lg ${status.color} ${status.bg} ${status.border} border backdrop-blur-sm`}>
        <span className="mr-3 text-lg animate-pulse">{status.icon}</span>
        <span className="font-semibold">{status.text}</span>
      </div>
    </div>
  );
};

export default StatusBar;
