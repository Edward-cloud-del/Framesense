import React from 'react';
import { useAppStore } from '../stores/app-store';

interface ModelSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onModelSelect: (model: string) => void;
}

interface AIModel {
  name: string;
  provider: string;
  icon: string;
  tier: string;
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
  const availableModels: AIModel[] = [];
  for (let i = 0; i <= userTierIndex; i++) {
    availableModels.push(...modelsByTier[tierOrder[i] as keyof typeof modelsByTier]);
  }

  // Get locked models
  const lockedModels: AIModel[] = [];
  for (let i = userTierIndex + 1; i < tierOrder.length; i++) {
    lockedModels.push(...modelsByTier[tierOrder[i] as keyof typeof modelsByTier]);
  }

  // Combine all models for 4x2 grid layout
  const allModels = [...availableModels, ...lockedModels];

  const handleModelSelect = (modelName: string, isLocked: boolean) => {
    if (isLocked) {
      handleUpgrade();
      return;
    }
    onModelSelect(modelName);
    onClose();
  };

  const handleUpgrade = () => {
    window.open('https://framesense.se/payments', '_blank');
  };

  const isModelLocked = (model: any) => {
    return !availableModels.some(available => available.name === model.name);
  };

  const getModelDisplayName = (name: string) => {
    // Shorten names for compact display
    return name
      .replace('GPT-3.5-turbo', 'GPT-3.5')
      .replace('GPT-4o-mini', 'GPT-4o mini')
      .replace('GPT-4o 32k', 'GPT-4o 32k')
      .replace('Claude 3 Haiku', 'Claude Haiku')
      .replace('Claude 3.5 Sonnet', 'Claude Sonnet')
      .replace('Claude 3 Opus', 'Claude Opus')
      .replace('Gemini Flash', 'Gemini Flash')
      .replace('Gemini Pro', 'Gemini Pro')
      .replace('Gemini Ultra Pro', 'Gemini Ultra+')
      .replace('Gemini Ultra', 'Gemini Ultra')
      .replace('Llama 3.1 70B', 'Llama 70B')
      .replace('Llama 3.1 405B', 'Llama 405B');
  };

  return (
    // Use absolute positioning to cover the entire Tauri window
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white/90">
        <h3 className="text-sm font-semibold text-gray-900">Välj AI-Modell</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content with scroll */}
      <div className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-120px)]">
        {/* 4x2 Grid Layout - 2 columns, multiple rows */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {allModels.map((model) => {
            const isLocked = isModelLocked(model);
            const isSelected = selectedModel === model.name;
            
            return (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model.name, isLocked)}
                className={`
                  relative p-2 rounded-lg transition-all duration-200 text-left min-h-[60px] flex flex-col justify-center
                  ${isSelected && !isLocked
                    ? 'bg-blue-100 border-2 border-blue-300 shadow-sm'
                    : isLocked 
                      ? 'bg-gray-100 border border-gray-200 opacity-60 cursor-pointer hover:opacity-80'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }
                `}
              >
                {/* Lock icon for locked models */}
                {isLocked && (
                  <div className="absolute top-1 right-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                
                {/* Selected checkmark */}
                {isSelected && !isLocked && (
                  <div className="absolute top-1 right-1">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm">{model.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium leading-tight ${isLocked ? 'text-gray-600' : 'text-gray-900'}`}>
                      {getModelDisplayName(model.name)}
                    </div>
                    <div className={`text-xs ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                      {model.provider}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Upgrade section for locked models */}
        {lockedModels.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>Uppgradera för fler modeller</span>
            </button>
          </div>
        )}

        {/* Usage info - compact */}
        {user && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Requests kvar: <span className="font-medium">{user.tier.remainingRequests}</span></span>
              <span className="capitalize font-medium">{user.tier.tier}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector; 