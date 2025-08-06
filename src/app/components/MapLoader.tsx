// src/app/components/MapLoader.tsx

"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { AggregatedPharmacy } from "../page";

interface MapLoaderProps {
  center: [number, number];
  pharmacies: Record<string, AggregatedPharmacy>;
}

export default function MapLoader({ center, pharmacies }: MapLoaderProps) {
  const Map = useMemo(() => dynamic(
    () => import('./Map'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false
    }
  ), []);

  return <Map center={center} pharmacies={pharmacies} />;
}