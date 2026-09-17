import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  Copy,
  Check,
  Building2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Trash2,
  User,
  Filter,
  ArrowRight,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Clock,
  Eye,
  CheckCircle2,
  Globe,
  Ban,
  EyeOff,
  XCircle,
  Zap,
  Smartphone,
  SmartphoneNfc
} from 'lucide-react';
import { Lead, Country, FitnessCategory, CompetitorSoftware, GlobalRegion } from '../types';
import {
  GLOBAL_REGIONS,
  GlobalRegionConfig,
  getGlobalRegionForCountry,
} from '../data/regionsData';
import {
  getSentToClaudeNames,
  addSentToClaudeNames,
  removeSentToClaudeName,
  clearSentToClaudeMemory,
} from '../utils/claudeMemory';
import {
  getPermanentExclusions,
  appendPermanentExclusions,
  clearPermanentExclusions,
  removePermanentExclusion,
} from '../utils/persistentStorage';
import { enrichContactDetails } from '../utils/contactEnrichment';
import {
  isAustralianBusiness,
  isNZBusiness,
  isValidLeadForTerritory,
  normalizeAustralianLead,
} from '../utils/geoValidation';
import { SalesloftCadenceLog } from './SalesloftCadenceLog';

interface LeadFinderViewProps {
  leads: Lead[];
  currentGlobalRegion?: GlobalRegion | 'All';
  onSelectGlobalRegion?: (region: GlobalRegion | 'All') => void;
  onAddLeads: (leads: Lead[]) => void;
  onFreshSearchLeads?: (leads: Lead[]) => void;
  onClearUncadencedLeads?: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenSalesforceModal: () => void;
  onOpenExportModal: () => void;
  onOpenAddModal: () => void;
}

