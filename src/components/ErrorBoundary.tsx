import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  let errorMessage = 'An unexpected error occurred.';
  try {
    const parsedError = JSON.parse(error.message || '');
    if (parsedError.error) {
      errorMessage = parsedError.error;
    }
  } catch (e) {
    // Not a JSON error
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">Something went wrong</h2>
        <p className="text-stone-600 mb-6">{errorMessage}</p>
        <button
          onClick={() => {
            resetErrorBoundary();
            window.location.reload();
          }}
          className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
