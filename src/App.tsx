import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import PermissionWizard from './components/PermissionWizard';
import ResultOverlay from './components/ResultOverlay';
import ProgressIndicator from './components/ProgressIndicator';
import { useAppStore } from './stores/app-store';

function App() {
	const [isReady, setIsReady] = useState(false);
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
