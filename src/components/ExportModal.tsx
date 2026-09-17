import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Copy, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { Lead } from '../types';
import { addSentToClaudeNames } from '../utils/claudeMemory';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onOpenImportModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, leads, onOpenImportModal }) => {
  const [copied, setCopied] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);
  const [activeMode, setActiveMode] = useState<'csv' | 'claude'>('csv');

  if (!isOpen) return null;

  const handleMarkAsSentToClaude = () => {
    const names = leads.map(l => l.businessName).filter(Boolean);
    addSentToClaudeNames(names);
    setMarkedSent(true);
    setTimeout(() => setMarkedSent(false), 3000);
  };

  const headers = [
    'Company',
    'FirstName',
    'LastName',
    'Title',
    'Email',
    'Phone',
    'City',
    'State',
    'PostalCode',
    'Country',
    'Website',
    'Status',
    'Competitor_Software__c',
    'Fitness_Category__c',
    'Has_Custom_Branded_App__c',
    'App_Store_Status__c',
    'App_Store_Notes__c',
    'Custom_App_Pitch_Opportunity__c',
    'Known_Pain_Points__c',
    'Switching_Triggers__c',
    'Killer_Discovery_Question__c',
    'Pitch_Angle__c',
    'Description',
  ];

  const csvRows = leads.map((l) => {
    const nameParts = (l.decisionMakerName || 'Owner').split(' ');
    const firstName = nameParts[0] || 'Owner';
    const lastName = nameParts.slice(1).join(' ') || 'Manager';
    const painPoints = Array.isArray(l.knownPainPoints) ? l.knownPainPoints.join('; ') : '';
    const triggers = Array.isArray(l.switchingTriggers) ? l.switchingTriggers.join('; ') : '';

    return [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${firstName.replace(/"/g, '""')}"`,
      `"${lastName.replace(/"/g, '""')}"`,
      `"${(l.decisionMakerTitle || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.suburb || '').replace(/"/g, '""')}"`,
      `"${(l.region || '').replace(/"/g, '""')}"`,
      `"${(l.postcode || '').replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.leadStatus || '').replace(/"/g, '""')}"`,
      `"${(l.currentSoftware || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${l.hasCustomBrandedApp ? 'Yes' : 'No'}"`,
      `"${(l.appStoreStatus || 'No Branded App (Target)').replace(/"/g, '""')}"`,
      `"${(l.appStoreNotes || '').replace(/"/g, '""')}"`,
      `"${(l.customAppOpportunity || '').replace(/"/g, '""')}"`,
      `"${painPoints.replace(/"/g, '""')}"`,
      `"${triggers.replace(/"/g, '""')}"`,
      `"${(l.killerDiscoveryQuestion || '').replace(/"/g, '""')}"`,
      `"${(l.suggestedAngle || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const fullCsvText = [headers.join(','), ...csvRows].join('\n');

  // Formatted markdown summary specially built for pasting directly into Claude Enterprise
  const claudePromptText = `Please cross-reference these ${leads.length} ANZ single-site prospect accounts with our Salesforce CRM instance to check for existing Account or Lead records, owner assignments, or active opportunities:

${leads.map((l, i) => `${i + 1}. **${l.businessName}** (${l.category})
   - Website: ${l.website || 'N/A'}
   - Software: ${l.currentSoftware}
   - Mobile App Status: ${l.appStoreStatus || 'No Branded App in Stores (Target)'} - ${l.appStoreNotes || 'Web booking only'}
   - White-Label App Hook: ${l.customAppOpportunity || 'Pitch custom branded member app on iOS/Android'}
   - Location: ${l.suburb}, ${l.region}, ${l.country}
   - Contact: ${l.decisionMakerName} (${l.decisionMakerTitle}) | Phone: ${l.phone} | Email: ${l.email}
   - Pain Points: ${Array.isArray(l.knownPainPoints) ? l.knownPainPoints.join(', ') : 'N/A'}
   - Discovery Question: "${l.killerDiscoveryQuestion || ''}"`).join('\n\n')}`;

  const handleDownloadCsv = () => {
    handleMarkAsSentToClaude();
    const blob = new Blob([fullCsvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mindbody_ANZ_Salesforce_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    handleMarkAsSentToClaude();
    navigator.clipboard.writeText(activeMode === 'csv' ? fullCsvText : claudePromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 border border-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileSpreadsheet className="w-5 h-5 text-[#F25F22]" />
          <h3 className="text-lg font-bold text-slate-900">Export Prospects for Salesforce & Salesloft Cross-Referencing</h3>
        </div>

        <div className="flex items-center gap-2 mt-3 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setActiveMode('csv')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'csv' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Salesforce / Salesloft .CSV
          </button>
          <button
            onClick={() => setActiveMode('claude')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'claude' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🤖 Claude Enterprise Prompt Format
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium mt-2">
          {activeMode === 'csv'
            ? `Exporting ${leads.length} accounts as a CSV ready for Salesforce Data Loader, Salesloft, or Excel.`
            : `Formatted prompt text designed to paste directly into Claude Enterprise to automatically cross-reference with Salesforce.`}
        </p>

        <div className="mt-3">
          <textarea
            readOnly
            rows={10}
            value={activeMode === 'csv' ? fullCsvText : claudePromptText}
            className={`w-full text-[11px] font-mono p-3 rounded-xl border border-slate-200 focus:outline-none bg-slate-50 ${
              activeMode === 'csv' ? 'text-emerald-800' : 'text-purple-900'
            }`}
          />
        </div>

        {markedSent && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Marked {leads.length} accounts as "Sent to Claude" — AI Search will strictly exclude them from future discovery scans!</span>
          </div>
        )}

        {onOpenImportModal && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-purple-900">Got your cross-referenced Claude CSV back?</span>
              <p className="text-slate-600 text-[11px] font-medium">Sync it back to automatically filter out owned or recently contacted leads.</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenImportModal();
              }}
              className="px-3 py-1.5 font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors whitespace-nowrap shadow-2xs"
            >
              Sync Claude CSV
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? 'Copied to Clipboard & Marked Sent!' : activeMode === 'csv' ? 'Copy CSV Raw Text' : 'Copy Claude Prompt'}
          </button>

          {activeMode === 'csv' && (
            <button
              onClick={handleDownloadCsv}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download .CSV File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
