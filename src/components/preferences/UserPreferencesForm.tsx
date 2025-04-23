import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getUserPreferences, 
  updateUserPreferences, 
  getDefaultPreferences, 
  getAvailableCategories, 
  getAvailableSources,
  clearPreferencesCache,
  getAvailableLanguages
} from '../../services/preferencesService';
import type { UserPreference } from '../../types/newsapi';

interface UserPreferencesFormProps {
  userId: string;
  onSaved?: () => void;
}

const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({ userId, onSaved }) => {
  const [preferences, setPreferences] = useState<Partial<UserPreference> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Input states
  const [keywordInput, setKeywordInput] = useState('');
  const [excludedKeywordInput, setExcludedKeywordInput] = useState('');
  
  // Available options
  const categories = getAvailableCategories();
  const sources = getAvailableSources();
  const languages = getAvailableLanguages();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userPrefs = await getUserPreferences(userId);
        
        if (userPrefs) {
          setPreferences(userPrefs);
        } else {
          // Create default preferences if none exist
          setPreferences(getDefaultPreferences(userId));
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError('Failed to load your preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [userId]);
  
  const handleAddKeyword = () => {
    if (!keywordInput.trim() || !preferences) return;
    
    const normalizedKeyword = keywordInput.trim().toLowerCase();
    
    // Don't add if already exists
    if (preferences.keywords?.includes(normalizedKeyword)) {
      setKeywordInput('');
      return;
    }
    
    setPreferences({
      ...preferences,
      keywords: [...(preferences.keywords || []), normalizedKeyword]
    });
    setKeywordInput('');
  };
  
  const handleRemoveKeyword = (keyword: string) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      keywords: preferences.keywords?.filter(k => k !== keyword) || []
    });
  };
  
  const handleAddExcludedKeyword = () => {
    if (!excludedKeywordInput.trim() || !preferences) return;
    
    const normalizedKeyword = excludedKeywordInput.trim().toLowerCase();
    
    // Don't add if already exists
    if (preferences.excluded_keywords?.includes(normalizedKeyword)) {
      setExcludedKeywordInput('');
      return;
    }
    
    setPreferences({
      ...preferences,
      excluded_keywords: [...(preferences.excluded_keywords || []), normalizedKeyword]
    });
    setExcludedKeywordInput('');
  };
  
  const handleRemoveExcludedKeyword = (keyword: string) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      excluded_keywords: preferences.excluded_keywords?.filter(k => k !== keyword) || []
    });
  };
  
  const toggleCategory = (categoryId: string) => {
    if (!preferences) return;
    
    const currentCategories = preferences.categories || [];
    
    if (currentCategories.includes(categoryId)) {
      setPreferences({
        ...preferences,
        categories: currentCategories.filter(c => c !== categoryId)
      });
    } else {
      setPreferences({
        ...preferences,
        categories: [...currentCategories, categoryId]
      });
    }
  };
  
  const toggleSource = (sourceId: string) => {
    if (!preferences) return;
    
    const currentSources = preferences.sources || [];
    
    if (currentSources.includes(sourceId)) {
      setPreferences({
        ...preferences,
        sources: currentSources.filter(s => s !== sourceId)
      });
    } else {
      setPreferences({
        ...preferences,
        sources: [...currentSources, sourceId]
      });
    }
  };
  
  const toggleLanguage = (languageId: string) => {
    if (!preferences) return;
    
    const currentLanguages = preferences.languages || [];
    
    if (currentLanguages.includes(languageId)) {
      // Don't allow removing the last language
      if (currentLanguages.length <= 1) {
        return;
      }
      
      setPreferences({
        ...preferences,
        languages: currentLanguages.filter(l => l !== languageId)
      });
    } else {
      setPreferences({
        ...preferences,
        languages: [...currentLanguages, languageId]
      });
    }
  };
  
  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Ensure we have the user_id
      const prefsToSave = {
        ...preferences,
        user_id: userId
      };
      
      const result = await updateUserPreferences(prefsToSave);
      
      if (result) {
        // Clear cache to ensure we get fresh data next time
        clearPreferencesCache(userId);
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (onSaved) onSaved();
      } else {
        setError('Failed to save preferences. Please try again.');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('An error occurred while saving your preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-6 text-red-400">
        <p>Failed to load preferences. Please refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Keywords Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">Keywords to Track</h3>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="e.g., Bitcoin, AI, Investment"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <button
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          
          {preferences.keywords && preferences.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map((keyword) => (
                <div key={keyword} className="bg-blue-900/40 px-3 py-1 rounded-full text-blue-200 text-sm flex items-center">
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 text-blue-300 hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No keywords added yet. Add keywords to track specific topics.</p>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`p-3 rounded-lg border ${
                preferences.categories?.includes(category.id)
                  ? 'bg-blue-900/40 border-blue-500/70 text-blue-200'
                  : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-700/70'
              } transition-colors flex items-center justify-between`}
            >
              <span>{category.name}</span>
              {preferences.categories?.includes(category.id) && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </section>
      
      {/* Language Preferences Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">Language Preferences</h3>
        <p className="text-sm text-gray-400 mb-4">
          Select the languages you want to see articles in.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => toggleLanguage(language.id)}
              disabled={preferences.languages?.length === 1 && preferences.languages?.includes(language.id)}
              className={`p-3 rounded-lg border ${
                preferences.languages?.includes(language.id)
                  ? 'bg-blue-900/40 border-blue-500/70 text-blue-200'
                  : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-700/70'
              } ${
                preferences.languages?.length === 1 && preferences.languages?.includes(language.id)
                  ? 'opacity-70 cursor-not-allowed'
                  : ''
              } transition-colors flex items-center justify-between`}
            >
              <span>{language.name}</span>
              {preferences.languages?.includes(language.id) && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          You must select at least one language.
        </p>
      </section>
      
      {/* Sources Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">News Sources</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => toggleSource(source.id)}
              className={`p-3 rounded-lg border ${
                preferences.sources?.includes(source.id)
                  ? 'bg-blue-900/40 border-blue-500/70 text-blue-200'
                  : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-700/70'
              } transition-colors flex items-center justify-between`}
            >
              <span>{source.name}</span>
              {preferences.sources?.includes(source.id) && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </section>
      
      {/* Excluded Keywords Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">Excluded Keywords</h3>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={excludedKeywordInput}
              onChange={(e) => setExcludedKeywordInput(e.target.value)}
              placeholder="e.g., Politics, Sports"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddExcludedKeyword()}
            />
            <button
              onClick={handleAddExcludedKeyword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          
          {preferences.excluded_keywords && preferences.excluded_keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preferences.excluded_keywords.map((keyword) => (
                <div key={keyword} className="bg-red-900/40 px-3 py-1 rounded-full text-red-200 text-sm flex items-center">
                  {keyword}
                  <button
                    onClick={() => handleRemoveExcludedKeyword(keyword)}
                    className="ml-2 text-red-300 hover:text-red-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No excluded keywords added yet. Add keywords you want to avoid seeing.</p>
          )}
        </div>
      </section>
      
      {/* Save Button */}
      <div className="pt-4 border-t border-gray-700 flex justify-between items-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg flex items-center ${
            saving
              ? 'bg-blue-700/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
        
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        
        {success && (
          <motion.p 
            className="text-sm text-green-400 flex items-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check className="h-4 w-4 mr-1" />
            Preferences saved successfully
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default UserPreferencesForm;