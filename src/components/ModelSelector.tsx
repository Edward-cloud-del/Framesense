import React, { useState, useEffect } from 'react';
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
  
  // Animation state like ChatBox
  const [boxVisible, setBoxVisible] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setBoxVisible(false);
      setTimeout(() => setBoxVisible(true), 10);
    } else {
      setBoxVisible(false);
    }
  }, [isVisible]);

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
      { name: 'Llama 3.1 70B', provider: 'Meta', icon: '🦙', tier: 'pro' }
    ],
    enterprise: [
      { name: 'GPT-4o 32k', provider: 'OpenAI', icon: '🤖', tier: 'enterprise' },
      { name: 'Claude 3 Opus', provider: 'Anthropic', icon: '🧠', tier: 'enterprise' },
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
    // Very short names for 4x2 compact display
    return name
      .replace('GPT-3.5-turbo', 'GPT-3.5')
      .replace('GPT-4o-mini', 'GPT-4o mini')
      .replace('GPT-4o 32k', 'GPT-4o 32k')
      .replace('GPT-4o', 'GPT-4o')
      .replace('Claude 3 Haiku', 'Haiku')
      .replace('Claude 3.5 Sonnet', 'Sonnet')
      .replace('Claude 3 Opus', 'Opus')
      .replace('Gemini Flash', 'Flash')
      .replace('Gemini Pro', 'Gemini Pro')
      .replace('Llama 3.1 70B', 'Llama 70B')
      .replace('Llama 3.1 405B', 'Llama 405B');
  };

  return (
    <div className={`relative z-50 transition-all duration-300 ease-out ${boxVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div 
        className="bg-gray-900/95 backdrop-blur-[20px] border border-white/10 rounded-2xl p-2 mt-2 mb-1"
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
        }}
      >


        {/* 4x2 Grid Layout - 4 columns, scrollable */}
        <div className="max-h-32 overflow-y-auto mb-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
          <div className="grid grid-cols-4 gap-1">
            {allModels.map((model) => {
            const isLocked = isModelLocked(model);
            const isSelected = selectedModel === model.name;
            
            return (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model.name, isLocked)}
                className={`
                  relative p-1 rounded-md transition-all duration-200 text-left min-h-[35px] flex flex-col justify-center
                  ${isSelected && !isLocked
                    ? 'bg-blue-500/30 border border-blue-400/50'
                    : isLocked 
                      ? 'bg-white/5 border border-white/10 opacity-50 cursor-pointer hover:opacity-70'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30'
                  }
                `}
              >
                {/* Lock icon for locked models */}
                {isLocked && (
                  <div className="absolute top-0.5 right-0.5">
                    <svg className="w-2 h-2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                
                {/* Selected checkmark */}
                {isSelected && !isLocked && (
                  <div className="absolute top-0.5 right-0.5">
                    <svg className="w-2 h-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <span className="text-xs mb-0.5">{model.icon}</span>
                  <div className={`text-xs font-medium leading-tight ${isLocked ? 'text-white/40' : 'text-white/90'}`}>
                    {getModelDisplayName(model.name)}
                  </div>
                </div>
              </button>
                          );
            })}
          </div>
        </div>

        {/* Upgrade section for locked models */}
        {lockedModels.length > 0 && (
          <div className="border-t border-white/10 pt-1 mb-1">
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white/90 py-1 px-2 rounded-md font-medium text-xs hover:from-blue-500/30 hover:to-purple-600/30 transition-all duration-200 flex items-center justify-center space-x-1 border border-white/20"
            >
              <span>🚀</span>
              <span>Upgrade</span>
            </button>
          </div>
        )}

        {/* Usage info - very compact */}
        {user && (
          <div className="text-xs text-white/50 flex justify-between items-center">
            <span>{user.tier.remainingRequests} left</span>
            <span className="capitalize">{user.tier.tier}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector; 