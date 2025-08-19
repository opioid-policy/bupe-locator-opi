// src/app/components/MapLoader.tsx
'use client';

import dynamic from 'next/dynamic';
import { AggregatedPharmacy } from '../page';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
});

interface MapLoaderProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
}

const MapLoader: React.FC<MapLoaderProps> = ({ center, pharmacies }) => {
  return <Map center={center} pharmacies={pharmacies} />;
};

export default MapLoader;