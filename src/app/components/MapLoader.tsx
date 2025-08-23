'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AggregatedPharmacy } from '../page';
import ErrorBoundary from './ErrorBoundary';
import MapLoading from './MapLoading';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <MapLoading />
});

interface MapLoaderProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
}

const MapLoader: React.FC<MapLoaderProps> = ({ center, pharmacies }) => {
  return (
    <ErrorBoundary fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Failed to load map
    </div>}>
      <Suspense fallback={<MapLoading />}>
        <Map center={center} pharmacies={pharmacies} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default MapLoader;
