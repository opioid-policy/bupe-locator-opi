// src/app/components/MapLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { AggregatedPharmacy } from "../page";

interface MapLoaderProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
}

export default function MapLoader({ center, pharmacies }: MapLoaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the screen is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const Map = useMemo(() => dynamic(
    () => import('./Map'),
    {
      loading: () => <p>A map is loading...</p>,
      ssr: false
    }
  ), []);

  return (
    <div style={{
      height: isMobile ? '60vh' : '100vh',
      width: '100%',
      position: 'relative',
      top: 0
    }}>
      <Map center={center} pharmacies={pharmacies} />
    </div>
  );
}
