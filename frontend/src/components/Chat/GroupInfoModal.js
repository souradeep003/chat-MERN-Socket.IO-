import React, { useState } from 'react';
import Modal from '../Common/Modal';
import Avatar from '../Common/Avatar';
import { conversationAPI, authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import toast from 'react-hot-toast';

const GroupInfoModal = ({ isOpen, onClose, conversation }) => {
  const user = useAuthStore((state) => state.user);
  const { updateConversation } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = conversation.admins?.includes(user?._id);

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === conversation.name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await conversationAPI.updateGroup(conversation._id, {
        name: groupName,
      });
      updateConversation(conversation._id, data);
      toast.success('Group name updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update group name');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await authAPI.searchUsers(query);
      // Filter out existing members
      const existingIds = conversation.participants.map((p) => p._id);
      setSearchResults(data.filter((u) => !existingIds.includes(u._id)));
    } catch (error) {
      toast.error('Failed to search users');
    }
  };

  const handleAddMember = async (userId) => {
    setLoading(true);
    try {
      const { data } = await conversationAPI.addMembers(conversation._id, [userId]);
      updateConversation(conversation._id, data);
      toast.success('Member added');
      setShowAddMembers(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the group?')) return;

    setLoading(true);
    try {
      const { data } = await conversationAPI.removeMember(conversation._id, userId);
      updateConversation(conversation._id, data);
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    setLoading(true);
    try {
      await conversationAPI.leaveGroup(conversation._id);
      toast.success('You left the group');
      onClose();
    } catch (error) {
      toast.error('Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group Info" size="md">
      <div className="space-y-6">
        {/* Group Avatar & Name */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
            {conversation.name?.charAt(0).toUpperCase()}
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleUpdateName}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setGroupName(conversation.name);
                }}
                className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {conversation.name}
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {conversation.participants.length} members
          </p>
        </div>

        {/* Members List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Members</h4>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                + Add Member
              </button>
            )}
          </div>

          {showAddMembers && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Search users..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              
              {searchResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      onClick={() => handleAddMember(result._id)}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <Avatar user={result} size="sm" />
                      <span className="text-sm text-gray-900 dark:text-white">{result.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {conversation.participants.map((member) => {
              const isMemberAdmin = conversation.admins?.includes(member._id);
              const isCurrentUser = member._id === user?._id;

              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar user={member} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.name} {isCurrentUser && '(You)'}
                      </p>
                      {isMemberAdmin && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">Admin</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Group Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLeaveGroup}
            disabled={loading}
            className="w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
          >
            Leave Group
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GroupInfoModal;