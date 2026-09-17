import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Tag,
  Edit,
  Trash2,
  Globe,
  DollarSign,
  Send,
  MoreVertical,
  X,
  List,
  Grid,
  Map
} from 'lucide-react';
import { Lead, LeadStatus, CompetitorSoftware, Country } from '../types';

interface LeadPipelineViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  onUpdateLeadNotes: (leadId: string, notes: string) => void;
  onDeleteLead: (leadId: string) => void;
  onSelectLeadForOutreach: (lead: Lead) => void;
}

export const LeadPipelineView: React.FC<LeadPipelineViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onUpdateLeadNotes,
  onDeleteLead,
  onSelectLeadForOutreach,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [softwareFilter, setSoftwareFilter] = useState<string>('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.suburb.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.decisionMakerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || l.leadStatus === statusFilter;
    const matchesSoftware = softwareFilter === 'All' || l.currentSoftware === softwareFilter;
    const matchesCountry = countryFilter === 'All' || l.country === countryFilter;
    const matchesRegion = regionFilter === 'All' || l.region === regionFilter || l.region?.toLowerCase().includes(regionFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesSoftware && matchesCountry && matchesRegion;
  });

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Fresh Prospect':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Enriched':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Salesforce (Duplicate)':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Contacted (Email)':
      case 'Contacted (Phone)':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Demo Scheduled':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Closed Won':
        return 'bg-emerald-600 text-white font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSoftwareBadge = (sw: CompetitorSoftware) => {
    switch (sw) {
      case 'Momence':
        return 'bg-purple-100 text-purple-800 font-bold';
      case 'Clubworx':
        return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'GymMaster':
        return 'bg-blue-100 text-blue-800 font-bold';
      case 'Hapana':
        return 'bg-orange-100 text-orange-800 font-bold';
      case 'Wodify':
        return 'bg-red-100 text-red-800 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filters Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F25F22]" />
              Territory Prospect Pipeline & Account Map
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Business Contact Enriched
              </span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 font-medium">
              Manage your active ANZ SMB single-site accounts, check contact fatigue, update deal stages, and trigger outreach.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#F25F22] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Studio Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#F25F22] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Pipeline Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-[#F25F22] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Territory Map
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search studio name, suburb, decision maker..."
              className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All Lead Statuses</option>
              <option value="Fresh Prospect">Fresh Prospect</option>
              <option value="Enriched">Enriched</option>
              <option value="In Salesforce (Duplicate)">In Salesforce (Duplicate)</option>
              <option value="Contacted (Email)">Contacted (Email)</option>
              <option value="Contacted (Phone)">Contacted (Phone)</option>
              <option value="Demo Scheduled">Demo Scheduled</option>
              <option value="Closed Won">Closed Won</option>
            </select>
          </div>

          <div>
            <select
              value={softwareFilter}
              onChange={(e) => setSoftwareFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All Competitor Software</option>
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

          <div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">Australia & New Zealand</option>
              <option value="Australia">🇦🇺 Australia Only</option>
              <option value="New Zealand">🇳🇿 New Zealand Only</option>
            </select>
          </div>

          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="All">All States & Regions</option>
              <option value="NSW">NSW</option>
              <option value="VIC">VIC</option>
              <option value="QLD">QLD</option>
              <option value="WA">WA</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="ACT">ACT</option>
              <option value="Auckland">Auckland</option>
              <option value="Wellington">Wellington</option>
              <option value="Canterbury">Canterbury</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#F25F22]/50 transition-all shadow-sm flex flex-col justify-between text-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(lead.leadStatus)}`}>
                      {lead.leadStatus}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{lead.businessName}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                      <MapPin className="w-3 h-3 text-[#F25F22]" />
                      {lead.suburb}, {lead.region} ({lead.country})
                    </p>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded ${getSoftwareBadge(lead.currentSoftware)}`}>
                    {lead.currentSoftware}
                  </span>
                </div>

                <div className="mt-3 text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#F25F22]" /> {lead.decisionMakerName} ({lead.decisionMakerTitle})
                  </p>
                  <p className="text-slate-800 flex items-center gap-1 font-semibold">
                    <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                  </p>
                  <p className="text-slate-800 flex items-center gap-1 font-semibold truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                  </p>
                </div>

                {/* Fatigue Score bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                    <span>Salesforce Contact Fatigue</span>
                    <span className={lead.fatigueScore >= 6 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                      Score: {lead.fatigueScore}/10 ({lead.contactAttemptsCount} Contacts)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        lead.fatigueScore >= 7
                          ? 'bg-rose-500'
                          : lead.fatigueScore >= 4
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${lead.fatigueScore * 10}%` }}
                    ></div>
                  </div>
                </div>

                {lead.suggestedAngle && (
                  <p className="mt-3 text-[11px] bg-orange-50 text-slate-800 p-2.5 rounded-xl border border-orange-200 font-medium line-clamp-2">
                    💡 <span className="font-bold text-[#D94E15]">Pitch Angle:</span> {lead.suggestedAngle}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedLead(lead);
                    setEditingNotes(lead.notes || '');
                  }}
                  className="text-xs text-slate-600 hover:text-[#F25F22] font-bold transition-colors underline"
                >
                  View Details & Notes
                </button>

                <button
                  onClick={() => onSelectLeadForOutreach(lead)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" /> Outreach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B192C] text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Business / Location</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Current Software</th>
                  <th className="px-4 py-3.5">Decision Maker</th>
                  <th className="px-4 py-3.5">Lead Status</th>
                  <th className="px-4 py-3.5">Fatigue Score</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 text-sm block">{lead.businessName}</span>
                      <span className="text-slate-600 text-[11px] flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-[#F25F22]" /> {lead.suburb}, {lead.region} ({lead.country})
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-700">{lead.category}</td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${getSoftwareBadge(lead.currentSoftware)}`}>
                        {lead.currentSoftware}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{lead.decisionMakerName}</span>
                      <span className="text-slate-600 text-[10px] font-medium">{lead.phone}</span>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={lead.leadStatus}
                        onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-[#F25F22]`}
                      >
                        <option value="Fresh Prospect">Fresh Prospect</option>
                        <option value="Enriched">Enriched</option>
                        <option value="In Salesforce (Duplicate)">In Salesforce (Duplicate)</option>
                        <option value="Contacted (Email)">Contacted (Email)</option>
                        <option value="Contacted (Phone)">Contacted (Phone)</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        <option value="Closed Won">Closed Won</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          lead.fatigueScore >= 7
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : lead.fatigueScore >= 4
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {lead.fatigueScore}/10
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectLeadForOutreach(lead)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3 h-3" /> Draft
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Territory Map View */}
      {viewMode === 'map' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Globe className="w-5 h-5 text-blue-600" />
                Australia & New Zealand Regional Territory Clusters
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Visual territory breakdown showing competitor software concentration by state and city region.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Momence</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Clubworx</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> GymMaster</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Hapana</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['NSW (Sydney Metro)', 'VIC (Melbourne Bayside)', 'QLD (Brisbane/Gold Coast)', 'WA (Perth Metro)', 'Auckland (NZ)', 'Wellington / Christchurch (NZ)'].map((regionName) => {
              const regionKey = regionName.split(' ')[0];
              const regionLeads = filteredLeads.filter(
                l => l.region.includes(regionKey) || regionName.includes(l.region)
              );

              return (
                <div key={regionName} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#F25F22]" /> {regionName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {regionLeads.length} Studios
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {regionLeads.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No active leads in this filter cluster.</p>
                    ) : (
                      regionLeads.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => setSelectedLead(l)}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#F25F22] cursor-pointer transition-colors flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{l.businessName}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{l.suburb} • {l.category}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSoftwareBadge(l.currentSoftware)}`}>
                            {l.currentSoftware}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedLead.leadStatus)}`}>
                  {selectedLead.leadStatus}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedLead.businessName}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#F25F22]" />
                  {selectedLead.address} ({selectedLead.country})
                </p>
              </div>

              <span className={`text-xs px-2.5 py-1 rounded font-bold ${getSoftwareBadge(selectedLead.currentSoftware)}`}>
                Using {selectedLead.currentSoftware}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Decision Maker</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedLead.decisionMakerName}</p>
                <p className="text-slate-600 font-medium">{selectedLead.decisionMakerTitle}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Contact Details</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedLead.phone}</p>
                <p className="text-slate-600 font-medium truncate">{selectedLead.email}</p>
                {selectedLead.instagram && <p className="text-purple-700 font-semibold">{selectedLead.instagram}</p>}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-slate-800">
                <span className="font-bold text-red-700 block">Known Competitor Weaknesses & Pain Points:</span>
                <ul className="list-disc list-inside text-slate-700 mt-1 space-y-0.5 font-medium">
                  {selectedLead.knownPainPoints?.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-slate-800">
                <span className="font-bold text-[#D94E15] block">AE Mindbody Pitch Angle:</span>
                <p className="mt-0.5 text-slate-700 font-medium">{selectedLead.suggestedAngle}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">AE Call & Email Notes:</label>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record call responses, gatekeeper details, or demo notes..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onUpdateLeadNotes(selectedLead.id, editingNotes);
                  setSelectedLead(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Save Notes & Close
              </button>

              <button
                onClick={() => {
                  const lead = selectedLead;
                  setSelectedLead(null);
                  onSelectLeadForOutreach(lead);
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" /> Launch Outreach Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
