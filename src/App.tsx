import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
import AIResponse from './components/AIResponse';
import ChatBox from './components/ChatBox';
import SettingsDialog from './components/SettingsDialog';
import ThinkingAnimation from './components/ThinkingAnimation';

import { useAppStore } from './stores/app-store';

// 🤖 Real OpenAI Integration
import { createAIService } from './services/openai-service';
import { getApiKey } from './config/api-config';
import type { IAIService, AIRequest } from './types/ai-types';
import UserService from './services/user-service';

// STEG 4: AI Message interface for complete AI integration
interface AIMessage {
	text: string;
	imageData?: string;  // base64 PNG data
	timestamp: number;
	bounds?: any; // Future: CaptureBounds type
}

// OCR Result interface (matches Rust OCRResult)
interface OCRResult {
	text: string;
	confidence: number;
	has_text: boolean;
}

function App() {
	const [isReady, setIsReady] = useState(false);
	const [screenshotResult, setScreenshotResult] = useState<string | null>(null);
	const [isCreatingOverlay, setIsCreatingOverlay] = useState(false);
	
	// 🤖 CHAT FLOW STATE MANAGEMENT (STEG 2) - Updated for window-based chat
	const [aiResponse, setAiResponse] = useState<string | null>(null);
	const [chatBoxOpen, setChatBoxOpen] = useState(false);
	
	// 🖼️ STEG 2: Separate state for AI image context (independent from badge)
	const [selectedImageForAI, setSelectedImageForAI] = useState<string | null>(null);
	
	// 🔍 OCR Context state for automatic text extraction
	const [ocrContext, setOcrContext] = useState<OCRResult | null>(null);
	
	// 🤖 Real OpenAI service state
	const [aiService, setAiService] = useState<IAIService | null>(null);
	
	// ⚙️ Settings UI state
	const [settingsOpen, setSettingsOpen] = useState(false);
	
	// 🎭 Thinking Animation state
	const [isAiThinking, setIsAiThinking] = useState(false);
	const [aiProcessingStage, setAiProcessingStage] = useState<string>('');

	const { 
		hasPermissions, 
		isProcessing, 
		currentResult, 
		setPermissions,
		user,
		setUser 
	} = useAppStore();

	// 🤖 REAL OpenAI integration function - replaces mock
	const sendToAI = async (aiMessage: AIMessage): Promise<string> => {
		if (!aiService) {
			throw new Error('AI service not initialized. Please check your API key.');
		}

		// Update thinking stage for prompt optimization
		setAiProcessingStage('Optimizing AI prompt...');

		console.log('🤖 Sending request to real OpenAI API...', {
			hasImage: !!aiMessage.imageData,
			messageLength: aiMessage.text.length,
			hasOCRContext: aiMessage.text.includes('[OCR Context')
		});
		
		try {
			const request: AIRequest = {
				message: aiMessage.text,
				imageData: aiMessage.imageData,
				imageType: 'image/png'
			};

			const response = await aiService.analyzeImageWithText(request);
			
			console.log('✅ OpenAI API response received:', {
				contentLength: response.content.length,
				tokensUsed: response.tokensUsed,
				model: response.model
			});

			return response.content;

		} catch (error: any) {
			console.error('❌ OpenAI API error:', error);
			
			// User-friendly error messages
			if (error.message.includes('Invalid API key')) {
				return '❌ **API Key Error**\n\nThe OpenAI API key is invalid. Please check your API key configuration.';
			} else if (error.message.includes('Rate limit')) {
				return '❌ **Rate Limited**\n\nToo many requests. Please wait a moment and try again.';
			} else if (error.message.includes('Daily limit')) {
				return '❌ **Daily Limit Reached**\n\nYou\'ve reached the daily request limit. Limit will reset tomorrow.';
			} else if (error.message.includes('Image too large')) {
				return '❌ **Image Too Large**\n\nThe selected image is too large. Please select a smaller area and try again.';
			} else {
				return `❌ **AI Error**\n\nSomething went wrong: ${error.message}\n\nPlease try again or select a different area.`;
			}
		}
	};

	useEffect(() => {
		// Check permissions on app start
		checkPermissions();
		
		// Restore app state when window is created (Raycast-style)
		restoreAppState();
		
		// Initialize user (load from storage or create mock)
		initializeUser();
		
		// 🤖 Initialize AI service with API key
		const apiKey = getApiKey();
		if (apiKey) {
			const service = createAIService(apiKey);
			setAiService(service);
			console.log('✅ AI service initialized with real OpenAI');
		} else {
			console.warn('⚠️ No API key found - AI service disabled');
		}
		
		// Listen for save-state-and-close event from Rust (Raycast-style)
		const unlistenSave = listen('save-state-and-close', () => {
			console.log('💾 Saving state before window closes...');
			saveAppState();
		});
		
		// Listen for selection results from Rust after screen capture
		const unlistenResult = listen('selection-result', (event: any) => {
			console.log('🎯 Received selection result from Rust:', event.payload);
			const result = event.payload;
			
			if (result.success && result.type === 'image' && result.imageData) {
				// STEG 1: Behåll screenshot for badge (oförändrad)
				setScreenshotResult(result.imageData);
				console.log('✅ Screen selection image loaded for badge!');
				
				// STEG 1: Save screenshot for AI context  
				setSelectedImageForAI(result.imageData);
				console.log('✅ Screenshot saved for AI analysis!');
				
				// 🔍 NEW: Run automatic OCR in background (SILENT)
				runAutomaticOCR(result.imageData);
				
				// STEG 1: Auto-activate ChatBox after screenshot
				console.log('🔄 Auto-activating ChatBox with image context...');
				if (!chatBoxOpen) {
					handleAskAI(); // This will expand window and show ChatBox
				}
				
				// Show brief success message (remove later)
				const bounds = result.bounds;
				console.log(`📸 Selection: ${bounds.width}x${bounds.height} at (${bounds.x}, ${bounds.y}) - ChatBox activated!`);
			} else if (result.type === 'error') {
				console.error('❌ Selection failed:', result.message);
				alert(`Selection failed: ${result.message}`);
			}
		});
		
		return () => {
			unlistenSave.then(fn => fn());
			unlistenResult.then(fn => fn());
		};
	}, []);

	const checkPermissions = async () => {
		try {
			const permissions = await invoke('check_permissions');
			setPermissions(!!permissions); // Force to boolean
			setIsReady(true);
		} catch (error) {
			console.error('Failed to check permissions:', error);
			setPermissions(true); // Assume true for testing
			setIsReady(true);
		}
	};

	const initializeUser = async () => {
		try {
			// Try to load existing user from storage
			const storedUser = await UserService.loadStoredUser();
			
			if (storedUser) {
				setUser(storedUser);
				console.log('✅ User loaded from storage:', storedUser.email, storedUser.tier.tier);
			} else {
				// Create mock user for testing
				const mockUser = await UserService.initializeMockUser();
				setUser(mockUser);
				console.log('✅ Mock user initialized:', mockUser.email, mockUser.tier.tier);
			}
		} catch (error) {
			console.error('❌ Failed to initialize user:', error);
			// Fallback to mock user
			const mockUser = await UserService.initializeMockUser();
			setUser(mockUser);
		}
	};

	const saveAppState = async () => {
		try {
			await invoke('save_app_state', { 
				screenshot_data: screenshotResult 
			});
			console.log('💾 App state saved successfully');
		} catch (error) {
			console.error('❌ Failed to save app state:', error);
		}
	};

	const restoreAppState = async () => {
		try {
			const state = await invoke('get_app_state') as any;
			if (state.screenshot_data) {
				setScreenshotResult(state.screenshot_data);
				console.log('📂 App state restored with screenshot');
			}
		} catch (error) {
			console.error('❌ Failed to restore app state:', error);
		}
	};

	const testScreenSelection = async () => {
		// Always close previous chat/AI response when switching
		setAiResponse(null);
		setChatBoxOpen(false);
		
		if (isCreatingOverlay) {
			console.log('⏳ Already creating overlay, ignoring click');
			return;
		}
		
		setIsCreatingOverlay(true);
		console.log('🚀 FAS 1: Starting optimized overlay selection...');
		
		try {
			// FAS 1: Use optimized overlay with pooling
			await invoke('create_transparent_overlay_optimized');
			console.log('✅ Optimized overlay window activated (pooled)');
			
			// Main window stays normal - no changes needed
		} catch (error) {
			console.error('❌ Failed to create optimized overlay:', error);
			console.log('🔄 Falling back to original overlay...');
			
			// Fallback to original overlay if optimized fails
			try {
				await invoke('create_transparent_overlay');
				console.log('✅ Fallback overlay window created');
			} catch (fallbackError) {
				console.error('❌ Both overlay methods failed:', fallbackError);
				alert(`Failed to create overlay: ${error}`);
			}
		} finally {
			// FAS 1: Faster reset (overlay pooling is quicker)
			setTimeout(() => {
				setIsCreatingOverlay(false);
			}, 500); // Reduced from 1000ms
		}
	};

	// 🤖 CHAT FLOW HANDLERS (FAS 4: React-based approach)
	const handleAskAI = async () => {
		// Always close previous chat/AI response when switching
		setAiResponse(null);
		setChatBoxOpen(false);
		
		console.log('🤖 Ask AI clicked - React ChatBox approach');
		console.log('📊 Current chatBoxOpen state:', chatBoxOpen);
		console.log('🖼️ Image context:', selectedImageForAI ? 'Present' : 'None');
		
		if (!chatBoxOpen) {
			// Open ChatBox: Expand window + show ChatBox
			console.log('🔄 Opening ChatBox - expanding window and showing component');
			
			try {
				// Expand window for chat mode with better height calculation
				await invoke('resize_window', { width: 600, height: 120 });
				console.log('✅ Window expanded to 600x120 for chat');
				
				// Show ChatBox with consistent background
				console.log('✅ ChatBox opened with consistent background');
				
				// Show ChatBox React component
				setChatBoxOpen(true);
				console.log('✅ ChatBox component now visible');
				
			} catch (error) {
				console.error('❌ Failed to expand window for chat:', error);
				// Still show ChatBox even if window resize fails
				setChatBoxOpen(true);
			}
		} else {
			// Close ChatBox: Hide ChatBox + shrink window
			console.log('🔄 Closing ChatBox - hiding component and shrinking window');
			handleCloseChatBox();
		}
	};

	// Handle ChatBox close (shrink window back to compact size)
	const handleCloseChatBox = async () => {
		console.log('🔄 Closing ChatBox and shrinking window');
		
		try {
			// Hide ChatBox component first
			setChatBoxOpen(false);
			
			// STEG 2: Clear image context when closing ChatBox
			clearImageContext();
			
			// Only shrink if no AI response is showing
			if (!aiResponse) {
				await invoke('resize_window', { width: 600, height: 50 });
				console.log('✅ Window shrunk back to 600x50');
			} else {
				console.log('✅ Keeping window expanded - AI response visible');
			}
			
			// ChatBox closed, background remains consistent
			console.log('✅ ChatBox closed, background consistent');
			
		} catch (error) {
			console.error('❌ Failed to shrink window after chat close:', error);
			// Still hide ChatBox even if window resize fails
			setChatBoxOpen(false);
		}
	};

	// Handle AI response dismissal (shrink window back to compact)
	const handleDismissAiResponse = async () => {
		console.log('🔄 Dismissing AI response and shrinking window');
		
		// Hide AI response
		setAiResponse(null);
		
		// STEG 2: Clear image context when dismissing AI response  
		clearImageContext();
		
		try {
			// Shrink window back to compact size
			await invoke('resize_window', { width: 600, height: 50 });
			console.log('✅ Window shrunk back to 600x50 after AI response dismissed');
		} catch (error) {
			console.error('❌ Failed to shrink window after AI response dismiss:', error);
		}
	};

	// Handle message sent from ChatBox
	const handleSendMessage = async (message: string) => {
		console.log('💬 Message sent from ChatBox:', message);
		console.log('🖼️ Image context available:', !!selectedImageForAI);
		console.log('🔍 OCR context available:', !!ocrContext?.has_text);
		
		// Start thinking animation
		setIsAiThinking(true);
		setAiProcessingStage('Analyzing screenshot...');
		
		// Hide ChatBox but keep window expanded for AI response
		setChatBoxOpen(false);
		
		// Restore CSS background but keep window size for AI response
		console.log('✅ ChatBox hidden, keeping window expanded for AI response');
		
		// 🔍 Enhanced message with OCR context if available
		setAiProcessingStage('Processing OCR context...');
		
		const enhancedMessage = ocrContext?.has_text 
			? `${message}\n\n[OCR Context - Text found in image: "${ocrContext.text}" (Confidence: ${Math.round(ocrContext.confidence * 100)}%)]`
			: message;
		
		// STEG 4: Create comprehensive AI message with text, image, and OCR data
		const aiMessage: AIMessage = {
			text: enhancedMessage,
			imageData: selectedImageForAI || undefined,
			timestamp: Date.now(),
			bounds: undefined // Future: Add capture bounds if needed
		};
		
		console.log('📤 Enhanced AI message prepared:', {
			originalText: message,
			enhancedText: enhancedMessage,
			hasImage: !!aiMessage.imageData,
			hasOCR: !!ocrContext?.has_text,
			ocrText: ocrContext?.has_text ? `"${ocrContext.text.substring(0, 30)}..."` : 'None',
			imageSize: aiMessage.imageData ? `${Math.round(aiMessage.imageData.length * 0.75 / 1024)}KB` : 'N/A',
			timestamp: aiMessage.timestamp,
			formattedTime: new Date(aiMessage.timestamp).toLocaleTimeString()
		});
		
		// STEG 4: Send to AI (mock for now, ready for real API)
		setAiProcessingStage('Sending to OpenAI...');
		
		try {
			const aiResponse = await sendToAI(aiMessage);
			setAiProcessingStage('Generating response...');
			
			// Calculate window height based on response length
			const getWindowHeight = (textLength: number) => {
				const screenHeight = window.screen?.height || 900;
				const baseHeight = 80; // Header + padding
				const maxContentHeight = Math.floor(screenHeight * 0.6); // Use more conservative 60% of screen
				
				// Calculate needed height based on text length
				let contentHeight;
				if (textLength < 100) contentHeight = 80;
				else if (textLength < 300) contentHeight = 120;
				else if (textLength < 600) contentHeight = 160;
				else if (textLength < 1000) contentHeight = 220;
				else contentHeight = maxContentHeight;
				
				return Math.min(baseHeight + contentHeight, maxContentHeight);
			};
			
			const windowHeight = getWindowHeight(aiResponse.length);
			console.log(`📏 AI response length: ${aiResponse.length} chars → window height: ${windowHeight}px`);
			
			// Short delay to show final stage then resize and show response
			setTimeout(async () => {
				try {
					await invoke('resize_window', { width: 600, height: windowHeight });
					console.log('✅ Window resized for AI response');
				} catch (error) {
					console.warn('⚠️ Failed to resize window:', error);
				}
				
							setAiResponse(aiResponse);
			setIsAiThinking(false);
			setAiProcessingStage('');
			
			// Update user usage after successful AI request
			if (user) {
				try {
					const updatedUser = await UserService.updateUsage(1);
					setUser(updatedUser);
					console.log('✅ User usage updated:', updatedUser.tier.remainingRequests, 'requests remaining');
				} catch (error) {
					console.error('❌ Failed to update user usage:', error);
				}
			}
		}, 100);
		} catch (error) {
			console.error('❌ AI request failed:', error);
			setAiResponse('❌ Sorry, I encountered an error processing your request. Please try again.');
			setIsAiThinking(false);
			setAiProcessingStage('');
		}
		
		const contextTypes = [
			selectedImageForAI ? 'Image' : null,
			ocrContext?.has_text ? 'OCR' : null
		].filter(Boolean).join(' + ') || 'Text only';
		
		console.log('✅ AI response generated with context:', contextTypes);
	};

	// 🔍 Automatic OCR function - runs silently after screenshot
	const runAutomaticOCR = async (imageData: string) => {
		console.log('🔍 Running automatic OCR in background...');
		
		try {
			const ocrResult = await invoke('extract_text_ocr', { imageData }) as OCRResult;
			setOcrContext(ocrResult);
			
			if (ocrResult.has_text) {
				console.log(`✅ OCR completed silently - Found text: "${ocrResult.text.substring(0, 50)}..." (${Math.round(ocrResult.confidence * 100)}% confidence)`);
			} else {
				console.log('🔍 OCR completed silently - No text detected');
			}
		} catch (error) {
			console.log('🔍 OCR failed silently, continuing without text context:', error);
			setOcrContext(null);
		}
	};

	// ⚙️ Settings handlers
	const handleApiKeyUpdate = (newApiKey: string) => {
		if (newApiKey && newApiKey.startsWith('sk-')) {
			// Update service with new API key
			const service = createAIService(newApiKey);
			setAiService(service);
			console.log('✅ AI service updated with new API key');
		} else {
			// Remove API key
			setAiService(null);
			console.log('🔐 API key removed - AI service disabled');
		}
	};

	const handleOpenSettings = () => {
		setSettingsOpen(true);
		console.log('⚙️ Opening settings dialog');
	};

	const handleCloseSettings = () => {
		setSettingsOpen(false);
		console.log('⚙️ Settings dialog closed');
	};

	// STEG 2: Clear image context when starting new session
	const clearImageContext = () => {
		setSelectedImageForAI(null);
		setOcrContext(null); // Also clear OCR context
		console.log('🗑️ Image and OCR context cleared for new session');
	};

	const moveWindowToCorrectPosition = async () => {
		try {
			await invoke('move_window_to_position');
			console.log('✅ Window moved to correct position (4/5 from bottom)');
			alert('✅ Fönster flyttat till rätt position!');
		} catch (error) {
			console.error('❌ Failed to move window:', error);
			alert('❌ Kunde inte flytta fönstret');
		}
	};

	// Add effect to resize window when thinking
	useEffect(() => {
		if (isAiThinking) {
			invoke('resize_window', { width: 600, height: 100 });
		}
	}, [isAiThinking]);

	const [aiResponseVisible, setAiResponseVisible] = useState(false);

	useEffect(() => {
		if (aiResponse) {
			setAiResponseVisible(false);
			setTimeout(() => setAiResponseVisible(true), 10); // trigger animation
		} else {
			setAiResponseVisible(false);
		}
	}, [aiResponse]);

	if (!isReady) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	// Temporary: Skip permissions for testing
	// if (!hasPermissions) {
	// 	return <PermissionWizard onPermissionsGranted={checkPermissions} />;
	// }

	return (
		<div 
			className="h-full flex flex-col px-4 py-2 rounded-xl border border-gray-200 shadow-lg relative overflow-hidden"
			style={{ 
				backgroundColor: 'rgba(20, 20, 20, 0.5)', 
				backdropFilter: 'blur(10px)',
				borderColor: 'rgba(255, 255, 255, 0.2)'
			}}
		>
			{/* Compact palette header */}
			<div className="flex items-center justify-between flex-shrink-0">
				<div className="flex items-center space-x-2">
					<div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
						<svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<span className="text-xs font-medium text-white">FrameSense</span>
					
					{/* Screenshot result - BETWEEN LOGO AND BUTTON */}
					{screenshotResult && (
						<div className="flex items-center space-x-2 px-2 py-1 bg-gray-500/20 rounded border border-white/10 backdrop-blur-sm">
							<span className="text-xs text-white font-medium">Captured</span>
							<img 
								src={screenshotResult} 
								alt="Screenshot" 
								className="w-6 h-4 object-cover rounded border border-white/20"
							/>
						</div>
					)}
				</div>
				
				{/* Action Buttons */}
				<div className="flex space-x-1.5">
					{/* Settings Button */}
					<button
						onClick={handleOpenSettings}
						className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10"
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span>Settings</span>
					</button>

					{/* Ask AI Button */}
					<button
						onClick={handleAskAI}
						className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10"
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<span>Ask AI</span>
					</button>

					{/* Move Window Button */}
					<button
						onClick={moveWindowToCorrectPosition}
						className="bg-green-500/20 hover:bg-green-500/30 text-white px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10"
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
						</svg>
						<span>Move</span>
					</button>

					{/* Interactive Selection Button - With loading state */}
					<button
						onClick={testScreenSelection}
						disabled={isCreatingOverlay}
						className={`${
							isCreatingOverlay 
								? 'bg-gray-500/30 cursor-not-allowed' 
								: 'bg-gray-500/20 hover:bg-gray-500/30'
						} text-white px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10`}
					>
						{isCreatingOverlay ? (
							<>
								<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								<span>Creating...</span>
							</>
						) : (
							<>
								<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<span>Select</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Main content area with fixed top and bottom margins */}
			<div className="flex flex-col justify-between h-full overflow-hidden">
				{/* Top margin from header to AI Response */}
				<div className="mt-3 flex-shrink-0">
					{aiResponse && (
						<div className={`transition-all duration-300 ease-out pb-4 ${aiResponseVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}> {/* pb-4 = 16px bottom padding */}
							<AIResponse 
								response={aiResponse}
								onDismiss={handleDismissAiResponse}
							/>
						</div>
					)}
				</div>

				{/* Bottom elements with fixed margin from AI Response */}
				<div className="flex flex-col flex-shrink-0 mt-2"> {/* mt-2 = 8px top margin */}
					<ThinkingAnimation
						isVisible={isAiThinking}
						currentStage={aiProcessingStage}
					/>
					<ChatBox 
						isVisible={chatBoxOpen}
						onSend={handleSendMessage}
						onClose={handleCloseChatBox}
						imageContext={selectedImageForAI || undefined}
					/>
				</div>
			</div>

			{/* Processing indicator */}
			{isProcessing && <ProgressIndicator />}
			
			{/* Result overlay */}
			{currentResult && <ResultOverlay result={currentResult} />}
			
			{/* ⚙️ Settings Dialog */}
			<SettingsDialog
				isOpen={settingsOpen}
				onClose={handleCloseSettings}
				aiService={aiService}
				onApiKeyUpdate={handleApiKeyUpdate}
			/>
		</div>
	);
}

export default App;
