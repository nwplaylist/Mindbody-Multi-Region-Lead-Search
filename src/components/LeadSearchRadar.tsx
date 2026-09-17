import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, Plus, Check, ExternalLink, ShieldAlert, Zap, Filter, Phone, Mail, X, Trash2, CheckCircle2 } from 'lucide-react';
import { Lead, Country, FitnessCategory, CompetitorSoftware } from '../types';
import {
  getSentToClaudeNames,
  addSentToClaudeNames,
  removeSentToClaudeName,
  clearSentToClaudeMemory,
} from '../utils/claudeMemory';
import { enrichContactDetails } from '../utils/contactEnrichment';

interface LeadSearchRadarProps {
  onAddLeadsToPipeline: (leads: Lead[]) => void;
  existingLeadIds: string[];
  onSelectLeadForOutreach: (lead: Lead) => void;
}

export const LeadSearchRadar: React.FC<LeadSearchRadarProps> = ({
  onAddLeadsToPipeline,
  existingLeadIds,
  onSelectLeadForOutreach,
}) => {
  const [country, setCountry] = useState<Country>('Australia');
  const [region, setRegion] = useState<string>('All');
  const [suburb, setSuburb] = useState<string>('');
  const [category, setCategory] = useState<FitnessCategory | 'All'>('Reformer Pilates');
  const [software, setSoftware] = useState<CompetitorSoftware | 'All'>('Momence');
  const [resultLimit, setResultLimit] = useState<number>(15);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [addedLeadIds, setAddedLeadIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExclusionModal, setShowExclusionModal] = useState(false);

  // Store business names sent to Claude in state
  const [sentToClaudeNames, setSentToClaudeNames] = useState<string[]>(getSentToClaudeNames);

  useEffect(() => {
    const handleSync = () => {
      setSentToClaudeNames(getSentToClaudeNames());
    };
    window.addEventListener('claudeMemoryUpdated', handleSync);
    return () => window.removeEventListener('claudeMemoryUpdated', handleSync);
  }, []);

  const handleSearch = async (append = false) => {
    setIsSearching(true);
    setErrorMessage(null);

    // Compute exclude list strictly from accounts sent to Claude & current search session results
    const currentResultsNames = searchResults.map(l => l.businessName);
    const excludeList = Array.from(new Set([...sentToClaudeNames, ...currentResultsNames]));

    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          region: region === 'All' ? undefined : region,
          suburb: suburb.trim() ? suburb : undefined,
          category: category === 'All' ? undefined : category,
          competitorSoftware: software === 'All' ? undefined : software,
          limit: resultLimit,
          excludeNames: excludeList,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.leads)) {
        let returnedLeads: Lead[] = data.leads.map(enrichContactDetails);

        // Guard: If specific competitor software is selected, enforce normalized software match on client side
        if (software !== 'All') {
          const targetNorm = software.toLowerCase().replace(/[\s\-_]/g, '');
          returnedLeads = returnedLeads.filter((l: Lead) => {
            const swNorm = (l.currentSoftware || '').toLowerCase().replace(/[\s\-_]/g, '');
            return swNorm.includes(targetNorm) || targetNorm.includes(swNorm);
          });
        }

        if (append) {
          // Merge avoiding duplicate business names
          const existingNames = new Set(searchResults.map(l => l.businessName.toLowerCase()));
          const uniqueNewLeads = returnedLeads.filter((l: Lead) => !existingNames.has(l.businessName.toLowerCase()));
          setSearchResults(prev => [...prev, ...uniqueNewLeads]);
        } else {
          setSearchResults(returnedLeads);
        }
        setSearchExecuted(true);
      } else {
        setErrorMessage(data.error || 'Failed to fetch lead radar results.');
      }
    } catch (err: any) {
      setErrorMessage('Network error running Lead Radar search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSentToClaude = (businessName: string) => {
    const exists = sentToClaudeNames.some(n => n.toLowerCase() === businessName.toLowerCase());
    if (exists) {
      removeSentToClaudeName(businessName);
    } else {
      addSentToClaudeNames([businessName]);
    }
  };

  const handleRemoveExcluded = (name: string) => {
    removeSentToClaudeName(name);
  };

  const handleClearAllExcluded = () => {
    clearSentToClaudeMemory();
  };

  const applyPreset = (
    presetCountry: Country,
    presetRegion: string,
    presetSuburb: string,
    presetCategory: FitnessCategory,
    presetSoftware: CompetitorSoftware
  ) => {
    setCountry(presetCountry);
    setRegion(presetRegion);
    setSuburb(presetSuburb);
    setCategory(presetCategory);
    setSoftware(presetSoftware);
  };

  const handleAddSingleLead = (lead: Lead) => {
    onAddLeadsToPipeline([lead]);
    setAddedLeadIds(prev => new Set(prev).add(lead.id));
  };

  const handleAddAllLeads = () => {
    const newLeads = searchResults.filter(l => !addedLeadIds.has(l.id));
    if (newLeads.length > 0) {
      onAddLeadsToPipeline(newLeads);
      const newAdded = new Set(addedLeadIds);
      newLeads.forEach(l => newAdded.add(l.id));
      setAddedLeadIds(newAdded);
    }
  };

  const getSoftwareBadgeColor = (sw: CompetitorSoftware) => {
    switch (sw) {
      case 'Momence':
        return 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
      case 'PushPress':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'Clubworx':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      case 'GymMaster':
        return 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
      case 'Hapana':
        return 'bg-orange-100 text-[#D94E15] border-orange-200 font-bold';
      case 'Wodify':
        return 'bg-red-100 text-red-800 border-red-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Header Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-50 text-[#F25F22] font-bold border border-orange-200">
                <Search className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">AI Lead Discovery Radar (AU & NZ)</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Find fresh single-site SMB fitness & wellness studios using competitor platforms (Momence, Clubworx, GymMaster, Hapana) across Australia and New Zealand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Excludes {sentToClaudeNames.length} Accounts Sent to Claude
            </span>
            <button
              onClick={() => setShowExclusionModal(true)}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="View or edit business names excluded from future AI searches"
            >
              Manage Exclude Memory ({sentToClaudeNames.length})
            </button>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 text-[#D94E15] border border-orange-200 flex items-center gap-1.5">
              Single-Site SMB Only
            </span>
          </div>
        </div>

        {/* Quick Presets for AEs */}
        <div className="pt-4 pb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#F25F22]" /> High-Yield ANZ AE Single-Site Presets:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('Australia', 'WA', 'Subiaco & Perth', 'Functional / CrossFit', 'PushPress')}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
            >
              🇦🇺 Perth PushPress Gyms & Dojos
            </button>
            <button
              onClick={() => applyPreset('Australia', 'NSW', 'Surry Hills & Manly', 'Reformer Pilates', 'Momence')}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
            >
              🇦🇺 Sydney Single-Site Momence Pilates
            </button>
            <button
              onClick={() => applyPreset('Australia', 'QLD', 'Fortitude Valley & Burleigh', 'Martial Arts & BJJ', 'Clubworx')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
            >
              🇦🇺 QLD Clubworx Dojos & Gyms
            </button>
            <button
              onClick={() => applyPreset('New Zealand', 'Auckland', 'Ponsonby & Newmarket', '24/7 Gym & Health Club', 'GymMaster')}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
            >
              🇳🇿 Auckland GymMaster 24/7 Gyms
            </button>
            <button
              onClick={() => applyPreset('Australia', 'VIC', 'South Yarra & Richmond', 'Boutique Strength & HIIT', 'Hapana')}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 text-[#D94E15] border border-orange-200 hover:bg-orange-100 transition-colors font-semibold flex items-center gap-1 shadow-2xs"
            >
              🇦🇺 Melbourne Hapana Boutique Studios
            </button>
          </div>
        </div>

        {/* Filter Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Target Country</label>
            <select
              value={country}
              onChange={(e) => {
                const c = e.target.value as Country;
                setCountry(c);
                setRegion('All');
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="Australia">🇦🇺 Australia</option>
              <option value="New Zealand">🇳🇿 New Zealand</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">State / Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All States & Regions</option>
              {country === 'Australia' ? (
                <>
                  <option value="NSW">NSW (Sydney / Newcastle)</option>
                  <option value="VIC">VIC (Melbourne / Geelong)</option>
                  <option value="QLD">QLD (Brisbane / Gold Coast)</option>
                  <option value="WA">WA (Perth / Fremantle)</option>
                  <option value="SA">SA (Adelaide)</option>
                  <option value="TAS">TAS (Hobart / Launceston)</option>
                  <option value="ACT">ACT (Canberra)</option>
                </>
              ) : (
                <>
                  <option value="Auckland">Auckland Region</option>
                  <option value="Wellington">Wellington Region</option>
                  <option value="Canterbury/Christchurch">Canterbury / Christchurch</option>
                  <option value="Waikato">Waikato / Hamilton</option>
                  <option value="Bay of Plenty">Bay of Plenty / Tauranga</option>
                  <option value="Otago">Otago / Queenstown</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Suburb / City</label>
            <input
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. Surry Hills, Ponsonby"
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Studio Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All Categories & Activities</option>
              <option value="Reformer Pilates">Reformer Pilates</option>
              <option value="Mat Pilates & Yoga">Mat Pilates & Yoga</option>
              <option value="Indoor Golf Simulators">Indoor Golf Simulators</option>
              <option value="Padel & Racket Clubs">Padel & Racket Clubs</option>
              <option value="Fitness-Adjacent & Activity Venues">Fitness-Adjacent & Activity Venues</option>
              <option value="Spa, Sauna & Recovery">Spa, Sauna & Recovery</option>
              <option value="Martial Arts & BJJ">Martial Arts & BJJ</option>
              <option value="Functional / CrossFit">Functional / CrossFit</option>
              <option value="24/7 Gym & Health Club">24/7 Gym & Health Club</option>
              <option value="Boutique Strength & HIIT">Boutique Strength & HIIT</option>
              <option value="Allied Health & Wellness">Allied Health & Wellness</option>
              <option value="Dance & Rhythm Cycle">Dance & Rhythm Cycle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Competitor Software</label>
            <select
              value={software}
              onChange={(e) => setSoftware(e.target.value as any)}
              className="w-full text-xs font-bold bg-orange-50/70 border border-orange-200 rounded-lg px-3 py-2 text-[#D94E15] focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">ANY Booking / Membership Software (Excl. Mindbody)</option>
              <option value="Xoda">Xoda</option>
              <option value="PushPress">PushPress</option>
              <option value="Momence">Momence</option>
              <option value="Clubworx">Clubworx</option>
              <option value="GymMaster">GymMaster</option>
              <option value="Hapana">Hapana</option>
              <option value="Acuity / Squarespace">Acuity / Squarespace</option>
              <option value="WellnessLiving">WellnessLiving</option>
              <option value="Glofox">Glofox</option>
              <option value="Vagaro">Vagaro</option>
              <option value="Wodify">Wodify</option>
              <option value="Gymdesk">Gymdesk</option>
              <option value="Zen Planner">Zen Planner</option>
              <option value="Reserva / Other Booking System">Reserva / Other Booking System</option>
              <option value="No Software / Manual">No Software / Manual</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-800">Results Per Scan:</label>
              <select
                value={resultLimit}
                onChange={(e) => setResultLimit(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#F25F22]"
              >
                <option value={10}>10 real prospects</option>
                <option value={15}>15 real prospects</option>
                <option value={20}>20 real prospects</option>
              </select>
            </div>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline text-slate-600">Filtering exclusively for <strong className="text-[#D94E15]">Single-Site SMB Locations</strong>.</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-[10px]">
              🚫 Mindbody Users Strictly Excluded
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {searchResults.length > 0 && (
              <button
                onClick={() => handleSearch(true)}
                disabled={isSearching}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Run search again and append unique prospects to existing list"
              >
                <Plus className="w-3.5 h-3.5 text-[#F25F22]" /> Append More Results ({searchResults.length} loaded)
              </button>
            )}

            <button
              onClick={() => handleSearch(false)}
              disabled={isSearching}
              className="px-6 py-2.5 bg-[#F25F22] hover:bg-[#D94E15] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Scanning AU/NZ Real Studios...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run Fresh Search ({resultLimit})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Results Header */}
      {searchExecuted && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0B192C] text-white px-5 py-3.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-sm font-bold">
                Radar Found {searchResults.length} High-Potential Leads
              </h3>
              <span className="text-xs text-slate-300">
                ({country} • {region} • {software === 'All' ? 'Competitors' : software})
              </span>
            </div>

            <button
              onClick={handleAddAllLeads}
              className="text-xs px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-white transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Import All to Territory Pipeline
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {searchResults.map((lead) => {
              const isAdded = addedLeadIds.has(lead.id) || existingLeadIds.includes(lead.id);

              return (
                <div
                  key={lead.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#F25F22]/50 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">{lead.businessName}</h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getSoftwareBadgeColor(
                              lead.currentSoftware
                            )}`}
                          >
                            Using {lead.currentSoftware}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#F25F22]" />
                          {lead.suburb}, {lead.region} ({lead.country})
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700">{lead.category}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                          EST. AUD ${lead.estimatedMonthlyRevenueAUD?.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>

                    {/* Contact & Decision Maker */}
                    <div className="mt-3 py-2.5 px-3.5 bg-slate-50 rounded-xl text-xs grid grid-cols-2 gap-2 border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Decision Maker</span>
                        <span className="font-bold text-slate-900">{lead.decisionMakerName}</span>
                        <span className="text-slate-600 text-[11px] block font-medium">{lead.decisionMakerTitle}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Contact Info</span>
                        <p className="text-slate-800 flex items-center gap-1 text-[11px] font-semibold truncate">
                          <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                        </p>
                        <p className="text-slate-800 flex items-center gap-1 text-[11px] font-semibold truncate">
                          <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                        </p>
                      </div>
                    </div>

                    {/* Pain points & switching triggers */}
                    <div className="mt-3 space-y-2">
                      <div className="text-xs">
                        <span className="font-bold text-red-600">Current Pain Points: </span>
                        <ul className="list-disc list-inside text-slate-700 text-[11px] mt-0.5 space-y-0.5 font-medium">
                          {lead.knownPainPoints?.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-xs bg-orange-50/80 p-2.5 rounded-xl border border-orange-200 text-slate-800">
                        <span className="font-bold text-[#D94E15]">Mindbody Pitch Hook: </span>
                        <span className="text-[11px] text-slate-700 font-medium">{lead.suggestedAngle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:text-[#F25F22] flex items-center gap-1 font-semibold transition-colors"
                      >
                        Website <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleToggleSentToClaude(lead.businessName)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          sentToClaudeNames.some(n => n.toLowerCase() === lead.businessName.toLowerCase())
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={
                          sentToClaudeNames.some(n => n.toLowerCase() === lead.businessName.toLowerCase())
                            ? 'Excluded from future AI searches (Sent to Claude)'
                            : 'Mark sent to Claude so future searches exclude this account'
                        }
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        {sentToClaudeNames.some(n => n.toLowerCase() === lead.businessName.toLowerCase())
                          ? 'Sent to Claude'
                          : 'Mark Sent to Claude'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectLeadForOutreach(lead)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-[#F25F22]" /> Draft Cold Email
                      </button>

                      <button
                        onClick={() => handleAddSingleLead(lead)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> In Pipeline
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add to Pipeline
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exclusion Manager Modal */}
      {showExclusionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col text-slate-900">
            <button
              onClick={() => setShowExclusionModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Accounts Sent to Claude (Exclusion Memory)</h3>
                <p className="text-xs text-slate-600 font-medium">
                  {sentToClaudeNames.length} studio business names will be automatically excluded from future AI search scans.
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
              {sentToClaudeNames.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-medium">
                  No accounts marked as sent to Claude yet. Export leads to Claude or copy CSVs to automatically build this memory list!
                </div>
              ) : (
                sentToClaudeNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <span className="text-slate-800">{name}</span>
                    <button
                      onClick={() => handleRemoveExcluded(name)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Remove from exclusion list so AI search can find this business again"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {sentToClaudeNames.length > 0 && (
                <button
                  onClick={handleClearAllExcluded}
                  className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  Clear Entire Exclusion Memory
                </button>
              )}
              <button
                onClick={() => setShowExclusionModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors ml-auto shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
