// src/utils/state-utils.ts
export function getStateFromZipCode(zip: string): string | undefined {
  const zipNum = parseInt(zip.substring(0, 3));
  
  // Complete ZIP to state mapping for all 50 states + DC (first 3 digits)
  
  // 010-027: Massachusetts
  if (zipNum >= 10 && zipNum <= 27) return 'Massachusetts';
  
  // 028-029: Rhode Island  
  if (zipNum >= 28 && zipNum <= 29) return 'Rhode Island';
  
  // 030-039: New Hampshire
  if (zipNum >= 30 && zipNum <= 39) return 'New Hampshire';
  
  // 040-049: Maine
  if (zipNum >= 40 && zipNum <= 49) return 'Maine';
  
  // 050-059: Vermont
  if (zipNum >= 50 && zipNum <= 59) return 'Vermont';
  
  // 060-069: Connecticut
  if (zipNum >= 60 && zipNum <= 69) return 'Connecticut';
  
  // 070-089: New Jersey
  if (zipNum >= 70 && zipNum <= 89) return 'New Jersey';
  
  // 100-149: New York
  if (zipNum >= 100 && zipNum <= 149) return 'New York';
  
  // 150-196: Pennsylvania
  if (zipNum >= 150 && zipNum <= 196) return 'Pennsylvania';
  
  // 197-199: Delaware
  if (zipNum >= 197 && zipNum <= 199) return 'Delaware';
  
  // 200-205: Washington DC
  if (zipNum >= 200 && zipNum <= 205) return 'District of Columbia';
  
  // 206-219: Maryland
  if (zipNum >= 206 && zipNum <= 219) return 'Maryland';
  
  // 220-246: Virginia
  if (zipNum >= 220 && zipNum <= 246) return 'Virginia';
  
  // 247-269: West Virginia
  if (zipNum >= 247 && zipNum <= 269) return 'West Virginia';
  
  // 270-289: North Carolina
  if (zipNum >= 270 && zipNum <= 289) return 'North Carolina';
  
  // 290-299: South Carolina
  if (zipNum >= 290 && zipNum <= 299) return 'South Carolina';
  
  // 300-319: Georgia
  if (zipNum >= 300 && zipNum <= 319) return 'Georgia';
  
  // 320-349: Florida
  if (zipNum >= 320 && zipNum <= 349) return 'Florida';
  
  // 350-369: Alabama
  if (zipNum >= 350 && zipNum <= 369) return 'Alabama';
  
  // 370-385: Tennessee
  if (zipNum >= 370 && zipNum <= 385) return 'Tennessee';
  
  // 386-397: Mississippi
  if (zipNum >= 386 && zipNum <= 397) return 'Mississippi';
  
  // 400-427: Kentucky
  if (zipNum >= 400 && zipNum <= 427) return 'Kentucky';
  
  // 430-458: Ohio
  if (zipNum >= 430 && zipNum <= 458) return 'Ohio';
  
  // 460-479: Indiana
  if (zipNum >= 460 && zipNum <= 479) return 'Indiana';
  
  // 480-499: Michigan
  if (zipNum >= 480 && zipNum <= 499) return 'Michigan';
  
  // 500-528: Iowa
  if (zipNum >= 500 && zipNum <= 528) return 'Iowa';
  
  // 530-549: Wisconsin
  if (zipNum >= 530 && zipNum <= 549) return 'Wisconsin';
  
  // 550-567: Minnesota
  if (zipNum >= 550 && zipNum <= 567) return 'Minnesota';
  
  // 570-577: South Dakota
  if (zipNum >= 570 && zipNum <= 577) return 'South Dakota';
  
  // 580-588: North Dakota
  if (zipNum >= 580 && zipNum <= 588) return 'North Dakota';
  
  // 590-599: Montana
  if (zipNum >= 590 && zipNum <= 599) return 'Montana';
  
  // 600-629: Illinois
  if (zipNum >= 600 && zipNum <= 629) return 'Illinois';
  
  // 630-658: Missouri
  if (zipNum >= 630 && zipNum <= 658) return 'Missouri';
  
  // 660-679: Kansas
  if (zipNum >= 660 && zipNum <= 679) return 'Kansas';
  
  // 680-693: Nebraska
  if (zipNum >= 680 && zipNum <= 693) return 'Nebraska';
  
  // 700-714: Louisiana
  if (zipNum >= 700 && zipNum <= 714) return 'Louisiana';
  
  // 716-729: Arkansas
  if (zipNum >= 716 && zipNum <= 729) return 'Arkansas';
  
  // 730-749: Oklahoma
  if (zipNum >= 730 && zipNum <= 749) return 'Oklahoma';
  
  // 750-799: Texas
  if (zipNum >= 750 && zipNum <= 799) return 'Texas';
  
  // 800-816: Colorado
  if (zipNum >= 800 && zipNum <= 816) return 'Colorado';
  
  // 820-831: Wyoming
  if (zipNum >= 820 && zipNum <= 831) return 'Wyoming';
  
  // 832-838: Idaho
  if (zipNum >= 832 && zipNum <= 838) return 'Idaho';
  
  // 840-847: Utah
  if (zipNum >= 840 && zipNum <= 847) return 'Utah';
  
  // 850-860: Arizona
  if (zipNum >= 850 && zipNum <= 860) return 'Arizona';
  
  // 870-884: New Mexico
  if (zipNum >= 870 && zipNum <= 884) return 'New Mexico';
  
  // 889-898: Nevada
  if (zipNum >= 889 && zipNum <= 898) return 'Nevada';
  
  // 900-961: California
  if (zipNum >= 900 && zipNum <= 961) return 'California';
  
  // 967: Hawaii
  if (zipNum === 967) return 'Hawaii';
  
  // 970-979: Oregon
  if (zipNum >= 970 && zipNum <= 979) return 'Oregon';
  
  // 980-994: Washington
  if (zipNum >= 980 && zipNum <= 994) return 'Washington';
  
  // 995-999: Alaska
  if (zipNum >= 995 && zipNum <= 999) return 'Alaska';
  
  return undefined;
}