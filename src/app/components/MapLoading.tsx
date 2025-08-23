"use client";
import Image from 'next/image';

export default function MapLoading() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000
    }}>
      <div style={{
        animation: 'spin 8s linear infinite',
        width: '100px',
        height: '100px'
      }}>
        <Image
          src="/otter-loading.png"
          alt="Loading map"
          width={100}
          height={100}
          priority
          style={{ display: 'block' }}
        />
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
