import { CompetitorSoftware } from '../types';

export type GlobalRegion = 'North America' | 'Europe' | 'Asia' | 'South America' | 'Oceania';

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  statesOrProvinces: string[];
}

export interface GlobalRegionConfig {
  id: GlobalRegion;
  name: string;
  label: string;
  flag: string;
  headline: string;
  description: string;
  countries: CountryInfo[];
  defaultCountry: string;
  defaultCompetitors: CompetitorSoftware[];
  presets: {
    label: string;
    flag: string;
    country: string;
    region: string;
    suburb: string;
    category: string;
    software: CompetitorSoftware | 'All';
    appFilter: 'no_app_only' | 'generic_only' | 'all';
    scanHostedOnly?: boolean;
    tooltip?: string;
  }[];
}

export const GLOBAL_REGIONS: Record<GlobalRegion, GlobalRegionConfig> = {
  'North America': {
    id: 'North America',
    name: 'North America',
    label: 'North America',
    flag: '🌎',
    headline: 'North America SMB Single-Site Lead Radar',
    description: 'Scans boutique fitness, gym, yoga, and pilates operators across the US, Canada, and Mexico using Momence, PushPress, Wodify, Zen Planner, and Gymdesk.',
    defaultCountry: 'United States',
    defaultCompetitors: ['PushPress', 'Momence', 'Wodify', 'Zen Planner', 'Gymdesk', 'Acuity / Squarespace', 'Mariana Tek', 'Vagaro', 'WellnessLiving', 'Glofox'],
    countries: [
      {
        name: 'United States',
        code: 'US',
        flag: '🇺🇸',
        currency: 'USD',
        currencySymbol: '$',
        phonePrefix: '+1',
        statesOrProvinces: [
          'California (CA)', 'New York (NY)', 'Texas (TX)', 'Florida (FL)',
          'Illinois (IL)', 'Colorado (CO)', 'Washington (WA)', 'Massachusetts (MA)',
          'Arizona (AZ)', 'North Carolina (NC)', 'Georgia (GA)', 'Pennsylvania (PA)',
          'Ohio (OH)', 'Tennessee (TN)', 'Utah (UT)', 'Oregon (OR)',
          'Michigan (MI)', 'Minnesota (MN)', 'Virginia (VA)', 'Nevada (NV)'
        ],
      },
      {
        name: 'Canada',
        code: 'CA',
        flag: '🇨🇦',
        currency: 'CAD',
        currencySymbol: '$',
        phonePrefix: '+1',
        statesOrProvinces: ['Ontario (ON)', 'British Columbia (BC)', 'Quebec (QC)', 'Alberta (AB)', 'Nova Scotia (NS)', 'Manitoba (MB)'],
      },
      {
        name: 'Mexico',
        code: 'MX',
        flag: '🇲🇽',
        currency: 'MXN',
        currencySymbol: '$',
        phonePrefix: '+52',
        statesOrProvinces: ['CDMX / Mexico City', 'Jalisco / Guadalajara', 'Nuevo León / Monterrey', 'Quintana Roo / Cancún'],
      },
    ],
    presets: [
      {
        label: '🇺🇸 US National Momence (No App)',
        flag: '🇺🇸',
        country: 'United States',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'Momence',
        appFilter: 'no_app_only',
        tooltip: 'Independent US boutique studios using Momence without their own app in Apple/Google Play',
      },
      {
        label: '🇺🇸 California PushPress (No App)',
        flag: '🇺🇸',
        country: 'United States',
        region: 'California (CA)',
        suburb: '',
        category: 'Functional / CrossFit',
        software: 'PushPress',
        appFilter: 'no_app_only',
        tooltip: 'California functional fitness gyms on PushPress without branded app',
      },
      {
        label: '🇺🇸 New York / Texas Wodify',
        flag: '🇺🇸',
        country: 'United States',
        region: 'New York (NY)',
        suburb: '',
        category: 'Functional / CrossFit',
        software: 'Wodify',
        appFilter: 'no_app_only',
      },
      {
        label: '🇨🇦 Canada National Zen Planner',
        flag: '🇨🇦',
        country: 'Canada',
        region: 'All',
        suburb: '',
        category: 'Martial Arts & BJJ',
        software: 'Zen Planner',
        appFilter: 'no_app_only',
      },
      {
        label: '🇺🇸 Florida Gymdesk Sweep',
        flag: '🇺🇸',
        country: 'United States',
        region: 'Florida (FL)',
        suburb: '',
        category: 'All',
        software: 'Gymdesk',
        appFilter: 'no_app_only',
      },
      {
        label: '🇺🇸 Texas Reformer Pilates Momence',
        flag: '🇺🇸',
        country: 'United States',
        region: 'Texas (TX)',
        suburb: '',
        category: 'Reformer Pilates',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
    ],
  },
  'Europe': {
    id: 'Europe',
    name: 'Europe',
    label: 'Europe',
    flag: '🌍',
    headline: 'European SMB Single-Site Lead Radar',
    description: 'Identifies independent fitness, reformer, and yoga facilities across the UK, Ireland, Germany, France, Spain, and Netherlands.',
    defaultCountry: 'United Kingdom',
    defaultCompetitors: ['Glofox', 'BSport', 'Momence', 'GymMaster', 'Wodify', 'TeamUp', 'BoxMate', 'Virtuagym', 'Eversports', 'Acuity / Squarespace'],
    countries: [
      {
        name: 'United Kingdom',
        code: 'UK',
        flag: '🇬🇧',
        currency: 'GBP',
        currencySymbol: '£',
        phonePrefix: '+44',
        statesOrProvinces: ['Greater London', 'Manchester / North West', 'West Midlands / Birmingham', 'Scotland (Edinburgh/Glasgow)', 'West Yorkshire / Leeds', 'South West / Bristol'],
      },
      {
        name: 'Ireland',
        code: 'IE',
        flag: '🇮🇪',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+353',
        statesOrProvinces: ['Dublin County', 'Cork', 'Galway', 'Limerick'],
      },
      {
        name: 'Germany',
        code: 'DE',
        flag: '🇩🇪',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+49',
        statesOrProvinces: ['Berlin', 'Bavaria / Munich', 'Hamburg', 'Hesse / Frankfurt', 'North Rhine-Westphalia / Cologne'],
      },
      {
        name: 'France',
        code: 'FR',
        flag: '🇫🇷',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+33',
        statesOrProvinces: ['Île-de-France / Paris', 'Auvergne-Rhône-Alpes / Lyon', 'Provence-Alpes-Côte d\'Azur / Marseille', 'Nouvelle-Aquitaine / Bordeaux'],
      },
      {
        name: 'Spain',
        code: 'ES',
        flag: '🇪🇸',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+34',
        statesOrProvinces: ['Madrid', 'Catalonia / Barcelona', 'Valencia', 'Andalusia / Seville'],
      },
      {
        name: 'Italy',
        code: 'IT',
        flag: '🇮🇹',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+39',
        statesOrProvinces: ['Lombardy / Milan', 'Lazio / Rome', 'Piedmont / Turin', 'Tuscany / Florence'],
      },
      {
        name: 'Netherlands',
        code: 'NL',
        flag: '🇳🇱',
        currency: 'EUR',
        currencySymbol: '€',
        phonePrefix: '+31',
        statesOrProvinces: ['North Holland / Amsterdam', 'South Holland / Rotterdam & The Hague', 'Utrecht', 'North Brabant'],
      },
    ],
    presets: [
      {
        label: '🇬🇧 UK National Glofox (No App)',
        flag: '🇬🇧',
        country: 'United Kingdom',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'Glofox',
        appFilter: 'no_app_only',
        tooltip: 'UK boutique studios using Glofox lacking their own branded mobile app',
      },
      {
        label: '🇬🇧 London Boutique Momence',
        flag: '🇬🇧',
        country: 'United Kingdom',
        region: 'Greater London',
        suburb: '',
        category: 'Reformer Pilates',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
      {
        label: '🇪🇺 EU BSport / Eversports',
        flag: '🇪🇺',
        country: 'Germany',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'BSport',
        appFilter: 'no_app_only',
      },
      {
        label: '🇮🇪 Ireland Boutique GymMaster',
        flag: '🇮🇪',
        country: 'Ireland',
        region: 'Dublin County',
        suburb: '',
        category: 'All',
        software: 'GymMaster',
        appFilter: 'no_app_only',
      },
      {
        label: '🇪🇸 Spain Boutique Fitness Glofox',
        flag: '🇪🇸',
        country: 'Spain',
        region: 'Catalonia / Barcelona',
        suburb: '',
        category: 'Boutique Strength & HIIT',
        software: 'Glofox',
        appFilter: 'no_app_only',
      },
      {
        label: '🇳🇱 Amsterdam Yoga & Pilates Momence',
        flag: '🇳🇱',
        country: 'Netherlands',
        region: 'North Holland / Amsterdam',
        suburb: '',
        category: 'Mat Pilates & Yoga',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
    ],
  },
  'Asia': {
    id: 'Asia',
    name: 'Asia',
    label: 'Asia',
    flag: '🌏',
    headline: 'Asia-Pacific & Middle East SMB Lead Radar',
    description: 'Discovers single-site boutique fitness, martial arts, reformer, and wellness studios across Singapore, Japan, Hong Kong, UAE, and India.',
    defaultCountry: 'Singapore',
    defaultCompetitors: ['Glofox', 'Vibefam', 'GymMaster', 'Momence', 'Hapana', 'BSport', 'Acuity / Squarespace'],
    countries: [
      {
        name: 'Singapore',
        code: 'SG',
        flag: '🇸🇬',
        currency: 'SGD',
        currencySymbol: 'S$',
        phonePrefix: '+65',
        statesOrProvinces: ['Central Region (CBD, Orchard, Tanjong Pagar)', 'East Region (Katong, Marine Parade)', 'West Region (Clementi, Buona Vista)', 'North Region'],
      },
      {
        name: 'United Arab Emirates',
        code: 'AE',
        flag: '🇦🇪',
        currency: 'AED',
        currencySymbol: 'AED',
        phonePrefix: '+971',
        statesOrProvinces: ['Dubai (Marina, Downtown, JLT, Business Bay)', 'Abu Dhabi', 'Sharjah'],
      },
      {
        name: 'Japan',
        code: 'JP',
        flag: '🇯🇵',
        currency: 'JPY',
        currencySymbol: '¥',
        phonePrefix: '+81',
        statesOrProvinces: ['Tokyo (Shibuya, Minato, Shinjuku, Roppongi)', 'Osaka', 'Kyoto', 'Yokohama'],
      },
      {
        name: 'Hong Kong',
        code: 'HK',
        flag: '🇭🇰',
        currency: 'HKD',
        currencySymbol: 'HK$',
        phonePrefix: '+852',
        statesOrProvinces: ['Hong Kong Island (Central, Sheung Wan, Causeway Bay)', 'Kowloon (Tsim Sha Tsui, Mong Kok)', 'New Territories'],
      },
      {
        name: 'India',
        code: 'IN',
        flag: '🇮🇳',
        currency: 'INR',
        currencySymbol: '₹',
        phonePrefix: '+91',
        statesOrProvinces: ['Mumbai (Bandra, Andheri, Juhu)', 'Delhi NCR (Gurugram, South Delhi)', 'Bengaluru (Indiranagar, Koramangala)', 'Pune'],
      },
    ],
    presets: [
      {
        label: '🇸🇬 Singapore Glofox / Vibefam',
        flag: '🇸🇬',
        country: 'Singapore',
        region: 'Central Region (CBD, Orchard, Tanjong Pagar)',
        suburb: '',
        category: 'All',
        software: 'Glofox',
        appFilter: 'no_app_only',
        tooltip: 'Singapore boutique studios lacking their own store app',
      },
      {
        label: '🇦🇪 Dubai Luxury Boutique Momence',
        flag: '🇦🇪',
        country: 'United Arab Emirates',
        region: 'Dubai (Marina, Downtown, JLT, Business Bay)',
        suburb: '',
        category: 'Reformer Pilates',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
      {
        label: '🇯🇵 Tokyo Boutique Studio Sweep',
        flag: '🇯🇵',
        country: 'Japan',
        region: 'Tokyo (Shibuya, Minato, Shinjuku, Roppongi)',
        suburb: '',
        category: 'All',
        software: 'GymMaster',
        appFilter: 'no_app_only',
      },
      {
        label: '🇭🇰 Hong Kong Pilates & Yoga',
        flag: '🇭🇰',
        country: 'Hong Kong',
        region: 'Hong Kong Island (Central, Sheung Wan, Causeway Bay)',
        suburb: '',
        category: 'Mat Pilates & Yoga',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
      {
        label: '🇮🇳 India Functional Fitness Sweep',
        flag: '🇮🇳',
        country: 'India',
        region: 'Bengaluru (Indiranagar, Koramangala)',
        suburb: '',
        category: 'Functional / CrossFit',
        software: 'GymMaster',
        appFilter: 'no_app_only',
      },
    ],
  },
  'South America': {
    id: 'South America',
    name: 'South America',
    label: 'South America',
    flag: '🌎',
    headline: 'South America SMB Single-Site Lead Radar',
    description: 'Finds independent academies, crossfit boxes, and pilates studios across Brazil, Argentina, Colombia, and Chile on EVO, Tecnofit, CrossX, and Glofox.',
    defaultCountry: 'Brazil',
    defaultCompetitors: ['EVO / W12', 'Tecnofit', 'CrossX', 'Glofox', 'BSport', 'Acuity / Squarespace', 'Gymdesk'],
    countries: [
      {
        name: 'Brazil',
        code: 'BR',
        flag: '🇧🇷',
        currency: 'BRL',
        currencySymbol: 'R$',
        phonePrefix: '+55',
        statesOrProvinces: ['São Paulo (SP)', 'Rio de Janeiro (RJ)', 'Paraná / Curitiba (PR)', 'Minas Gerais / Belo Horizonte (MG)', 'Rio Grande do Sul / Porto Alegre (RS)', 'Santa Catarina / Florianópolis (SC)'],
      },
      {
        name: 'Argentina',
        code: 'AR',
        flag: '🇦🇷',
        currency: 'ARS',
        currencySymbol: '$',
        phonePrefix: '+54',
        statesOrProvinces: ['Buenos Aires (CABA / Palermo / Recoleta)', 'Buenos Aires Province', 'Córdoba', 'Santa Fe / Rosario'],
      },
      {
        name: 'Colombia',
        code: 'CO',
        flag: '🇨🇴',
        currency: 'COP',
        currencySymbol: '$',
        phonePrefix: '+57',
        statesOrProvinces: ['Bogotá D.C. (Zona Rosa, Chapinero, Usaquén)', 'Antioquia / Medellín (El Poblado, Laureles)', 'Valle del Cauca / Cali'],
      },
      {
        name: 'Chile',
        code: 'CL',
        flag: '🇨🇱',
        currency: 'CLP',
        currencySymbol: '$',
        phonePrefix: '+56',
        statesOrProvinces: ['Santiago / Región Metropolitana (Las Condes, Vitacura, Providencia)', 'Valparaíso / Viña del Mar', 'Biobío / Concepción'],
      },
    ],
    presets: [
      {
        label: '🇧🇷 Brazil EVO / Tecnofit Sweep',
        flag: '🇧🇷',
        country: 'Brazil',
        region: 'São Paulo (SP)',
        suburb: '',
        category: 'All',
        software: 'EVO / W12',
        appFilter: 'no_app_only',
        tooltip: 'Brazilian studios using EVO without branded app in app stores',
      },
      {
        label: '🇧🇷 Rio de Janeiro BJJ & Gyms',
        flag: '🇧🇷',
        country: 'Brazil',
        region: 'Rio de Janeiro (RJ)',
        suburb: '',
        category: 'Martial Arts & BJJ',
        software: 'Tecnofit',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇷 Buenos Aires Boutique Glofox',
        flag: '🇦🇷',
        country: 'Argentina',
        region: 'Buenos Aires (CABA / Palermo / Recoleta)',
        suburb: '',
        category: 'Reformer Pilates',
        software: 'Glofox',
        appFilter: 'no_app_only',
      },
      {
        label: '🇨🇴 Medellín / Bogotá CrossX',
        flag: '🇨🇴',
        country: 'Colombia',
        region: 'Antioquia / Medellín (El Poblado, Laureles)',
        suburb: '',
        category: 'Functional / CrossFit',
        software: 'CrossX',
        appFilter: 'no_app_only',
      },
      {
        label: '🇨🇱 Santiago Functional Box Sweep',
        flag: '🇨🇱',
        country: 'Chile',
        region: 'Santiago / Región Metropolitana (Las Condes, Vitacura, Providencia)',
        suburb: '',
        category: 'Boutique Strength & HIIT',
        software: 'Glofox',
        appFilter: 'no_app_only',
      },
    ],
  },
  'Oceania': {
    id: 'Oceania',
    name: 'Oceania',
    label: 'Australia & New Zealand',
    flag: '🌊',
    headline: 'Australia & New Zealand Single-Site Lead Radar',
    description: 'Scans boutique fitness and timetable booking signals across Australia & New Zealand with strict single-site verification and app store audit.',
    defaultCountry: 'Australia',
    defaultCompetitors: ['Momence', 'Clubworx', 'GymMaster', 'PushPress', 'Wodify', 'Hapana', 'Xoda', 'Acuity / Squarespace'],
    countries: [
      {
        name: 'Australia',
        code: 'AU',
        flag: '🇦🇺',
        currency: 'AUD',
        currencySymbol: '$',
        phonePrefix: '+61',
        statesOrProvinces: ['NSW (Sydney & Hunter)', 'VIC (Melbourne & Geelong)', 'QLD (Brisbane & Gold Coast)', 'WA (Perth & Fremantle)', 'SA (Adelaide)', 'ACT (Canberra)', 'TAS (Hobart)', 'NT (Darwin)'],
      },
      {
        name: 'New Zealand',
        code: 'NZ',
        flag: '🇳🇿',
        currency: 'NZD',
        currencySymbol: '$',
        phonePrefix: '+64',
        statesOrProvinces: ['Auckland Region', 'Wellington / Te Aro', 'Canterbury / Christchurch', 'Waikato / Hamilton', 'Bay of Plenty / Tauranga', 'Otago / Queenstown', 'Other NZ'],
      },
    ],
    presets: [
      {
        label: '🇦🇺 All Australia Momence (No App)',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇺 All Australia PushPress (No App)',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'PushPress',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇺 Sydney / NSW Momence',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'NSW (Sydney & Hunter)',
        suburb: '',
        category: 'Reformer Pilates',
        software: 'Momence',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇺 Perth / WA PushPress',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'WA (Perth & Fremantle)',
        suburb: '',
        category: 'Functional / CrossFit',
        software: 'PushPress',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇺 Melbourne / VIC Wodify',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'VIC (Melbourne & Geelong)',
        suburb: '',
        category: 'All',
        software: 'Wodify',
        appFilter: 'no_app_only',
      },
      {
        label: '🇦🇺 Brisbane / QLD Clubworx',
        flag: '🇦🇺',
        country: 'Australia',
        region: 'QLD (Brisbane & Gold Coast)',
        suburb: '',
        category: 'Martial Arts & BJJ',
        software: 'Clubworx',
        appFilter: 'no_app_only',
      },
      {
        label: '🌐 Clubworx Hosted Sites (app.clubworx.com)',
        flag: '🌐',
        country: 'Australia',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'Clubworx',
        appFilter: 'no_app_only',
        scanHostedOnly: true,
        tooltip: 'Target businesses hosted on app.clubworx.com without custom domain',
      },
      {
        label: '🇳🇿 NZ National GymMaster (No App)',
        flag: '🇳🇿',
        country: 'New Zealand',
        region: 'All',
        suburb: '',
        category: 'All',
        software: 'GymMaster',
        appFilter: 'no_app_only',
      },
    ],
  },
};

export function getGlobalRegionForCountry(countryName: string): GlobalRegion {
  const norm = (countryName || '').toLowerCase().trim();
  for (const [regionKey, config] of Object.entries(GLOBAL_REGIONS)) {
    if (config.countries.some(c => c.name.toLowerCase() === norm || c.code.toLowerCase() === norm)) {
      return regionKey as GlobalRegion;
    }
  }
  // Fallbacks
  if (norm.includes('united states') || norm.includes('usa') || norm.includes('canada') || norm.includes('mexico')) {
    return 'North America';
  }
  if (norm.includes('kingdom') || norm.includes('uk') || norm.includes('germany') || norm.includes('france') || norm.includes('spain') || norm.includes('italy') || norm.includes('netherlands') || norm.includes('ireland')) {
    return 'Europe';
  }
  if (norm.includes('singapore') || norm.includes('japan') || norm.includes('emirates') || norm.includes('dubai') || norm.includes('india') || norm.includes('hong kong')) {
    return 'Asia';
  }
  if (norm.includes('brazil') || norm.includes('argentina') || norm.includes('colombia') || norm.includes('chile')) {
    return 'South America';
  }
  return 'Oceania';
}
