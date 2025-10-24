'use client';

import { useEffect, useState } from 'react';
import { useAuthProviders } from '@/hooks/useAuthProviders';

export default function ProviderTestPage() {
  const { providers, loading, error } = useAuthProviders();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Capture console.log messages
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Provider Detection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Current State</h2>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded ${loading ? 'bg-yellow-100' : 'bg-green-100'}`}>
                Loading: {loading ? 'Yes' : 'No'}
              </div>
              {error && (
                <div className="p-2 rounded bg-red-100 text-red-700">
                  Error: {error}
                </div>
              )}
              <div className="space-y-1">
                <div className={`p-2 rounded ${providers.emailPassword ? 'bg-green-100' : 'bg-gray-100'}`}>
                  Email/Password: {providers.emailPassword ? 'Enabled' : 'Disabled'}
                </div>
                <div className={`p-2 rounded ${providers.google ? 'bg-green-100' : 'bg-gray-100'}`}>
                  Google: {providers.google ? 'Enabled' : 'Disabled'}
                </div>
                <div className={`p-2 rounded ${providers.facebook ? 'bg-green-100' : 'bg-gray-100'}`}>
                  Facebook: {providers.facebook ? 'Enabled' : 'Disabled'}
                </div>
                <div className={`p-2 rounded ${providers.github ? 'bg-green-100' : 'bg-gray-100'}`}>
                  GitHub: {providers.github ? 'Enabled' : 'Disabled'}
                </div>
                <div className={`p-2 rounded ${providers.microsoft ? 'bg-green-100' : 'bg-gray-100'}`}>
                  Microsoft: {providers.microsoft ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Console Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-900">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setLogs([])}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}