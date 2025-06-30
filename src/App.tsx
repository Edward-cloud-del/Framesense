import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
import { useAppStore } from './stores/app-store';

function App() {
	const [isReady, setIsReady] = useState(false);
	const [screenshotResult, setScreenshotResult] = useState<string | null>(null);
	const { 
		hasPermissions, 
		isProcessing, 
		currentResult, 
		setPermissions 
	} = useAppStore();

	useEffect(() => {
		// Check permissions on app start
		checkPermissions();
	}, []);

	const checkPermissions = async () => {
		try {
			const permissions = await invoke('check_permissions');
			setPermissions(permissions);
			setIsReady(true);
		} catch (error) {
			console.error('Failed to check permissions:', error);
			setIsReady(true);
		}
	};

	const takeScreenshot = async () => {
		try {
			console.log('📸 Taking screenshot...');
			const result = await invoke('take_fullscreen_screenshot') as string;
			setScreenshotResult(result);
			console.log('✅ Screenshot captured!');
		} catch (error) {
			console.error('❌ Screenshot failed:', error);
			alert(`Screenshot failed: ${error}`);
		}
	};

	const testScreenSelection = async () => {
		try {
			console.log('🎯 Testing screen selection...');
			const result = await invoke('start_screen_selection') as any;
			console.log('✅ Selection result:', result);
			
			if (result && !result.cancelled) {
				setScreenshotResult(result.image_data);
				alert(`Selection captured! Bounds: ${result.bounds.width}x${result.bounds.height} at (${result.bounds.x}, ${result.bounds.y})`);
			} else {
				alert('Selection was cancelled or invalid');
			}
		} catch (error) {
			console.error('❌ Selection failed:', error);
			alert(`Selection failed: ${error}`);
		}
	};

	if (!isReady) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (!hasPermissions) {
		return <PermissionWizard onPermissionsGranted={checkPermissions} />;
	}

	return (
		<div className="h-screen bg-gray-50 flex flex-col">
			{/* Main content */}
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
						<svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-gray-900">FrameSense</h1>
					<p className="text-gray-600 max-w-md">
						Press <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">⌥ + Space</kbd> to capture any screen content and get instant AI insights.
					</p>
					
					{/* Test buttons */}
					<div className="pt-6 space-y-3">
						<div className="flex space-x-3 justify-center">
							<button
								onClick={takeScreenshot}
								className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center space-x-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span>Test Screenshot</span>
							</button>
							
							<button
								onClick={testScreenSelection}
								className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<span>Test Selection</span>
							</button>
						</div>
						
						{screenshotResult && (
							<div className="mt-4 p-4 bg-white rounded-lg shadow-sm max-w-sm mx-auto">
								<p className="text-sm text-gray-600 mb-2">Screenshot captured!</p>
								<img 
									src={screenshotResult} 
									alt="Screenshot" 
									className="w-full h-32 object-cover rounded border"
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Processing indicator */}
			{isProcessing && <ProgressIndicator />}
			
			{/* Result overlay */}
			{currentResult && <ResultOverlay result={currentResult} />}
		</div>
	);
}

export default App;
