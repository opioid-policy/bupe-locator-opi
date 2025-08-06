// src/app/components/PharmacyMarkers.tsx

"use client";

import { Marker, Popup } from "react-leaflet";
import { greenIcon, redIcon } from "@/lib/mapIcons";
import { AggregatedPharmacy } from "../page";
import TrendIndicator from "./TrendIndicator";

interface PharmacyMarkersProps {
  pharmacies: Record<string, AggregatedPharmacy>;
}

function formatDate(dateString: string) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PharmacyMarkers({ pharmacies }: PharmacyMarkersProps) {
  return (
    <>
      {Object.values(pharmacies).map((pharmacy) => (
        <Marker
          key={pharmacy.id}
          position={pharmacy.coords}
          icon={pharmacy.status === 'success' ? greenIcon : redIcon}
        >
          <Popup>
            <strong>
              {pharmacy.name}
              <TrendIndicator trend={pharmacy.trend} />
            </strong>
            <br />
            {pharmacy.full_address}
            {pharmacy.phone_number && ( <><br /><a href={`tel:${pharmacy.phone_number}`}>{pharmacy.phone_number}</a></> )}
            <br /><br />
            Success Reports: {pharmacy.successCount}
            <br />
            Denial Reports: {pharmacy.denialCount}
            <br />
            {pharmacy.lastUpdated && ( <em>Last Successful Report: {formatDate(pharmacy.lastUpdated)}</em> )}
            {pharmacy.standardizedNotes && pharmacy.standardizedNotes.length > 0 && (
              <>
                <br /><br />
                <strong>Notes:</strong>
                <ul>
                  {pharmacy.standardizedNotes.map(note => ( <li key={note}>{note}</li> ))}
                </ul>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}