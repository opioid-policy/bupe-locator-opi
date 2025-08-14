// lib/directions.ts
export function getDirectionsUrl(latitude: number, longitude: number): string {
  // For OpenStreetMap - using latitude, longitude order
  return `https://www.openstreetmap.org/directions?from=&to=${latitude},${longitude}#map=15/${latitude}/${longitude}`;
}