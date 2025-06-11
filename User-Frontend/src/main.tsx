// main.tsx (conceptual)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider wraps the entire App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);