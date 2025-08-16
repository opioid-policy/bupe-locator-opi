// src/app/components/ManualPharmacyEntry.tsx
import { useState } from 'react';
import styles from '../Home.module.css';

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
  verified_address: boolean;
}

interface ManualPharmacyEntryProps {
  onBack: () => void;
  onSubmit: (pharmacyData: PharmacyData) => void;
  turnstileToken: string | null;
}

interface AddressSuggestion {
  full_address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export default function ManualPharmacyEntry({ 
  onBack, 
  onSubmit, 
  turnstileToken 
}: ManualPharmacyEntryProps) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pharmacyZip, setPharmacyZip] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  
  // Common pharmacy keywords for validation
  const pharmacyKeywords = [
    'pharmacy', 'drug', 'cvs', 'walgreens', 'rite aid', 'walmart', 
    'target', 'kroger', 'safeway', 'publix', 'meijer', 'wegmans',
    'costco', 'sam\'s club', 'albertsons', 'heb', 'hy-vee'
  ];

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

  // Validate that this is likely a pharmacy
  const validatePharmacy = () => {
    const nameLower = pharmacyName.toLowerCase();
    const addressLower = streetAddress.toLowerCase();
    
    // Check if name or address contains pharmacy-related keywords
    const hasPharmacyKeyword = pharmacyKeywords.some(keyword => 
      nameLower.includes(keyword) || addressLower.includes(keyword)
    );
    
    if (!hasPharmacyKeyword) {
      return 'Please enter a pharmacy name. This should be a location that dispenses prescription medications.';
    }
    
    // Basic validation for required fields
    if (!pharmacyName || pharmacyName.length < 2) {
      return 'Please enter a valid pharmacy name.';
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      return 'Please enter a valid street address.';
    }
    
    if (!city || city.length < 2) {
      return 'Please enter a valid city.';
    }
    
    if (!state || state.length !== 2) {
      return 'Please enter a valid 2-letter state code (e.g., MI).';
    }
    
    if (!pharmacyZip || !/^\d{5}$/.test(pharmacyZip)) {
      return 'Please enter a valid 5-digit ZIP code.';
    }
    
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length !== 10) {
      return 'Please enter a valid 10-digit phone number or leave it blank.';
    }
    
    return null;
  };

  // Validate address with geocoding
  const validateAddress = async () => {
    setIsValidating(true);
    setValidationError('');
    
    const validationMessage = validatePharmacy();
    if (validationMessage) {
      setValidationError(validationMessage);
      setIsValidating(false);
      return false;
    }
    
    try {
      // Validate address using geocoding
      const fullAddress = `${streetAddress}, ${city}, ${state} ${pharmacyZip}`;
      const response = await fetch(
        `/api/validate-address?address=${encodeURIComponent(fullAddress)}&name=${encodeURIComponent(pharmacyName)}`
      );
      const data = await response.json();
      
      if (!data.valid) {
        setValidationError(data.error || 'Address could not be verified. Please check and try again.');
        
        // Show suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          setAddressSuggestions(data.suggestions);
        }
        setIsValidating(false);
        return false;
      }
      
      // Address is valid, prepare pharmacy data
      const pharmacyData: PharmacyData = {
        mapbox_id: `manual_${Date.now()}`, // Unique ID for manual entries
        name: pharmacyName,
        full_address: fullAddress,
        street_address: streetAddress,
        city: city,
        state: state.toUpperCase(),
        zip_code: pharmacyZip,
        latitude: data.coordinates[0],
        longitude: data.coordinates[1],
        phone_number: phoneNumber.replace(/\D/g, ''),
        manual_entry: true,
        verified_address: true
      };
      
      onSubmit(pharmacyData);
      return true;
      
    } catch {
      setValidationError('Unable to validate address. Please try again.');
      setIsValidating(false);
      return false;
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    setStreetAddress(suggestion.street || '');
    setCity(suggestion.city || '');
    setState(suggestion.state || '');
    setPharmacyZip(suggestion.zip || '');
    setAddressSuggestions([]);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAddress();
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
        className={styles.backButton}
        type="button"
      >
        ← Back to search
      </button>
      
      <h2 className={styles.subheading}>Add a Pharmacy</h2>
      <p className={styles.helper}>
        If you couldn&apos;t find your pharmacy in the search results, you can add it manually.
        Please ensure this is a licensed pharmacy that dispenses prescription medications.
      </p>

      <form className={styles.reportForm} onSubmit={handleSubmit}>
        <label htmlFor="pharmacyName">
          Pharmacy Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="pharmacyName"
          value={pharmacyName}
          onChange={(e) => setPharmacyName(e.target.value)}
          placeholder="e.g., CVS Pharmacy, Walgreens, Meijer Pharmacy"
          className={styles.inputField}
          required
        />
        <small className={styles.helper}>
          Include &quot;Pharmacy&quot; if it&apos;s part of the name
        </small>

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

        <div className={styles.cityStateZip}>
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
            <input
              type="text"
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              placeholder="MI"
              maxLength={2}
              className={styles.inputField}
              required
            />
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
        </div>

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

        {validationError && (
          <div className={styles.errorMessage}>
            <strong>⚠️ {validationError}</strong>
          </div>
        )}

        {addressSuggestions.length > 0 && (
          <div className={styles.suggestions}>
            <p>Did you mean:</p>
            {addressSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={styles.suggestionButton}
              >
                {suggestion.full_address}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={styles.submitButton}
        >
          {isValidating ? 'Validating...' : 'Add Pharmacy'}
        </button>

        {!turnstileToken && (
          <p className={styles.helper}>
            Please complete the security check to continue.
          </p>
        )}
      </form>

      <div className={styles.privacyNote}>
        <strong>Privacy Note:</strong> This pharmacy information will be added to our 
        database to help others find it. No personal information about you is stored.
        Manual entries require approval before appearing in search results.
      </div>
    </div>
  );
}