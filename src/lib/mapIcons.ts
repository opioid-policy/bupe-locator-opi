// src/lib/mapIcons.ts
// Marker images are served from this site (public/leaflet/), never a CDN.

import L from 'leaflet';

const common = {
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

export const greenIcon = new L.Icon({ iconUrl: '/leaflet/marker-green.svg', ...common });
export const redIcon = new L.Icon({ iconUrl: '/leaflet/marker-red.svg', ...common });
