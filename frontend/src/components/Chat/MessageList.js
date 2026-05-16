import React, { useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import MessageItem from './MessageItem';
import { format, isSameDay } from 'date-fns';

const MessageList = ({ messages, hasMore, onLoadMore, loading }) => {
  const user = useAuthStore((state) => state.user);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more when scrolled to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      onLoadMore();
    }
  };

  const renderDateSeparator = (date) => (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
        {format(new Date(date), 'MMMM dd, yyyy')}
      </div>
    </div>
  );

  const groupedMessages = messages.reduce((groups, message, index) => {
    const currentDate = new Date(message.createdAt);
    const previousMessage = messages[index - 1];
    const previousDate = previousMessage ? new Date(previousMessage.createdAt) : null;

    if (!previousDate || !isSameDay(currentDate, previousDate)) {
      groups.push({
        type: 'date',
        date: currentDate,
      });
    }

    groups.push({
      type: 'message',
      data: message,
    });

    return groups;
  }, []);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin bg-gray-50 dark:bg-gray-900"
    >
      {loading && hasMore && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return <div key={`date-${index}`}>{renderDateSeparator(item.date)}</div>;
        }

        const message = item.data;
        const isOwn = message.sender._id === user?._id;
        const showAvatar = !isOwn && (
          index === groupedMessages.length - 1 ||
          groupedMessages[index + 1]?.type === 'date' ||
          groupedMessages[index + 1]?.data?.sender._id !== message.sender._id
        );

        return (
          <MessageItem
            key={message._id}
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
          />
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;