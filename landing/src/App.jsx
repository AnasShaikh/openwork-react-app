import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <LandingPage />
      </div>
    </Router>
  );
}

export default App;