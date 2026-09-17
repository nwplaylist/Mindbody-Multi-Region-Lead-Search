export const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;
export type AUStateCode = typeof AU_STATES[number];

export const AU_STATE_FULL_NAMES: Record<string, AUStateCode> = {
  'new south wales': 'NSW',
  'victoria': 'VIC',
  'queensland': 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  'tasmania': 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
};

// Common US / International Cities that mistakenly appear in search results
export const NON_AU_CITIES = new Set([
  'austin', 'dallas', 'houston', 'san antonio', 'fort worth', 'el paso', 'arlington',
  'los angeles', 'san diego', 'san francisco', 'san jose', 'fresno', 'sacramento', 'long beach',
  'oakland', 'anaheim', 'santa ana', 'irvine', 'bakersfield', 'riverside', 'stockton',
  'chicago', 'naperville', 'aurora', 'rockford', 'joliet',
  'miami', 'orlando', 'tampa', 'jacksonville', 'st petersburg', 'fort lauderdale', 'tallahassee',
  'atlanta', 'savannah', 'augusta', 'columbus',
  'new york', 'brooklyn', 'manhattan', 'queens', 'bronx', 'staten island', 'buffalo', 'rochester',
  'boston', 'cambridge', 'worcester', 'springfield',
  'seattle', 'spokane', 'tacoma', 'vancouver', 'bellevue',
  'portland', 'salem', 'eugene', 'bend',
  'phoenix', 'tucson', 'mesa', 'chandler', 'scottsdale', 'glendale', 'tempe',
  'philadelphia', 'pittsburgh', 'allentown', 'erie',
  'nashville', 'memphis', 'knoxville', 'chattanooga', 'clarksville',
  'charlotte', 'raleigh', 'greensboro', 'durham', 'winston-salem',
  'denver', 'colorado springs', 'fort collins', 'lakewood', 'boulder',
  'detroit', 'grand rapids', 'warren', 'ann arbor',
  'minneapolis', 'st paul', 'rochester', 'bloomington',
  'st louis', 'kansas city', 'springfield', 'columbia',
  'las vegas', 'reno', 'henderson', 'north las vegas',
  'salt lake city', 'west valley city', 'provo', 'west jordan',
  'indianapolis', 'fort wayne', 'evansville', 'south bend',
  'columbus', 'cleveland', 'cincinnati', 'toledo', 'akron',
  'milwaukee', 'madison', 'green bay', 'kenosha',
  'albuquerque', 'las cruces', 'rio rancho', 'santa fe',
  'honolulu', 'anchorage', 'fairbanks',
  // UK
  'london', 'manchester', 'birmingham', 'leeds', 'liverpool', 'glasgow', 'edinburgh',
  'bristol', 'sheffield', 'newcastle upon tyne', 'belfast', 'cardiff', 'nottingham',
  // Canada
  'toronto', 'montreal', 'calgary', 'ottawa', 'edmonton', 'winnipeg', 'quebec city', 'hamilton'
]);

// US States to detect in address, region or suburb
export const US_STATES_EXPANDED = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
  'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington state', 'west virginia',
  'wisconsin', 'wyoming'
];

export const US_POSTAL_CODES_2LETTER = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WV', 'WI', 'WY'
]);

// Non-Australian Country indicators
export const NON_AU_COUNTRIES = [
  'united states', 'usa', 'u.s.a.', 'u.s.', 'united kingdom', 'uk', 'u.k.',
  'great britain', 'england', 'scotland', 'wales', 'canada', 'ireland',
  'germany', 'france', 'spain', 'italy', 'netherlands', 'singapore',
  'south africa', 'philippines', 'mexico', 'brazil'
];

/**
 * Validates if a lead is strictly within Australia
 */