export const LeadFinderView: React.FC<LeadFinderViewProps> = ({
  leads,
  currentGlobalRegion,
  onSelectGlobalRegion,
  onAddLeads,
  onFreshSearchLeads,
  onClearUncadencedLeads,
  onUpdateLead,
  onDeleteLead,
  onOpenSalesforceModal,
  onOpenExportModal,
  onOpenAddModal,
}) => {
  // Main view navigation tab
  const [activeMainTab, setActiveMainTab] = useState<'radar' | 'cadence'>('radar');

  // Active Global Region (supports synchronized parent state or fallback internal state)
  const [internalGlobalRegion, setInternalGlobalRegion] = useState<GlobalRegion | 'All'>('North America');
  const activeGlobalRegion = currentGlobalRegion !== undefined ? currentGlobalRegion : internalGlobalRegion;

  const setActiveGlobalRegion = (r: GlobalRegion | 'All') => {
    if (onSelectGlobalRegion) {
      onSelectGlobalRegion(r);
    }
    setInternalGlobalRegion(r);
  };

  // Search parameters
  const [country, setCountry] = useState<Country>('United States');
  const [region, setRegion] = useState<string>('All');
  const [suburb, setSuburb] = useState<string>('');
  const [category, setCategory] = useState<FitnessCategory | 'All'>('Functional / CrossFit');
  const [software, setSoftware] = useState<CompetitorSoftware | 'All'>('PushPress');
  const [appStoreFilter, setAppStoreFilter] = useState<'no_app_only' | 'generic_only' | 'all'>('no_app_only');
  const [scanClubworxHosted, setScanClubworxHosted] = useState<boolean>(false);
  const [resultLimit, setResultLimit] = useState<number>(20);
  const [deepScan, setDeepScan] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [showDiscoveryTips, setShowDiscoveryTips] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Synchronize search defaults when active territory changes
  useEffect(() => {
    if (activeGlobalRegion !== 'All') {
      const config = GLOBAL_REGIONS[activeGlobalRegion];
      if (config) {
        setCountry(config.defaultCountry as Country);
        setRegion('All');
        setSoftware(config.defaultCompetitors[0] || 'All');
        setScanClubworxHosted(false);
      }
    } else {
      setCountry('All' as Country);
      setRegion('All');
      setSoftware('All');
    }
  }, [activeGlobalRegion]);

  // Filter and Search within discovered leads list
  const [leadListFilter, setLeadListFilter] = useState<'all' | 'clean' | 'in_sf' | 'no_app' | 'clubworx_hosted' | 'verified_links'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingLeadId, setVerifyingLeadId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{ id: string; message: string } | null>(null);
  const [testingLinkId, setTestingLinkId] = useState<string | null>(null);
  const [linkTestResults, setLinkTestResults] = useState<
    Record<
      string,
      {
        valid: boolean;
        reachable: boolean;
        isMultiLocation: boolean;
        statusText: string;
        finalUrl?: string;
      }
    >
  >({});

  // Combined exclusion memory
  const [exclusionList, setExclusionList] = useState<string[]>(() => {
    return Array.from(new Set([...getPermanentExclusions(), ...getSentToClaudeNames()]));
  });

  const syncExclusions = () => {
    setExclusionList(Array.from(new Set([...getPermanentExclusions(), ...getSentToClaudeNames()])));
  };

  useEffect(() => {
    syncExclusions();
    window.addEventListener('claudeMemoryUpdated', syncExclusions);
    return () => window.removeEventListener('claudeMemoryUpdated', syncExclusions);
  }, []);

  const handleToggleCadence = (lead: Lead) => {
    const isNowCadenced = !lead.addedToCadence;
    const updated: Lead = {
      ...lead,
      addedToCadence: isNowCadenced,
      cadenceAddedAt: isNowCadenced ? new Date().toISOString().split('T')[0] : undefined,
      cadenceName: isNowCadenced ? (lead.cadenceName || 'ANZ Competitor Switcher Cadence') : undefined,
    };
    onUpdateLead(updated);
    if (isNowCadenced) {
      setToastNotification(`⚡ "${lead.businessName}" moved to SalesLoft Cadence Log! (View in Cadence tab)`);
    } else {
      setToastNotification(`"${lead.businessName}" removed from SalesLoft Cadence.`);
    }
    setTimeout(() => setToastNotification(null), 4500);
  };

  const handleMarkNotViable = (lead: Lead) => {
    appendPermanentExclusions([lead.businessName]);
    addSentToClaudeNames([lead.businessName]);
    syncExclusions();
    onDeleteLead(lead.id);
    setToastNotification(`🚫 "${lead.businessName}" marked as Not Viable and permanently removed from pipeline & future radar scans.`);
    setTimeout(() => setToastNotification(null), 5000);
  };

  const handleExcludeMultiLocation = (lead: Lead) => {
    appendPermanentExclusions([lead.businessName]);
    addSentToClaudeNames([lead.businessName]);
    syncExclusions();
    onDeleteLead(lead.id);
    setToastNotification(`🏢 "${lead.businessName}" flagged as Multi-Location and excluded from all future radar scans.`);
    setTimeout(() => setToastNotification(null), 5000);
  };

  const handleTestLink = async (lead: Lead) => {
    const testUrl = lead.website || lead.bookingUrl;
    if (!testUrl) return;
    setTestingLinkId(lead.id);
    try {
      const res = await fetch('/api/leads/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          businessName: lead.businessName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkTestResults((prev) => ({
          ...prev,
          [lead.id]: {
            valid: data.valid,
            reachable: data.reachable,
            isMultiLocation: data.isMultiLocation,
            statusText: data.statusText,
            finalUrl: data.finalUrl,
          },
        }));

        if (data.finalUrl && data.finalUrl !== lead.website) {
          onUpdateLead({
            ...lead,
            website: data.finalUrl,
            websiteVerified: true,
            hasLocationsTab: data.isMultiLocation,
            isSingleSite: !data.isMultiLocation,
            websiteStatus: data.reachable ? 'Live & Reachable' : 'DNS Confirmed',
          });
        }
      }
    } catch (err: any) {
      setLinkTestResults((prev) => ({
        ...prev,
        [lead.id]: {
          valid: false,
          reachable: false,
          isMultiLocation: false,
          statusText: 'Check failed: ' + (err.message || 'Network error'),
        },
      }));
    } finally {
      setTestingLinkId(null);
    }
  };

  const handleRemoveExclusionItem = (name: string) => {
    removePermanentExclusion(name);
    removeSentToClaudeName(name);
    syncExclusions();
  };

  const handleClearAllExclusions = () => {
    clearPermanentExclusions();
    clearSentToClaudeMemory();
    syncExclusions();
    setToastNotification('Exclusion memory cleared.');
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleVerifyOperation = async (lead: Lead) => {
    setVerifyingLeadId(lead.id);
    try {
      const res = await fetch('/api/leads/verify-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: lead.businessName,
          website: lead.website,
          country: lead.country,
          suburb: lead.suburb,
          region: lead.region,
        }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        const v = data.verification;
        const updated: Lead = {
          ...lead,
          website: v.verifiedWebsite || lead.website,
          bookingUrl: v.verifiedBookingUrl || lead.bookingUrl,
          currentSoftware: (v.verifiedCurrentSoftware || lead.currentSoftware) as CompetitorSoftware,
          timetableBookingSignal: v.timetableBookingSignal || lead.timetableBookingSignal,
          phone: v.phone || lead.phone,
          email: v.email || lead.email,
          instagram: v.instagram || lead.instagram,
          decisionMakerName: v.decisionMakerName || lead.decisionMakerName,
          decisionMakerTitle: v.decisionMakerTitle || lead.decisionMakerTitle,
          hasCustomBrandedApp: v.hasCustomBrandedApp ?? lead.hasCustomBrandedApp,
          appStoreStatus: v.appStoreStatus || lead.appStoreStatus,
          appStoreNotes: v.appStoreNotes || lead.appStoreNotes,
          customAppOpportunity: v.customAppOpportunity || lead.customAppOpportunity,
        };
        onUpdateLead(updated);
        setVerificationFeedback({
          id: lead.id,
          message: v.isCurrentlyOperating
            ? `Verified Active: ${v.statusSummary || 'Currently Operating'}`
            : 'Operational Check Complete',
        });
        setTimeout(() => setVerificationFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Error verifying operation:', err);
    } finally {
      setVerifyingLeadId(null);
    }
  };

  // Run AI Discovery grounded search
  const handleSearch = async () => {
    setIsSearching(true);
    setErrorMessage(null);

    const permanentExcludes = getPermanentExclusions();
    const claudeExcludes = getSentToClaudeNames();
    const currentLeadNames = leads.map(l => l.businessName);
    const excludeList = Array.from(new Set([...permanentExcludes, ...claudeExcludes, ...currentLeadNames]));

    try {
      const targetRegion = activeGlobalRegion === 'All' ? getGlobalRegionForCountry(country) : activeGlobalRegion;
      const searchCountry = country === 'All' ? (GLOBAL_REGIONS[targetRegion]?.defaultCountry || 'United States') : country;

      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalRegion: targetRegion,
          country: searchCountry,
          region: region === 'All' ? undefined : region,
          suburb: suburb.trim() ? suburb : undefined,
          category: category === 'All' ? undefined : category,
          competitorSoftware: software === 'All' ? undefined : software,
          limit: resultLimit,
          deepScan,
          appStoreFilter,
          scanClubworxHostedOnly: scanClubworxHosted,
          excludeNames: excludeList,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.leads)) {
        // Enforce strict geographic territory validation on all incoming leads
        const geoValidLeads = data.leads.filter((l: any) =>
          isValidLeadForTerritory(l, targetRegion, country !== 'All' ? country : undefined)
        );
        const normalizedLeads = geoValidLeads.map((l: any) =>
          targetRegion === 'Oceania' && l.country === 'Australia' ? normalizeAustralianLead(l) : l
        );
        const returnedLeads: Lead[] = normalizedLeads.map((l: any) => ({
          ...l,
          globalRegion: l.globalRegion || targetRegion,
        })).map(enrichContactDetails);

        // Filter if specific software requested, but allow variations
        let filtered = returnedLeads;
        if (scanClubworxHosted) {
          filtered = returnedLeads.filter((l: Lead) =>
            l.isHostedPortalWebsite ||
            (l.currentSoftware || '').toLowerCase().includes('clubworx') ||
            (l.website || '').includes('clubworx') ||
            (l.bookingUrl || '').includes('clubworx')
          );
          if (filtered.length === 0 && returnedLeads.length > 0) {
            filtered = returnedLeads;
          }
        } else if (software !== 'All') {
          const targetNorm = software.toLowerCase().replace(/[\s\-_/]/g, '');
          filtered = returnedLeads.filter((l: Lead) => {
            const swNorm = (l.currentSoftware || '').toLowerCase().replace(/[\s\-_/]/g, '');
            return swNorm.includes(targetNorm) || targetNorm.includes(swNorm) ||
                   (targetNorm.includes('acuity') && swNorm.includes('squarespace')) ||
                   (targetNorm.includes('squarespace') && swNorm.includes('acuity'));
          });
          // If strict filter removed everything but leads were returned for that software search, keep returned
          if (filtered.length === 0 && returnedLeads.length > 0) {
            filtered = returnedLeads;
          }
        }

        // Fresh search replaces previous un-cadenced leads while archiving them to exclusion memory
        if (onFreshSearchLeads) {
          onFreshSearchLeads(filtered);
        } else {
          onAddLeads(filtered);
        }

        syncExclusions();
        setToastNotification(
          scanClubworxHosted
            ? `🎯 Harvested ${filtered.length} verified Australian Clubworx portal-hosted sites (app.clubworx.com)!`
            : `🎯 Harvested ${filtered.length} verified ${country} single-site leads without custom app in ${targetRegion}!`
        );
        setTimeout(() => setToastNotification(null), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to find new leads.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while scanning for leads.');
    } finally {
      setIsSearching(false);
    }
  };

  const applyPreset = (
    presetCountry: Country,
    presetRegion: string,
    presetSuburb: string,
    presetCategory: FitnessCategory | 'All',
    presetSoftware: CompetitorSoftware | 'All',
    presetAppFilter: 'no_app_only' | 'generic_only' | 'all' = 'no_app_only',
    scanHostedOnly: boolean = false
  ) => {
    const targetTerritory = getGlobalRegionForCountry(presetCountry);
    if (targetTerritory && activeGlobalRegion !== targetTerritory && activeGlobalRegion !== 'All') {
      setActiveGlobalRegion(targetTerritory);
    }
    setCountry(presetCountry);
    setRegion(presetRegion);
    setSuburb(presetSuburb);
    setCategory(presetCategory);
    setSoftware(presetSoftware);
    setAppStoreFilter(presetAppFilter);
    setScanClubworxHosted(scanHostedOnly);
  };

  const handleCopyContact = (lead: Lead) => {
    const contactText = `Business: ${lead.businessName}
Category: ${lead.category} (Single Location)
Booking Software: ${lead.currentSoftware}
Mobile App Presence: ${lead.hasCustomBrandedApp ? 'Has Custom Store App' : 'No Custom Branded App in Stores (Prime Opportunity)'}
App Store Notes: ${lead.appStoreNotes || 'No dedicated branded app in Apple App Store or Google Play'}
Custom App Pitch Hook: ${lead.customAppOpportunity || 'Pitch custom branded iOS & Android member app to eliminate generic booking friction'}
Timetable Signal: ${lead.timetableBookingSignal || 'Online timetable detected'}
Contact Name: ${lead.decisionMakerName} (${lead.decisionMakerTitle})
Phone: ${lead.phone}
Email: ${lead.email}
Website: ${lead.website}
Booking Link: ${lead.bookingUrl || lead.website}
Address: ${lead.address}, ${lead.suburb} ${lead.region} ${lead.country}`;

    navigator.clipboard.writeText(contactText);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSalesforceStatus = (lead: Lead) => {
    const isCurrentlyInSf = lead.salesforceMatchStatus === 'Exists in Salesforce' || lead.salesforceMatchStatus === 'Fuzzy Match';
    const updated: Lead = {
      ...lead,
      salesforceMatchStatus: isCurrentlyInSf ? 'Not in Salesforce' : 'Exists in Salesforce',
      salesforceMatchDetails: isCurrentlyInSf ? 'Manually marked as Clean (Not in Salesforce)' : 'Manually marked as Existing in Salesforce',
    };
    onUpdateLead(updated);
  };

  // Leads for the Prospect Discovery Radar: Strictly un-cadenced leads!
  // Filter by active global territory and selected country
  const radarLeads = leads
    .filter(l => !l.addedToCadence)
    .filter(l => {
      if (activeGlobalRegion === 'All') {
        if (country && country !== 'All') {
          return isValidLeadForTerritory(l, undefined, country);
        }
        return true;
      }
      return isValidLeadForTerritory(l, activeGlobalRegion, country !== 'All' ? country : undefined);
    });
  const cadencedLeadsCount = leads.filter(l => l.addedToCadence).length;

  const filteredLeads = radarLeads.filter(l => {
    // Filter
    if (leadListFilter === 'clean' && (l.salesforceMatchStatus === 'Exists in Salesforce' || l.salesforceMatchStatus === 'Fuzzy Match')) {
      return false;
    }
    if (leadListFilter === 'in_sf' && (l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead')) {
      return false;
    }
    if (leadListFilter === 'no_app' && l.hasCustomBrandedApp === true) {
      return false;
    }
    if (leadListFilter === 'clubworx_hosted' && !l.isHostedPortalWebsite && !l.website?.includes('app.clubworx.com') && !l.bookingUrl?.includes('app.clubworx.com')) {
      return false;
    }
    if (leadListFilter === 'verified_links' && (!l.websiteVerified || l.hasLocationsTab)) {
      return false;
    }

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (l.businessName || '').toLowerCase().includes(q);
      const matchSuburb = (l.suburb || '').toLowerCase().includes(q);
      const matchSoftware = (l.currentSoftware || '').toLowerCase().includes(q);
      const matchEmail = (l.email || '').toLowerCase().includes(q);
      const matchPhone = (l.phone || '').toLowerCase().includes(q);
      const matchDM = (l.decisionMakerName || '').toLowerCase().includes(q);
      const matchSignal = (l.timetableBookingSignal || '').toLowerCase().includes(q);
      const matchApp = (l.appStoreNotes || '').toLowerCase().includes(q) || (l.customAppOpportunity || '').toLowerCase().includes(q);
      const matchHosted = (l.website || '').toLowerCase().includes('clubworx') || (l.bookingUrl || '').toLowerCase().includes('clubworx');
      return matchName || matchSuburb || matchSoftware || matchEmail || matchPhone || matchDM || matchSignal || matchApp || matchHosted;
    }

    return true;
  });

  const cleanLeadsCount = radarLeads.filter(l => l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead').length;
  const inSfLeadsCount = radarLeads.filter(l => l.salesforceMatchStatus === 'Exists in Salesforce' || l.salesforceMatchStatus === 'Fuzzy Match').length;
  const noAppLeadsCount = radarLeads.filter(l => l.hasCustomBrandedApp === false || !l.hasCustomBrandedApp).length;
  const clubworxHostedCount = radarLeads.filter(
    l => l.isHostedPortalWebsite || l.website?.includes('app.clubworx.com') || l.bookingUrl?.includes('app.clubworx.com')
  ).length;
  const verifiedSingleSiteCount = radarLeads.filter(
    l => l.websiteVerified && !l.hasLocationsTab
  ).length;

  const getSoftwareBadgeColor = (sw: CompetitorSoftware) => {
    switch (sw) {
      case 'Momence':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'PushPress':
        return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
      case 'Clubworx':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'GymMaster':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'Hapana':
        return 'bg-orange-100 text-[#D94E15] border-orange-300 font-bold';
      case 'Wodify':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'Acuity / Squarespace':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
    }
  };

  // Regional intelligence context
  const activeRegionConfig = activeGlobalRegion !== 'All' ? GLOBAL_REGIONS[activeGlobalRegion] : null;

  // Available countries based on active region
  const availableCountries = activeGlobalRegion !== 'All'
    ? GLOBAL_REGIONS[activeGlobalRegion].countries
    : Object.values(GLOBAL_REGIONS).flatMap(r => r.countries);

  // Match selected country info
  const selectedCountryInfo = availableCountries.find(
    c => c.name.toLowerCase() === (country || '').toLowerCase()
  );

  // Available states / provinces for the selected country
  const availableStates = selectedCountryInfo?.statesOrProvinces || (
    activeGlobalRegion !== 'All'
      ? GLOBAL_REGIONS[activeGlobalRegion].countries.flatMap(c => c.statesOrProvinces)
      : []
  );

  // Active presets for quick sweeps
  const activePresets = activeGlobalRegion !== 'All'
    ? GLOBAL_REGIONS[activeGlobalRegion].presets
    : [
        GLOBAL_REGIONS['North America'].presets[0],
        GLOBAL_REGIONS['Europe'].presets[0],
        GLOBAL_REGIONS['Oceania'].presets[0],
        GLOBAL_REGIONS['Asia'].presets[0],
        GLOBAL_REGIONS['South America'].presets[0],
        GLOBAL_REGIONS['North America'].presets[1],
      ];

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION BANNER */}
      {toastNotification && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white text-sm px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP VIEW SWITCHER TABS: PROSPECT RADAR vs SALESLOFT CADENCE */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveMainTab('radar')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'radar'
              ? 'bg-[#0B192C] text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Search className="w-4 h-4 text-orange-400" />
          <span>Prospect Discovery Radar</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeMainTab === 'radar' ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-slate-700'
          }`}>
            {radarLeads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('cadence')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'cadence'
              ? 'bg-[#0B192C] text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
          <span>Added to SalesLoft Cadence</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F25F22] text-white shadow-xs">
            {cadencedLeadsCount}
          </span>
        </button>
      </div>

      {/* CONDITIONAL MAIN TAB CONTENT */}
      {activeMainTab === 'cadence' ? (
        <SalesloftCadenceLog
          leads={leads}
          onUpdateLead={onUpdateLead}
          onDeleteLead={onDeleteLead}
          onSwitchToRadar={() => setActiveMainTab('radar')}
        />
      ) : (
        <>
          {/* SECTION 1: SEARCH & TIMETABLE SIGNAL SCANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-50 text-[#F25F22] font-bold border border-orange-200">
                <Search className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Single-Location Lead Discovery & Timetable Signal Scanner
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {activeRegionConfig
                ? activeRegionConfig.description
                : 'Scans independent boutique fitness studios, gyms, and wellness operators globally across North America, Europe, Asia, South America, and Oceania for timetable widgets.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1.5" title="Scans live websites to ensure domains exist and contain no 'Locations' tab">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Multi-Location & 'Locations' Tab Ban: Active
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              App Absence Discovery: {appStoreFilter === 'no_app_only' ? 'Active' : 'All'}
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Single Location Verified
            </span>
            <button
              onClick={() => setShowExclusionModal(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1"
            >
              <Ban className="w-3 h-3 text-rose-600" /> Exclude Memory ({exclusionList.length})
            </button>
          </div>
        </div>

        {/* PROMINENT GLOBAL REGION SWITCHER BAR */}
        <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Globe className="w-4 h-4 text-[#F25F22]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sales Territory:
              </span>
            </div>

            {/* Region Switcher Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'North America', label: 'North America', flag: '🌎', sub: 'US, Canada, Mexico' },
                { id: 'Europe', label: 'Europe', flag: '🇪🇺', sub: 'UK, Germany, France, Spain' },
                { id: 'Asia', label: 'Asia & UAE', flag: '🌏', sub: 'Singapore, Dubai, Tokyo, HK' },
                { id: 'South America', label: 'South America', flag: '🌎', sub: 'Brazil, Argentina, Colombia' },
                { id: 'Oceania', label: 'Oceania', flag: '🇦🇺', sub: 'Australia, New Zealand' },
                { id: 'All', label: 'All Territories', flag: '🌐', sub: 'Global Multi-Region' },
              ].map((opt) => {
                const isSelected = activeGlobalRegion === opt.id;
                const leadsCount = opt.id === 'All'
                  ? leads.filter(l => !l.addedToCadence).length
                  : leads.filter(l => !l.addedToCadence && l.globalRegion === opt.id).length;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveGlobalRegion(opt.id as GlobalRegion | 'All')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#F25F22] text-white ring-2 ring-orange-400/70 shadow-md font-extrabold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                    title={`${opt.label}: ${opt.sub}`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-slate-950 text-slate-400'
                    }`}>
                      {leadsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Territory Intelligence Context */}
          {activeRegionConfig ? (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>{activeRegionConfig.flag}</span>
                  <span>{activeRegionConfig.headline}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Target Competitors: <strong className="text-slate-200">{activeRegionConfig.defaultCompetitors.slice(0, 5).join(', ')}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Default Country: <strong className="text-emerald-400">{activeRegionConfig.defaultCountry}</strong></span>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
              <span className="font-bold text-white">🌐 Global Discovery Sweep Active:</span>
              <span className="text-slate-400">Searching all regions and international competitors with verified single-location discovery.</span>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F25F22]" /> Quick Territory & Software Sweeps:
            </span>
            {activePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  applyPreset(
                    preset.country as Country,
                    preset.region,
                    preset.suburb,
                    preset.category as FitnessCategory | 'All',
                    preset.software as CompetitorSoftware | 'All',
                    preset.appFilter,
                    preset.scanHostedOnly
                  )
                }
                className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
              >
                {preset.label}
              </button>
            ))}

            {(activeGlobalRegion === 'Oceania' || activeGlobalRegion === 'All') && (
              <button
                type="button"
                onClick={() => applyPreset('Australia', 'All', '', 'All', 'Clubworx', 'no_app_only', true)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 shadow-2xs ${
                  scanClubworxHosted
                    ? 'bg-purple-600 text-white border border-purple-700 font-bold'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
                title="Target Australian businesses hosted on app.clubworx.com/websites/ without an independent custom domain"
              >
                🌐 Clubworx Hosted Sites (app.clubworx.com)
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDiscoveryTips(!showDiscoveryTips)}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium shrink-0 flex items-center gap-1"
          >
            💡 {showDiscoveryTips ? 'Hide Discovery Tips' : 'How to find 100+ accounts'}
          </button>
        </div>

        {/* Discovery Tips Expansion Banner */}
        {showDiscoveryTips && (
          <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pro Tips to Discover Massive Lead Pools:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-amber-800">
              <li><strong>Multi-Region Footprint:</strong> Use the territory switcher above to instantly scan North America (Momence, PushPress, Wodify), Europe (Glofox, BSport, TeamUp), Asia (Vibefam, Momence), South America (Tecnofit, EVO), or Oceania (Clubworx, GymMaster).</li>
              <li><strong>Clubworx Hosted Sites:</strong> In Australia, many independent gyms rely on Clubworx&apos;s hosted template (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">site:app.clubworx.com/websites/</code>). Use the dedicated scanner to find these high-conversion targets.</li>
              <li><strong>App Store Audit Hook:</strong> Studios on competitor software without a custom branded app in Apple App Store or Google Play Store are prime candidates for Mindbody&apos;s white-label branded app.</li>
              <li><strong>Clear Suburb / Town:</strong> Leaving suburb blank scans the entire State, Province, or National metro footprint rather than just 1 neighborhood.</li>
              <li><strong>Set Modality to &quot;All Modalities&quot;:</strong> Software like Momence or PushPress is used across Pilates, CrossFit, BJJ, Yoga, and Boutique Strength studios.</li>
              <li><strong>Scan Limit:</strong> Increase Scan Limit to 20 or 30 leads to harvest dozens of new accounts per run.</li>
            </ul>
          </div>
        )}

        {/* Dynamic Multi-Region Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mt-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => {
                const c = e.target.value as Country;
                setCountry(c);
                setRegion('All');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-semibold"
            >
              {activeGlobalRegion === 'All' ? (
                <>
                  <option value="All">🌐 All Countries (Global)</option>
                  {Object.entries(GLOBAL_REGIONS).map(([regName, regConfig]) => (
                    <optgroup key={regName} label={`${regConfig.flag} ${regName}`}>
                      {regConfig.countries.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </>
              ) : (
                <>
                  {availableCountries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">State / Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All States / Provinces (Sweep)</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Suburb / Town (Optional)</label>
            <input
              type="text"
              placeholder="Leave blank for entire State/Country"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Fitness Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FitnessCategory | 'All')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All Modalities (Maximum Discovery)</option>
              <option value="Functional / CrossFit">Functional / CrossFit</option>
              <option value="Reformer Pilates">Reformer Pilates</option>
              <option value="Mat Pilates & Yoga">Mat Pilates & Yoga</option>
              <option value="Martial Arts & BJJ">Martial Arts & BJJ</option>
              <option value="24/7 Gym & Health Club">24/7 Gym & Health Club</option>
              <option value="Boutique Strength & HIIT">Boutique Strength & HIIT</option>
              <option value="Spa, Sauna & Recovery">Spa, Sauna & Recovery</option>
              <option value="Allied Health & Wellness">Allied Health & Wellness</option>
              <option value="Indoor Golf Simulators">Indoor Golf Simulators</option>
              <option value="Padel & Racket Clubs">Padel & Racket Clubs</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Booking Software</label>
            <select
              value={software}
              onChange={(e) => setSoftware(e.target.value as CompetitorSoftware | 'All')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-semibold text-purple-900"
            >
              <option value="All">All Competitors (Broad Scan)</option>
              {activeRegionConfig && (
                <optgroup label={`Top in ${activeRegionConfig.name}`}>
                  {activeRegionConfig.defaultCompetitors.map((sw) => (
                    <option key={sw} value={sw}>
                      {sw}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All Global Competitors">
                {[
                  'PushPress',
                  'Momence',
                  'Wodify',
                  'Zen Planner',
                  'Gymdesk',
                  'Glofox',
                  'Acuity / Squarespace',
                  'Mariana Tek',
                  'WellnessLiving',
                  'Vagaro',
                  'Clubworx',
                  'GymMaster',
                  'Hapana',
                  'BSport',
                  'TeamUp',
                  'Virtuagym',
                  'Eversports',
                  'BoxMate',
                  'Tecnofit',
                  'EVO / W12',
                  'CrossX',
                  'Vibefam',
                ]
                  .filter((sw) => !activeRegionConfig?.defaultCompetitors.includes(sw))
                  .map((sw) => (
                    <option key={sw} value={sw}>
                      {sw}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-indigo-600" /> App Store Filter
            </label>
            <select
              value={appStoreFilter}
              onChange={(e) => setAppStoreFilter(e.target.value as 'no_app_only' | 'generic_only' | 'all')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-semibold text-indigo-900"
            >
              <option value="no_app_only">📱 No App in Store (Prime Target)</option>
              <option value="generic_only">🌐 Web/Generic Portal Only</option>
              <option value="all">All App Statuses</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">Scan Limit:</span>
              {[5, 10, 15, 20, 25, 30].map((lim) => (
                <button
                  key={lim}
                  type="button"
                  onClick={() => setResultLimit(lim)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    resultLimit === lim
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lim}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDeepScan(!deepScan)}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1 ${
                deepScan
                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${deepScan ? 'text-purple-600' : 'text-slate-400'}`} />
              Deep Portal Dorks: {deepScan ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextVal = !scanClubworxHosted;
                setScanClubworxHosted(nextVal);
                if (nextVal && software !== 'Clubworx') {
                  setSoftware('Clubworx');
                }
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1.5 ${
                scanClubworxHosted
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
              title="Target businesses that use app.clubworx.com for hosting and design rather than having their own domain"
            >
              <Globe className={`w-3.5 h-3.5 ${scanClubworxHosted ? 'text-white' : 'text-purple-600'}`} />
              Clubworx Hosted Scanner: {scanClubworxHosted ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {radarLeads.length > 0 && onClearUncadencedLeads && (
              <button
                type="button"
                onClick={onClearUncadencedLeads}
                className="px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
                title="Archive current un-cadenced leads to exclusion memory"
              >
                Clear Radar
              </button>
            )}

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-xs bg-[#F25F22] hover:bg-[#D94E15] text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Websites & Portals for Signals...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Scan for Single-Site Leads ({resultLimit})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clubworx Hosted Mode Active Banner */}
        {scanClubworxHosted && (
          <div className="mt-3 p-3 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-purple-200 text-purple-800 shrink-0 font-bold">
                <Globe className="w-4 h-4" />
              </span>
              <div>
                <span className="font-extrabold text-purple-950">Targeting Portal-Only Clubworx Sites: </span>
                <span className="text-purple-900 font-medium">
                  Search will specifically dork for Australian fitness, martial arts, and gym businesses hosted on <code className="bg-purple-100 text-purple-950 px-1 py-0.5 rounded font-mono font-bold">site:app.clubworx.com/websites/</code> and <code className="bg-purple-100 text-purple-950 px-1 py-0.5 rounded font-mono font-bold">site:app.clubworx.com/portal/</code> that lack their own custom domain.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScanClubworxHosted(false)}
              className="text-[11px] text-purple-700 hover:text-purple-950 font-bold underline shrink-0 self-end sm:self-center"
            >
              Turn Off
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: SALESFORCE CROSS-REFERENCE STATUS & LIST CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Salesforce Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLeadListFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'all'
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Radar Leads</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-700 text-white font-bold">
                {radarLeads.length}
              </span>
            </button>

            <button
              onClick={() => setLeadListFilter('no_app')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'no_app'
                  ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-400/30'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>No App in Stores</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-800 text-white font-bold">
                {noAppLeadsCount}
              </span>
            </button>

            <button
              onClick={() => setLeadListFilter('clean')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'clean'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Not in SF</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-800 text-white font-bold">
                {cleanLeadsCount}
              </span>
            </button>

            <button
              onClick={() => setLeadListFilter('in_sf')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'in_sf'
                  ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-400/30'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>In SF</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-800 text-white font-bold">
                {inSfLeadsCount}
              </span>
            </button>

            <button
              onClick={() => setLeadListFilter('clubworx_hosted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'clubworx_hosted'
                  ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400/30'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
              title="Filter for businesses that use app.clubworx.com for website hosting and booking"
            >
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              <span>Clubworx Hosted</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-800 text-white font-bold">
                {clubworxHostedCount}
              </span>
            </button>

            <button
              onClick={() => setLeadListFilter('verified_links')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leadListFilter === 'verified_links'
                  ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-400/30'
                  : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
              }`}
              title="Filter for leads with verified reachable domains and confirmed no Locations tab"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Verified Single-Site</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-800 text-white font-bold">
                {verifiedSingleSiteCount}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenSalesforceModal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              title="Upload or paste Salesforce accounts list to cross-reference all leads"
            >
              <ShieldCheck className="w-4 h-4" />
              Cross-Reference Salesforce
            </button>

            <button
              onClick={onOpenExportModal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export CSV
            </button>

            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Search inside list */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by Business Name, Suburb, Booking Signal, Phone, Email, or Owner..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PURE LIST OF LEADS & CONTACT DETAILS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Verified Leads & Contact Details ({filteredLeads.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Single-site boutique fitness & booking operators in Australia and New Zealand
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-600">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No Leads Found In This View</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search query, or click "Scan for Single-Site Leads" above to find new leads.'
                : 'Click "Scan for Single-Site Leads" above or select a preset to discover fresh fitness businesses.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead) => {
              const isInSalesforce = lead.salesforceMatchStatus === 'Exists in Salesforce' || lead.salesforceMatchStatus === 'Fuzzy Match';

              return (
                <div
                  key={lead.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md ${
                    isInSalesforce
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Name, Badges, Salesforce Status */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">
                          {lead.businessName}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSoftwareBadgeColor(lead.currentSoftware)}`}>
                          {lead.currentSoftware}
                        </span>
                        {(lead.isHostedPortalWebsite || lead.website?.includes('app.clubworx.com') || lead.bookingUrl?.includes('app.clubworx.com')) && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-2xs">
                            <Globe className="w-3 h-3 text-purple-700" /> Clubworx Hosted Site
                          </span>
                        )}
                        {!lead.hasCustomBrandedApp ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                            <Smartphone className="w-3 h-3 text-indigo-600" /> No App in Stores
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-slate-500" /> Has Store App
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Single Location (No Locations Tab)
                        </span>
                        {lead.websiteVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1" title="Real-time DNS & reachability verified">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" /> {lead.websiteStatus || 'Live Domain'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> Operating Business
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {lead.address || `${lead.suburb}, ${lead.region} ${lead.country}`}
                        </span>

                        <button
                          onClick={() => handleVerifyOperation(lead)}
                          disabled={verifyingLeadId === lead.id}
                          className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors disabled:opacity-50"
                          title="Run real-time Google verification of operational status, website & store app presence"
                        >
                          {verifyingLeadId === lead.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" /> Verifying Live Status & Stores...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 text-indigo-600" /> Re-Verify Live Status
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Salesforce Status Badge & Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isInSalesforce ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                            Exists in Salesforce
                          </span>
                          <button
                            onClick={() => handleToggleSalesforceStatus(lead)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 font-semibold transition-colors"
                            title="Mark as not in Salesforce"
                          >
                            Mark Clean
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            Not in Salesforce (Fresh Lead)
                          </span>
                          <button
                            onClick={() => handleToggleSalesforceStatus(lead)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 font-semibold transition-colors"
                            title="Mark as duplicate in Salesforce"
                          >
                            Mark in SF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Feedback Banner */}
                  {verificationFeedback && verificationFeedback.id === lead.id && (
                    <div className="my-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{verificationFeedback.message}</span>
                    </div>
                  )}

                  {/* APP STORE AUDIT & CUSTOM MOBILE APP OPPORTUNITY BANNER */}
                  <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-start sm:items-center gap-2.5 text-indigo-950">
                      <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 font-bold">
                        <Smartphone className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-indigo-950">
                            {lead.hasCustomBrandedApp ? 'Mobile App Store Presence:' : 'App Store Audit & Pitch Hook:'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !lead.hasCustomBrandedApp
                              ? 'bg-indigo-200/90 text-indigo-950 border border-indigo-300'
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            {lead.appStoreStatus || (!lead.hasCustomBrandedApp ? 'No Branded App in Apple/Google' : 'Custom App Detected')}
                          </span>
                        </div>
                        <p className="text-indigo-900 font-medium mt-0.5">
                          {lead.customAppOpportunity || lead.appStoreNotes || `No standalone app under "${lead.businessName}" in Apple App Store or Google Play Store. Pitch Mindbody branded app to elevate client retention.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`https://www.google.com/search?q=site:apps.apple.com+${encodeURIComponent('"' + lead.businessName + '"')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-800 font-bold flex items-center gap-1 text-[11px] transition-colors shadow-2xs"
                        title="Search Apple App Store for dedicated app"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-600" />
                        iOS Check
                      </a>
                      <a
                        href={`https://www.google.com/search?q=site:play.google.com/store/apps+${encodeURIComponent('"' + lead.businessName + '"')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-800 font-bold flex items-center gap-1 text-[11px] transition-colors shadow-2xs"
                        title="Search Google Play Store for dedicated app"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-600" />
                        Android Check
                      </a>
                    </div>
                  </div>

                  {/* CLUBWORX HOSTED PORTAL BANNER */}
                  {(lead.isHostedPortalWebsite || lead.website?.includes('app.clubworx.com') || lead.bookingUrl?.includes('app.clubworx.com')) && (
                    <div className="my-2.5 p-3 rounded-xl bg-purple-50/90 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-start sm:items-center gap-2.5 text-purple-950">
                        <span className="p-1.5 rounded-lg bg-purple-200 text-purple-800 shrink-0 font-bold">
                          <Globe className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-purple-950">Portal-Hosted Web Presence:</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
                              app.clubworx.com Subdomain (No Independent Website)
                            </span>
                          </div>
                          <p className="text-purple-900 font-medium mt-0.5">
                            This studio has no custom domain—their web design and bookings are hosted on a generic Clubworx URL. Pitch Mindbody high-converting web widgets for a custom domain plus a standalone branded mobile app.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={lead.website || lead.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 text-[11px] transition-colors shadow-2xs"
                          title="Open hosted app.clubworx.com page"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Portal Site
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TIMETABLE & BOOKING SIGNAL BANNER */}
                  <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start sm:items-center gap-2 text-slate-800">
                      <span className="p-1.5 rounded-lg bg-orange-100 text-[#F25F22] shrink-0 font-bold">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">Live Booking / Timetable Signal: </span>
                        <span className="text-slate-700 font-medium">
                          {lead.timetableBookingSignal || `Live ${lead.currentSoftware} booking widget detected on official website schedule.`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          Website
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(lead.businessName + ' ' + (lead.suburb || '') + ' ' + lead.country)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-indigo-700 font-semibold flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <Globe className="w-3 h-3 text-indigo-500" />
                          Google Studio
                        </a>
                      )}
                      {lead.bookingUrl && (
                        <a
                          href={lead.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <Calendar className="w-3 h-3 text-purple-700" />
                          Timetable
                        </a>
                      )}
                      {(lead.website || lead.bookingUrl) && (
                        <button
                          type="button"
                          onClick={() => handleTestLink(lead)}
                          disabled={testingLinkId === lead.id}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50"
                          title="Run real-time probe to check domain DNS reachability and ensure there is no 'Locations' tab"
                        >
                          {testingLinkId === lead.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-teal-700" /> Testing URL & Single Site...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-teal-700" /> Test URL & Single Site
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* URL Reachability & Locations Tab Test Result Banner */}
                  {linkTestResults[lead.id] && (
                    <div
                      className={`my-2 p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in ${
                        !linkTestResults[lead.id].valid
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : linkTestResults[lead.id].isMultiLocation
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!linkTestResults[lead.id].valid ? (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : linkTestResults[lead.id].isMultiLocation ? (
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold">{linkTestResults[lead.id].statusText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {linkTestResults[lead.id].isMultiLocation && (
                          <button
                            type="button"
                            onClick={() => handleExcludeMultiLocation(lead)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Exclude Multi-Site
                          </button>
                        )}
                        {!linkTestResults[lead.id].valid && (
                          <button
                            type="button"
                            onClick={() => onDeleteLead(lead.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Discard Dead Lead
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VERIFIED CONTACT DETAILS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-1 text-xs">
                    {/* Decision Maker */}
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-[#F25F22]" /> Owner / Decision Maker
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                        {lead.decisionMakerName || 'Studio Owner'}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate font-medium">
                        {lead.decisionMakerTitle || 'Founder / Managing Director'}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" /> Direct Phone
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-emerald-700 hover:underline"
                        >
                          {lead.phone || '+61 2 9000 0000'}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lead.phone || '');
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold mt-0.5 block"
                      >
                        Copy Phone Number
                      </button>
                    </div>

                    {/* Email */}
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-600" /> Contact Email
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-blue-700 hover:underline"
                        >
                          {lead.email || 'info@example.com'}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lead.email || '');
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold mt-0.5 block"
                      >
                        Copy Email Address
                      </button>
                    </div>

                    {/* Social & Web */}
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-emerald-600" /> Website & Social
                        </span>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                          >
                            Visit <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(lead.businessName + ' ' + (lead.suburb || '') + ' ' + lead.country)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                          >
                            Search <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-indigo-600 hover:underline truncate block"
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(lead.businessName + ' ' + (lead.suburb || '') + ' ' + lead.country)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-indigo-600 hover:underline truncate block"
                          >
                            Find on Google Maps / Web
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate font-medium flex items-center gap-1.5 mt-0.5">
                        {lead.instagram ? (
                          <a
                            href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-700 hover:underline flex items-center gap-0.5"
                          >
                            <Instagram className="w-3 h-3" /> {lead.instagram}
                          </a>
                        ) : (
                          <span>{lead.suburb}, {lead.region}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Salesforce Match details if matched */}
                  {lead.salesforceMatchDetails && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{lead.salesforceMatchDetails}</span>
                      {lead.salesforceAccountOwner && (
                        <span className="font-bold ml-auto">Owner: {lead.salesforceAccountOwner}</span>
                      )}
                    </div>
                  )}

                  {/* Bottom Action Strip */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Discovered: <span className="font-medium text-slate-700">{lead.addedAt || '2026-08-16'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {lead.addedToCadence ? (
                        <button
                          onClick={() => handleToggleCadence(lead)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Currently active in SalesLoft Cadence (click to remove)"
                        >
                          <Check className="w-3.5 h-3.5" /> In Cadence
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleCadence(lead)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F25F22] hover:bg-[#D94E15] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Log as added to SalesLoft Cadence"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" /> + Add to Cadence
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyContact(lead)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1"
                      >
                        {copiedId === lead.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" /> Copy Details
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleExcludeMultiLocation(lead)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Flag as multi-location (or having a 'Locations' tab) and permanently exclude from all future radar scans"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Exclude Multi-Site</span>
                      </button>

                      <button
                        onClick={() => handleMarkNotViable(lead)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Mark as not viable (closed, franchise, competitor lock, or dead) and permanently remove from pipeline"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>Not Viable</span>
                      </button>

                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Dismiss lead from view"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* EXCLUSION / CLAUDE MEMORY MODAL */}
      {showExclusionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">Search Exclusion & Not Viable Memory</h3>
              </div>
              <button
                onClick={() => setShowExclusionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              These <span className="font-bold text-slate-900">{exclusionList.length} businesses</span> (including previously archived searches, &quot;Not Viable&quot; studios, and dismissed accounts) are permanently excluded from future AI search scans so they will never clutter your radar again.
            </p>

            <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 text-xs pr-1">
              {exclusionList.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No businesses currently in exclusion memory.
                </div>
              ) : (
                exclusionList.map((name, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <span className="font-semibold truncate">{name}</span>
                    <button
                      onClick={() => handleRemoveExclusionItem(name)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Remove from exclusion list"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleClearAllExclusions}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Clear All Exclusions
              </button>
              <button
                onClick={() => setShowExclusionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
