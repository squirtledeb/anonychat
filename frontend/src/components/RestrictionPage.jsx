import React from 'react';

const RestrictionPage = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
    }`}>
      <div className={`max-w-2xl mx-auto text-center ${
        isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
      } backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-12 border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Icon */}
        <div className="mb-8">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-red-600/20' : 'bg-red-100'
          }`}>
            <span className="text-6xl">🚫</span>
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Access Restricted
        </h1>

        {/* Message */}
        <div className={`mb-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <p className="text-lg mb-4">
            This anonymous chat application is only available to students connected to the college WiFi network.
          </p>
          <p className="text-base">
            Please connect to your college's WiFi network to access this service.
          </p>
        </div>

        {/* Instructions */}
        <div className={`mb-8 p-6 rounded-2xl ${
          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
        }`}>
          <h3 className={`font-semibold mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            How to connect:
          </h3>
          <ol className={`text-left space-y-2 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">1.</span>
              <span>Go to your device's WiFi settings</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">2.</span>
              <span>Connect to your college's WiFi network</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">3.</span>
              <span>Refresh this page once connected</span>
            </li>
          </ol>
        </div>

        {/* Contact Info */}
        <div className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>If you're already connected to college WiFi and still seeing this message,</p>
          <p>please contact your IT department for assistance.</p>
        </div>

        {/* Refresh Button */}
        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestrictionPage;
