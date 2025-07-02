import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
import AIResponse from './components/AIResponse';
import ChatBox from './components/ChatBox';

import { useAppStore } from './stores/app-store';

function App() {
	const [isReady, setIsReady] = useState(false);
	const [screenshotResult, setScreenshotResult] = useState<string | null>(null);
	const [isCreatingOverlay, setIsCreatingOverlay] = useState(false);
	
	// 🤖 CHAT FLOW STATE MANAGEMENT (STEG 2) - Updated for window-based chat
	const [aiResponse, setAiResponse] = useState<string | null>(null);
	const [chatBoxOpen, setChatBoxOpen] = useState(false);

	const { 
		hasPermissions, 
		isProcessing, 
		currentResult, 
		setPermissions 
	} = useAppStore();

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
				setScreenshotResult(result.imageData);
				console.log('✅ Screen selection image loaded!');
				
				// Show alert with bounds info
				const bounds = result.bounds;
				alert(`Selection Complete!\n\nBounds: ${bounds.width}x${bounds.height} at (${bounds.x}, ${bounds.y})\n\nImage captured and displayed below!`);
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
		console.log('🚀 Starting transparent overlay selection...');
		
		try {
			// Create separate transparent overlay window
			await invoke('create_transparent_overlay');
			console.log('✅ Transparent overlay window created');
			
			// Main window stays normal - no changes needed
		} catch (error) {
			console.error('❌ Failed to create overlay:', error);
			alert(`Failed to create overlay: ${error}`);
		} finally {
			// Reset after delay to prevent rapid clicks
			setTimeout(() => {
				setIsCreatingOverlay(false);
			}, 1000);
		}
	};

	// 🤖 CHAT FLOW HANDLERS (FAS 4: React-based approach)
	const handleAskAI = async () => {
		console.log('🤖 Ask AI clicked - React ChatBox approach');
		console.log('📊 Current chatBoxOpen state:', chatBoxOpen);
		
		if (!chatBoxOpen) {
			// Open ChatBox: Expand window + show ChatBox
			console.log('🔄 Opening ChatBox - expanding window and showing component');
			
			try {
				// Expand window for chat mode (600x140 → 600x220) - hälften så stor expansion
				await invoke('resize_window', { width: 600, height: 220 });
				console.log('✅ Window expanded to 600x220');
				
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
			
			// Shrink window back to compact size (600x220 → 600x140)
			await invoke('resize_window', { width: 600, height: 140 });
			console.log('✅ Window shrunk back to 600x140');
			
			// Restore CSS background - window shows white background again
			console.log('✅ Background restored, transparency disabled');
			
		} catch (error) {
			console.error('❌ Failed to shrink window after chat close:', error);
			// Still hide ChatBox even if window resize fails
			setChatBoxOpen(false);
		}
	};

	// Handle message sent from ChatBox
	const handleSendMessage = async (message: string) => {
		console.log('💬 Message sent from ChatBox:', message);
		
		// Close ChatBox and shrink window
		await handleCloseChatBox();
		
		// Show AI response (mock for now)
		const mockResponse = `AI Response to: "${message}"\n\nThis is a mock response from the AI system. In a real implementation, this would be processed by an actual AI service.`;
		setAiResponse(mockResponse);
		
		console.log('✅ AI response shown and ChatBox closed');
	};

	const handleSelectWithChat = async () => {
		console.log('🎯 Select with Chat - doing screen capture + showing chat box');
		// First do screen capture
		await testScreenSelection();
		// Then show chat box using new React approach
		if (!chatBoxOpen) {
			handleAskAI(); // This will expand window and show ChatBox
		}
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
			className="h-full flex flex-col px-4 py-1 rounded-xl border border-gray-200 shadow-lg"
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
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
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
					onDismiss={() => setAiResponse(null)}
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
			/>
		</div>
	);
}

export default App;
