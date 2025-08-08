export function getDirectionsUrl(latitude: number, longitude: number, nameOrAddress: string) {
  if (typeof window !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
    }
    return `geo:${latitude},${longitude}?q=${encodeURIComponent(nameOrAddress)}`;
  }
  return `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`;
}