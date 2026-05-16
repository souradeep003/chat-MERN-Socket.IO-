export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
};

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ACCEPTED_FILE_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
];

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  MESSAGE_REACTION: 'message:reaction',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USERS_ONLINE: 'users:online',
  CONVERSATION_UPDATED: 'conversation:updated',
};