export function isAustralianBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;

  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const region = (lead.region || '').trim();
  const suburb = (lead.suburb || '').trim().toLowerCase();
  const postcode = (lead.postcode || '').toString().trim();
  const phone = (lead.phone || '').trim();
  const website = (lead.website || '').trim().toLowerCase();

  // 1. Explicit Non-Australian Country check
  if (country && country !== 'australia' && country !== 'au' && country !== 'aus') {
    return false;
  }

  for (const nonAu of NON_AU_COUNTRIES) {
    if (country === nonAu || address.includes(` ${nonAu}`) || address.endsWith(nonAu)) {
      return false;
    }
  }

  // 2. TLD Check: if website has foreign TLD (.co.uk, .ca, .us), reject
  if (website.includes('.co.uk') || website.includes('.us/') || website.endsWith('.us') ||
      website.includes('.ca/') || website.endsWith('.ca') || website.includes('.uk/')) {
    return false;
  }

  // 3. Check Phone Number
  // Non-Australian Phone numbers
  if (phone) {
    const cleanDigits = phone.replace(/[^0-9+]/g, '');
    // +1 (USA / Canada), +44 (UK), +353, +49, +33
    if (cleanDigits.startsWith('+1') || cleanDigits.startsWith('+44') || cleanDigits.startsWith('+353') || cleanDigits.startsWith('+49')) {
      return false;
    }
    // US 10-digit format check (starts with non-Australian area code and has 10 digits)
    if (!cleanDigits.startsWith('+61') && cleanDigits.length === 10) {
      // Australian valid 10 digits start with 04 (mobile), 02, 03, 07, 08, 13, 18
      const prefix2 = cleanDigits.substring(0, 2);
      if (!['04', '02', '03', '07', '08', '13', '18'].includes(prefix2)) {
        // Likely US 10 digit number
        return false;
      }
    }
  }

  // 4. Check Postcode
  if (postcode) {
    // 5-digit zip codes (e.g. 90210, 78701) are distinctly US
    if (/^\d{5}$/.test(postcode) || /^\d{5}-\d{4}$/.test(postcode)) {
      return false;
    }
    // UK postcodes containing letters
    if (/[a-zA-Z]/.test(postcode)) {
      return false;
    }
    // Australian postcodes must be 4 digits between 0800 and 7999 or 9000-9999
    if (/^\d{4}$/.test(postcode)) {
      const pNum = parseInt(postcode, 10);
      if ((pNum < 800 || pNum > 7999) && (pNum < 9000 || pNum > 9999)) {
        return false;
      }
    }
  }

  // 5. Check Region / State
  const upperRegion = region.toUpperCase();
  // If region is a US state abbreviation (except WA which is Western Australia in AU)
  if (US_POSTAL_CODES_2LETTER.has(upperRegion) && upperRegion !== 'WA') {
    return false;
  }
  // Check full US state names in region
  if (US_STATES_EXPANDED.includes(region.toLowerCase())) {
    return false;
  }

  // 6. Check Suburb & Address for US Cities and States
  if (NON_AU_CITIES.has(suburb)) {
    return false;
  }

  for (const city of NON_AU_CITIES) {
    // Look for whole word city mentions in address
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(address) && !website.includes('.com.au') && !website.includes('.net.au')) {
      // Double check if city name happens to match an AU suburb; if address contains US state or zip, reject
      for (const usState of US_STATES_EXPANDED) {
        if (address.includes(usState)) return false;
      }
      for (const usCode of US_POSTAL_CODES_2LETTER) {
        if (new RegExp(`[,\\s]${usCode}[,\\s\\d]`, 'i').test(address) && usCode !== 'WA') {
          return false;
        }
      }
      // If address contains Austin, Miami, Chicago, Dallas, San Diego, etc. without .au domain
      if (['austin', 'miami', 'chicago', 'dallas', 'san diego', 'san francisco', 'los angeles', 'houston', 'denver', 'atlanta', 'seattle'].includes(city)) {
        return false;
      }
    }
  }

  for (const usState of US_STATES_EXPANDED) {
    const usStateRegex = new RegExp(`\\b${usState}\\b`, 'i');
    if (usStateRegex.test(address)) {
      return false;
    }
  }

  // Check for US zip pattern in address (e.g. ", CA 90210" or "TX 78701")
  if (/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WV|WI|WY)\s+\d{5}\b/i.test(address)) {
    return false;
  }

  // 7. POSITIVE VALIDATION:
  // An Australian business should have at least one clear Australian anchor:
  // - Website ends in .com.au, .net.au, .org.au, .sydney, .melbourne, .qld, .nsw, etc.
  // - Region is one of NSW, VIC, QLD, WA, SA, TAS, ACT, NT (or full state name)
  // - Phone starts with +61, 04, 02, 03, 07, 08, 13, 18
  // - Postcode is valid 4 digits
  // - Address contains Australia, NSW, VIC, QLD, WA, SA, TAS, ACT, NT
  const isAuTld = website.includes('.com.au') || website.includes('.net.au') || website.includes('.org.au') || website.includes('.sydney') || website.includes('.melbourne');
  const isAuRegion = AU_STATES.includes(upperRegion as any) || Object.keys(AU_STATE_FULL_NAMES).includes(region.toLowerCase());
  const isAuPhone = phone.startsWith('+61') || phone.startsWith('04') || phone.startsWith('02') || phone.startsWith('03') || phone.startsWith('07') || phone.startsWith('08') || phone.startsWith('(02)') || phone.startsWith('(03)') || phone.startsWith('(07)') || phone.startsWith('(08)');
  const isAuAddress = /\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT|Australia|New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania)\b/i.test(address);

  // If none of the positive Australian indicators exist, we cannot guarantee it is Australian
  if (!isAuTld && !isAuRegion && !isAuPhone && !isAuAddress && country !== 'australia') {
    return false;
  }

  return true;
}

