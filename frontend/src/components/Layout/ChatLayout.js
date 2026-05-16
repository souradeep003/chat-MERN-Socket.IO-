import React from 'react';
import Sidebar from './Sidebar';
import ChatWindow from '../Chat/ChatWindow';

const ChatLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Fixed width on desktop, full width on mobile */}
      <div className="w-full md:w-96 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Chat Window - Takes remaining space */}
      <div className="flex-1 hidden md:flex">
        <ChatWindow />
      </div>

      {/* Mobile: Show ChatWindow when conversation is active */}
      <div className="flex-1 md:hidden">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatLayout;