import React from 'react';

interface ThinkingAnimationProps {
  isVisible: boolean;
  currentStage: string;
}

export default function ThinkingAnimation({ isVisible, currentStage }: ThinkingAnimationProps) {
  if (!isVisible) return null;

  // Clean stage text without emojis
  const cleanStage = currentStage
    .replace(/📸|🔍|🧠|🤖|✨/g, '')
    .trim();

  return (
    <div className="absolute bottom-3 left-3 right-3 z-40">
      <div className="text-center">
        <p className="text-xs text-gray-400 font-light">
          {cleanStage}
        </p>
      </div>
    </div>
  );
} 