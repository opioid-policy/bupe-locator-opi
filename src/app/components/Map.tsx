"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { Suspense } from 'react';
import { AggregatedPharmacy } from "../page";
import PharmacyMarkers from "./PharmacyMarkers";
import MapLegend from "./MapLegend";
import ErrorBoundary from "./ErrorBoundary";
import MapLoading from "./MapLoading";

interface MapProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

function MapDebouncer() {
  useMapEvents({
    moveend: debounce(() => {
      // Handle viewport changes
    }, 300),
    zoomend: debounce(() => {
      // Handle zoom changes
    }, 300)
  });
  return null;
}

function debounce<F extends (...args: never[]) => void>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: unknown, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Map({
  center,
  pharmacies,
  zoom = 12,
  minZoom = 10,
  maxZoom = 19
}: MapProps) {
  // Validate center coordinates
  if (!Array.isArray(center) ||
      center.length !== 2 ||
      typeof center[0] !== 'number' ||
      typeof center[1] !== 'number') {
    console.error("Invalid coordinates:", center);
    return <div>Invalid map location</div>;
  }

  return (
    <div style={{ height: '500px', width: '100%', position: 'relative' }}>
      <ErrorBoundary fallback={<div>Map failed to load</div>}>
        <Suspense fallback={<MapLoading />}>
          <MapContainer
            center={center}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains={['a', 'b', 'c', 'd']}
            />
            <PharmacyMarkers pharmacies={pharmacies} />
            <MapLegend />
            <MapDebouncer />
          </MapContainer>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
