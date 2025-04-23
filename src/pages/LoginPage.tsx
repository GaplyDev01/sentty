import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.search.includes('signup=true'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Update isLogin state when URL parameters change
  useEffect(() => {
    setIsLogin(!location.search.includes('signup=true'));
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      } else {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        
        const { error } = await signUp(email, password, username);
        if (error) throw error;
        navigate('/onboarding');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Update the URL to reflect the current auth mode
    navigate(isLogin ? '/login?signup=true' : '/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4">
      <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]"></div>
      
      {/* Back to Landing Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>
      
      <motion.div 
        className="max-w-md w-full bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700/50 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <Cpu className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          {isLogin ? 'Sign in to SophIQ' : 'Create a SophIQ account'}
        </h1>
        
        <p className="text-center text-gray-400 mb-6">
          {isLogin 
            ? 'Your personalized AI-powered news aggregator' 
            : 'Join SophIQ and get news tailored to your interests'}
        </p>
        
        {/* Auth Mode Tabs */}
        <div className="flex mb-8 bg-gray-900/70 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md transition-colors ${
              isLogin 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md transition-colors ${
              !isLogin 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-gray-300 pl-10 w-full py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-gray-300 pl-10 w-full py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-gray-300 pl-10 w-full py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>{isLogin ? 'Sign in' : 'Create account'}</>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-blue-400 hover:text-blue-300 focus:outline-none"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;