/**
 * Validates if a lead is strictly within New Zealand
 */
export function isNZBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const website = (lead.website || '').trim().toLowerCase();
  const phone = (lead.phone || '').trim();

  if (country === 'australia') return false;

  const isNzTld = website.includes('.co.nz') || website.includes('.nz');
  const isNzPhone = phone.startsWith('+64') || phone.startsWith('02') || phone.startsWith('09') || phone.startsWith('03') || phone.startsWith('04') || phone.startsWith('07') || phone.startsWith('06');
  const isNzAddress = /\b(Auckland|Wellington|Christchurch|Tauranga|Hamilton|Queenstown|Dunedin|Nelson|New Zealand|NZ)\b/i.test(address) ||
                      /\b(Auckland|Wellington|Christchurch|Tauranga|Hamilton|Queenstown|Dunedin|Nelson)\b/i.test(lead.region || '');

  return isNzTld || isNzPhone || isNzAddress || country === 'new zealand';
}

/**
 * Validates if a lead is strictly within North America (US, Canada, Mexico)
 */
export function isNorthAmericanBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const website = (lead.website || '').trim().toLowerCase();
  const phone = (lead.phone || '').trim();

  // Reject clear AU / NZ / UK / Europe / South America indicators
  if (country === 'australia' || country === 'new zealand' || website.includes('.com.au') || website.includes('.co.nz') || website.includes('.co.uk')) {
    return false;
  }
  if (phone.startsWith('+61') || phone.startsWith('+64') || phone.startsWith('+44')) {
    return false;
  }

  const isUsOrCaTld = website.includes('.us') || website.includes('.ca') || website.includes('.mx');
  const isUsOrCaPhone = phone.startsWith('+1') || phone.startsWith('+52') || (!phone.startsWith('+') && phone.replace(/\D/g, '').length === 10);
  const isNaAddress =
    /\b(United States|USA|U\.S\.A|U\.S|Canada|Mexico|CA|NY|TX|FL|IL|CO|WA|MA|AZ|NC|GA|PA|OH|TN|UT|OR|MI|MN|VA|NV|Ontario|British Columbia|Quebec|Alberta|CDMX|Jalisco)\b/i.test(address) ||
    /\b(United States|Canada|Mexico)\b/i.test(lead.country || '') ||
    US_STATES_EXPANDED.some(s => address.includes(s) || (lead.region || '').toLowerCase().includes(s));

  return isUsOrCaTld || isUsOrCaPhone || isNaAddress || ['united states', 'usa', 'canada', 'mexico'].includes(country);
}

