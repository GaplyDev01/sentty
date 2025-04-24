import React, { useState } from 'react';
import { RefreshCw, Check, XCircle, AlertCircle, Terminal, Clock, Calendar } from 'lucide-react';
import { format, formatDistanceToNow, parseISO, addMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { aggregationService } from '../../services/aggregationService';
import type { SystemSettings } from '../../types/newsapi';

interface AggregationStatusProps {
  status: SystemSettings | null;
  onRefresh: () => void;
}

const AggregationStatus: React.FC<AggregationStatusProps> = ({ status, onRefresh }) => {
  const [running, setRunning] = useState(false);
  const [runState, setRunState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [aggregationDetails, setAggregationDetails] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [singleCategory, setSingleCategory] = useState(true); // Default to single category to avoid rate limiting
  const [testingScheduled, setTestingScheduled] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<any>(null);

  const triggerAggregation = async () => {
    try {
      // Check for cooldown period
      if (cooldownUntil && new Date() < cooldownUntil) {
        const remainingTime = Math.ceil((cooldownUntil.getTime() - new Date().getTime()) / 1000 / 60);
        setErrorMessage(`Please wait approximately ${remainingTime} minutes before trying again to avoid rate limiting`);
        return;
      }

      setRunning(true);
      setRunState('running');
      setErrorMessage(null);
      setShowLogs(true);
      setAggregationDetails(null);
      setRateLimited(false);
      
      // Pass forceUpdate flag to the service
      const result = await aggregationService.triggerAggregation({
        forceUpdate: forceUpdate,
        singleCategory: singleCategory
      });
      
      setAggregationDetails(result);
      
      setRunState('completed');
      setTimeout(() => {
        onRefresh();
        setRunState('idle');
      }, 1000);
    } catch (error: any) {
      console.error('Error triggering aggregation:', error);
      setRunState('error');
      
      // Extract the error message from the response if possible
      let errorText = "An unknown error occurred";
      
      try {
        // Try to parse error response from Edge Function
        if (typeof error === 'object' && error !== null) {
          // Check for Supabase Edge Function specific error format
          if (error.subType === 'supabase-function' && error.response) {
            try {
              const responseData = JSON.parse(error.response);
              errorText = responseData.error || "Error calling Edge Function";
              
              console.log('Supabase function error details:', responseData);
            } catch (parseError) {
              // If we can't parse the JSON, use the raw response
              errorText = error.response;
            }
          } 
          // If it's a fetch error with response data
          else if (error.response && typeof error.response.json === 'function') {
            const errorData = await error.response.json();
            errorText = errorData.error || errorData.message || errorText;
          } 
          // If it's already parsed from JSON
          else if (error.error) {
            errorText = error.error;
          }
          // If it's a standard Error object
          else if (error.message) {
            errorText = error.message;
          }
        }
      } catch (e) {
        // If we can't parse the error, just use the string representation
        errorText = String(error);
      }
      
      setErrorMessage(errorText);
      
      // Check if the error is related to rate limiting
      const errorLower = errorText.toLowerCase();
      if (
        errorLower.includes('rate limit') || 
        errorLower.includes('too many fetch errors') ||
        errorLower.includes('too many requests') ||
        errorLower.includes('api issues') ||
        errorLower.includes('try again later') ||
        errorLower.includes('check api key')
      ) {
        setRateLimited(true);
        
        // Set a cooldown period of 15 minutes
        const cooldown = addMinutes(new Date(), 15);
        setCooldownUntil(cooldown);
      }
    } finally {
      setRunning(false);
    }
  };

  const testScheduledFunction = async () => {
    try {
      setTestingScheduled(true);
      setErrorMessage(null);
      setScheduledResult(null);
      
      const result = await aggregationService.triggerScheduledAggregation();
      setScheduledResult(result);
      onRefresh(); // Refresh to get latest status
      
    } catch (error) {
      console.error('Error testing scheduled function:', error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error testing scheduled function");
    } finally {
      setTestingScheduled(false);
    }
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-4">News Aggregation Status</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 mb-1">Last Aggregation</p>
            <p className="text-lg font-semibold text-white">
              {status?.last_run 
                ? format(parseISO(status.last_run), 'MMM dd, yyyy HH:mm:ss')
                : 'Never Run'}
            </p>
            {status?.last_run && (
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(parseISO(status.last_run), { addSuffix: true })}
              </p>
            )}
          </div>
          
          <StatusBadge status={status?.status} count={status?.articles_count} />
        </div>
        
        {status?.next_scheduled && (
          <div className="bg-gray-800/50 rounded-lg p-3 flex items-center">
            <Calendar className="h-4 w-4 text-blue-400 mr-2" />
            <div>
              <p className="text-sm text-gray-300">Next scheduled run:</p>
              <p className="text-white">
                {format(parseISO(status.next_scheduled), 'MMM dd, yyyy HH:mm:ss')}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(parseISO(status.next_scheduled), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}
        
        {status?.error_message && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-800/30 rounded-md p-3 text-sm text-red-300 flex items-start mt-3"
          >
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Error Details:</p>
              <p>{status.error_message}</p>
            </div>
          </motion.div>
        )}
        
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-800/30 rounded-md p-3 text-sm text-red-300 flex items-start mt-3"
          >
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Error Details:</p>
              <p>{errorMessage}</p>
              
              {rateLimited && (
                <div className="mt-2 p-2 bg-red-900/30 rounded">
                  <p className="font-medium text-yellow-300">NewsAPI Rate Limit Exceeded</p>
                  <p className="mt-1">The NewsAPI has rate limits on how many requests can be made. Please wait before trying again.</p>
                  {cooldownUntil && (
                    <p className="mt-1 flex items-center text-yellow-200">
                      <Clock className="h-4 w-4 mr-1" />
                      Try again after: {format(cooldownUntil, 'HH:mm:ss')}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-300">
                    For more frequent updates, consider upgrading to a premium NewsAPI account with higher rate limits.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {showLogs && aggregationDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/70 border border-gray-700/30 rounded-md p-3 text-sm text-gray-300 mt-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                Aggregation Results
              </h4>
              <button 
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                Hide
              </button>
            </div>
            
            <div className="space-y-2">
              <p>{aggregationDetails.message}</p>
              
              {aggregationDetails.count > 0 ? (
                <>
                  <p>Added {aggregationDetails.count} new articles</p>
                  
                  {aggregationDetails.categories && (
                    <div>
                      <p className="font-medium mt-2 mb-1">Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(aggregationDetails.categories).map(([category, count]: [string, any]) => (
                          <span key={category} className="px-2 py-1 bg-gray-700/60 rounded-full text-xs">
                            {category}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aggregationDetails.languages && (
                    <div>
                      <p className="font-medium mt-2 mb-1">Languages:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(aggregationDetails.languages).map(([lang, count]: [string, any]) => (
                          <span key={lang} className="px-2 py-1 bg-gray-700/60 rounded-full text-xs">
                            {lang}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p>No new articles were found to add</p>
              )}
              
              {aggregationDetails.errors && aggregationDetails.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-yellow-400 font-medium">Encountered {aggregationDetails.errors.length} errors during insertion</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {showLogs && scheduledResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/70 border border-gray-700/30 rounded-md p-3 text-sm text-gray-300 mt-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Scheduled Function Test Results
              </h4>
              <button 
                onClick={() => setScheduledResult(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                Hide
              </button>
            </div>
            
            <div className="space-y-2">
              <p>{scheduledResult.message}</p>
              
              {scheduledResult.status === 'skipped' && (
                <p className="text-yellow-400">Aggregation was skipped: {scheduledResult.reason}</p>
              )}
              
              {scheduledResult.result && (
                <p>
                  {scheduledResult.result.count > 0 
                    ? `Added ${scheduledResult.result.count} new articles` 
                    : "No new articles were added"}
                </p>
              )}
              
              {scheduledResult.nextScheduled && (
                <div className="flex items-center text-blue-300 mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Next scheduled: {new Date(scheduledResult.nextScheduled).toLocaleString()}
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        <div className="pt-4 border-t border-gray-700">
          <p className="text-gray-300 mb-3">Manual Actions</p>
          
          <div className="flex flex-wrap items-start gap-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="force-update"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-600 bg-gray-700"
                />
                <label htmlFor="force-update" className="ml-2 text-sm text-gray-300">
                  Force Update (bypass duplicate check)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="single-category"
                  checked={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-600 bg-gray-700"
                />
                <label htmlFor="single-category" className="ml-2 text-sm text-gray-300">
                  Single Category (avoid rate limiting)
                </label>
              </div>
              
              <button
                onClick={triggerAggregation}
                disabled={running || (cooldownUntil && new Date() < cooldownUntil)}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  running || (cooldownUntil && new Date() < cooldownUntil)
                    ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                    : runState === 'running'
                    ? 'bg-blue-900/40 cursor-wait'
                    : runState === 'completed'
                    ? 'bg-green-600 hover:bg-green-700'
                    : runState === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {running ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running manual aggregation...
                  </>
                ) : cooldownUntil && new Date() < cooldownUntil ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Rate limited (try again later)
                  </>
                ) : runState === 'completed' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Aggregation completed
                  </>
                ) : runState === 'error' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Error, try again
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Manual Aggregation Now
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-400" />
                Test Scheduled Function
              </h4>
              
              <p className="text-xs text-gray-400">
                Run the scheduled aggregation function manually to test that it's working correctly.
              </p>
              
              <button
                onClick={testScheduledFunction}
                disabled={testingScheduled}
                className={`px-4 py-2 rounded-lg flex items-center text-sm ${
                  testingScheduled
                    ? 'bg-blue-900/40 cursor-wait text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {testingScheduled ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Test Scheduled Function
                  </>
                )}
              </button>
            </div>
          </div>
          
          {cooldownUntil && new Date() < cooldownUntil && (
            <div className="mt-2 text-sm text-gray-400">
              NewsAPI rate limit reached. Can run again in approximately {Math.ceil((cooldownUntil.getTime() - new Date().getTime()) / 1000 / 60)} minutes.
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Note: The free NewsAPI plan has strict rate limits. To avoid hitting these limits, aggregations are now limited to fewer categories and articles per run.</p>
            <p className="mt-1">Each aggregation request uses only 1 randomly selected category and collects a small number of articles to stay within rate limits.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status?: string; count?: number }> = ({ status, count }) => {
  if (!status) return null;
  
  switch (status) {
    case 'success':
      return (
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Success
          </span>
          {count !== undefined && (
            <span className="text-xs text-gray-400 mt-1">
              {count} articles added
            </span>
          )}
        </div>
      );
    case 'partial_success':
      return (
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 rounded-full text-sm flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial Success
          </span>
          {count !== undefined && (
            <span className="text-xs text-gray-400 mt-1">
              {count} articles added
            </span>
          )}
        </div>
      );
    case 'error':
      return (
        <span className="px-3 py-1 bg-red-900/40 text-red-300 rounded-full text-sm flex items-center">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    case 'never_run':
      return (
        <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 rounded-full text-sm flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Never Run
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
          Unknown
        </span>
      );
  }
};

export default AggregationStatus;