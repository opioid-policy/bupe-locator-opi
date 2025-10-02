// src/utils/state-utils.ts
const STATE_RANGES: Array<[number, number, string]> = [
  [10, 27, 'Massachusetts'], [28, 29, 'Rhode Island'], [30, 39, 'New Hampshire'],
  [40, 49, 'Maine'], [50, 59, 'Vermont'], [60, 69, 'Connecticut'],
  [70, 89, 'New Jersey'], [100, 149, 'New York'], [150, 196, 'Pennsylvania'],
  [197, 199, 'Delaware'], [200, 205, 'District of Columbia'], [206, 219, 'Maryland'],
  [220, 246, 'Virginia'], [247, 269, 'West Virginia'], [270, 289, 'North Carolina'],
  [290, 299, 'South Carolina'], [300, 319, 'Georgia'], [320, 349, 'Florida'],
  [350, 369, 'Alabama'], [370, 385, 'Tennessee'], [386, 397, 'Mississippi'],
  [400, 427, 'Kentucky'], [430, 458, 'Ohio'], [460, 479, 'Indiana'],
  [480, 499, 'Michigan'], [500, 528, 'Iowa'], [530, 549, 'Wisconsin'],
  [550, 567, 'Minnesota'], [570, 577, 'South Dakota'], [580, 588, 'North Dakota'],
  [590, 599, 'Montana'], [600, 629, 'Illinois'], [630, 658, 'Missouri'],
  [660, 679, 'Kansas'], [680, 693, 'Nebraska'], [700, 714, 'Louisiana'],
  [716, 729, 'Arkansas'], [730, 749, 'Oklahoma'], [750, 799, 'Texas'],
  [800, 816, 'Colorado'], [820, 831, 'Wyoming'], [832, 838, 'Idaho'],
  [840, 847, 'Utah'], [850, 860, 'Arizona'], [870, 884, 'New Mexico'],
  [889, 898, 'Nevada'], [900, 961, 'California'], [967, 967, 'Hawaii'],
  [970, 979, 'Oregon'], [980, 994, 'Washington'], [995, 999, 'Alaska']
];

export function getStateFromZipCode(zip: string): string | undefined {
  const zipNum = parseInt(zip.substring(0, 3));
  if (isNaN(zipNum)) return undefined;
  
  for (const [min, max, state] of STATE_RANGES) {
    if (zipNum >= min && zipNum <= max) return state;
  }
  
  return undefined;
}