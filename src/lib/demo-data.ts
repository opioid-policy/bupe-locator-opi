// src/lib/demo-data.ts
// Demo data management for buprenorphine access tool

export const DEMO_ZIP_CODE = '00000';
export const DEMO_STATE = 'Demo';

// Demo coordinates (center of continental US for realistic distance calculations)
export const DEMO_COORDINATES = {
  latitude: 39.8283,
  longitude: -98.5795
};

// Demo pharmacy data - realistic but clearly marked as demo
export const DEMO_PHARMACIES = [
  {
    pharmacy_id: 'demo_cvs_001',
    pharmacy_name: 'CVS Pharmacy #1234 (DEMO)',
    street_address: '123 Main Street',
    city: 'Demo City',
    state: 'Demo',
    zip_code: '00000',
    latitude: 39.8383,
    longitude: -98.5695,
    phone_number: '5555551234',
    manual_entry: false,
    live_manual_entry: false
  },
  {
    pharmacy_id: 'demo_walgreens_001',
    pharmacy_name: 'Walgreens #5678 (DEMO)',
    street_address: '456 Oak Avenue',
    city: 'Demo City',
    state: 'Demo',
    zip_code: '00000',
    latitude: 39.8183,
    longitude: -98.5895,
    phone_number: '5555555678',
    manual_entry: false,
    live_manual_entry: false
  },
  {
    pharmacy_id: 'demo_independent_001',
    pharmacy_name: 'Community Pharmacy (DEMO)',
    street_address: '789 Elm Street',
    city: 'Demo City',
    state: 'Demo',
    zip_code: '00000',
    latitude: 39.8283,
    longitude: -98.5595,
    phone_number: '5555559012',
    manual_entry: true,
    live_manual_entry: true
  }
];

// Demo reports with varied realistic scenarios
export const DEMO_REPORTS = [
  {
    pharmacy_id: 'demo_cvs_001',
    report_type: 'success',
    formulation: ['Suboxone (film)', 'Buprenorphine/Naloxone (film; generic)'],
    standardized_notes: ['Best to call ahead'],
    submission_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    zip_code: '00000',
    state: 'Demo'
  },
  {
    pharmacy_id: 'demo_walgreens_001',
    report_type: 'denial',
    formulation: [],
    standardized_notes: ['Will order, but not in stock', 'Only fills for existing patients'],
    submission_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    zip_code: '00000',
    state: 'Demo'
  },
  {
    pharmacy_id: 'demo_independent_001',
    report_type: 'success',
    formulation: ['Buprenorphine/Naloxone (tablet; generic)'],
    standardized_notes: ['Helpful staff'],
    submission_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    zip_code: '00000',
    state: 'Demo'
  },
  {
    pharmacy_id: 'demo_cvs_001',
    report_type: 'success',
    formulation: ['Zubsolv (tablet)'],
    standardized_notes: [],
    submission_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    zip_code: '00000',
    state: 'Demo'
  }
];

// Helper function to check if we're in demo mode
export function isDemoMode(zipCode: string): boolean {
  return zipCode === DEMO_ZIP_CODE;
}

// Helper function to get demo data for API responses
export function getDemoPharmacies() {
  return DEMO_PHARMACIES;
}

export function getDemoReports() {
  return DEMO_REPORTS;
}

// Convert demo data to format expected by your existing API structure
export function formatDemoPharmaciesForAPI() {
  return DEMO_PHARMACIES.map(pharmacy => ({
    ...pharmacy,
    id: pharmacy.pharmacy_id,
    name: pharmacy.pharmacy_name,
    last_report: DEMO_REPORTS
      .filter(r => r.pharmacy_id === pharmacy.pharmacy_id)
      .sort((a, b) => new Date(b.submission_time).getTime() - new Date(a.submission_time).getTime())[0]
      ?.submission_time
  }));
}

export function formatDemoReportsForAPI() {
  return DEMO_REPORTS.map(report => ({
    ...report,
    reportType: report.report_type as 'success' | 'denial',
    formulations: report.formulation,
    standardizedNotes: report.standardized_notes,
    submissionTime: report.submission_time,
    zipCode: report.zip_code
  }));
}