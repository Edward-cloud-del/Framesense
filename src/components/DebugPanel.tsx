import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DebugResult {
  success: boolean;
  message: string;
}

const DebugPanel: React.FC = () => {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: DebugResult) => {
    setDebugResults(prev => [result, ...prev].slice(0, 10)); // Keep only last 10 results
  };

  const testQuickCommand = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('test_quick_command') as DebugResult;
      addResult(result);
    } catch (error) {
      addResult({ success: false, message: `Error: ${error}` });
    }
    setIsLoading(false);
  };

  const testCaptureFlow = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('debug_capture_flow') as DebugResult;
      addResult(result);
    } catch (error) {
      addResult({ success: false, message: `Error: ${error}` });
    }
    setIsLoading(false);
  };

  const testScreenCapture = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('test_screen_capture') as DebugResult;
      addResult(result);
    } catch (error) {
      addResult({ success: false, message: `Error: ${error}` });
    }
    setIsLoading(false);
  };

  const testPermissions = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('check_permissions') as boolean;
      addResult({ 
        success: result, 
        message: result ? "✅ All permissions granted" : "❌ Permissions denied" 
      });
    } catch (error) {
      addResult({ success: false, message: `Error: ${error}` });
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 bg-gray-900 text-white max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">🔧 Debug Panel</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={testQuickCommand}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
        >
          Test Quick Command
        </button>
        
        <button
          onClick={testCaptureFlow}
          disabled={isLoading}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
        >
          Test Capture Flow
        </button>
        
        <button
          onClick={testScreenCapture}
          disabled={isLoading}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
        >
          Test Screen Capture
        </button>
        
        <button
          onClick={testPermissions}
          disabled={isLoading}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded text-sm"
        >
          Test Permissions
        </button>
      </div>
      
      {isLoading && (
        <div className="text-yellow-400 mb-2">⏳ Running test...</div>
      )}
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {debugResults.map((result, index) => (
          <div
            key={index}
            className={`p-2 rounded text-xs border-l-4 ${
              result.success
                ? 'bg-green-900 border-green-500 text-green-100'
                : 'bg-red-900 border-red-500 text-red-100'
            }`}
          >
            <div className="font-mono whitespace-pre-wrap">{result.message}</div>
          </div>
        ))}
      </div>
      
      {debugResults.length === 0 && (
        <div className="text-gray-400 text-sm">No debug results yet. Run some tests!</div>
      )}
    </div>
  );
};

export default DebugPanel; 