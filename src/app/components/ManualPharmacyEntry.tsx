// src/app/components/ManualPharmacyEntry.tsx
import { useState } from 'react';
import styles from '../Home.module.css';
import Turnstile from 'react-turnstile';

interface PharmacyData {
  osm_id: string;
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
  live_manual_entry?: boolean;  // ADD THIS

}

interface ManualPharmacyEntryProps {
  onBack: () => void;
  onSubmit: (
    pharmacyData: PharmacyData, 
    reportType: 'success' | 'denial',
    formulations: string[],
    standardizedNotes: string[],
    notes: string,
    turnstileToken: string
  ) => void;
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

const formulationOptions = [
  'Suboxone Film', 'Suboxone Tablet', 'Zubsolv Tablet',
  'Buprenorphine/Naloxone Film (generic)', 'Buprenorphine/Naloxone Tablet (generic)',
  'Buprenorphine Tablet (generic)'
];

const standardizedNoteOptions = [
'Will order, but not in stock', 'Partial fill (did not fill the full prescription)',
 'Permanently closed',
'Best to call ahead', 'Only fills for existing patients', 
'Only fills from prescribers "close-by"',
 'Requires specific diagnosis code', 'Long wait times',
  'Won\'t accept cash', 'Helpful staff', 'Unhelpful staff'
];

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
};

const sanitizeAddress = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
};

export default function ManualPharmacyEntry({ 
  onBack, 
  onSubmit
}: ManualPharmacyEntryProps) {
  // Pharmacy fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pharmacyZip, setPharmacyZip] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Report fields
  const [reportType, setReportType] = useState<'success' | 'denial' | ''>('');
  const [formulations, setFormulations] = useState<string[]>([]);
  const [standardizedNotes, setStandardizedNotes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [consentMap, setConsentMap] = useState(false);

  
  // Form state
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

  // Basic field validation
  const validateFields = () => {
   if (pharmacyName.includes('<') || pharmacyName.includes('>')) {
    return 'Invalid characters in pharmacy name.';
  }
    
    if (!streetAddress || streetAddress.trim().length < 2) {
    return 'Please enter a street address.';
    }
    
    if (!city || city.trim().length < 2) {
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
    
    if (!reportType) {
      return 'Please select whether you were able to fill your prescription.';
    }

     if (!consentMap) {
    return 'You must consent to sharing your report on the public map.';
  }
    
    return null;
  };

  // Handle form submission
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
    
    // Prepare pharmacy data
    const fullAddress = `${streetAddress}, ${city}, ${state} ${pharmacyZip}`;
    const pharmacyData: PharmacyData = {
  osm_id: `manual_${Date.now()}`,
  name: pharmacyName.trim(),
  full_address: fullAddress,
  street_address: streetAddress.trim(),
  city: city.trim(),
  state: state,
  zip_code: pharmacyZip,
  latitude: 0,
  longitude: 0,
  phone_number: phoneNumber.replace(/\D/g, ''),
  manual_entry: true,
  live_manual_entry: false  // ADD THIS - requires approval before going live
};
    
    onSubmit(
      pharmacyData, 
      reportType as 'success' | 'denial',
      formulations,
      standardizedNotes,
      notes,
      turnstileToken
    );
    setIsValidating(false);
  };

  const handleFormulationChange = (option: string) => {
    setFormulations(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option) 
        : [...prev, option]
    );
  };

  const handleStandardizedNoteChange = (option: string) => {
    setStandardizedNotes(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option) 
        : [...prev, option]
    );
  };

  const canSubmit = 
    pharmacyName && 
    streetAddress && 
    city && 
    state && 
    pharmacyZip && 
    reportType &&
    consentMap &&
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
      
      <h2 className={styles.subheading}>Add a Pharmacy & Report</h2>
      <p className={styles.helper}>
        If you couldn&apos;t find your pharmacy in the search results, you can add it here 
        along with your report about filling your prescription.
      </p>
      <br/>

      {/* Pharmacy Information Section */}
      <h3>Pharmacy Information</h3>
      
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
          onChange={(e) => setStreetAddress(sanitizeAddress(e.target.value))}
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



      {/* Report Information Section */}
      <br />
      <h3>Your Report</h3>
      
      <div className={styles.formGroup}>
        <label>
          What was the outcome of your visit? <span className={styles.required}>*</span>
        </label>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="reportType"
              value="success"
              checked={reportType === 'success'}
              onChange={(e) => setReportType(e.target.value as 'success')}
            />
            ✅ I was able to fill my prescription
          </label>
          <label>
            <input
              type="radio"
              name="reportType"
              value="denial"
              checked={reportType === 'denial'}
              onChange={(e) => setReportType(e.target.value as 'denial')}
            />
            ❌ I was not able to fill my prescription
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>What formulation(s) did you try to fill?</label>
        <div className={styles.checkboxGroup}>
          {formulationOptions.map(option => (
            <label key={option} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formulations.includes(option)}
                onChange={() => handleFormulationChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Select any that apply:</label>
        <div className={styles.checkboxGroup}>
          {standardizedNoteOptions.map(option => (
            <label key={option} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={standardizedNotes.includes(option)}
                onChange={() => handleStandardizedNoteChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes">
          Additional notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          placeholder="Any other details about your experience..."
          rows={4}
          className={styles.inputField}
          onChange={(e) => setNotes(sanitizeInput(e.target.value))}
        />
      </div>

       <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={consentMap}
            onChange={(e) => setConsentMap(e.target.checked)}
            required
            style={{marginRight: '0.5rem'}}
          />
           I understand my anonymous report will be used to update the public map (REQUIRED).
        </label>
      </div>

      {validationError && (
        <div className={styles.errorMessage}>
          <strong>⚠️ {validationError}</strong>
        </div>
      )}

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <Turnstile
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onVerify={(token) => setTurnstileToken(token)}
          onError={() => setValidationError('Security check failed. Please refresh and try again.')}
        />
      ) : (
        <div className={styles.errorMessage}>
          Security configuration error. Please contact support.
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={styles.submitButton}
        style={{ marginTop: '1rem' }}
      >
        {isValidating ? 'Submitting...' : 'Submit Report'}
      </button>

      <div className={styles.privacyNote} style={{ marginTop: '1.5rem' }}>
        <strong>Privacy Note:</strong> This pharmacy information and your report will be added 
        to our database to help others. Manual entries require approval before appearing in search results.
      </div>
    </div>
  );
}