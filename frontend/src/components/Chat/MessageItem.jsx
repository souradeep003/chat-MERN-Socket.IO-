import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../Common/Avatar';
import {
  formatMessageTime,
  getFileIcon,
  formatFileSize,
} from '../../utils/helpers';
import { messageAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

const MessageItem = ({ message, isOwn, showAvatar }) => {
  const user = useAuthStore((state) => state.user);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [imageLoaded, setImageLoaded] = useState(false);
  const emojiPickerRef = useRef(null);
  const actionsRef = useRef(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      setEditContent(message.content);
      return;
    }
    try {
      await messageAPI.edit(message._id, trimmed);
      setIsEditing(false);
      toast.success('Message updated');
    } catch (err) {
      toast.error('Failed to update message');
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageAPI.delete(message._id);
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleReaction = async (emojiData) => {
    try {
      await messageAPI.addReaction(message._id, emojiData.emoji);
      setShowEmojiPicker(false);
    } catch (err) {
      toast.error('Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (emoji) => {
    try {
      await messageAPI.removeReaction(message._id, emoji);
    } catch (err) {
      toast.error('Failed to remove reaction');
    }
  };

  // ─── Status Tick ────────────────────────────────────────────────────────────

  const renderStatus = () => {
    if (!isOwn) return null;
    const { status } = message;
    if (status === 'read') {
      return (
        <span className="text-blue-400 font-semibold" title="Read">
          ✓✓
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span className="text-gray-400 dark:text-gray-500" title="Delivered">
          ✓✓
        </span>
      );
    }
    return (
      <span className="text-gray-400 dark:text-gray-500" title="Sent">
        ✓
      </span>
    );
  };

  // ─── Reactions ──────────────────────────────────────────────────────────────

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const grouped = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [] };
      }
      acc[reaction.emoji].count += 1;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {});

    return (
      <div
        className={`flex flex-wrap gap-1 mt-1.5 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}
      >
        {Object.values(grouped).map((group) => {
          const reacted = group.users.includes(user && user._id);
          return (
            <button
              key={group.emoji}
              onClick={() =>
                reacted
                  ? handleRemoveReaction(group.emoji)
                  : handleReaction({ emoji: group.emoji })
              }
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border transition ${
                reacted
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={reacted ? 'Remove reaction' : 'React'}
            >
              <span>{group.emoji}</span>
              <span className="text-gray-600 dark:text-gray-300">
                {group.count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // ─── File Block ──────────────────────────────────────────────────────────────

  const renderFileBlock = () => {
    const fileIcon = getFileIcon(message.fileName);
    const fileSize = formatFileSize(message.fileSize);
    const linkClass = isOwn
      ? 'bg-blue-700 border-blue-500'
      : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    const nameClass = isOwn
      ? 'text-white'
      : 'text-gray-900 dark:text-white';
    const sizeClass = isOwn
      ? 'text-blue-200'
      : 'text-gray-500 dark:text-gray-400';
    const iconClass = isOwn
      ? 'text-blue-200'
      : 'text-gray-500 dark:text-gray-400';

    return (
      <a
        href={message.fileUrl}
        download={message.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center space-x-3 p-3 rounded-xl border transition hover:opacity-80 ${linkClass}`}
      >
        <span className="text-3xl flex-shrink-0">{fileIcon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${nameClass}`}>
            {message.fileName}
          </p>
          <p className={`text-xs ${sizeClass}`}>{fileSize}</p>
        </div>
        <svg
          className={`w-5 h-5 flex-shrink-0 ${iconClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </a>
    );
  };

  // ─── Message Content ────────────────────────────────────────────────────────

  const renderContent = () => {
    // Deleted message
    if (message.deleted) {
      return (
        <p className="italic text-sm text-gray-400 dark:text-gray-500 select-none">
          🚫 This message was deleted
        </p>
      );
    }

    // Image
    if (message.type === 'image') {
      return (
        <div className="space-y-2">
          <div
            className={`relative rounded-xl overflow-hidden max-w-xs ${
              !imageLoaded
                ? 'bg-gray-200 dark:bg-gray-700 animate-pulse h-48 w-64'
                : ''
            }`}
          >
            <img
              src={message.fileUrl}
              alt="Shared"
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.fileUrl, '_blank')}
              className={`rounded-xl cursor-pointer hover:opacity-90 transition max-w-xs max-h-64 object-cover w-full ${
                imageLoaded ? 'block' : 'hidden'
              }`}
            />
          </div>
          {message.content && (
            <p className="text-sm break-words whitespace-pre-wrap px-1">
              {message.content}
            </p>
          )}
        </div>
      );
    }

    // File — uses helper to avoid JSX-in-return parser bug
    if (message.type === 'file') {
      return renderFileBlock();
    }

    // Editing mode
    if (isEditing) {
      return (
        <div className="space-y-2 min-w-[200px]">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleEditKeyDown}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Save
            </button>
            <span className="text-gray-400">·</span>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400"
            >
              Cancel
            </button>
            <span className="text-gray-400 ml-auto">
              Enter to save · Esc to cancel
            </span>
          </div>
        </div>
      );
    }

    // Plain text
    return (
      <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
        {message.content}
      </p>
    );
  };

  // ─── Action Buttons ─────────────────────────────────────────────────────────

  const renderActions = () => {
    if (!showActions || message.deleted) return null;

    return (
      <div
        ref={actionsRef}
        className={`absolute -top-10 ${
          isOwn ? 'right-0' : 'left-0'
        } flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 z-20`}
      >
        {/* React */}
        <button
          onClick={() => setShowEmojiPicker((v) => !v)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-base"
          title="Add Reaction"
        >
          😊
        </button>

        {/* Reply placeholder */}
        <button
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title="Reply"
        >
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        {/* Edit — own text messages only */}
        {isOwn && message.type === 'text' && !message.deleted && (
          <button
            onClick={() => {
              setIsEditing(true);
              setShowActions(false);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Edit"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

        {/* Delete — own messages only */}
        {isOwn && (
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
            title="Delete"
          >
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex items-end gap-2 group ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar — other users only */}
      <div className="flex-shrink-0 self-end mb-1">
        {!isOwn ? (
          showAvatar ? (
            <Avatar user={message.sender} size="sm" />
          ) : (
            <div className="w-8 h-8" />
          )
        ) : null}
      </div>

      {/* Bubble + Metadata */}
      <div
        className={`flex flex-col max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender name in group chats */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
            {message.sender && message.sender.name}
          </span>
        )}

        {/* Bubble */}
        <div className="relative">
          {renderActions()}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className={`absolute z-30 ${
                isOwn ? 'right-0' : 'left-0'
              } bottom-full mb-12`}
            >
              <EmojiPicker
                onEmojiClick={handleReaction}
                height={350}
                searchDisabled={false}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all ${
              isOwn
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
            } ${message.deleted ? 'opacity-60' : ''}`}
          >
            {renderContent()}
          </div>
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Time + Edited + Status */}
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 text-xs text-gray-400 dark:text-gray-500 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.edited && !message.deleted && (
            <span className="italic">· edited</span>
          )}
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;