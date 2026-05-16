import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useThemeStore } from '../../store/themeStore';
import { conversationAPI } from '../../services/api';
import ConversationItem from '../Chat/ConversationItem';
import NewChatModal from '../Chat/NewChatModal';
import Avatar from '../Common/Avatar';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  
  const { conversations, activeConversation, setConversations, setActiveConversation } = useChatStore();
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await conversationAPI.getAll();
      setConversations(data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants?.find(p => p._id !== user?._id);
    const name = conv.isGroup ? conv.name : otherUser?.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h1>
          
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* New Chat */}
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Profile */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="relative"
            >
              <Avatar user={user} size="sm" showOnline />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-center">No conversations yet</p>
              <p className="text-sm text-center mt-1">Start a new chat to get started</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isActive={activeConversation?._id === conversation._id}
                onClick={() => setActiveConversation(conversation)}
              />
            ))
          )}
        </div>

        {/* Profile Dropdown */}
        {showProfile && (
          <div className="absolute bottom-16 left-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar user={user} size="md" showOnline />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          isOpen={showNewChat}
          onClose={() => setShowNewChat(false)}
          onSuccess={fetchConversations}
        />
      )}
    </>
  );
};

export default Sidebar;