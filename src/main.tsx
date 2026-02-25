import { clearSwAndCaches } from "./clearSwAndCaches";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./app/auth/AuthProvider";
import { ErrorBoundary } from "./ui/ErrorBoundary";


clearSwAndCaches().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
});
