import React from 'react';
import { useChatStore } from '../../store/chatStore';
import ChatWindow from '../Chat/ChatWindow';
import Sidebar from './Sidebar';

const MobileChatWindow = () => {
  const { activeConversation, setActiveConversation } = useChatStore();

  if (activeConversation) {
    return (
      <div className="h-screen flex flex-col">
        {/* Back button */}
        <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <button
            onClick={() => setActiveConversation(null)}
            className="mr-3 text-gray-600 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Back to Chats
          </h2>
        </div>
        <ChatWindow />
      </div>
    );
  }

  return <Sidebar />;
};

export default MobileChatWindow;