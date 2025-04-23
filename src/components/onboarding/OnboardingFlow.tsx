import React, { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  title: string;
  description: string;
  component: React.ReactNode;
}

const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    keywords: [] as string[],
    categories: [] as string[],
    sources: [] as string[],
    excluded_keywords: [] as string[]
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [excludedKeywordInput, setExcludedKeywordInput] = useState('');

  const categories = [
    { id: 'business', name: 'Business' },
    { id: 'crypto', name: 'Cryptocurrency' },
    { id: 'stocks', name: 'Stock Market' },
    { id: 'technology', name: 'Technology' },
    { id: 'web3', name: 'Web3' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' }
  ];

  const sources = [
    { id: 'bloomberg', name: 'Bloomberg' },
    { id: 'cnn', name: 'CNN' },
    { id: 'bbc-news', name: 'BBC News' },
    { id: 'reuters', name: 'Reuters' },
    { id: 'techcrunch', name: 'TechCrunch' },
    { id: 'the-verge', name: 'The Verge' },
    { id: 'wired', name: 'Wired' }
  ];

  const handleAddKeyword = () => {
    if (keywordInput && !preferences.keywords.includes(keywordInput)) {
      setPreferences({
        ...preferences,
        keywords: [...preferences.keywords, keywordInput]
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setPreferences({
      ...preferences,
      keywords: preferences.keywords.filter(k => k !== keyword)
    });
  };

  const handleAddExcludedKeyword = () => {
    if (excludedKeywordInput && !preferences.excluded_keywords.includes(excludedKeywordInput)) {
      setPreferences({
        ...preferences,
        excluded_keywords: [...preferences.excluded_keywords, excludedKeywordInput]
      });
      setExcludedKeywordInput('');
    }
  };

  const handleRemoveExcludedKeyword = (keyword: string) => {
    setPreferences({
      ...preferences,
      excluded_keywords: preferences.excluded_keywords.filter(k => k !== keyword)
    });
  };

  const toggleCategory = (categoryId: string) => {
    if (preferences.categories.includes(categoryId)) {
      setPreferences({
        ...preferences,
        categories: preferences.categories.filter(c => c !== categoryId)
      });
    } else {
      setPreferences({
        ...preferences,
        categories: [...preferences.categories, categoryId]
      });
    }
  };

  const toggleSource = (sourceId: string) => {
    if (preferences.sources.includes(sourceId)) {
      setPreferences({
        ...preferences,
        sources: preferences.sources.filter(s => s !== sourceId)
      });
    } else {
      setPreferences({
        ...preferences,
        sources: [...preferences.sources, sourceId]
      });
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    try {
      // Using upsert instead of insert to handle cases where user preferences already exist
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        keywords: preferences.keywords,
        categories: preferences.categories,
        sources: preferences.sources,
        excluded_keywords: preferences.excluded_keywords,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving preferences:', error);
        return;
      }

      // Redirect to home page after successful completion
      navigate('/dashboard');
    } catch (error) {
      console.error('Error in handleComplete:', error);
    }
  };

  const steps: OnboardingStep[] = [
    {
      title: 'Interests',
      description: 'What topics are you most interested in?',
      component: (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Add keywords to track</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="e.g., Bitcoin, AI, Investment"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {preferences.keywords.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Your keywords</label>
              <div className="flex flex-wrap gap-2">
                {preferences.keywords.map((keyword) => (
                  <div key={keyword} className="bg-blue-900/40 px-3 py-1 rounded-full text-blue-200 text-sm flex items-center">
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Categories',
      description: 'Choose categories you want to follow',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-3 rounded-lg border ${
                  preferences.categories.includes(category.id)
                    ? 'bg-blue-900/40 border-blue-500/70 text-blue-200'
                    : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-700/70'
                } transition-colors flex items-center justify-between`}
              >
                <span>{category.name}</span>
                {preferences.categories.includes(category.id) && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Sources',
      description: 'Select your preferred news sources',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`p-3 rounded-lg border ${
                  preferences.sources.includes(source.id)
                    ? 'bg-blue-900/40 border-blue-500/70 text-blue-200'
                    : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-700/70'
                } transition-colors flex items-center justify-between`}
              >
                <span>{source.name}</span>
                {preferences.sources.includes(source.id) && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Exclusions',
      description: 'What topics would you like to exclude?',
      component: (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Add keywords to exclude</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={excludedKeywordInput}
                onChange={(e) => setExcludedKeywordInput(e.target.value)}
                placeholder="e.g., Politics, Sports"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddExcludedKeyword()}
              />
              <button
                onClick={handleAddExcludedKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {preferences.excluded_keywords.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Your excluded keywords</label>
              <div className="flex flex-wrap gap-2">
                {preferences.excluded_keywords.map((keyword) => (
                  <div key={keyword} className="bg-red-900/40 px-3 py-1 rounded-full text-red-200 text-sm flex items-center">
                    {keyword}
                    <button
                      onClick={() => handleRemoveExcludedKeyword(keyword)}
                      className="ml-2 text-red-300 hover:text-red-100"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="w-full h-2 bg-gray-800">
        <motion.div 
          className="h-full bg-blue-600" 
          initial={{ width: '0%' }}
          animate={{ width: `${currentStepPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="max-w-2xl mx-auto p-6 md:py-12">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
            <p className="text-gray-400">{steps[currentStep].description}</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 shadow-xl">
            {steps[currentStep].component}
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg flex items-center ${
                currentStep === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFlow;