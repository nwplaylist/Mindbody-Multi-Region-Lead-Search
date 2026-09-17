import React from 'react';
import { Search, ShieldAlert, FileSpreadsheet, MapPin, Sparkles, Building2, ShieldCheck, Plus, CheckCircle2, Zap, Globe } from 'lucide-react';
import { Lead, GlobalRegion } from '../types';
import { GLOBAL_REGIONS } from '../data/regionsData';

interface HeaderProps {
  leads: Lead[];
  currentGlobalRegion: GlobalRegion | 'All';
  onSelectGlobalRegion: (region: GlobalRegion | 'All') => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenSalesforceModal: () => void;
}

const REGION_OPTIONS: { id: GlobalRegion | 'All'; label: string; flag: string; sub: string }[] = [
  { id: 'North America', label: 'North America', flag: '🌎', sub: 'US, Canada, Mexico' },
  { id: 'Europe', label: 'Europe', flag: '🇪🇺', sub: 'UK, Germany, France, Spain' },
  { id: 'Asia', label: 'Asia & UAE', flag: '🌏', sub: 'Singapore, Dubai, Tokyo, HK' },
  { id: 'South America', label: 'South America', flag: '🌎', sub: 'Brazil, Argentina, Colombia' },
  { id: 'Oceania', label: 'Oceania', flag: '🇦🇺', sub: 'Australia, New Zealand' },
  { id: 'All', label: 'All Territories', flag: '🌐', sub: 'Global Multi-Region' },
];

export const Header: React.FC<HeaderProps> = ({
  leads,
  currentGlobalRegion,
  onSelectGlobalRegion,
  onOpenAddModal,
  onOpenExportModal,
  onOpenSalesforceModal,
}) => {
  const cleanCount = leads.filter(l => l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead').length;
  const inSfCount = leads.filter(l => l.salesforceMatchStatus === 'Exists in Salesforce' || l.salesforceMatchStatus === 'Fuzzy Match').length;
  const cadencedCount = leads.filter(l => l.addedToCadence).length;

  const activeRegionConfig = currentGlobalRegion !== 'All' ? GLOBAL_REGIONS[currentGlobalRegion] : null;

  return (
    <header className="bg-[#0B192C] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Identity & Scope */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F25F22] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/25 shrink-0">
            M
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Mindbody <span className="text-[#F25F22] font-semibold">Global Lead Radar</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {activeRegionConfig ? `${activeRegionConfig.flag} ${activeRegionConfig.name} • Single-Site Focus` : '🌐 Global Multi-Region'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Web timetable scanner • SalesLoft cadence attribution • Verified direct contact details
            </p>
          </div>
        </div>

        {/* Live Stat Badges & Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Cadenced stats */}
          <div className="bg-orange-950/80 border border-orange-600/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span className="text-orange-200">In SalesLoft Cadence:</span>
            <span className="font-extrabold text-white text-xs bg-[#F25F22] px-2 py-0.5 rounded-md">
              {cadencedCount}
            </span>
          </div>

          {/* Clean stats */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Clean / Not in SF:</span>
            <span className="font-bold text-emerald-400">{cleanCount}</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">In SF:</span>
            <span className="font-bold text-amber-400">{inSfCount}</span>
          </div>

          {/* Action buttons */}
          <button
            onClick={onOpenSalesforceModal}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Cross-Ref SF
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#F25F22] hover:bg-[#D94E15] text-white transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Global Territory Switcher Bar */}
      <div className="bg-[#07111E] border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-4 h-4 text-[#F25F22]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sales Territory:
            </span>
          </div>

          {/* Territory Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {REGION_OPTIONS.map((opt) => {
              const isSelected = currentGlobalRegion === opt.id;
              const leadsInThisRegion = opt.id === 'All'
                ? leads.length
                : leads.filter(l => l.globalRegion === opt.id).length;

              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectGlobalRegion(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs ${
                    isSelected
                      ? 'bg-[#F25F22] text-white ring-2 ring-orange-400/50 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                  title={`${opt.label}: ${opt.sub}`}
                >
                  <span className="text-sm">{opt.flag}</span>
                  <span>{opt.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-black/25 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {leadsInThisRegion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
