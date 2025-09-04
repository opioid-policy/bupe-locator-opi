// src/utils/state-utils.ts
const ZIP_TO_STATE: Record<string, string> = {
  // This is a simplified mapping - you might want a more complete one
  '35': 'Alabama', '99': 'Alaska', '85': 'Arizona', '72': 'Arkansas',
  '90': 'California', '80': 'Colorado', '06': 'Connecticut', '19': 'Delaware',
  '32': 'Florida', '30': 'Georgia', '96': 'Hawaii', '83': 'Idaho',
  '60': 'Illinois', '46': 'Indiana', '50': 'Iowa', '66': 'Kansas',
  '40': 'Kentucky', '70': 'Louisiana', '04': 'Maine', '21': 'Maryland',
  '02': 'Massachusetts', '49': 'Michigan', '55': 'Minnesota', '39': 'Mississippi',
  '63': 'Missouri', '59': 'Montana', '68': 'Nebraska', '89': 'Nevada',
  '03': 'New Hampshire', '07': 'New Jersey', '87': 'New Mexico', '10': 'New York',
  '27': 'North Carolina', '58': 'North Dakota', '44': 'Ohio', '73': 'Oklahoma',
  '97': 'Oregon', '15': 'Pennsylvania', '02': 'Rhode Island', '29': 'South Carolina',
  '57': 'South Dakota', '37': 'Tennessee', '75': 'Texas', '84': 'Utah',
  '05': 'Vermont', '22': 'Virginia', '98': 'Washington', '25': 'West Virginia',
  '53': 'Wisconsin', '82': 'Wyoming'
};

export function getStateFromZipCode(zipCode: string): string | undefined {
  if (!zipCode || zipCode.length < 2) return undefined;
  const prefix = zipCode.substring(0, 2);
  return ZIP_TO_STATE[prefix];
}