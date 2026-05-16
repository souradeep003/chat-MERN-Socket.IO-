import React, { useState } from 'react';
import Modal from '../Common/Modal';
import Avatar from '../Common/Avatar';
import { authAPI, conversationAPI } from '../../services/api';
import { useChatStore } from '../../store/chatStore';
import toast from 'react-hot-toast';

const NewChatModal = ({ isOpen, onClose, onSuccess }) => {
  const { setActiveConversation } = useChatStore();
  const [tab, setTab] = useState('user'); // 'user' or 'group'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await authAPI.searchUsers(query);
      setSearchResults(data);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateChat = async () => {
    if (tab === 'user' && selectedUsers.length !== 1) {
      toast.error('Please select one user');
      return;
    }

    if (tab === 'group') {
      if (!groupName.trim()) {
        toast.error('Please enter a group name');
        return;
      }
      if (selectedUsers.length < 2) {
        toast.error('Please select at least 2 users for a group');
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (tab === 'user') {
        response = await conversationAPI.create({
          participantId: selectedUsers[0]._id,
        });
      } else {
        response = await conversationAPI.createGroup({
          name: groupName,
          participants: selectedUsers.map((u) => u._id),
        });
      }

      toast.success(tab === 'user' ? 'Chat created' : 'Group created');
      setActiveConversation(response.data);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat" size="md">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('user')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              tab === 'user'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setTab('group')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              tab === 'group'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Create Group
          </button>
        </div>

        {/* Group Name Input */}
        {tab === 'group' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Search Users */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {tab === 'user' ? 'Search User' : 'Add Members'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Selected Users (for group) */}
        {tab === 'group' && selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 rounded-full"
              >
                <span className="text-sm">{user.name}</span>
                <button
                  onClick={() => toggleUserSelection(user)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2">
          {searching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users found
            </div>
          ) : (
            searchResults.map((user) => {
              const isSelected = selectedUsers.find((u) => u._id === user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => {
                    if (tab === 'user') {
                      setSelectedUsers([user]);
                    } else {
                      toggleUserSelection(user);
                    }
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={loading || selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : tab === 'user' ? (
              'Start Chat'
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewChatModal;