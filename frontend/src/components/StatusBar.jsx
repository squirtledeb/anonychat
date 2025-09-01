import React from 'react';

const StatusBar = ({ state }) => {
  const getStatusInfo = () => {
    switch (state) {
      case 'idle':
        return { text: 'Ready to chat', color: 'bg-gray-500', icon: '💬' };
      case 'searching':
        return { text: 'Searching for stranger...', color: 'bg-yellow-500', icon: '🔍' };
      case 'chatting':
        return { text: 'Connected with stranger', color: 'bg-green-500', icon: '✅' };
      case 'disconnected':
        return { text: 'Stranger left', color: 'bg-red-500', icon: '❌' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500', icon: '❓' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="mb-6">
      <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${status.color}`}>
        <span className="mr-2">{status.icon}</span>
        {status.text}
      </div>
    </div>
  );
};

export default StatusBar;
