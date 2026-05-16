import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../Common/Avatar';
import { formatMessageTime, truncateText } from '../../utils/helpers';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const user = useAuthStore((state) => state.user);
  const { onlineUsers, unreadCounts } = useChatStore();

  const otherUser = conversation.participants?.find(p => p._id !== user?._id);
  const isOnline = onlineUsers.includes(otherUser?._id);
  const unreadCount = unreadCounts[conversation._id] || 0;

  const getDisplayName = () => {
    if (conversation.isGroup) {
      return conversation.name;
    }
    return otherUser?.name || 'Unknown User';
  };

  const getLastMessage = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { sender, content, type } = conversation.lastMessage;
    const senderName = sender._id === user?._id ? 'You' : sender.name.split(' ')[0];
    
    if (type === 'image') return `${senderName}: 📷 Photo`;
    if (type === 'file') return `${senderName}: 📎 File`;
    
    return `${senderName}: ${truncateText(content, 35)}`;
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.isGroup ? (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {conversation.name?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Avatar user={otherUser} size="md" showOnline={isOnline} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {getDisplayName()}
          </h3>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatMessageTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {getLastMessage()}
          </p>
          
          {unreadCount > 0 && (
            <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;