import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
// Removed AIResponse import - now using ResultOverlay
import ChatBox from './components/ChatBox';
// Removed SettingsDialog import - now using Upgrade to Pro
import ThinkingAnimation from './components/ThinkingAnimation';
import ModelSelector from './components/ModelSelector';


import { useAppStore, AIResult } from './stores/app-store';
import { authService, type User } from './services/auth-service-db';
import LoginDialog from './components/LoginDialog';
import UserMenu from './components/UserMenu';

// 🤖 Real OpenAI Integration
import { createAIService } from './services/openai-service';
import { getApiKey } from './config/api-config';
import type { IAIService, AIRequest } from './types/ai-types';
import UserService from './services/user-service';
import DevHelpers from './utils/dev-helpers';

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
	const [chatBoxOpen, setChatBoxOpen] = useState(false);
	
	// 🖼️ STEG 2: Separate state for AI image context (independent from badge)
	const [selectedImageForAI, setSelectedImageForAI] = useState<string | null>(null);
	
	// 🔍 OCR Context state for automatic text extraction
	const [ocrContext, setOcrContext] = useState<OCRResult | null>(null);
	
	// 🤖 Real OpenAI service state
	const [aiService, setAiService] = useState<IAIService | null>(null);
	
	// ⚙️ Settings UI state (removed - now using Upgrade to Pro)
	
	// 🎭 Thinking Animation state
	const [isAiThinking, setIsAiThinking] = useState(false);
	const [aiProcessingStage, setAiProcessingStage] = useState<string>('');
	
	// 🎯 Model Selector state (like ChatBox)
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);



	const { 
		hasPermissions, 
		isProcessing, 
		currentResult, 
		setPermissions,
		selectedModel,
		setSelectedModel
	} = useAppStore();

	// Use auth service for user management
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [debugMode, setDebugMode] = useState(true); // Auto-show debug info
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	
	// Login handlers - defined at component level
	const handleLoginClick = () => {
		setShowLoginDialog(true);
	};

	const handleLoginSuccess = (user: User) => {
		setCurrentUser(user);
		alert(`🎉 Welcome back, ${user.name}!\n\nYou now have ${user.tier} access!`);
	};

	const handleLogout = () => {
		setCurrentUser(null);
		alert('👋 You have been logged out. You now have free access.');
	};

	const handleUserUpdate = (user: User) => {
		setCurrentUser(user);
	};

	// Initialize auth service and listen for user changes
	useEffect(() => {
		const handleUserChange = (user: User | null) => {
			setCurrentUser(user);
			console.log('🔍 User changed:', user ? `${user.email} (${user.tier})` : 'No user');
		};

		authService.addAuthListener(handleUserChange);
		
		// Load current user
		authService.loadCurrentUser().then(user => {
			setCurrentUser(user);
			console.log('🔍 Initial user loaded:', user ? `${user.email} (${user.tier})` : 'No user');
		});
		
		return () => {
			authService.removeAuthListener(handleUserChange);
		};
	}, []);

	// Debug functions for session management
	const clearUserSession = async () => {
		try {
			await authService.logout();
			console.log('🗑️ Session cleared successfully');
			alert('Session cleared! You are now logged out.');
		} catch (error) {
			console.error('❌ Failed to clear session:', error);
			alert('Failed to clear session. Check console for details.');
		}
	};

	// Handle upgrade click
	const handleUpgradeClick = async (plan?: string) => {
		try {
			console.log('🚀 Starting upgrade process for plan:', plan || 'default');
			
			// Open payment page on payments server
			const baseUrl = 'http://localhost:8080';
			const upgradeUrl = plan 
				? `${baseUrl}/payments?plan=${plan}`
				: `${baseUrl}/payments`;
			
			console.log('🔗 Opening payment page:', upgradeUrl);
			await open(upgradeUrl);
			
			console.log('✅ Payment process initiated');
		} catch (error) {
			console.error('❌ Failed to start upgrade process:', error);
			alert('Failed to open payment page. Please try again.');
		}
	};

	    const refreshUserSession = async () => {
        try {
            const user = await authService.refreshUserStatus();
            if (user) {
                console.log('🔄 Status refreshed:', user.email, user.tier);
                alert(`Status refreshed! User: ${user.email} (${user.tier})`);
            } else {
                console.log('🔄 No user to refresh');
                alert('No active user session found.');
            }
        } catch (error) {
            console.error('❌ Failed to refresh status:', error);
            alert('Failed to refresh status. Check console for details.');
        }
    };

    const clearPaymentFile = async () => {
        try {
            await invoke('clear_payment_file');
            console.log('🗑️ Payment file cleared');
            alert('Payment file cleared successfully.');
        } catch (error) {
            console.error('❌ Failed to clear payment file:', error);
            alert('Failed to clear payment file. Check console for details.');
        }
    };

    const testStatusCheck = async () => {
        try {
            console.log('🧪 Testing status check...');
            await refreshUserSession();
            console.log('✅ Status check test completed');
        } catch (error) {
            console.error('❌ Status check test failed:', error);
            alert('Status check test failed. Check console for details.');
        }
    };

    const testPaymentsPage = () => {
        console.log('🧪 Testing payments page...');
        open('http://localhost:3000/payments');
        console.log('✅ Payments page opened');
    };

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
		
		// 🤖 Initialize AI service with API key
		const apiKey = getApiKey();
		if (apiKey) {
			const service = createAIService(apiKey);
			setAiService(service);
			console.log('✅ AI service initialized with real OpenAI');
		} else {
			console.warn('⚠️ No API key found - AI service disabled');
		}
		
		// 🔗 Server-centralized method - no deep link service needed
		console.log('✅ Using simple server-centralized payment method');
		
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
		console.log('🔴 RED CIRCLE: testScreenSelection called - user clicked Select button');
		// Always close previous chat/AI response when switching
		useAppStore.getState().setCurrentResult(null);
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
		useAppStore.getState().setCurrentResult(null);
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
			if (!currentResult) {
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
		
		// Hide AI response using new system
		useAppStore.getState().setCurrentResult(null);
		
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
				
							// 🔴 RED CIRCLE: Creating AIResult for new ResultOverlay
				console.log('🔴 RED CIRCLE: About to create AIResult with aiResponse:', aiResponse.substring(0, 50) + '...');
				const result: AIResult = {
					id: `result_${Date.now()}`,
					content: aiResponse,
					type: selectedImageForAI ? 'hybrid' : 'text',
					confidence: 0.9,
					timestamp: new Date(),
					capturedImage: selectedImageForAI || undefined,
					position: { x: 100, y: 100 } // Center position
				};
				
				console.log('🔴 RED CIRCLE: Created AIResult:', {
					id: result.id,
					contentLength: result.content.length,
					type: result.type,
					hasCapturedImage: !!result.capturedImage
				});
				
				// Use new ResultOverlay system
				useAppStore.getState().setCurrentResult(result);
				useAppStore.getState().addResult(result);
				console.log('🔴 RED CIRCLE: AIResult set in store - should trigger ResultOverlay render!');
				
				setIsAiThinking(false);
				setAiProcessingStage('');
				
				// Update user usage after successful AI request (handled by auth service)
				if (currentUser) {
					console.log('✅ AI request completed for user:', currentUser.email, currentUser.tier);
				}
		}, 100);
		} catch (error) {
			console.error('❌ AI request failed:', error);
			
			// Create error result for new ResultOverlay
			const errorResult: AIResult = {
				id: `error_${Date.now()}`,
				content: '❌ Sorry, I encountered an error processing your request. Please try again.',
				type: 'text',
				confidence: 0.0,
				timestamp: new Date(),
				capturedImage: selectedImageForAI || undefined,
				position: { x: 100, y: 100 }
			};
			
			useAppStore.getState().setCurrentResult(errorResult);
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

	// ⚙️ Settings handlers (removed - now using Upgrade to Pro)

	// 🎯 Model Selector handlers (like ChatBox)
	const handleOpenModelSelector = async () => {
		// Always close previous chat/AI response when switching
		useAppStore.getState().setCurrentResult(null);
		setChatBoxOpen(false);
		
		console.log('🎯 Model selector clicked - dropdown approach');
		console.log('📊 Current modelSelectorOpen state:', modelSelectorOpen);
		
		if (!modelSelectorOpen) {
			// Open ModelSelector: Expand window + show ModelSelector
			console.log('🔄 Opening ModelSelector - expanding window and showing component');
			
			try {
				// Expand window for model selector with better height
				await invoke('resize_window', { width: 600, height: 250 });
				console.log('✅ Window expanded to 600x250 for model selector');
				
				// Show ModelSelector React component
				setModelSelectorOpen(true);
				console.log('✅ ModelSelector component now visible');
				
			} catch (error) {
				console.error('❌ Failed to expand window for model selector:', error);
				// Still show ModelSelector even if window resize fails
				setModelSelectorOpen(true);
			}
		} else {
			// Close ModelSelector: Hide ModelSelector + shrink window
			console.log('🔄 Closing ModelSelector - hiding component and shrinking window');
			handleCloseModelSelector();
		}
	};

	const handleCloseModelSelector = async () => {
		console.log('🔄 Closing ModelSelector and shrinking window');
		
		try {
			// Hide ModelSelector component first
			setModelSelectorOpen(false);
			
			// Only shrink if no AI response is showing
			if (!currentResult) {
				await invoke('resize_window', { width: 600, height: 50 });
				console.log('✅ Window shrunk back to 600x50');
			} else {
				console.log('✅ Keeping window expanded - AI response visible');
			}
			
			console.log('✅ ModelSelector closed, background consistent');
			
		} catch (error) {
			console.error('❌ Failed to shrink window after model selector close:', error);
			// Still hide ModelSelector even if window resize fails
			setModelSelectorOpen(false);
		}
	};

	const handleModelSelect = (model: string) => {
		setSelectedModel(model);
		console.log('🎯 Model selected:', model);
	};

	// STEG 2: Clear image context when starting new session
	const clearImageContext = () => {
		setSelectedImageForAI(null);
		setOcrContext(null); // Also clear OCR context
		console.log('🗑️ Image and OCR context cleared for new session');
	};



	// Add effect to resize window when thinking
	useEffect(() => {
		if (isAiThinking) {
			invoke('resize_window', { width: 600, height: 100 });
		}
	}, [isAiThinking]);

	// Removed aiResponseVisible state - now using ResultOverlay system

	// 🔴 DEBUG: Comprehensive render state logging
	console.log('🔍 App.tsx render - Debug State:', {
		// User session info
		hasCurrentUser: !!currentUser,
		userEmail: currentUser?.email || 'NO USER',
		userTier: currentUser?.tier || 'NO TIER',
		userStatus: currentUser?.subscription_status || 'NO STATUS',
		
		// AI result info
		hasCurrentResult: !!currentResult,
		currentResultId: currentResult?.id,
		currentResultType: currentResult?.type,
		currentResultContent: currentResult?.content?.substring(0, 30) + '...' || 'NO CONTENT',
		
		// Component states
		chatBoxOpen,
		modelSelectorOpen,
		debugMode,
		selectedModel,
	});

	// 🔴 RED CIRCLE: Manual test function for debugging
	const testResultOverlay = () => {
		console.log('🔴 RED CIRCLE: Manually testing ResultOverlay...');
		const testResult: AIResult = {
			id: `test_${Date.now()}`,
			content: '🔴 This is a test AI response to verify that the ResultOverlay works correctly. You should see upgrade buttons and model selector.',
			type: 'text',
			confidence: 1.0,
			timestamp: new Date(),
			capturedImage: undefined,
			position: { x: 100, y: 100 }
		};
		
		useAppStore.getState().setCurrentResult(testResult);
		console.log('🔴 RED CIRCLE: Test result set - ResultOverlay should appear!');
	};

	// 🔴 RED CIRCLE: Make test function available in browser console
	if (typeof window !== 'undefined') {
		(window as any).testResultOverlay = testResultOverlay;
		console.log('🔴 RED CIRCLE: Run testResultOverlay() in console to test UI');
	}

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
			className="h-full flex flex-col px-4 py-1.5 rounded-xl border border-gray-200 shadow-lg relative overflow-hidden"
			style={{ 
				backgroundColor: 'rgba(20, 20, 20, 0.5)', 
				backdropFilter: 'blur(10px)',
				borderColor: 'rgba(255, 255, 255, 0.2)'
			}}
			data-tauri-drag-region
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
					
					{/* 🔍 DEBUG: Current User Display */}
					<div className="flex items-center space-x-1">
						<button
							onClick={() => setDebugMode(!debugMode)}
							className="text-xs text-white/50 hover:text-white/80 transition-colors"
							title="Toggle debug info"
						>
							🔍
						</button>
						{debugMode && (
							<div className="flex items-center space-x-1 px-2 py-0.5 bg-yellow-500/20 rounded border border-yellow-400/30 backdrop-blur-sm">
								{currentUser ? (
									<>
										<span className="text-xs text-yellow-300 font-mono">
											{currentUser.email.substring(0, 15)}...
										</span>
										<span className={`text-xs px-1 py-0.5 rounded font-mono ${
											currentUser.tier === 'free' ? 'bg-gray-500/30 text-gray-300' :
											currentUser.tier === 'premium' ? 'bg-blue-500/30 text-blue-300' :
											currentUser.tier === 'pro' ? 'bg-purple-500/30 text-purple-300' :
											'bg-yellow-500/30 text-yellow-300'
										}`}>
											{currentUser.tier.toUpperCase()}
										</span>
										<button
											onClick={clearUserSession}
											className="text-xs text-red-400 hover:text-red-300 ml-1"
											title="Clear session"
										>
											🗑️
										</button>
										<button
											onClick={refreshUserSession}
											className="text-xs text-green-400 hover:text-green-300"
											title="Refresh session"
										>
											🔄
										</button>
																			<button
										onClick={clearPaymentFile}
										className="text-xs text-orange-400 hover:text-orange-300"
										title="Clear payment file"
									>
										📄
									</button>
									<button
										onClick={testStatusCheck}
										className="text-xs text-green-400 hover:text-green-300"
										title="Test status check"
									>
										💳
									</button>
									<button
										onClick={testPaymentsPage}
										className="text-xs text-blue-400 hover:text-blue-300"
										title="Test payments page"
									>
										🌐
									</button>
									</>
								) : (
									<span className="text-xs text-gray-400 font-mono">NO USER</span>
								)}
							</div>
						)}
					</div>
					
					{/* Screenshot result - BETWEEN LOGO AND BUTTON */}
					{screenshotResult && (
						<div className="flex items-center space-x-2 px-2 py-1 bg-gray-500/20 rounded border border-white/10 backdrop-blur-sm">
							<img 
								src={screenshotResult} 
								alt="Screenshot" 
								className="w-6 h-4 object-cover rounded border border-white/20"
							/>
						</div>
					)}
				</div>
				
				{/* User Authentication Section */}
				<div className="flex items-center space-x-2">
					{currentUser ? (
						<UserMenu 
							user={currentUser}
							onLogout={handleLogout}
							onUserUpdate={handleUserUpdate}
						/>
					) : (
						<button
							onClick={handleLoginClick}
							className="flex items-center space-x-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
							title="Login with premium account"
						>
							<span>🔑</span>
							<span className="text-white/80 text-sm">Login</span>
						</button>
					)}
				</div>
				
				{/* Action Buttons */}
				<div className="flex space-x-1.5" data-tauri-drag-region="false">
					{/* Upgrade to Pro Button */}
					<button
						onClick={() => handleUpgradeClick('pro')}
						className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-white px-3 py-0.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-purple-400/20"
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span>Upgrade to Pro</span>
					</button>



					{/* Model Selector Button */}
					<button
						onClick={handleOpenModelSelector}
						className="bg-purple-500/20 hover:bg-purple-500/30 text-white px-3 py-0.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10"
						title={`Current model: ${selectedModel}`}
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
						</svg>
						<span>Models</span>
						<span className="text-xs opacity-75">({selectedModel.split('-')[0]})</span>
					</button>

					{/* Ask AI Button */}
					<button
						onClick={handleAskAI}
						className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-3 py-1 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10"
					>
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<span>Ai</span>
					</button>

					{/* Interactive Selection Button - With loading state */}
					<button
						onClick={testScreenSelection}
						disabled={isCreatingOverlay}
						className={`${
							isCreatingOverlay 
								? 'bg-gray-500/30 cursor-not-allowed' 
								: 'bg-gray-500/20 hover:bg-gray-500/30'
						} text-white px-3 py-0.5 rounded-lg transition-colors text-xs flex items-center space-x-1.5 backdrop-blur-sm border border-white/10`}
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
				{/* Top margin from header - old AIResponse removed, now using ResultOverlay */}
				<div className="mt-3 flex-shrink-0">
					{/* AI Response now handled by ResultOverlay component below */}
				</div>

				{/* Bottom elements with fixed margin from AI Response */}
				<div className="flex flex-col flex-shrink-0 mt-2"> {/* mt-2 = 8px top margin */}
					<ThinkingAnimation
						isVisible={isAiThinking}
						currentStage={aiProcessingStage}
					/>
					<div data-tauri-drag-region="false">
						<ChatBox 
							isVisible={chatBoxOpen}
							onSend={handleSendMessage}
							onClose={handleCloseChatBox}
							imageContext={selectedImageForAI || undefined}
						/>
									<ModelSelector
				isVisible={modelSelectorOpen}
				onClose={handleCloseModelSelector}
				onModelSelect={handleModelSelect}
				selectedModel={selectedModel}
			/>
					</div>
				</div>
			</div>

			{/* Processing indicator */}
			{isProcessing && <ProgressIndicator />}
			
					{/* 🔴 RED CIRCLE: Debug currentResult state */}
			
			{/* Result overlay */}
			{currentResult && <div data-tauri-drag-region="false"><ResultOverlay result={currentResult} /></div>}
			{/* 🔴 RED CIRCLE: ResultOverlay should render above this line when currentResult exists */}
			


			
			{/* Login Dialog */}
			<LoginDialog
				isOpen={showLoginDialog}
				onClose={() => setShowLoginDialog(false)}
				onLoginSuccess={handleLoginSuccess}
			/>

			{/* ⚙️ Settings Dialog - Removed, now using Upgrade to Pro button */}


		</div>
	);
}

export default App;