/**
 * Validates if a lead is strictly within Europe (UK, Ireland, Germany, France, Spain, Italy, Netherlands, etc.)
 */
export function isEuropeanBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const website = (lead.website || '').trim().toLowerCase();
  const phone = (lead.phone || '').trim();

  // Reject AU / NZ
  if (country === 'australia' || country === 'new zealand' || website.includes('.com.au') || website.includes('.co.nz')) {
    return false;
  }
  if (phone.startsWith('+61') || phone.startsWith('+64')) return false;

  const isEuTld =
    website.includes('.co.uk') || website.includes('.uk') || website.includes('.ie') ||
    website.includes('.de') || website.includes('.fr') || website.includes('.es') ||
    website.includes('.it') || website.includes('.nl') || website.includes('.eu');
  const isEuPhone =
    phone.startsWith('+44') || phone.startsWith('+353') || phone.startsWith('+49') ||
    phone.startsWith('+33') || phone.startsWith('+34') || phone.startsWith('+39') || phone.startsWith('+31');
  const isEuAddress =
    /\b(United Kingdom|UK|England|Scotland|Wales|Ireland|Germany|France|Spain|Italy|Netherlands|London|Manchester|Birmingham|Leeds|Glasgow|Edinburgh|Dublin|Berlin|Munich|Hamburg|Frankfurt|Paris|Lyon|Marseille|Madrid|Barcelona|Milan|Rome|Amsterdam|Rotterdam)\b/i.test(address) ||
    /\b(United Kingdom|Ireland|Germany|France|Spain|Italy|Netherlands)\b/i.test(lead.country || '');

  return isEuTld || isEuPhone || isEuAddress || ['united kingdom', 'uk', 'ireland', 'germany', 'france', 'spain', 'italy', 'netherlands'].includes(country);
}

/**
 * Validates if a lead is strictly within Asia / Middle East (Singapore, Japan, Hong Kong, UAE, India)
 */
export function isAsianBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const website = (lead.website || '').trim().toLowerCase();
  const phone = (lead.phone || '').trim();

  if (country === 'australia' || country === 'new zealand' || website.includes('.com.au') || website.includes('.co.nz')) {
    return false;
  }

  const isAsiaTld = website.includes('.sg') || website.includes('.jp') || website.includes('.hk') || website.includes('.ae') || website.includes('.in');
  const isAsiaPhone = phone.startsWith('+65') || phone.startsWith('+81') || phone.startsWith('+852') || phone.startsWith('+971') || phone.startsWith('+91');
  const isAsiaAddress =
    /\b(Singapore|Japan|Tokyo|Osaka|Kyoto|Hong Kong|Dubai|Abu Dhabi|United Arab Emirates|UAE|India|Mumbai|Delhi|Bengaluru|Bangalore|Pune)\b/i.test(address) ||
    /\b(Singapore|Japan|Hong Kong|United Arab Emirates|UAE|India)\b/i.test(lead.country || '');

  return isAsiaTld || isAsiaPhone || isAsiaAddress || ['singapore', 'japan', 'hong kong', 'united arab emirates', 'uae', 'india'].includes(country);
}

/**
 * Validates if a lead is strictly within South America (Brazil, Argentina, Colombia, Chile)
 */
export function isSouthAmericanBusiness(lead: any): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const country = (lead.country || '').trim().toLowerCase();
  const address = (lead.address || '').trim().toLowerCase();
  const website = (lead.website || '').trim().toLowerCase();
  const phone = (lead.phone || '').trim();

  if (country === 'australia' || country === 'new zealand' || website.includes('.com.au') || website.includes('.co.nz')) {
    return false;
  }

  const isSaTld = website.includes('.com.br') || website.includes('.br') || website.includes('.com.ar') || website.includes('.ar') || website.includes('.com.co') || website.includes('.co') || website.includes('.cl');
  const isSaPhone = phone.startsWith('+55') || phone.startsWith('+54') || phone.startsWith('+57') || phone.startsWith('+56');
  const isSaAddress =
    /\b(Brazil|Brasil|São Paulo|Rio de Janeiro|Curitiba|Belo Horizonte|Argentina|Buenos Aires|Córdoba|Rosario|Colombia|Bogotá|Medellín|Cali|Chile|Santiago|Valparaíso)\b/i.test(address) ||
    /\b(Brazil|Brasil|Argentina|Colombia|Chile)\b/i.test(lead.country || '');

  return isSaTld || isSaPhone || isSaAddress || ['brazil', 'brasil', 'argentina', 'colombia', 'chile'].includes(country);
}

