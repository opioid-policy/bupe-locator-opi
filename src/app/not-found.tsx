import { Suspense } from 'react';
import Link from 'next/link';

// Create a separate component for the content that might use dynamic features
function NotFoundContent() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      minHeight: '60vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center' 
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Sorry, the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link 
        href="/" 
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007cba',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '1rem'
        }}
      >
        Return Home
      </Link>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      minHeight: '60vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center' 
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Sorry, the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link 
        href="/" 
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007cba',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '1rem'
        }}
      >
        Return Home
      </Link>
    </div>
  );
}

// Main not-found page component
export default function NotFound() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotFoundContent />
    </Suspense>
  );
}