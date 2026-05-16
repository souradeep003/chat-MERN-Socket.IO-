import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else {
    return format(messageDate, 'MMM dd');
  }
};

export const formatLastSeen = (date) => {
  if (!date) return 'Offline';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = filename.split('.').pop().toLowerCase();
  return imageExtensions.includes(ext);
};

export const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    zip: '🗜️',
    rar: '🗜️',
    mp4: '🎥',
    mp3: '🎵',
  };
  return icons[ext] || '📎';
};

export const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};