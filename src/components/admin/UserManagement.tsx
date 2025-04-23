import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit, Trash2, RefreshCw, BookmarkCheck, Clock, Database } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { historyService } from '../../services/historyService'; 
import { bookmarkService } from '../../services/bookmarkService';
import type { Profile } from '../../types/newsapi';

interface UserManagementProps {
  initialUsers?: Profile[];
  loading?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ initialUsers, loading: externalLoading }) => {
  const [users, setUsers] = useState<Profile[]>(initialUsers || []);
  const [loading, setLoading] = useState<boolean>(externalLoading || false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<Record<string, { bookmarks: number; history: number }>>({}); 
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
    } else {
      fetchUsers();
    }
  }, [initialUsers]);

  // Fetch user activity stats when users load
  useEffect(() => {
    if (users.length > 0) {
      fetchUserStats();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError(`Error fetching users: ${usersError.message}`);
        throw usersError;
      }
        
      setUsers(usersData || []);
      console.log(`Fetched ${usersData?.length || 0} users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    const stats: Record<string, { bookmarks: number; history: number }> = {};
    
    try {
      // Fetch stats for a small sample of users to avoid overloading
      const sampleUsers = users.slice(0, 10);
      
      for (const user of sampleUsers) {
        // Get bookmark count
        const bookmarks = await bookmarkService.getUserBookmarks(user.id, false);
        
        // Get history count
        const history = await historyService.getUserHistory(user.id, 100, false);
        
        stats[user.id] = {
          bookmarks: bookmarks.length,
          history: history.length
        };
      }
      
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleRefreshUsers = async () => {
    setRefreshing(true);
    await fetchUsers();
    await fetchUserStats();
    setRefreshing(false);
  };

  const handleViewUserDetail = (user: Profile) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete user from Supabase Auth (this will cascade to delete profiles and related data)
      // This is a simplified demonstration - in a real app, you'd use admin APIs
      const { error: deleteError } = await supabase.rpc('delete_user', { user_id: userId });
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId: string) => {
    // This would be implemented in a full application
    console.log('Edit user:', userId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <div className="flex items-center space-x-2">
          <p className="text-gray-400">Total: {users.length} users</p>
          <button 
            onClick={handleRefreshUsers} 
            className={`p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors`}
            disabled={refreshing}
            title="Refresh user list"
          >
            <RefreshCw className={`h-4 w-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-md p-4 text-red-300">
          <h3 className="font-medium mb-1">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {users.length === 0 && !loading ? (
        <div className="text-center py-10 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400">No users found.</p>
        </div>
      ) : (
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/30">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-white font-medium">{user.username?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-900/40 text-purple-300' 
                        : 'bg-blue-900/40 text-blue-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString() 
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3 text-xs">
                      {userStats[user.id] ? (
                        <>
                          <span className="flex items-center text-blue-300">
                            <BookmarkCheck className="h-3.5 w-3.5 mr-1" />
                            {userStats[user.id].bookmarks}
                          </span>
                          <span className="flex items-center text-gray-400">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {userStats[user.id].history}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Loading...</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-700/70 transition-colors" 
                        title="View User Data"
                        onClick={() => handleViewUserDetail(user)}
                      >
                        <Database className="h-4 w-4 text-gray-400" />
                      </button>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-700/70 transition-colors" 
                        title="Edit User"
                        onClick={() => handleEditUser(user.id)}
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-700/70 transition-colors" 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* User Detail Modal would be implemented here */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              User Details: {selectedUser.username}
            </h3>
            {/* User details content would go here */}
            <div className="space-y-4">
              <p>This feature is not fully implemented in the demo.</p>
              <button 
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                onClick={() => setShowUserDetail(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;