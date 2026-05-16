import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emit events
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Typing indicator
  startTyping(conversationId) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing:stop', { conversationId });
  }

  // Join conversation room
  joinConversation(conversationId) {
    this.emit('conversation:join', conversationId);
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    this.emit('conversation:leave', conversationId);
  }

  // Send message
  sendMessage(data) {
    this.emit('message:send', data);
  }

  // Mark messages as read
  markAsRead(conversationId) {
    this.emit('message:read', { conversationId });
  }
}

export default new SocketService();