import React from 'react';
import { useAppStore } from '../stores/app-store';

interface ModelSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onModelSelect: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isVisible, onClose, onModelSelect }) => {
  const { user, selectedModel } = useAppStore();

  if (!isVisible) return null;

  const modelsByTier = {
    free: [
      { name: 'GPT-3.5-turbo', provider: 'OpenAI', icon: '🤖', tier: 'free' },
      { name: 'Gemini Flash', provider: 'Google', icon: '💎', tier: 'free' }
    ],
    premium: [
      { name: 'GPT-4o-mini', provider: 'OpenAI', icon: '🤖', tier: 'premium' },
      { name: 'Claude 3 Haiku', provider: 'Anthropic', icon: '🧠', tier: 'premium' },
      { name: 'Gemini Pro', provider: 'Google', icon: '💎', tier: 'premium' }
    ],
    pro: [
      { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖', tier: 'pro' },
      { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🧠', tier: 'pro' },
      { name: 'Gemini Ultra', provider: 'Google', icon: '💎', tier: 'pro' },
      { name: 'Llama 3.1 70B', provider: 'Meta', icon: '🦙', tier: 'pro' }
    ],
    enterprise: [
      { name: 'GPT-4o 32k', provider: 'OpenAI', icon: '🤖', tier: 'enterprise' },
      { name: 'Claude 3 Opus', provider: 'Anthropic', icon: '🧠', tier: 'enterprise' },
      { name: 'Gemini Ultra Pro', provider: 'Google', icon: '💎', tier: 'enterprise' },
      { name: 'Llama 3.1 405B', provider: 'Meta', icon: '🦙', tier: 'enterprise' }
    ]
  };

  const currentUserTier = user?.tier.tier || 'free';
  const tierOrder = ['free', 'premium', 'pro', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(currentUserTier);

  // Get available models up to user's tier
  const availableModels = [];
  for (let i = 0; i <= userTierIndex; i++) {
    availableModels.push(...modelsByTier[tierOrder[i] as keyof typeof modelsByTier]);
  }

  // Get locked models
  const lockedModels = [];
  for (let i = userTierIndex + 1; i < tierOrder.length; i++) {
    lockedModels.push(...modelsByTier[tierOrder[i] as keyof typeof modelsByTier]);
  }

  const handleModelSelect = (modelName: string) => {
    onModelSelect(modelName);
    onClose();
  };

  const handleUpgrade = () => {
    window.open('https://framesense.se/payments', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
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

        <div className="space-y-3">
          {/* Current Tier Models */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Dina modeller ({currentUserTier})
            </h4>
            
            {availableModels.map((model) => (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model.name)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  selectedModel === model.name
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <span className="text-xl mr-3">{model.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{model.name}</div>
                  <div className="text-sm text-gray-500">{model.provider}</div>
                </div>
                {selectedModel === model.name && (
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Locked Models */}
          {lockedModels.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                🔒 Uppgradera för fler modeller
              </h4>
              
              {lockedModels.map((model) => (
                <div
                  key={model.name}
                  className="w-full flex items-center p-3 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed"
                >
                  <span className="text-xl mr-3">{model.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.provider}</div>
                  </div>
                  <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    {model.tier}
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleUpgrade}
                className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>🚀</span>
                <span>Uppgradera till Pro - Få tillgång till alla modeller</span>
              </button>
            </div>
          )}
        </div>

        {/* Usage Info */}
        {user && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Requests kvar idag:</span>
                <span className="font-medium">{user.tier.remainingRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Nuvarande plan:</span>
                <span className="font-medium capitalize">{user.tier.tier}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector; 