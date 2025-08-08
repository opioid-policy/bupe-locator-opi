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
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  return (
    <div style={{ height: '500px', width: '100%', position: 'relative', top: 0 }}>
      <MapContainer
        key={center.toString()}
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxAccessToken}`}
        />
        <PharmacyMarkers pharmacies={pharmacies} />
        <MapLegend />
      </MapContainer>
    </div>
  );
}
