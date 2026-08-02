import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import App from './App';
import { WalletProvider } from './context/WalletContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ErrorBoundary>
			<WalletProvider>
				<App />
			</WalletProvider>
		</ErrorBoundary>
	</React.StrictMode>
);
