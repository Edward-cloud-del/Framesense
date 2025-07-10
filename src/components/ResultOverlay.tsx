import React, { useEffect, useState } from 'react';
import { useAppStore, AIResult } from '../stores/app-store';
import { invoke } from '@tauri-apps/api/core';
import ModelSelector from './ModelSelector';

interface ResultOverlayProps {
  result: AIResult;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ result }) => {
  const { 
    setCurrentResult, 
    user, 
    selectedModel, 
    showModelSelector, 
    setShowModelSelector 
  } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Auto-close after 15 seconds (extended for reading time)
    const timer = setTimeout(() => {
      handleClose();
    }, 15000);

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

  const handleUpgrade = () => {
    window.open('https://framesense.se/payments', '_blank');
  };

  const handleModelSelector = () => {
    setShowModelSelector(true);
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

  const getModelIcon = () => {
    if (selectedModel.includes('GPT')) return '🤖';
    if (selectedModel.includes('Claude')) return '🧠';
    if (selectedModel.includes('Gemini')) return '💎';
    if (selectedModel.includes('Llama')) return '🦙';
    return '🤖';
  };

  const getTierColor = () => {
    const tier = user?.tier.tier || 'free';
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-700';
      case 'premium': return 'bg-blue-100 text-blue-700';
      case 'pro': return 'bg-purple-100 text-purple-700';
      case 'enterprise': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Safe position values to avoid TypeScript errors
  const positionX = result.position?.x ?? undefined;
  const positionY = result.position?.y ?? undefined;
  const hasPosition = positionX !== undefined && positionY !== undefined;

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Result overlay */}
        <div className={`absolute transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) ${
            isVisible ? 'scale(1)' : 'scale(0.95)'
          }`
        }}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-96 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon()}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">FrameSense AI</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTierColor()}`}>
                        {user?.tier.tier?.charAt(0).toUpperCase() + user?.tier.tier?.slice(1) || 'Free'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getModelIcon()} {selectedModel}
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

            {/* Captured Image Preview - Reduced size */}
            {result.capturedImage && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="image-preview" style={{ maxHeight: '300px' }}>
                  <img 
                    src={result.capturedImage} 
                    alt="Captured screenshot"
                    className="w-full h-auto rounded-lg shadow-sm"
                    style={{ 
                      maxHeight: '300px', 
                      objectFit: 'contain' 
                    }}
                  />
                </div>
              </div>
            )}

            {/* AI Response */}
            <div className="px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result.content}
                </p>
              </div>
            </div>

            {/* Upgrade Section - Prominent */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>🚀</span>
                <span>
                  {user?.tier.tier === 'free' ? 'Upgrade to Pro - Få tillgång till GPT-4o & Claude' :
                   user?.tier.tier === 'premium' ? 'Upgrade to Pro - Få tillgång till GPT-4o & Llama' :
                   user?.tier.tier === 'pro' ? 'Upgrade to Enterprise - Obegränsade requests' :
                   'Hantera prenumeration'}
                </span>
              </button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Använder {selectedModel} • {user?.tier.remainingRequests || 0} requests kvar idag
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyText}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </button>
                
                {/* Model Selection Button */}
                <button
                  onClick={handleModelSelector}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <span>🎯</span>
                  <span>Choose Models</span>
                </button>
              </div>
              
              {/* Additional action buttons if available */}
              {result.actions && result.actions.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {result.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      {showModelSelector && (
        <ModelSelector onClose={() => setShowModelSelector(false)} />
      )}
    </>
  );
};

export default ResultOverlay; 