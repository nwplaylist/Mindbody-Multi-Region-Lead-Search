export type GlobalRegion = 'North America' | 'Europe' | 'Asia' | 'South America' | 'Oceania';

export type Country =
  | 'Australia'
  | 'New Zealand'
  | 'United States'
  | 'Canada'
  | 'Mexico'
  | 'United Kingdom'
  | 'Ireland'
  | 'Germany'
  | 'France'
  | 'Spain'
  | 'Italy'
  | 'Netherlands'
  | 'Singapore'
  | 'Japan'
  | 'Hong Kong'
  | 'India'
  | 'United Arab Emirates'
  | 'Brazil'
  | 'Argentina'
  | 'Colombia'
  | 'Chile'
  | string;

export type AUState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
export type NZRegion = 'Auckland' | 'Wellington' | 'Canterbury/Christchurch' | 'Waikato' | 'Bay of Plenty' | 'Otago' | 'Other NZ';

export type Region = string;

export type FitnessCategory =
  | 'Reformer Pilates'
  | 'Mat Pilates & Yoga'
  | 'Functional / CrossFit'
  | 'Martial Arts & BJJ'
  | '24/7 Gym & Health Club'
  | 'Boutique Strength & HIIT'
  | 'Allied Health & Wellness'
  | 'Spa, Sauna & Recovery'
  | 'Dance & Rhythm Cycle'
  | 'Indoor Golf Simulators'
  | 'Padel & Racket Clubs'
  | 'Fitness-Adjacent & Activity Venues';

export type CompetitorSoftware =
  | 'Momence'
  | 'Clubworx'
  | 'GymMaster'
  | 'Xoda'
  | 'PushPress'
  | 'Zen Planner'
  | 'Wodify'
  | 'Gymdesk'
  | 'Hapana'
  | 'Acuity / Squarespace'
  | 'WellnessLiving'
  | 'Glofox'
  | 'Vagaro'
  | 'Mariana Tek'
  | 'BSport'
  | 'TeamUp'
  | 'BoxMate'
  | 'Virtuagym'
  | 'Eversports'
  | 'EVO / W12'
  | 'Tecnofit'
  | 'CrossX'
  | 'Vibefam'
  | 'Reserva / Other Booking System'
  | 'No Software / Manual';

export type LeadStatus =
  | 'Fresh Prospect'
  | 'Enriched'
  | 'In Salesforce (Duplicate)'
  | 'Contacted (Email)'
  | 'Contacted (Phone)'
  | 'Demo Scheduled'
  | 'Closed Won'
  | 'Not Interested';

export type SalesforceMatchStatus =
  | 'Not in Salesforce'
  | 'Exists in Salesforce'
  | 'Fuzzy Match'
  | 'New Lead'
  | 'Exact Salesforce Match'
  | 'Fatigued Account (>3 Outreaches)';

export interface Lead {
  id: string;
  businessName: string;
  category: FitnessCategory;
  currentSoftware: CompetitorSoftware;
  timetableBookingSignal?: string;
  bookingUrl?: string;
  globalRegion?: GlobalRegion;
  country: Country;
  region: Region;
  suburb: string;
  postcode: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  instagram?: string;
  decisionMakerName: string;
  decisionMakerTitle: string;
  estimatedClassCount?: number;
  estimatedMonthlyRevenueAUD?: number;
  leadStatus: LeadStatus;
  salesforceMatchStatus: SalesforceMatchStatus;
  salesforceMatchDetails?: string;
  salesforceAccountOwner?: string;
  fatigueScore: number; // 1-10 (1 = fresh, 10 = burned out by reps)
  knownPainPoints: string[];
  switchingTriggers: string[];
  suggestedAngle: string;
  addedAt: string;
  lastContactedDate?: string;
  notes?: string;
  contactAttemptsCount: number;
  isSingleSite?: boolean; // SMB constraint: strictly true for 1-location studios
  addedToCadence?: boolean; // Track if this lead was pushed to SalesLoft Cadence
  cadenceAddedAt?: string; // Date added to SalesLoft Cadence
  cadenceName?: string; // e.g. "ANZ Competitor Switcher Cadence"
  // App Store Presence & White-Label App Opportunity Fields
  hasCustomBrandedApp?: boolean; // false = target studio that lacks their own app in Apple/Google Play store
  appStoreStatus?: 'No Branded App (Target)' | 'Uses Generic Competitor App' | 'Has Custom App';
  appStoreNotes?: string; // Details on their mobile/booking presence
  customAppOpportunity?: string; // Specific sales pitch hook for branded mobile app
  // Hosted Web Presence Fields (e.g. app.clubworx.com/websites/)
  isHostedPortalWebsite?: boolean; // True if studio has no standalone domain and uses competitor hosted site builder
  hostedPortalType?: 'clubworx_website' | 'other_hosted' | 'custom_domain';
  // Link Verification & Single-Location Guard Fields
  websiteVerified?: boolean;
  websiteStatus?: 'Live & Reachable' | 'DNS Confirmed' | 'Unreachable';
  hasLocationsTab?: boolean; // True if website navigation contains "Locations" tab / multiple facilities
  multiLocationReason?: string;
}

export interface CompetitorBattlecard {
  id: string;
  softwareName: CompetitorSoftware;
  marketShareANZ: string; // e.g. "High in Reformer Pilates & Yoga"
  typicalCustomerProfile: string;
  keyWeaknesses: string[];
  mindbodyAdvantages: string[];
  killerDiscoveryQuestions: string[];
  pricingOverview: string;
  commonObjectionsAndHandlers: {
    objection: string;
    handler: string;
  }[];
  recentSwitchWinStory: string;
}

export interface SearchQueryFilters {
  globalRegion: GlobalRegion;
  country: Country | 'All';
  region: string;
  suburb: string;
  category: FitnessCategory | 'All';
  competitorSoftware: CompetitorSoftware | 'All';
  onlyFreshUncontacted: boolean;
  onlySingleSite: boolean;
  appStoreFilter?: 'no_app_only' | 'generic_only' | 'all';
  scanClubworxHostedOnly?: boolean;
}

export interface DedupeResult {
  providedName: string;
  providedEmail?: string;
  providedPhone?: string;
  matchedLeadId?: string;
  matchType: 'Exact' | 'Fuzzy' | 'None';
  matchReason?: string;
  fatigueWarning?: string;
  confidenceScore: number; // 0 - 100
  suggestedAction: 'Import as New Lead' | 'Merge with Existing' | 'Skip (Fatigued / Duplicate)';
}

export interface OutreachGenerationParams {
  lead: Lead;
  outreachType: 'email_cold' | 'email_followup' | 'phone_script' | 'instagram_dm' | 'linkedin_inmail';
  personaAngle: 'cost_roi' | 'feature_gap' | 'growth_marketplace' | 'migration_ease' | 'community_retention';
  customContext?: string;
}

export interface GeneratedOutreach {
  subject?: string;
  headline: string;
  body: string;
  callToAction: string;
  keyTalkingPoints: string[];
  objectionPrep: string;
}
