import { create } from 'zustand';

export interface AIResult {
  id: string;
  content: string;
  type: 'text' | 'image' | 'hybrid';
  confidence: number;
  timestamp: Date;
  position?: { x: number; y: number };
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface AppState {
  // Permissions
  hasPermissions: boolean;
  setPermissions: (permissions: boolean) => void;

  // Processing state
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
  processingStage: string;
  setProcessingStage: (stage: string) => void;

  // Results
  currentResult: AIResult | null;
  setCurrentResult: (result: AIResult | null) => void;
  
  // Recent results history
  recentResults: AIResult[];
  addResult: (result: AIResult) => void;
  clearResults: () => void;

  // Settings
  settings: {
    hotkey: string;
    aiProvider: 'openai' | 'anthropic';
    autoCapture: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  hasPermissions: false,
  isProcessing: false,
  processingStage: '',
  currentResult: null,
  recentResults: [],
  
  settings: {
    hotkey: 'Alt+Space',
    aiProvider: 'openai',
    autoCapture: true,
    theme: 'system',
  },

  // Actions
  setPermissions: (permissions) => set({ hasPermissions: permissions }),
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  setProcessingStage: (stage) => set({ processingStage: stage }),
  
  setCurrentResult: (result) => set({ currentResult: result }),
  
  addResult: (result) => set((state) => ({
    recentResults: [result, ...state.recentResults.slice(0, 9)] // Keep last 10 results
  })),
  
  clearResults: () => set({ recentResults: [], currentResult: null }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
})); 