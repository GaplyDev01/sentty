import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PanelTop, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';

const CryptoIntegrationsManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const enableIntegrations = async () => {
    setLoading(true);
    try {
      const result = await adminService.enableCryptoIntegrations();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
      <div className="flex items-center mb-4">
        <PanelTop className="h-5 w-5 mr-2 text-yellow-400" />
        <h3 className="text-lg font-medium text-white">Crypto Integrations Manager</h3>
      </div>

      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-blue-300 text-sm">
          This will enable all crypto news integrations with your API keys:
        </p>
        <ul className="mt-2 space-y-1 text-gray-300 text-sm pl-6 list-disc">
          <li>CryptoPanic</li>
          <li>FireCrawl</li>
          <li>CoinDesk</li>
        </ul>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 rounded-lg border ${
            result.success
              ? 'bg-green-900/30 border-green-800/30 text-green-300'
              : 'bg-red-900/30 border-red-800/30 text-red-300'
          }`}
        >
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{result.message}</p>
              {result.error && <p className="mt-2 text-sm">{result.error}</p>}
            </div>
          </div>
        </motion.div>
      )}

      <button
        onClick={enableIntegrations}
        disabled={loading}
        className={`w-full flex items-center justify-center px-4 py-2 rounded-lg ${
          loading
            ? 'bg-blue-700/50 cursor-wait text-gray-300'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Enabling Integrations...
          </>
        ) : (
          'Enable All Crypto Integrations'
        )}
      </button>
    </div>
  );
};

export default CryptoIntegrationsManager;