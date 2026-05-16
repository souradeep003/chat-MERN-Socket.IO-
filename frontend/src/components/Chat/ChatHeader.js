import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../Common/Avatar';
import GroupInfoModal from './GroupInfoModal';

const ChatHeader = () => {
  const user = useAuthStore((state) => state.user);
  const { activeConversation, onlineUsers, typingUsers } = useChatStore();
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  if (!activeConversation) return null;

  const otherUser = activeConversation.participants?.find(p => p._id !== user?._id);
  const isOnline = onlineUsers.includes(otherUser?._id);
  const isTyping = typingUsers[otherUser?._id];

  const getDisplayName = () => {
    if (activeConversation.isGroup) {
      return activeConversation.name;
    }
    return otherUser?.name || 'Unknown User';
  };

  const getStatus = () => {
    if (activeConversation.isGroup) {
      return `${activeConversation.participants.length} members`;
    }
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    return 'offline';
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          {activeConversation.isGroup ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {activeConversation.name?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Avatar user={otherUser} size="md" showOnline={isOnline} />
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getDisplayName()}
            </h2>
            <p className={`text-sm ${isTyping ? 'text-blue-600 dark:text-blue-400 italic' : 'text-gray-500 dark:text-gray-400'}`}>
              {getStatus()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Video Call */}
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Voice Call */}
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>

          {/* Info */}
          <button
            onClick={() => setShowGroupInfo(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showGroupInfo && activeConversation.isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={activeConversation}
        />
      )}
    </>
  );
};

export default ChatHeader;