// src/lib/form-options.ts

// Stable keys for database storage
export const standardizedNoteKeys = [
  'will-order-not-in-stock',
  'partial-fill',
  'call-ahead',
  'existing-patients-only',
  'prescribers-close-by',
  'certain-prescribers',
  'patients-close-by',
  'long-wait-times',
  'no-cash',
  'helpful-staff',
  'unhelpful-staff',
  'permanently-closed'
] as const;

// English labels for display (these get translated)
export const standardizedNoteLabels: Record<string, string> = {
  'will-order-not-in-stock': 'Will order, but not in stock',
  'partial-fill': 'Partial fill (did not fill the full prescription)',
  'call-ahead': 'Best to call ahead',
  'existing-patients-only': 'Only fills for existing patients',
  'prescribers-close-by': 'Only fills from prescribers "close-by"',
  'certain-prescribers': 'Only fill from certain prescribers',
  'patients-close-by': 'Only fills for patients "close-by"',
  'long-wait-times': 'Long wait times',
  'no-cash': "Won't accept cash",
  'helpful-staff': 'Helpful staff',
  'unhelpful-staff': 'Unhelpful staff',
  'permanently-closed': 'Permanently closed'
};

// Helper function to get label (will be replaced with translation later)
export function getStandardizedNoteLabel(key: string): string {
  return standardizedNoteLabels[key] || key;
}

// Function to map labels back to keys
export function mapLabelsToKeys(labels: string[]): string[] {
  const labelToKeyMap: Record<string, string> = {};
  (standardizedNoteKeys as readonly string[]).forEach(key => {
    const label = getStandardizedNoteLabel(key);
    labelToKeyMap[label] = key;
  });

  return labels.map(label => labelToKeyMap[label] || label);
}
