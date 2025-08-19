// src/app/components/ManualPharmacyEntry.tsx
import { useState } from 'react';
import styles from '../Home.module.css';
import Turnstile from 'react-turnstile';

interface PharmacyData {
  mapbox_id: string;
  name: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  manual_entry: boolean;
}

interface ManualPharmacyEntryProps {
  onBack: () => void;
  onSubmit: (pharmacyData: PharmacyData, turnstileToken: string) => void;
}

// US States list (full names)
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export default function ManualPharmacyEntry({ 
  onBack, 
  onSubmit
}: ManualPharmacyEntryProps) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pharmacyZip, setPharmacyZip] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumberDigits = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumberDigits.length;
    
    if (phoneNumberLength < 4) return phoneNumberDigits;
    if (phoneNumberLength < 7) {
      return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3)}`;
    }
    return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3, 6)}-${phoneNumberDigits.slice(6, 10)}`;
  };

  // Basic field validation (removed pharmacy name validation)
  const validateFields = () => {
    // Basic validation for required fields
    if (!pharmacyName || pharmacyName.length < 2) {
      return 'Please enter a pharmacy name.';
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      return 'Please enter a valid street address.';
    }
    
    if (!city || city.length < 2) {
      return 'Please enter a valid city.';
    }
    
    if (!state) {
      return 'Please select a state.';
    }
    
    if (!pharmacyZip || !/^\d{5}$/.test(pharmacyZip)) {
      return 'Please enter a valid 5-digit ZIP code.';
    }
    
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length !== 10) {
      return 'Please enter a valid 10-digit phone number or leave it blank.';
    }
    
    return null;
  };

  // Submit without validation (manual review)
  const handleSubmit = () => {
    if (!turnstileToken) {
      setValidationError('Please complete the security check.');
      return;
    }
    
    setIsValidating(true);
    setValidationError('');
    
    const validationMessage = validateFields();
    if (validationMessage) {
      setValidationError(validationMessage);
      setIsValidating(false);
      return;
    }
    
    // Prepare pharmacy data without geocoding
    const fullAddress = `${streetAddress}, ${city}, ${state} ${pharmacyZip}`;
    const pharmacyData: PharmacyData = {
      mapbox_id: `manual_${Date.now()}`, // Unique ID for manual entries
      name: pharmacyName,
      full_address: fullAddress,
      street_address: streetAddress,
      city: city,
      state: state,
      zip_code: pharmacyZip,
      latitude: 0, // Will be geocoded automatically in Airtable
      longitude: 0, // Will be geocoded automatically in Airtable
      phone_number: phoneNumber.replace(/\D/g, ''),
      manual_entry: true // This will check the box in Airtable
    };
    
    onSubmit(pharmacyData, turnstileToken);
    setIsValidating(false);
  };


  const canSubmit = 
    pharmacyName && 
    streetAddress && 
    city && 
    state && 
    pharmacyZip && 
    !isValidating &&
    turnstileToken;

  return (
    <div className={styles.manualEntry}>
      <button 
        onClick={onBack} 
        className={styles.submitButton}
        type="button"
        style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}
      >
        ← Back to search
      </button>
      
      <h2 className={styles.subheading}>Add a Pharmacy</h2>
      <p className={styles.helper}>
        If you couldn&apos;t find your pharmacy in the search results, you can add it manually.
        Please ensure this is a licensed pharmacy that dispenses prescription medications.
      </p>
      <br/>

      <div className={styles.formGroup}>
        <label htmlFor="pharmacyName">
          Pharmacy Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="pharmacyName"
          value={pharmacyName}
          onChange={(e) => setPharmacyName(e.target.value)}
          placeholder="e.g., Mom & Pop Shop"
          className={styles.inputField}
          required
        />
        <small className={styles.helper}>
          Include &quot;Pharmacy&quot; if it&apos;s part of the name
        </small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="streetAddress">
          Street Address <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="streetAddress"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="e.g., 123 Main Street"
          className={styles.inputField}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="city">
          City <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g., Grand Rapids"
          className={styles.inputField}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="state">
          State <span className={styles.required}>*</span>
        </label>
        <select
          id="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={styles.inputField}
          required
        >
          <option value="">Select a state</option>
          {US_STATES.map(stateName => (
            <option key={stateName} value={stateName}>
              {stateName}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="pharmacyZip">
          ZIP Code <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="pharmacyZip"
          value={pharmacyZip}
          onChange={(e) => setPharmacyZip(e.target.value.replace(/\D/g, ''))}
          placeholder="49503"
          maxLength={5}
          className={styles.inputField}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">
          Phone Number <span className={styles.optional}>(optional)</span>
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
          placeholder="(555) 123-4567"
          className={styles.inputField}
        />
        <small className={styles.helper}>
          Including a phone number helps others call ahead
        </small>
      </div>

      {validationError && (
        <div className={styles.errorMessage}>
          <strong>⚠️ {validationError}</strong>
        </div>
      )}

      {validationError && (
        <div className={styles.errorMessage}>
          <strong>⚠️ {validationError}</strong>
        </div>
      )}

      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={(token) => setTurnstileToken(token)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={styles.submitButton}
        style={{ marginTop: '1rem' }}
      >
        {isValidating ? 'Submitting...' : 'Add Pharmacy'}
      </button>

      <div className={styles.privacyNote} style={{ marginTop: '1.5rem' }}>
        <strong>Privacy Note:</strong> This pharmacy information will be added to our 
        database to help others find it. No personal information about you is stored.
        Manual entries require approval before appearing in search results.
      </div>
    </div>
  );
}