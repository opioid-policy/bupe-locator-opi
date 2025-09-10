import { Suspense } from 'react';
import Link from 'next/link';
import { T, NoTranslate } from '@/lib/i18n-markers';


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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}><T>Page Not Found</T></h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
       <T>Sorry, the page you&apos;re looking for doesn&apos;t exist.</T>
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
        <T>Return Home</T>
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}><T>Page Not Found</T></h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
       <T>Sorry, the page you&apos;re looking for doesn&apos;t exist.</T>
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
       <T>Return Home</T>
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