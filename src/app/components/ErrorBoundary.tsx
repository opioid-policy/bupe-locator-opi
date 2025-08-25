// src/app/components/ErrorBoundary.tsx
"use client";
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;  // Make fallback optional with a default
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;  // Store the error for potential logging
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    // You could add error reporting here (e.g., Sentry, LogRocket)
  }

  render() {
    if (this.state.hasError) {
      // Use the provided fallback or a default message
      return this.props.fallback || (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--font-color-dark)',
          backgroundColor: 'var(--background-color)',
          borderRadius: '4px',
          margin: '1rem 0'
        }}>
          <h2>Something went wrong</h2>
          <p>We&apos;re having trouble loading this content.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-green)',
              color: 'var(--font-color-dark)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
