import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  Calendar,
  Building2,
  Mail,
  Phone,
  Globe,
  Instagram,
  User,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Ban
} from 'lucide-react';
import { Lead, CompetitorSoftware, FitnessCategory } from '../types';
import { addSentToClaudeNames } from '../utils/claudeMemory';

interface SalesloftCadenceLogProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onSwitchToRadar: () => void;
}

export const SalesloftCadenceLog: React.FC<SalesloftCadenceLogProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  onSwitchToRadar,
}) => {
  const cadencedLeads = leads.filter((l) => l.addedToCadence);

  const [searchTerm, setSearchTerm] = useState('');
  const [softwareFilter, setSoftwareFilter] = useState<string>('All');
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [copiedAllEmails, setCopiedAllEmails] = useState(false);

  // Statistics calculation
  const totalCount = cadencedLeads.length;

  const softwareCounts = cadencedLeads.reduce((acc, lead) => {
    acc[lead.currentSoftware] = (acc[lead.currentSoftware] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = cadencedLeads.reduce((acc, lead) => {
    acc[lead.category] = (acc[lead.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cleanNetNewCount = cadencedLeads.filter(
    (l) => l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead'
  ).length;

  // Filtered list
  const filteredLeads = cadencedLeads.filter((lead) => {
    const matchesSearch =
      searchTerm === '' ||
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.decisionMakerName && lead.decisionMakerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.suburb && lead.suburb.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.region && lead.region.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSoftware = softwareFilter === 'All' || lead.currentSoftware === softwareFilter;

    return matchesSearch && matchesSoftware;
  });

  const handleRemoveFromCadence = (lead: Lead) => {
    onUpdateLead({
      ...lead,
      addedToCadence: false,
      cadenceAddedAt: undefined,
    });
  };

  const handleMarkNotViable = (lead: Lead) => {
    addSentToClaudeNames([lead.businessName]);
    onDeleteLead(lead.id);
  };

  const handleCopyLeadDetails = (lead: Lead) => {
    const text = `Business: ${lead.businessName}
Contact: ${lead.decisionMakerName} (${lead.decisionMakerTitle})
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Website: ${lead.website || 'N/A'}
Current Software: ${lead.currentSoftware}
Mobile App Status: ${lead.appStoreStatus || 'No Branded App in Stores (Target)'}
App Opportunity Hook: ${lead.customAppOpportunity || 'Pitch custom white-label mobile app'}
Location: ${lead.suburb ? `${lead.suburb}, ` : ''}${lead.region}, ${lead.country}
Signal: ${lead.timetableBookingSignal || 'N/A'}
Suggested Pitch Angle: ${lead.suggestedAngle || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopiedLeadId(lead.id);
    setTimeout(() => setCopiedLeadId(null), 2500);
  };

  const handleCopyAllEmails = () => {
    const emails = cadencedLeads
      .map((l) => l.email)
      .filter((e): e is string => Boolean(e && e.includes('@')))
      .join(', ');

    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setCopiedAllEmails(true);
    setTimeout(() => setCopiedAllEmails(false), 2500);
  };

  const handleExportCadenceCSV = () => {
    if (cadencedLeads.length === 0) return;

    const headers = [
      'First Name',
      'Last Name',
      'Title',
      'Company Name',
      'Work Email',
      'Phone',
      'Website',
      'Current Software',
      'Category',
      'Has Custom Store App',
      'App Store Status',
      'App Store Notes',
      'White-Label App Opportunity Hook',
      'Suburb',
      'State / Region',
      'Country',
      'Timetable Booking Signal',
      'Salesforce Status',
      'Cadence Date Added',
      'SalesLoft Pitch Angle',
    ];

    const rows = cadencedLeads.map((l) => {
      const parts = (l.decisionMakerName || 'Owner').split(' ');
      const firstName = parts[0] || 'Owner';
      const lastName = parts.slice(1).join(' ') || '';

      return [
        `"${firstName.replace(/"/g, '""')}"`,
        `"${lastName.replace(/"/g, '""')}"`,
        `"${(l.decisionMakerTitle || '').replace(/"/g, '""')}"`,
        `"${(l.businessName || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.website || '').replace(/"/g, '""')}"`,
        `"${(l.currentSoftware || '').replace(/"/g, '""')}"`,
        `"${(l.category || '').replace(/"/g, '""')}"`,
        `"${l.hasCustomBrandedApp ? 'Yes' : 'No'}"`,
        `"${(l.appStoreStatus || 'No Branded App (Target)').replace(/"/g, '""')}"`,
        `"${(l.appStoreNotes || '').replace(/"/g, '""')}"`,
        `"${(l.customAppOpportunity || '').replace(/"/g, '""')}"`,
        `"${(l.suburb || '').replace(/"/g, '""')}"`,
        `"${(l.region || '').replace(/"/g, '""')}"`,
        `"${(l.country || '').replace(/"/g, '""')}"`,
        `"${(l.timetableBookingSignal || '').replace(/"/g, '""')}"`,
        `"${(l.salesforceMatchStatus || '').replace(/"/g, '""')}"`,
        `"${(l.cadenceAddedAt || l.addedAt || '').replace(/"/g, '""')}"`,
        `"${(l.suggestedAngle || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesloft_cadence_leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER METRICS DASHBOARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-500/20 text-[#F25F22] border border-orange-500/30">
                <Zap className="w-5 h-5 fill-[#F25F22]" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                SalesLoft Cadence Tracker
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Outreach Log
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Track exactly how many high-intent competitor leads you have pushed into SalesLoft cadences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCadenceCSV}
              disabled={totalCount === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F25F22] hover:bg-[#D94E15] disabled:opacity-40 text-white transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Cadence CSV
            </button>
            <button
              onClick={handleCopyAllEmails}
              disabled={totalCount === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {copiedAllEmails ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Emails Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" /> Copy All Emails
                </>
              )}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {/* Metric 1: Total Leads */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Total Added to Cadence
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalCount}</span>
              <span className="text-xs text-emerald-400 font-semibold">Leads Activated</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sourced through radar</p>
          </div>

          {/* Metric 2: Clean Net-New */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Clean / Not in Salesforce
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{cleanNetNewCount}</span>
              <span className="text-xs text-slate-400">
                {totalCount > 0 ? `(${Math.round((cleanNetNewCount / totalCount) * 100)}%)` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero CRM ownership conflict</p>
          </div>

          {/* Metric 3: Top Competitor Replaced */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Competitor Targets
            </span>
            <div className="text-sm font-bold text-slate-200 truncate mt-1">
              {Object.keys(softwareCounts).length > 0 ? (
                Object.entries(softwareCounts)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .slice(0, 2)
                  .map(([name, count]) => `${name} (${count})`)
                  .join(', ')
              ) : (
                <span className="text-slate-500 font-normal">None yet</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ready for switcher angles</p>
          </div>

          {/* Metric 4: Direct Contacts */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Contact Coverage
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300">
                {cadencedLeads.filter((l) => l.email || l.phone).length}
              </span>
              <span className="text-xs text-slate-400">Direct Info</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Email or Phone ready</p>
          </div>
        </div>

        {/* COMPETITOR BREAKDOWN PILLS */}
        {Object.keys(softwareCounts).length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">Breakdown by Software:</span>
            {Object.entries(softwareCounts).map(([sw, count]) => (
              <span
                key={sw}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                {sw}: <span className="text-orange-400">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CADENCE LEADS LIST CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">
              Cadenced Leads ({filteredLeads.length})
            </h3>
            {filteredLeads.length !== totalCount && (
              <span className="text-xs text-slate-500 font-medium">(filtered from {totalCount})</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cadenced leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 w-48 sm:w-60"
              />
            </div>

            {/* Software filter */}
            <select
              value={softwareFilter}
              onChange={(e) => setSoftwareFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Competitors</option>
              {Object.keys(softwareCounts).map((sw) => (
                <option key={sw} value={sw}>
                  {sw} ({softwareCounts[sw]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CADENCED LEADS LIST */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {totalCount === 0 ? (
              <div className="space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F25F22] flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No leads added to SalesLoft Cadence yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Go to the <strong>Prospect Radar</strong> tab and click{' '}
                  <span className="font-semibold text-orange-600">&quot;+ Add to SalesLoft Cadence&quot;</span> on any
                  lead you push into outreach. They will automatically be logged here with metrics.
                </p>
                <button
                  onClick={onSwitchToRadar}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F25F22] hover:bg-[#D94E15] text-white transition-colors shadow-sm inline-flex items-center gap-1.5 mt-2"
                >
                  Go to Prospect Radar <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">No leads match your filter criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSoftwareFilter('All');
                  }}
                  className="text-xs text-orange-600 hover:underline font-bold"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
              >
                {/* Top Lead Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{lead.businessName}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#F25F22] border border-orange-200">
                          {lead.currentSoftware}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.suburb ? `${lead.suburb}, ` : ''}
                        {lead.region}, {lead.country} • <span className="font-medium text-slate-600">{lead.category}</span>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      In Cadence
                    </span>
                  </div>

                  {/* Decision Maker & Contact Bar */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-800 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lead.decisionMakerName}</span>
                        <span className="text-slate-400 font-normal">({lead.decisionMakerTitle})</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-blue-600 flex items-center gap-1 truncate max-w-[200px]"
                          title={lead.email}
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-300" /> No email
                        </span>
                      )}

                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : null}

                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-orange-600 flex items-center gap-1 text-slate-500 truncate max-w-[150px]"
                        >
                          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Booking widget / Timetable signal */}
                  {lead.timetableBookingSignal && (
                    <div className="text-[11px] text-slate-600 bg-orange-50/50 border border-orange-100 rounded-lg p-2 flex items-start gap-1.5">
                      <span className="font-bold text-orange-800 shrink-0">Signal:</span>
                      <span className="truncate">{lead.timetableBookingSignal}</span>
                    </div>
                  )}

                  {/* App Store Absence / Custom App Opportunity Hook */}
                  <div className="text-[11px] bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 text-emerald-950 space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1">
                        📱 {lead.appStoreStatus || 'No Branded App in Stores (Target)'}
                      </span>
                      <a
                        href={`https://www.google.com/search?q=site:apps.apple.com+"${encodeURIComponent(lead.businessName)}"`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                      >
                        Check Stores <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      {lead.customAppOpportunity || `Pitch custom branded iOS/Android mobile app to replace generic ${lead.currentSoftware} web booking.`}
                    </p>
                  </div>

                  {/* Pitch Angle Hook */}
                  {lead.suggestedAngle && (
                    <div className="text-[11px] text-slate-700 bg-indigo-50/60 border border-indigo-100 rounded-lg p-2">
                      <span className="font-bold text-indigo-900">Battlecard Angle: </span>
                      <span>{lead.suggestedAngle}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Added: <strong className="text-slate-600">{lead.cadenceAddedAt || lead.addedAt || 'Today'}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLeadDetails(lead)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1 text-xs"
                      title="Copy full details for SalesLoft"
                    >
                      {copiedLeadId === lead.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" /> Copy Info
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveFromCadence(lead)}
                      className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 font-semibold transition-colors flex items-center gap-1 text-xs"
                      title="Remove from Cadence Log (keeps in Radar)"
                    >
                      <Trash2 className="w-3 h-3 text-slate-400" /> Remove
                    </button>

                    <button
                      onClick={() => handleMarkNotViable(lead)}
                      className="px-2 py-1 rounded-lg text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 font-semibold transition-colors flex items-center gap-1 text-xs shadow-2xs"
                      title="Mark as Not Viable and permanently remove from all lists & future scans"
                    >
                      <Ban className="w-3 h-3 text-rose-600" /> Not Viable
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
