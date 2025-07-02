import React, { useState, useRef, useEffect } from 'react';

interface ChatBoxProps {
  onSend: (message: string) => void;
  onClose?: () => void;
  isVisible?: boolean;
}

export default function ChatBox({ onSend, onClose, isVisible = true }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    
    try {
      await onSend(trimmedMessage);
      setMessage(''); // Clear input after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-50">
      <div 
        className="bg-gray-900/95 backdrop-blur-[20px] border border-white/10 rounded-lg p-3"
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="chat with ai"
            disabled={isSending}
            className="flex-1 bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-white/90 text-sm placeholder:text-white/50 placeholder:font-light outline-none transition-all duration-200 focus:bg-white/5 focus:border-white/40 focus:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] disabled:opacity-50"
            autoComplete="off"
          />
          
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-white/80 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/40 hover:text-white disabled:bg-transparent disabled:border-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:hover:bg-transparent min-w-[60px]"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
} 