// src/app/components/PharmacyMarkers.tsx
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AggregatedPharmacy } from "../page";
import TrendIndicator from './TrendIndicator';


function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
interface PharmacyMarkersProps {
  pharmacies: Record<string, AggregatedPharmacy>;
}

const PharmacyMarkers: React.FC<PharmacyMarkersProps> = ({ pharmacies }) => {
  // Create custom icons for success and denial
  const createIcon = (status: 'success' | 'denial') => {
    const color = status === 'success' ? 'var(--accent-green)' : 'var(--accent-red)';
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--accent-cream);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'pharmacy-marker-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  return (
    <>
      {Object.values(pharmacies).map((pharmacy) => (
        <Marker
          key={pharmacy.id}
          position={[pharmacy.coords[0], pharmacy.coords[1]]}
          icon={createIcon(pharmacy.status)}
        >
          <Popup maxWidth={250}>
            <div style={{ padding: '5px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                {decodeHtmlEntities(pharmacy.name)}          <TrendIndicator trend={pharmacy.trend} />
              </h3>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Status:</strong> {pharmacy.status === 'success' ? '✓ Available' : '✗ Denied/Issues'}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Reports:</strong> {pharmacy.successCount} successful, {pharmacy.denialCount} denied
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Address:</strong><br/>
                {pharmacy.full_address && `${pharmacy.full_address} `}
              </p>
              {pharmacy.phone_number && (
                <>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${pharmacy.phone_number}`} style={{ color: '#1976d2' }}>
                      {pharmacy.phone_number}
                    </a>
                  </p>
                    <button
                      onClick={() => {
                        // Get coordinates and address
                        const lat = pharmacy.coords[0];
                        const lon = pharmacy.coords[1];
                        const address = encodeURIComponent(
                          `${pharmacy.full_address || ''} ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip}`.trim()
                        );
                        
                        // Check if mobile device
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        
                        if (isMobile) {
                          // On mobile, use generic geo: URI that opens default map app
                          // This works with Apple Maps, Google Maps, or any default map app
                          window.location.href = `geo:${lat},${lon}?q=${address}`;
                        } else {
                          // On desktop, open OpenStreetMap zoomed to location
                          window.open(
                            `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
                            '_blank'
                          );
                        }
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '5px 10px',
                        backgroundColor: 'var(--accent-green)',
                        color: 'var(--font-color-dark)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      Get Directions
                    </button>
                </>
              )}
              {pharmacy.standardizedNotes && pharmacy.standardizedNotes.length > 0 && (
                <>
                  <p style={{ margin: '10px 0 5px 0', fontSize: '14px' }}>
                    <strong>Notes:</strong>
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                    {pharmacy.standardizedNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </>
              )}
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                Last updated: {new Date(pharmacy.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default PharmacyMarkers;