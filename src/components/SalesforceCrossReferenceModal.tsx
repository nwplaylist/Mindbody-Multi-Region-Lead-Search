import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Upload, Check, RefreshCw, X, FileSpreadsheet, Sparkles, Building2 } from 'lucide-react';
import { Lead } from '../types';

interface SalesforceCrossReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onUpdateLeadsWithSalesforceStatus: (updatedLeads: Lead[]) => void;
}

export const SalesforceCrossReferenceModal: React.FC<SalesforceCrossReferenceModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLeadsWithSalesforceStatus,
}) => {
  const [salesforceInput, setSalesforceInput] = useState<string>(
    `Lagree Athletic Studio, lagreeathletic.com.au, +61398270044, David Kelly
Wildfire Reformer Pilates, wildfirepilates.com.au, +61293652010, Sarah Jenkins
Body & Soul Fitness Manly, bodysoulmanly.com, +61299778811, Liam Smith
FitZone Boxing Perth, fitzoneboxing.com.au, +61893810000, Unassigned`
  );
  const [isCrossReferencing, setIsCrossReferencing] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ total: number; matched: number; clean: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSalesforceInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleRunCrossReference = async () => {
    setIsCrossReferencing(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/salesforce/cross-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          salesforceInput,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.updatedLeads)) {
        onUpdateLeadsWithSalesforceStatus(data.updatedLeads);
        setResultSummary({
          total: data.summary?.totalChecked || leads.length,
          matched: data.summary?.matchedCount || 0,
          clean: data.summary?.cleanCount || leads.length,
        });
      } else {
        setErrorMessage(data.error || 'Failed to cross-reference Salesforce data.');
      }
    } catch (err: any) {
      setErrorMessage('Network error during Salesforce cross-reference.');
    } finally {
      setIsCrossReferencing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">Cross-Reference Leads with Salesforce</h3>
              <p className="text-xs text-slate-600">
                Check all {leads.length} leads against your Salesforce accounts, CSV export, or account names
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick upload or paste instructions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Paste Salesforce Accounts / CSV Lines:
            </label>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300 transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              Upload .CSV file
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Paste any list of existing Salesforce accounts, website domains, emails, phone numbers, or account export rows. The system matches domain names, business names, and contact details to flag existing accounts versus fresh unowned leads.
          </p>

          <textarea
            rows={7}
            value={salesforceInput}
            onChange={(e) => setSalesforceInput(e.target.value)}
            placeholder="Account Name, Website / Domain, Phone Number, Owner..."
            className="w-full text-xs font-mono bg-slate-50 text-slate-900 p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resultSummary && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-900 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                Salesforce Cross-Reference Complete!
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white border border-blue-100">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Checked</div>
                  <div className="text-base font-bold text-slate-900">{resultSummary.total}</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-emerald-100">
                  <div className="text-[10px] text-emerald-700 font-semibold uppercase">Fresh / Not in SF</div>
                  <div className="text-base font-bold text-emerald-700">{resultSummary.clean}</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-amber-100">
                  <div className="text-[10px] text-amber-700 font-semibold uppercase">In Salesforce</div>
                  <div className="text-base font-bold text-amber-700">{resultSummary.matched}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            {resultSummary ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleRunCrossReference}
            disabled={isCrossReferencing || !salesforceInput.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isCrossReferencing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Cross-Referencing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run Salesforce Cross-Reference
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