/**
 * Master multi-region geographic validator
 */
export function isValidLeadForTerritory(
  lead: any,
  globalRegion: 'North America' | 'Europe' | 'Asia' | 'South America' | 'Oceania' = 'Oceania',
  specificCountry?: string
): boolean {
  if (!lead || typeof lead !== 'object') return false;

  // If a specific country is chosen
  if (specificCountry && specificCountry !== 'All') {
    const cNorm = specificCountry.toLowerCase().trim();
    const leadCountryNorm = (lead.country || '').toLowerCase().trim();
    if (cNorm === 'australia') return isAustralianBusiness(lead);
    if (cNorm === 'new zealand') return isNZBusiness(lead);
    if (['united states', 'usa'].includes(cNorm)) {
      return isNorthAmericanBusiness(lead) && (leadCountryNorm.includes('united states') || leadCountryNorm.includes('usa') || !leadCountryNorm.includes('canada'));
    }
    if (cNorm === 'canada') {
      return isNorthAmericanBusiness(lead) && (leadCountryNorm.includes('canada') || (lead.address || '').toLowerCase().includes('canada'));
    }
    if (cNorm === 'united kingdom') {
      return isEuropeanBusiness(lead) && (leadCountryNorm.includes('united kingdom') || leadCountryNorm.includes('uk') || (lead.address || '').toLowerCase().includes('uk'));
    }
    // General check for specific country
    return leadCountryNorm.includes(cNorm) || (lead.address || '').toLowerCase().includes(cNorm);
  }

  // Validate by Global Region
  switch (globalRegion) {
    case 'North America':
      return isNorthAmericanBusiness(lead);
    case 'Europe':
      return isEuropeanBusiness(lead);
    case 'Asia':
      return isAsianBusiness(lead);
    case 'South America':
      return isSouthAmericanBusiness(lead);
    case 'Oceania':
    default:
      return isAustralianBusiness(lead) || isNZBusiness(lead);
  }
}

/**
 * Normalizes and formats Australian address, region and phone
 */
export function normalizeAustralianLead(lead: any): any {
  if (!lead) return lead;
  const copy = { ...lead };

  copy.country = 'Australia';

  // Normalize region
  const rawRegion = (copy.region || '').trim();
  const upper = rawRegion.toUpperCase();
  if (AU_STATES.includes(upper as any)) {
    copy.region = upper;
  } else if (AU_STATE_FULL_NAMES[rawRegion.toLowerCase()]) {
    copy.region = AU_STATE_FULL_NAMES[rawRegion.toLowerCase()];
  } else if (copy.address) {
    // Try to extract from address
    for (const state of AU_STATES) {
      if (new RegExp(`\\b${state}\\b`, 'i').test(copy.address)) {
        copy.region = state;
        break;
      }
    }
  }

  // Ensure default valid Australian region if still empty
  if (!AU_STATES.includes(copy.region as any)) {
    copy.region = 'NSW';
  }

  // Format Australian phone to international standard +61 if given in local format 04xx xxx xxx or 02 xxxx xxxx
  if (copy.phone && typeof copy.phone === 'string') {
    let p = copy.phone.trim();
    if (p.startsWith('04') || p.startsWith('02') || p.startsWith('03') || p.startsWith('07') || p.startsWith('08')) {
      const clean = p.replace(/\D/g, '');
      if (clean.length === 10 && clean.startsWith('0')) {
        copy.phone = `+61 ${clean.substring(1, 2)} ${clean.substring(2, 6)} ${clean.substring(6)}`;
      }
    }
  }

  return copy;
}
