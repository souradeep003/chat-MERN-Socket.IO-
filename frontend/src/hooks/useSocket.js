import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import socketService from '../services/socket';

export const useSocket = () => {
  const { token, user } = useAuthStore();
  const {
    setOnlineUsers,
    setTyping,
    updateConversation,
    incrementUnreadCount,
    activeConversation,
  } = useChatStore();

  useEffect(() => {
    if (token && user) {
      // Connect socket
      socketService.connect(token);

      // Listen to online users
      socketService.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      // Listen to typing events
      socketService.on('typing:start', (data) => {
        setTyping(data.userId, true);
      });

      socketService.on('typing:stop', (data) => {
        setTyping(data.userId, false);
      });

      // Listen to conversation updates
      socketService.on('conversation:updated', (data) => {
        updateConversation(data.conversationId, data.updates);
      });

      // Listen to new messages for unread count
      socketService.on('message:new', (message) => {
        // Increment unread count if not active conversation
        if (message.conversation !== activeConversation?._id) {
          incrementUnreadCount(message.conversation);
        }

        // Update last message in conversation
        updateConversation(message.conversation, {
          lastMessage: message,
        });
      });

      // Cleanup on unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [token, user]);

  return socketService;
};