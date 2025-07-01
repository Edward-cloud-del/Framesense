import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import DragOverlay from './components/DragOverlay';

function OverlayApp() {
	// Force transparent background on all DOM levels
	React.useEffect(() => {
		document.documentElement.style.backgroundColor = 'transparent';
		document.body.style.backgroundColor = 'transparent';
		const root = document.getElementById('root');
		if (root) {
			root.style.backgroundColor = 'transparent';
		}
		console.log('🔍 Forced transparent background on all levels');
	}, []);

	const handleSelectionComplete = async (result: any) => {
		console.log('✅ Overlay selection completed!', result);
		
		// Close the overlay window
		try {
			await invoke('close_transparent_overlay');
			console.log('✅ Overlay window closed');
		} catch (error) {
			console.error('❌ Failed to close overlay:', error);
		}
	};

	const handleSelectionCancel = async () => {
		console.log('❌ Overlay selection cancelled');
		
		// Close the overlay window
		try {
			await invoke('close_transparent_overlay');
			console.log('✅ Overlay window closed');
		} catch (error) {
			console.error('❌ Failed to close overlay:', error);
		}
	};

	return (
		<div 
			className="h-screen w-screen" 
			style={{ 
				backgroundColor: 'transparent',
				position: 'fixed',
				top: 0,
				left: 0,
				zIndex: 9999
			}}
		>
			<DragOverlay 
				onSelectionComplete={handleSelectionComplete}
				onCancel={handleSelectionCancel}
			/>
		</div>
	);
}

export default OverlayApp; 