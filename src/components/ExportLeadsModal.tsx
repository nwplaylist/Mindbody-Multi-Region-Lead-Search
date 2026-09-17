import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check, X, ShieldCheck, Filter } from 'lucide-react';
import { Lead } from '../types';

interface ExportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

export const ExportLeadsModal: React.FC<ExportLeadsModalProps> = ({
  isOpen,
  onClose,
  leads,
}) => {
  const [exportFilter, setExportFilter] = useState<'all' | 'clean_only' | 'sf_only'>('clean_only');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredLeads = leads.filter((l) => {
    if (exportFilter === 'clean_only') return l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead';
    if (exportFilter === 'sf_only') return l.salesforceMatchStatus === 'Exists in Salesforce' || l.salesforceMatchStatus === 'Fuzzy Match';
    return true;
  });

  const generateCSV = (): string => {
    const headers = [
      'Business Name',
      'Category',
      'Current Booking Software',
      'Timetable / Booking Signal',
      'Single Location',
      'Salesforce Status',
      'Salesforce Match Note',
      'Decision Maker Name',
      'Decision Maker Title',
      'Phone',
      'Email',
      'Website',
      'Booking URL',
      'Instagram',
      'Address',
      'Suburb',
      'Region/State',
      'Country',
      'Known Pain Points',
      'Switching Triggers',
      'Discovered Date',
    ];

    const rows = filteredLeads.map((l) => [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.currentSoftware || '').replace(/"/g, '""')}"`,
      `"${(l.timetableBookingSignal || '').replace(/"/g, '""')}"`,
      `"${l.isSingleSite ? 'Yes (Single Location)' : 'Multi-site'}"`,
      `"${(l.salesforceMatchStatus || '').replace(/"/g, '""')}"`,
      `"${(l.salesforceMatchDetails || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMakerName || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMakerTitle || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.bookingUrl || '').replace(/"/g, '""')}"`,
      `"${(l.instagram || '').replace(/"/g, '""')}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${(l.suburb || '').replace(/"/g, '""')}"`,
      `"${(l.region || '').replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      `"${(l.knownPainPoints || []).join('; ').replace(/"/g, '""')}"`,
      `"${(l.switchingTriggers || []).join('; ').replace(/"/g, '""')}"`,
      `"${(l.addedAt || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mindbody_leads_${exportFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCSV = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanCount = leads.filter(l => l.salesforceMatchStatus === 'Not in Salesforce' || l.salesforceMatchStatus === 'New Lead').length;
  const inSfCount = leads.filter(l => l.salesforceMatchStatus === 'Exists in Salesforce' || l.salesforceMatchStatus === 'Fuzzy Match').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">Export Leads to CSV</h3>
              <p className="text-xs text-slate-600">Download formatted lead list with verified contact details & booking signals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Leads to Export:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFilter('clean_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportFilter === 'clean_only'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Not in SF Only
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">{cleanCount} Clean Leads</div>
              </button>

              <button
                type="button"
                onClick={() => setExportFilter('all')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportFilter === 'all'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">All Leads</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">{leads.length} Total Leads</div>
              </button>

              <button
                type="button"
                onClick={() => setExportFilter('sf_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportFilter === 'sf_only'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-amber-900">In Salesforce</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">{inSfCount} Matched Leads</div>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Included Columns in CSV:</div>
            <div className="grid grid-cols-2 gap-1.5 text-slate-600">
              <div>✓ Business & Modality</div>
              <div>✓ Live Timetable/Booking Signal</div>
              <div>✓ Direct Phone & Email</div>
              <div>✓ Decision Maker & Title</div>
              <div>✓ Street Address & Suburb</div>
              <div>✓ Salesforce Match Status</div>
              <div>✓ Website & Booking URL</div>
              <div>✓ Pain Points & Switching Triggers</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleCopyCSV}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition-colors flex items-center gap-1.5 border border-slate-300 bg-white"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Copied to Clipboard!
              </>
            ) : (
              'Copy CSV Text'
            )}
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F25F22] hover:bg-[#D94E15] text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Download CSV ({filteredLeads.length} leads)
          </button>
        </div>
      </div>
    </div>
  );
};
