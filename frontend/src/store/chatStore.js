import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  unreadCounts: {},
  
  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (conversation) => set({ 
    activeConversation: conversation,
    messages: []
  }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg._id === messageId ? { ...msg, ...updates } : msg
    )
  })),
  
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(msg => msg._id !== messageId)
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  setTyping: (userId, isTyping) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [userId]: isTyping
    }
  })),
  
  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map(conv =>
      conv._id === conversationId ? { ...conv, ...updates } : conv
    )
  })),
  
  setUnreadCount: (conversationId, count) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [conversationId]: count
    }
  })),
  
  incrementUnreadCount: (conversationId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [conversationId]: (state.unreadCounts[conversationId] || 0) + 1
    }
  })),
  
  clearUnreadCount: (conversationId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [conversationId]: 0
    }
  })),
}));