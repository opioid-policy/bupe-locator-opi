"use client";
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { AggregatedPharmacy } from "../page";
import TrendIndicator from './TrendIndicator';
import ErrorBoundary from './ErrorBoundary';

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

  // Custom cluster icon styling
  const createClusterCustomIcon = (cluster: L.MarkerCluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? 'size-small' :
                count < 100 ? 'size-medium' : 'size-large';
    return L.divIcon({
      html: `<div class="pharmacy-cluster-icon ${size}">${count}</div>`,
      className: '',
      iconSize: L.point(
        count < 10 ? 30 : count < 100 ? 40 : 50,
        count < 10 ? 30 : count < 100 ? 40 : 50
      )
    });
  };

  // Check if mobile device
  const isMobile = typeof navigator !== 'undefined' ?
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

  return (
    <ErrorBoundary fallback={
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        Error loading map markers
      </div>
    }>
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        spiderfyOnMaxZoom={false}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
      >
        {Object.values(pharmacies).map((pharmacy) => {
          // Validate coordinates
          const [lat, lon] = pharmacy.coords || [0, 0];
          const validCoords = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;

          if (!validCoords) return null;

          return (
            <Marker
              key={pharmacy.id}
              position={[lat, lon]}
              icon={createIcon(pharmacy.status)}
            >
              <Popup maxWidth={250}>
                <div style={{ padding: '5px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                    {decodeHtmlEntities(pharmacy.name)}
                    <TrendIndicator trend={pharmacy.trend} />
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
                          {pharmacy.phone_number} 📞
                        </a>
                      </p>
                  <button
                    onClick={(e) => {
                      const button = e.currentTarget as HTMLButtonElement;
                      const originalText = button.textContent;

                      const lat = pharmacy.coords[0];
                      const lon = pharmacy.coords[1];
                      const address = encodeURIComponent(
                        `${pharmacy.full_address || ''} ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip}`.trim()
                      );

                      // Show loading state in the button
                      button.disabled = true;
                      button.textContent = 'Loading...';

                      setTimeout(() => {
                        if (isMobile) {
                          window.location.href = `geo:${lat},${lon}?q=${address}`;
                        } else {
                          window.open(
                            `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
                            '_blank'
                          );
                        }

                        // Restore button
                        button.disabled = false;
                        button.textContent = originalText;
                      }, 500);
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
                    Get Directions 🚌
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
          );
        })}
      </MarkerClusterGroup>
    </ErrorBoundary>
  );
};

export default PharmacyMarkers;
