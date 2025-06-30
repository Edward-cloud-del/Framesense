import React, { useEffect, useState } from 'react';
import { useAppStore, AIResult } from '../stores/app-store';
import { invoke } from '@tauri-apps/api/core';

interface ResultOverlayProps {
  result: AIResult;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ result }) => {
  const { setCurrentResult } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentResult(null);
    }, 300); // Wait for animation to complete
  };

  const handleCopyText = async () => {
    try {
      await invoke('copy_to_clipboard', { text: result.content });
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getTypeIcon = () => {
    switch (result.type) {
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'hybrid':
        return '🔄';
      default:
        return '✨';
    }
  };

  const getConfidenceColor = () => {
    if (result.confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (result.confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Result overlay */}
      <div className={`absolute transform transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}
      style={{
        left: result.position?.x || '50%',
        top: result.position?.y || '50%',
        transform: `translate(${result.position?.x ? '0' : '-50%'}, ${result.position?.y ? '0' : '-50%'}) ${
          isVisible ? 'scale(1)' : 'scale(0.95)'
        }`
      }}>
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 max-w-md w-80 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getTypeIcon()}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">FrameSense</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor()}`}>
                      {Math.round(result.confidence * 100)}% confident
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.type === 'text' ? 'Text' : result.type === 'image' ? 'Image' : 'Mixed'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {result.content}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={handleCopyText}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              
              {result.actions && result.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay; 