import React from 'react';

interface ThinkingAnimationProps {
  isVisible: boolean;
  currentStage: string;
}

export default function ThinkingAnimation({ isVisible, currentStage }: ThinkingAnimationProps) {
  if (!isVisible) return null;

  const getStageIcon = () => {
    if (currentStage.includes('screenshot')) return '📸';
    if (currentStage.includes('OCR') || currentStage.includes('text')) return '🔍';
    if (currentStage.includes('prompt')) return '🧠';
    if (currentStage.includes('OpenAI') || currentStage.includes('AI')) return '🤖';
    if (currentStage.includes('response')) return '✨';
    return '⚙️';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">FrameSense AI</h3>
          <p className="text-sm text-gray-500">Processing your request...</p>
        </div>

        {/* Current Stage */}
        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
          <div className="relative">
            <span className="text-2xl">{getStageIcon()}</span>
            <div className="absolute -inset-1 bg-blue-200 rounded-full animate-ping opacity-25"></div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">{currentStage}</p>
            <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>

        {/* Simple loading dots */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
} 