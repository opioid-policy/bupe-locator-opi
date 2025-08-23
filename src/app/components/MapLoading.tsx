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
      <Image
        src="/otter-loading.gif"
        alt="Loading map"
        width={100}
        height={100}
        priority
      />
    </div>
  );
}
