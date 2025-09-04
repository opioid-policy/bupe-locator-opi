export function getStateFromZipCode(zip: string): string | undefined {
  const zipNum = parseInt(zip.substring(0, 3));
  
  // Basic ZIP to state mapping (first 3 digits)
  if (zipNum >= 100 && zipNum <= 149) return 'New York';
  if (zipNum >= 150 && zipNum <= 196) return 'Pennsylvania';
  if (zipNum >= 200 && zipNum <= 205) return 'Virginia';
  if (zipNum >= 300 && zipNum <= 319) return 'Georgia';
  if (zipNum >= 320 && zipNum <= 349) return 'Florida';
  if (zipNum >= 480 && zipNum <= 499) return 'Michigan';
  if (zipNum >= 500 && zipNum <= 528) return 'Iowa';
  if (zipNum >= 600 && zipNum <= 629) return 'Illinois';
  if (zipNum >= 700 && zipNum <= 714) return 'Louisiana';
  if (zipNum >= 750 && zipNum <= 799) return 'Texas';
  if (zipNum >= 900 && zipNum <= 961) return 'California';
  // Add more mappings as needed
  
  return undefined;
}