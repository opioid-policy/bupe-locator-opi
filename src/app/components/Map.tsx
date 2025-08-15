// src/app/components/Map.tsx
"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { AggregatedPharmacy } from "../page";
import PharmacyMarkers from "./PharmacyMarkers";
import MapLegend from "./MapLegend";

interface MapProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
}

export default function Map({ center, pharmacies }: MapProps) {
  return (
    <div style={{ height: '500px', width: '100%', position: 'relative', top: 0 }}>
      <MapContainer
        key={center.toString()}
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* CartoDB Dark theme - similar to your current Mapbox dark theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        
        <PharmacyMarkers pharmacies={pharmacies} />
        <MapLegend />
      </MapContainer>
    </div>
  );
}