import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import App from './App';
import { WalletProvider } from './context/WalletContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import ToastHost from './components/Toast/ToastHost';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ErrorBoundary>
			<WalletProvider>
				<App />
				{/* Outside App so a toast still renders if a page subtree fails. */}
				<ToastHost />
			</WalletProvider>
		</ErrorBoundary>
	</React.StrictMode>
);
