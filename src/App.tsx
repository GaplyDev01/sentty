import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage'; 
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import UserPreferencesPage from './pages/UserPreferencesPage';
import FilteredArticlesPage from './pages/FilteredArticlesPage';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';
import CategoriesPage from './pages/CategoriesPage';
import SearchPage from './pages/SearchPage';

// Protected route component
const ProtectedRoute: React.FC<{ 
  element: React.ReactNode; 
  redirectPath?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}> = ({ 
  element, 
  redirectPath = '/login',
  requireAuth = true,
  requireAdmin = false
}) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (requireAuth && !user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{element}</>;
};

// Public route that redirects authenticated users to the dashboard
const PublicRoute: React.FC<{ 
  element: React.ReactNode; 
  redirectPath?: string;
}> = ({ 
  element, 
  redirectPath = '/dashboard'
}) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{element}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute element={<LandingPage />} />} />
      <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
      
      {/* Protected routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute element={<OnboardingFlow />} />
      } />
      
      <Route path="/dashboard" element={<ProtectedRoute element={<MainLayout />} />}>
        <Route index element={<HomePage />} />
        <Route path="article/:id" element={<ArticleDetailPage />} />
        <Route path="admin" element={
          <ProtectedRoute element={<AdminDashboard />} requireAdmin={true} />
        } />
        <Route path="preferences" element={<UserPreferencesPage />} />
        
        {/* Routes for filtered views */}
        <Route path="trending" element={<FilteredArticlesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="category/:id" element={<FilteredArticlesPage />} />
        
        {/* Bookmarks and history routes */}
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="history" element={<HistoryPage />} />
        
        {/* Search page */}
        <Route path="search" element={<SearchPage />} />
        
        {/* These routes would be implemented in a full application */}
        <Route path="profile" element={<div className="p-8 text-center text-gray-400">Profile section coming soon</div>} />
      </Route>
      
      {/* 404 route - redirect to landing or dashboard based on auth status */}
      <Route path="*" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}

export default AppWrapper;