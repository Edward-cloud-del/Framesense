import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OverlayApp from './OverlayApp';
import './index.css';

// Check if this is the overlay window
const isOverlay = window.location.pathname === '/overlay' || window.location.hash.includes('overlay');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		{isOverlay ? <OverlayApp /> : <App />}
	</React.StrictMode>
);
