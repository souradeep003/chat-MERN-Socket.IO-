import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { uploadAPI } from '../../services/api';
import socketService from '../../services/socket';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const { activeConversation } = useChatStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(activeConversation._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.stopTyping(activeConversation._id);
    }, 2000);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const { data } = await uploadAPI.uploadFile(file);
      
      // Create preview
      setPreview({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: data.url,
        name: file.name,
        size: file.size,
      });
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !preview) return;

    const messageData = {
      conversation: activeConversation._id,
      content: message.trim(),
      type: preview ? preview.type : 'text',
    };

    if (preview) {
      messageData.fileUrl = preview.url;
      messageData.fileName = preview.name;
      messageData.fileSize = preview.size;
    }

    // Send via socket
    socketService.sendMessage(messageData);

    // Clear input and preview
    setMessage('');
    setPreview(null);
    setIsTyping(false);
    socketService.stopTyping(activeConversation._id);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      {/* File Preview */}
      {preview && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {preview.type === 'image' ? (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-2xl">
                  📎
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {preview.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(preview.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={removePreview}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
        >
          {uploading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Emoji Picker Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="1"
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 scrollbar-thin"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() && !preview}
          className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;