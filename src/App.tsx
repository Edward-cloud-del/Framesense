import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
import AIResponse from './components/AIResponse';
import ChatBox from './components/ChatBox';

import { useAppStore } from './stores/app-store';

// STEG 4: AI Message interface for complete AI integration
interface AIMessage {
	text: string;
	imageData?: string;  // base64 PNG data
	timestamp: number;
	bounds?: any; // Future: CaptureBounds type
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

	const { 
		hasPermissions, 
		isProcessing, 
		currentResult, 
		setPermissions 
	} = useAppStore();

	// STEG 4: AI integration function (ready for OpenAI Vision API)
	const sendToAI = async (aiMessage: AIMessage): Promise<string> => {
		// Future implementation:
		// - Send to OpenAI Vision API if imageData exists
		// - Send to regular text API if only text
		// - Handle real AI responses
		console.log('🔮 Future AI endpoint ready:', aiMessage);
		
		// STEG 4: Enhanced mock implementation demonstrating full message preparation
		if (aiMessage.imageData) {
			const imageSize = Math.round(aiMessage.imageData.length * 0.75 / 1024); // Approximate KB size
			return `🤖 **AI Visual Analysis** 📸\n\n**Your question:** "${aiMessage.text}"\n\n**Image Analysis:** I can see the selected area from your screen. This appears to be a screenshot (${imageSize}KB) that contains various visual elements. In a real implementation, I would analyze the image content, text, UI elements, and provide specific insights about what's shown.\n\n**Technical Details:**\n• Timestamp: ${new Date(aiMessage.timestamp).toLocaleTimeString()}\n• Image format: Base64 PNG\n• Message type: Text + Visual\n\n**Combined Response:** Based on both your question and the visual content, I would provide a comprehensive analysis combining text understanding with computer vision capabilities.`;
		} else {
			return `🤖 **AI Text Response** 💬\n\n**Your question:** "${aiMessage.text}"\n\n**Technical Details:**\n• Timestamp: ${new Date(aiMessage.timestamp).toLocaleTimeString()}\n• Message type: Text only\n• Context: No image provided\n\nThis is a text-only response since no image was provided. In a real implementation, this would be processed by a language model to provide helpful and accurate information based on your question.`;
		}
	};

	useEffect(() => {
		// Check permissions on app start
		checkPermissions();
		
		// Restore app state when window is created (Raycast-style)
		restoreAppState();
		
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
		console.log('🤖 Ask AI clicked - React ChatBox approach');
		console.log('📊 Current chatBoxOpen state:', chatBoxOpen);
		console.log('🖼️ Image context:', selectedImageForAI ? 'Present' : 'None');
		
		if (!chatBoxOpen) {
			// Open ChatBox: Expand window + show ChatBox
			console.log('🔄 Opening ChatBox - expanding window and showing component');
			
			try {
				// Expand window for chat mode (600x50 → 600x130) - kompakt till expanderat  
				await invoke('resize_window', { width: 600, height: 130 });
				console.log('✅ Window expanded to 600x130');
				
				// Enable CSS transparency - window is transparent, React controls background
				console.log('✅ Window transparency enabled via CSS');
				
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
			
			// Restore CSS background - window shows white background again
			console.log('✅ Background restored, transparency disabled');
			
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
		
		// Hide ChatBox but keep window expanded for AI response
		setChatBoxOpen(false);
		
		// Restore CSS background but keep window size for AI response
		console.log('✅ ChatBox hidden, keeping window expanded for AI response');
		
		// STEG 4: Create comprehensive AI message with text and image data
		const aiMessage: AIMessage = {
			text: message,
			imageData: selectedImageForAI || undefined,
			timestamp: Date.now(),
			bounds: undefined // Future: Add capture bounds if needed
		};
		
		console.log('📤 STEG 4: Complete AI message prepared:', {
			text: aiMessage.text,
			hasImage: !!aiMessage.imageData,
			imageSize: aiMessage.imageData ? `${Math.round(aiMessage.imageData.length * 0.75 / 1024)}KB` : 'N/A',
			timestamp: aiMessage.timestamp,
			formattedTime: new Date(aiMessage.timestamp).toLocaleTimeString(),
			bounds: aiMessage.bounds || 'Not available'
		});
		
		// STEG 4: Send to AI (mock for now, ready for real API)
		try {
			const aiResponse = await sendToAI(aiMessage);
			setAiResponse(aiResponse);
		} catch (error) {
			console.error('❌ AI request failed:', error);
			setAiResponse('❌ Sorry, I encountered an error processing your request. Please try again.');
		}
		
		console.log('✅ AI response generated:', selectedImageForAI ? 'Text + Image' : 'Text only');
	};

	// STEG 2: Clear image context when starting new session
	const clearImageContext = () => {
		setSelectedImageForAI(null);
		console.log('🗑️ Image context cleared for new session');
	};

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
			className="h-full flex flex-col px-4 py-0 rounded-xl border border-gray-200 shadow-lg"
			style={{ 
				backgroundColor: chatBoxOpen ? 'transparent' : 'rgba(20, 20, 20, 0.5)', 
				backdropFilter: chatBoxOpen ? 'none' : 'blur(10px)',
				borderColor: chatBoxOpen ? 'transparent' : 'rgba(255, 255, 255, 0.2)'
			}}
		>
			{/* Compact palette header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
						<svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<span className="text-xs font-medium text-white">FrameSense</span>
					
					{/* Screenshot result - BETWEEN LOGO AND BUTTON */}
					{screenshotResult && (
						<div className="flex items-center space-x-2 px-2 py-1 bg-green-500/20 rounded border border-green-400/30 backdrop-blur-sm">
							<span className="text-xs text-green-200 font-medium">✅ Captured</span>
							<img 
								src={screenshotResult} 
								alt="Screenshot" 
								className="w-6 h-4 object-cover rounded border border-green-400/50"
							/>
						</div>
					)}
				</div>
				
				{/* Action Buttons */}
				<div className="flex space-x-1.5">
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



			{/* 🤖 AI RESPONSE (STEG 4) */}
			{aiResponse && (
				<AIResponse 
					response={aiResponse}
					onDismiss={handleDismissAiResponse}
				/>
			)}

			{/* Processing indicator */}
			{isProcessing && <ProgressIndicator />}
			
			{/* Result overlay */}
			{currentResult && <ResultOverlay result={currentResult} />}
			
			{/* 🤖 ChatBox Component (FAS 4: React-based) */}
			<ChatBox 
				isVisible={chatBoxOpen}
				onSend={handleSendMessage}
				onClose={handleCloseChatBox}
				imageContext={selectedImageForAI || undefined}
			/>
		</div>
	);
}

export default App;
