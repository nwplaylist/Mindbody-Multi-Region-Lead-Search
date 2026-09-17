import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, FileText, Upload, Sparkles, RefreshCw, ArrowRight, UserCheck, AlertCircle, Copy } from 'lucide-react';
import { Lead, DedupeResult } from '../types';

interface SalesforceDedupeProps {
  existingLeads: Lead[];
  onImportCleanLeads: (leads: Lead[]) => void;
}

export const SalesforceDedupe: React.FC<SalesforceDedupeProps> = ({
  existingLeads,
  onImportCleanLeads,
}) => {
  const [rawInput, setRawInput] = useState<string>(
    `Form & Flow Pilates, Surry Hills, chloe@formandflowsurryhills.com.au, +61292114450
Lagree Athletic Studio, South Yarra, hello@lagreeathletic.com.au, +61398270044
Wildfire Reformer Pilates, Bondi Beach, sarah@wildfirepilates.com.au, +61293652010
Kilo Functional Fitness, Richmond, team@kilofunctionalrichmond.com.au, +61394291102
Body & Soul Fitness, Manly, info@bodysoulmanly.com, +61299778811`
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [dedupeResults, setDedupeResults] = useState<DedupeResult[]>([]);
  const [hasScrubbed, setHasScrubbed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunScrub = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const lines = rawInput
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const response = await fetch('/api/leads/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLeadsInput: lines,
          existingLeads,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.results)) {
        setDedupeResults(data.results);
        setHasScrubbed(true);
      } else {
        setErrorMessage(data.error || 'Failed to scrub Salesforce lead list.');
      }
    } catch (err) {
      setErrorMessage('Network error during Salesforce lead scrub.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanCount = dedupeResults.filter(r => r.suggestedAction === 'Import as New Lead').length;
  const duplicateCount = dedupeResults.filter(r => r.matchType !== 'None').length;
  const fatiguedCount = dedupeResults.filter(r => r.fatigueWarning).length;

  const handleImportClean = () => {
    const cleanLeads: Lead[] = dedupeResults
      .filter(r => r.suggestedAction === 'Import as New Lead')
      .map((r, i) => ({
        id: `scrubbed-${Date.now()}-${i}`,
        businessName: r.providedName,
        category: 'Reformer Pilates',
        currentSoftware: 'Momence',
        country: 'Australia',
        region: 'NSW',
        suburb: 'Unknown Suburb',
        postcode: '2000',
        address: 'Australia',
        website: 'https://example.com',
        phone: r.providedPhone || '+61 2 9000 0000',
        email: r.providedEmail || 'info@example.com',
        decisionMakerName: 'Owner / Manager',
        decisionMakerTitle: 'Studio Owner',
        leadStatus: 'Fresh Prospect',
        salesforceMatchStatus: 'New Lead',
        fatigueScore: 1,
        knownPainPoints: ['Scrubbed from Salesforce export', 'Needs software review'],
        switchingTriggers: ['Looking for fresh outreach'],
        suggestedAngle: 'Introduce Mindbody local ANZ support & Marketplace exposure.',
        addedAt: new Date().toISOString().split('T')[0],
        contactAttemptsCount: 0,
      }));

    if (cleanLeads.length > 0) {
      onImportCleanLeads(cleanLeads);
      alert(`Successfully imported ${cleanLeads.length} clean, uncontacted leads into your pipeline!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Salesforce Pipeline Deduplication & Contact Fatigue Scrub</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Prevent contacting burned-out leads. Paste Salesforce export lists or scraped lead data to instantly catch duplicates, fuzzy matches, and leads contacted &gt;3 times previously.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Prevents Rep Over-Contacting
          </div>
        </div>

        {/* Input Text Box */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#F25F22]" /> Paste Salesforce Lead CSV / Raw Unverified Text:
            </label>
            <span className="text-xs text-slate-500 font-medium">Supported: CSV lines, Business Name, Email, Phone</span>
          </div>

          <textarea
            rows={5}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste business names, emails, phones, or Salesforce CSV export lines..."
            className="w-full text-xs font-mono bg-slate-50 text-slate-900 p-4 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-[#F25F22]"
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-600 font-medium">
              Cross-referencing against <span className="font-bold text-slate-900">{existingLeads.length} existing pipeline records</span>.
            </p>

            <button
              onClick={handleRunScrub}
              disabled={isProcessing || !rawInput.trim()}
              className="px-5 py-2.5 bg-[#F25F22] hover:bg-[#d94e15] text-white font-bold text-sm rounded-xl transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scrubbing Salesforce Leads...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run AI Dedupe & Fatigue Check
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Scrubbed Results */}
      {hasScrubbed && (
        <div className="space-y-4">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{cleanCount}</span>
                <span className="text-xs text-emerald-700 font-bold block">Clean Uncontacted Prospects</span>
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{duplicateCount}</span>
                <span className="text-xs text-amber-800 font-bold block">Salesforce Duplicates Caught</span>
              </div>
            </div>

            <div className="bg-white border border-rose-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{fatiguedCount}</span>
                <span className="text-xs text-rose-700 font-bold block">Fatigued Leads (&gt;3 Prev Outreach)</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#0B192C] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Deduplication Inspection Output ({dedupeResults.length} Checked)
              </h3>

              {cleanCount > 0 && (
                <button
                  onClick={handleImportClean}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Import {cleanCount} Clean Leads To Pipeline
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Lead / Business Name</th>
                    <th className="px-4 py-3">Match Type</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Inspection Analysis & Fatigue Risk</th>
                    <th className="px-4 py-3">Suggested Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {dedupeResults.map((result, i) => {
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {result.providedName}
                          {result.providedEmail && (
                            <span className="block font-medium text-[11px] text-slate-500">
                              {result.providedEmail}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              result.matchType === 'Exact'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : result.matchType === 'Fuzzy'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {result.matchType === 'None' ? 'New Uncontacted' : `${result.matchType} Match`}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {result.confidenceScore}%
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-slate-800 font-medium">{result.matchReason}</p>
                          {result.fatigueWarning && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded mt-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> {result.fatigueWarning}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs inline-block font-bold ${
                              result.suggestedAction === 'Import as New Lead'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : result.suggestedAction === 'Merge with Existing'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {result.suggestedAction}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
