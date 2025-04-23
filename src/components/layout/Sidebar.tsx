import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, BarChart2, Bookmark, Clock, Layers, ChevronRight, ChevronLeft, Settings, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import { historyService } from '../../services/historyService';
import Logo from '../ui/Logo';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { isAdmin, profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Handle clicks outside of the profile menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current && 
        profileButtonRef.current && 
        !profileMenuRef.current.contains(event.target as Node) && 
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch counts for bookmarks and history
  useEffect(() => {
    if (!user) return;
    
    const fetchCounts = async () => {
      try {
        // Get bookmarks count
        const bookmarks = await bookmarkService.getUserBookmarks(user.id, false);
        setBookmarkCount(bookmarks.length);
        
        // Get history count (last 30 days)
        const history = await historyService.getUserHistory(user.id, 100, false);
        setHistoryCount(history.length);
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    };
    
    fetchCounts();
  }, [user]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center py-3 px-4 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600/20 text-blue-400' 
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
    }`;

  const iconClass = "h-5 w-5";

  return (
    <div className="relative">
      {/* Glow effect behind the right edge */}
      <div 
        className={`absolute top-0 bottom-0 right-0 w-8 -mr-8 bg-blue-500/10 blur-[18px] rounded-full pointer-events-none z-10 transition-all duration-300 ${
          collapsed ? 'opacity-30' : 'opacity-50'
        }`}
      />

      <motion.aside 
        className={`${sidebarWidth} bg-gray-900/50 border-r border-blue-900/30 h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 overflow-hidden rounded-tr-2xl rounded-br-2xl relative z-20`}
        layout
      >
        <div className="h-full flex flex-col py-4 px-2">
          <div className="px-2 mb-6">
            <Logo iconOnly={collapsed} />
          </div>
          
          <div className="space-y-1 flex-1">
            <NavLink to="/dashboard" end className={navLinkClass}>
              <Home className={iconClass} />
              {!collapsed && <span className="ml-3">Home</span>}
            </NavLink>
            
            <NavLink to="/dashboard/trending" className={navLinkClass}>
              <TrendingUp className={iconClass} />
              {!collapsed && <span className="ml-3">Trending</span>}
            </NavLink>
            
            <NavLink to="/dashboard/categories" className={navLinkClass}>
              <div className="flex items-center">
                <Layers className={iconClass} />
                {!collapsed && <span className="ml-3 flex-1">Categories</span>}
              </div>
            </NavLink>
            
            <NavLink to="/dashboard/bookmarks" className={navLinkClass}>
              <div className="flex items-center">
                <Bookmark className={iconClass} />
                {!collapsed && <span className="ml-3 flex-1">Bookmarks</span>}
                
                {bookmarkCount > 0 && (
                  <span className={`${collapsed ? 'ml-0' : 'ml-2'} px-1.5 py-0.5 text-xs bg-blue-900/60 text-blue-300 rounded-full`}>
                    {bookmarkCount}
                  </span>
                )}
              </div>
            </NavLink>
            
            {/* History link is removed as requested */}

            <NavLink to="/dashboard/preferences" className={navLinkClass}>
              <Settings className={iconClass} />
              {!collapsed && <span className="ml-3">Preferences</span>}
            </NavLink>
            
            {isAdmin && (
              <NavLink to="/dashboard/admin" className={navLinkClass}>
                <BarChart2 className={iconClass} />
                {!collapsed && <span className="ml-3">Admin</span>}
              </NavLink>
            )}
          </div>
          
          {/* User Profile Section with Dropdown */}
          <div className="mt-auto mb-3 px-2 relative">
            <button
              ref={profileButtonRef}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-full flex ${collapsed ? 'justify-center' : 'justify-start'} items-center p-2 rounded-lg transition-colors hover:bg-gray-800/70 text-gray-300`}
            >
              <div className={`rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 ${collapsed ? 'h-9 w-9' : 'h-10 w-10'}`}>
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile?.username || 'User'} 
                    className={`rounded-full object-cover ${collapsed ? 'h-9 w-9' : 'h-10 w-10'}`}
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {profile?.username?.[0] || user?.email?.[0] || <User className={collapsed ? 'h-5 w-5' : 'h-6 w-6'} />}
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium line-clamp-1">
                    {profile?.username || user?.email?.split('@')[0] || 'User'}
                  </p>
                  {profile?.role && (
                    <p className="text-xs text-gray-400 capitalize">
                      {profile.role}
                    </p>
                  )}
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div 
                ref={profileMenuRef}
                className={`absolute ${
                  collapsed 
                    ? 'left-16 bottom-0' 
                    : 'bottom-full left-0 mb-1'
                } w-48 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 z-50`}
              >
                <NavLink 
                  to="/dashboard/profile" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Profile
                </NavLink>
                <NavLink 
                  to="/dashboard/preferences" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  News Preferences
                </NavLink>
                {profile?.role === 'admin' && (
                  <NavLink 
                    to="/dashboard/admin" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <BarChart2 className="h-4 w-4 inline mr-2" />
                    Admin Dashboard
                  </NavLink>
                )}
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleSignOut();
                  }} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4 inline mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleSidebar}
            className="mx-auto flex items-center justify-center p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </motion.aside>
    </div>
  );
};

export default Sidebar;