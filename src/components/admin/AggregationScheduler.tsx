import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addMinutes, addHours, parseISO } from 'date-fns';
import { aggregationService } from '../../services/aggregationService';

interface AggregationSchedulerProps {
  onUpdate: () => void;
}

const AggregationScheduler: React.FC<AggregationSchedulerProps> = ({ onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [frequency, setFrequency] = useState('15min');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Frequency options
  const frequencyOptions = [
    { value: '15min', label: 'Every 15 minutes' },
    { value: '30min', label: 'Every 30 minutes' },
    { value: '1hour', label: 'Every hour' },
    { value: '3hours', label: 'Every 3 hours' },
    { value: '6hours', label: 'Every 6 hours' },
    { value: '12hours', label: 'Every 12 hours' },
    { value: '24hours', label: 'Once a day' }
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aggregationService.getSchedule();
      if (data) {
        setSchedule(data);
        setIsEnabled(data.enabled);
        setFrequency(data.frequency || '15min');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRun = (freq: string): string => {
    const now = new Date();
    
    switch (freq) {
      case '15min':
        return addMinutes(now, 15).toISOString();
      case '30min':
        return addMinutes(now, 30).toISOString();
      case '1hour':
        return addHours(now, 1).toISOString();
      case '3hours':
        return addHours(now, 3).toISOString();
      case '6hours':
        return addHours(now, 6).toISOString();
      case '12hours':
        return addHours(now, 12).toISOString();
      case '24hours':
        return addHours(now, 24).toISOString();
      default:
        return addMinutes(now, 15).toISOString();
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedSchedule = {
        enabled: isEnabled,
        frequency: frequency,
        next_scheduled: isEnabled ? calculateNextRun(frequency) : null
      };
      
      await aggregationService.updateSchedule(updatedSchedule);
      await fetchSchedule();
      onUpdate();
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg space-y-6">
      <h3 className="text-lg font-medium text-white mb-4">Aggregation Schedule</h3>
      
      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Enable Scheduled Aggregation</span>
          <button 
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${isEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} 
            />
          </button>
        </div>
        
        {/* Frequency Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Aggregation Frequency</label>
          <div className="grid grid-cols-1 gap-2">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFrequency(option.value)}
                disabled={!isEnabled}
                className={`flex justify-between items-center w-full p-3 rounded-lg transition-colors ${
                  !isEnabled 
                    ? 'bg-gray-800/40 text-gray-500 cursor-not-allowed border border-gray-700/50' 
                    : frequency === option.value
                    ? 'bg-blue-900/40 border-blue-500/70 text-blue-200 border'
                    : 'bg-gray-800/40 border border-gray-700 text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {option.label}
                </span>
                {frequency === option.value && isEnabled && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Next Scheduled Run */}
        {isEnabled && schedule?.next_scheduled && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-center text-gray-300 mb-2">
              <Calendar className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium">Next Scheduled Run</span>
            </div>
            <p className="text-lg text-white">
              {format(parseISO(schedule.next_scheduled), 'MMM dd, yyyy HH:mm:ss')}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-md p-3 text-sm text-red-300">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className={`px-4 py-2 rounded-lg flex items-center ${
              saving
                ? 'bg-blue-700/50 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Schedule
              </>
            )}
          </button>
          
          {/* Success Message */}
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm text-green-400 flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Schedule saved successfully
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AggregationScheduler;