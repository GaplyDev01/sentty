import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, FileText, Clock, Settings, BarChart2, Database, Calendar } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { aggregationService } from '../services/aggregationService';
import type { Profile, SystemSettings } from '../types/newsapi';

// Import admin components
import AdminOverview from '../components/admin/AdminOverview';
import UserManagement from '../components/admin/UserManagement';
import ArticleManagement from '../components/admin/ArticleManagement';
import AggregationManagement from '../components/admin/AggregationManagement';
import AggregationScheduler from '../components/admin/AggregationScheduler';
import SystemSettings from '../components/admin/SystemSettings';
import CryptoNewsConfig from '../components/admin/CryptoNewsConfig';

// Define tabs for easier maintenance
const TABS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ARTICLES: 'articles',
  AGGREGATION: 'aggregation',
  SCHEDULE: 'schedule',
  CRYPTO: 'crypto',
  SETTINGS: 'settings'
};

const AdminDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [users, setUsers] = useState<Profile[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemSettings | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  async function fetchData() {
    setLoading(true);
    setFetchError(null);
    
    try {
      // Always fetch system status for the header info
      const status = await aggregationService.getAggregationStatus();
      setSystemStatus(status);
      
      // Fetch data based on active tab or dashboard (which needs multiple data types)
      if (activeTab === TABS.USERS || activeTab === TABS.DASHBOARD) {
        console.log('Fetching users for admin dashboard');
        
        // Use the administrative API for admins
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
          setFetchError(`Error fetching users: ${usersError.message}`);
          throw usersError;
        }
        
        setUsers(usersData || []);
        console.log(`Fetched ${usersData?.length || 0} users`);
      }
      
      if (activeTab === TABS.ARTICLES || activeTab === TABS.DASHBOARD) {
        const { count, error: countError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('Error counting articles:', countError);
          setFetchError(`Error counting articles: ${countError.message}`);
          throw countError;
        }
        
        setArticlesCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error instanceof Error ? error.message : error);
      if (!fetchError) {
        setFetchError('Error fetching admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Check if the user has admin access before rendering
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <motion.h1 
        className="text-3xl font-bold text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Admin Dashboard
      </motion.h1>
      
      {fetchError && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-md p-4 text-red-300">
          <h3 className="font-medium mb-1">Error</h3>
          <p>{fetchError}</p>
        </div>
      )}
      
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="flex flex-wrap text-sm font-medium text-center border-b border-gray-700">
          <TabButton 
            isActive={activeTab === TABS.DASHBOARD} 
            onClick={() => setActiveTab(TABS.DASHBOARD)}
            icon={<BarChart2 className="h-4 w-4 mr-2" />}
            label="Dashboard"
          />
          
          <TabButton 
            isActive={activeTab === TABS.USERS} 
            onClick={() => setActiveTab(TABS.USERS)}
            icon={<Users className="h-4 w-4 mr-2" />}
            label="Users"
          />
          
          <TabButton 
            isActive={activeTab === TABS.ARTICLES} 
            onClick={() => setActiveTab(TABS.ARTICLES)}
            icon={<FileText className="h-4 w-4 mr-2" />}
            label="Articles"
          />
          
          <TabButton 
            isActive={activeTab === TABS.AGGREGATION} 
            onClick={() => setActiveTab(TABS.AGGREGATION)}
            icon={<Clock className="h-4 w-4 mr-2" />}
            label="Manual"
          />
          
          <TabButton 
            isActive={activeTab === TABS.SCHEDULE} 
            onClick={() => setActiveTab(TABS.SCHEDULE)}
            icon={<Calendar className="h-4 w-4 mr-2" />}
            label="Scheduler"
          />
          
          <TabButton 
            isActive={activeTab === TABS.CRYPTO} 
            onClick={() => setActiveTab(TABS.CRYPTO)}
            icon={<Database className="h-4 w-4 mr-2" />}
            label="Crypto News"
          />
          
          <TabButton 
            isActive={activeTab === TABS.SETTINGS} 
            onClick={() => setActiveTab(TABS.SETTINGS)}
            icon={<Settings className="h-4 w-4 mr-2" />}
            label="Settings"
          />
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {activeTab === TABS.DASHBOARD && (
                <AdminOverview 
                  usersCount={users.length}
                  articlesCount={articlesCount}
                  systemStatus={systemStatus}
                  onRefresh={fetchData}
                />
              )}
              
              {activeTab === TABS.USERS && (
                <UserManagement initialUsers={users} />
              )}
              
              {activeTab === TABS.ARTICLES && (
                <ArticleManagement articlesCount={articlesCount} />
              )}
              
              {activeTab === TABS.AGGREGATION && (
                <AggregationManagement 
                  systemStatus={systemStatus}
                  onRefresh={fetchData}
                />
              )}
              
              {activeTab === TABS.SCHEDULE && (
                <AggregationScheduler 
                  onUpdate={fetchData}
                />
              )}
              
              {activeTab === TABS.CRYPTO && (
                <CryptoNewsConfig />
              )}
              
              {activeTab === TABS.SETTINGS && (
                <SystemSettings />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 flex items-center ${
        isActive 
          ? 'bg-blue-900/30 text-blue-400 border-b-2 border-blue-500' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

export default AdminDashboard;