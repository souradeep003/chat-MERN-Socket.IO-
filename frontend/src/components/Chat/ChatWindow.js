import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messageAPI } from '../../services/api';
import socketService from '../../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import Loader from '../Common/Loader';
import toast from 'react-hot-toast';

const ChatWindow = () => {
  const user = useAuthStore((state) => state.user);
  const {
    activeConversation,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearUnreadCount,
  } = useChatStore();

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages();
      socketService.joinConversation(activeConversation._id);
      socketService.markAsRead(activeConversation._id);
      clearUnreadCount(activeConversation._id);

      // Socket listeners
      socketService.on('message:new', handleNewMessage);
      socketService.on('message:updated', handleMessageUpdate);
      socketService.on('message:deleted', handleMessageDelete);
      socketService.on('message:reaction', handleReaction);

      return () => {
        socketService.leaveConversation(activeConversation._id);
        socketService.off('message:new', handleNewMessage);
        socketService.off('message:updated', handleMessageUpdate);
        socketService.off('message:deleted', handleMessageDelete);
        socketService.off('message:reaction', handleReaction);
      };
    }
  }, [activeConversation?._id]);

  const fetchMessages = async (pageNum = 1) => {
    if (!activeConversation) return;
    
    setLoading(true);
    try {
      const { data } = await messageAPI.getMessages(activeConversation._id, pageNum);
      
      if (pageNum === 1) {
        setMessages(data.messages);
      } else {
        setMessages([...data.messages, ...messages]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === activeConversation?._id) {
      addMessage(message);
      
      // Mark as read if not from current user
      if (message.sender._id !== user?._id) {
        socketService.markAsRead(activeConversation._id);
      }
    }
  };

  const handleMessageUpdate = (data) => {
    updateMessage(data.messageId, data.updates);
  };

  const handleMessageDelete = (data) => {
    deleteMessage(data.messageId);
  };

  const handleReaction = (data) => {
    updateMessage(data.messageId, { reactions: data.reactions });
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Select a conversation
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      <ChatHeader />
      
      {loading && page === 1 ? (
        <Loader text="Loading messages..." />
      ) : (
        <>
          <MessageList
            messages={messages}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
            loading={loading}
          />
          <MessageInput />
        </>
      )}
    </div>
  );
};

export default ChatWindow;