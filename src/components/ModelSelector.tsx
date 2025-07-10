import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/app-store';

interface ModelSelectorProps {
  onClose: () => void;
}

interface AIModel {
  name: string;
  provider: string;
  icon: string;
  description: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onClose }) => {
  const { user, selectedModel, setSelectedModel } = useAppStore();
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [lockedModels, setLockedModels] = useState<AIModel[]>([]);

  const modelsByTier = {
    free: [
      { name: 'GPT-3.5-turbo', provider: 'OpenAI', icon: '🤖', description: 'Fast and efficient for basic tasks' },
      { name: 'Gemini Flash', provider: 'Google', icon: '💎', description: 'Quick responses with good quality' }
    ],
    premium: [
      { name: 'GPT-4o-mini', provider: 'OpenAI', icon: '🤖', description: 'Advanced reasoning and analysis' },
      { name: 'Claude 3 Haiku', provider: 'Anthropic', icon: '🧠', description: 'Fast and thoughtful responses' },
      { name: 'Gemini Pro', provider: 'Google', icon: '💎', description: 'Professional-grade AI analysis' }
    ],
    pro: [
      { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖', description: 'State-of-the-art performance' },
      { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🧠', description: 'Excellent reasoning and coding' },
      { name: 'Gemini Ultra', provider: 'Google', icon: '💎', description: 'Ultra-high performance AI' },
      { name: 'Llama 3.1 70B', provider: 'Meta', icon: '🦙', description: 'Open-source powerhouse' }
    ],
    enterprise: [
      { name: 'GPT-4o 32k', provider: 'OpenAI', icon: '🤖', description: 'Extended context, maximum performance' },
      { name: 'Claude 3 Opus', provider: 'Anthropic', icon: '🧠', description: 'Most capable model available' },
      { name: 'Gemini Ultra Pro', provider: 'Google', icon: '💎', description: 'Enterprise-grade AI processing' },
      { name: 'Llama 3.1 405B', provider: 'Meta', icon: '🦙', description: 'Most advanced open-source model' }
    ]
  };

  useEffect(() => {
    const userTier = user?.tier.tier || 'free';
    const tiers = ['free', 'premium', 'pro', 'enterprise'];
    const userTierIndex = tiers.indexOf(userTier);
    
    // Get available models for user's tier and below
    const available: AIModel[] = [];
    for (let i = 0; i <= userTierIndex; i++) {
      available.push(...modelsByTier[tiers[i] as keyof typeof modelsByTier]);
    }
    
    // Get locked models (higher tiers)
    const locked: AIModel[] = [];
    for (let i = userTierIndex + 1; i < tiers.length; i++) {
      locked.push(...modelsByTier[tiers[i] as keyof typeof modelsByTier]);
    }
    
    setAvailableModels(available);
    setLockedModels(locked);
  }, [user]);

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    onClose();
  };

  const handleUpgrade = () => {
    window.open('https://framesense.se/payments', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Välj AI-Modell</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {user?.tier.tier === 'free' ? 'Free Plan' : 
             user?.tier.tier === 'premium' ? 'Premium Plan' :
             user?.tier.tier === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Available Models */}
          <div className="space-y-3">
            {availableModels.map((model) => (
              <div
                key={model.name}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel === model.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleModelSelect(model.name)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{model.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      {selectedModel === model.name && (
                        <span className="text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{model.provider}</p>
                    <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Locked Models */}
          {lockedModels.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">🔒 Uppgradera för fler modeller</h4>
                <button
                  onClick={handleUpgrade}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Uppgradera →
                </button>
              </div>
              <div className="space-y-2">
                {lockedModels.map((model) => (
                  <div
                    key={model.name}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-75"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl opacity-50">{model.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-600">{model.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {user?.tier.tier === 'free' ? 'Premium+' : 
                             user?.tier.tier === 'premium' ? 'Pro+' : 'Enterprise'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{model.provider}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {user?.tier.remainingRequests || 0} requests kvar idag
            </div>
            {user?.tier.tier === 'free' && (
              <button
                onClick={handleUpgrade}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Uppgradera
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector; 