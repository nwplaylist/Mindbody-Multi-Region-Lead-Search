import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, ShieldAlert, Clock, Sparkles, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { Lead, LeadStatus, SalesforceMatchStatus } from '../types';
import { addSentToClaudeNames } from '../utils/claudeMemory';

interface ImportClaudeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onSyncLeads: (updatedLeads: Lead[], newLeads: Lead[]) => void;
}

interface ProcessedRow {
  id: string;
  matchedLeadId?: string;
  businessName: string;
  website?: string;
  email?: string;
  phone?: string;
  currentSoftware?: string;
  detectedOwner?: string;
  detectedStatus?: string;
  detectedNotes?: string;
  lastContactedInfo?: string;
  
  // Categorization
  categoryTag: 'actionable' | 'owned_by_other' | 'contacted_recently' | 'new_lead';
  proposedLeadStatus: LeadStatus;
  proposedSFStatus: SalesforceMatchStatus;
  userDecision: 'apply_target' | 'apply_owned' | 'apply_recent' | 'skip_change' | 'remove_lead';
  reasonText: string;
}

export const ImportClaudeModal: React.FC<ImportClaudeModalProps> = ({
  isOpen,
  onClose,
  leads,
  onSyncLeads,
}) => {
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [filterTag, setFilterTag] = useState<'all' | 'actionable' | 'owned_by_other' | 'contacted_recently'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Simple CSV / TSV parser
  const parseCSVOrTSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 1) return { headers: [], rows: [] };

    // Determine delimiter (comma or tab or pipe)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes('|')) delimiter = '|';
    else if (firstLine.includes(';')) delimiter = ';';

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const dataRows = lines.slice(1).map(parseLine);

    return { headers, rows: dataRows };
  };

  const handleProcessInput = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const { headers, rows } = parseCSVOrTSV(inputText);

      // Find column indices
      const findColIdx = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
      };

      const nameIdx = findColIdx(['company', 'business', 'studio', 'name', 'account']);
      const ownerIdx = findColIdx(['owner', 'assigned', 'rep', 'user']);
      const statusIdx = findColIdx(['status', 'crm', 'salesforce', 'match', 'stage']);
      const contactIdx = findColIdx(['last_contact', 'contacted', 'last touch', 'touch', 'date']);
      const notesIdx = findColIdx(['notes', 'comment', 'action', 'reason', 'claude']);
      const websiteIdx = findColIdx(['website', 'url', 'site']);
      const emailIdx = findColIdx(['email', 'mail']);
      const softwareIdx = findColIdx(['software', 'competitor', 'platform']);

      const results: ProcessedRow[] = [];

      rows.forEach((row, idx) => {
        const nameVal = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : (row[0] || '');
        if (!nameVal || nameVal.toLowerCase() === 'company' || nameVal.toLowerCase() === 'business_name') return;

        const ownerVal = ownerIdx >= 0 ? row[ownerIdx] || '' : '';
        const statusVal = statusIdx >= 0 ? row[statusIdx] || '' : '';
        const contactVal = contactIdx >= 0 ? row[contactIdx] || '' : '';
        const notesVal = notesIdx >= 0 ? row[notesIdx] || '' : '';
        const websiteVal = websiteIdx >= 0 ? row[websiteIdx] || '' : '';
        const emailVal = emailIdx >= 0 ? row[emailIdx] || '' : '';
        const softwareVal = softwareIdx >= 0 ? row[softwareIdx] || '' : '';

        // Match with existing leads
        const cleanTargetName = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedLead = leads.find(l => {
          const lClean = l.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (lClean && cleanTargetName && (lClean.includes(cleanTargetName) || cleanTargetName.includes(lClean))) {
            return true;
          }
          if (websiteVal && l.website && l.website.toLowerCase().includes(websiteVal.toLowerCase())) {
            return true;
          }
          if (emailVal && l.email && l.email.toLowerCase() === emailVal.toLowerCase()) {
            return true;
          }
          return false;
        });

        // Determine category tag
        const combinedText = `${ownerVal} ${statusVal} ${contactVal} ${notesVal}`.toLowerCase();

        let tag: ProcessedRow['categoryTag'] = 'actionable';
        let proposedStatus: LeadStatus = 'Fresh Prospect';
        let proposedSFStatus: SalesforceMatchStatus = 'New Lead';
        let defaultDecision: ProcessedRow['userDecision'] = 'apply_target';
        let reason = 'Verified fresh target lead available for outreach';

        // Rule 1: Owned by other rep / colleague
        const isOwnedByOther =
          combinedText.includes('owned by') ||
          combinedText.includes('different rep') ||
          combinedText.includes('other rep') ||
          combinedText.includes('colleague') ||
          combinedText.includes('existing account') ||
          combinedText.includes('duplicate') ||
          combinedText.includes('in salesforce') ||
          (ownerVal && !ownerVal.toLowerCase().includes('unassigned') && !ownerVal.toLowerCase().includes('me'));

        // Rule 2: Contacted recently
        const isContactedRecently =
          combinedText.includes('recently') ||
          combinedText.includes('contacted') ||
          combinedText.includes('emailed') ||
          combinedText.includes('called') ||
          combinedText.includes('active opp') ||
          combinedText.includes('in talk') ||
          combinedText.includes('recent touch') ||
          combinedText.includes('days ago');

        if (isOwnedByOther) {
          tag = 'owned_by_other';
          proposedStatus = 'In Salesforce (Duplicate)';
          proposedSFStatus = 'Exact Salesforce Match';
          defaultDecision = 'apply_owned';
          reason = `Assigned to another rep in SF (${ownerVal || 'Owned account'})`;
        } else if (isContactedRecently) {
          tag = 'contacted_recently';
          proposedStatus = 'Contacted (Email)';
          proposedSFStatus = 'Fatigued Account (>3 Outreaches)';
          defaultDecision = 'apply_recent';
          reason = `Contacted recently (${contactVal || notesVal || 'Active touch point'})`;
        } else {
          tag = matchedLead ? 'actionable' : 'new_lead';
          proposedStatus = 'Fresh Prospect';
          proposedSFStatus = 'New Lead';
          defaultDecision = 'apply_target';
          reason = 'Unassigned & fresh prospect ready for outreach';
        }

        results.push({
          id: `import-row-${idx}-${Date.now()}`,
          matchedLeadId: matchedLead?.id,
          businessName: matchedLead ? matchedLead.businessName : nameVal,
          website: websiteVal || matchedLead?.website,
          email: emailVal || matchedLead?.email,
          phone: matchedLead?.phone,
          currentSoftware: softwareVal || matchedLead?.currentSoftware,
          detectedOwner: ownerVal,
          detectedStatus: statusVal,
          detectedNotes: notesVal,
          lastContactedInfo: contactVal,
          categoryTag: tag,
          proposedLeadStatus: proposedStatus,
          proposedSFStatus: proposedSFStatus,
          userDecision: defaultDecision,
          reasonText: reason,
        });
      });

      setProcessedRows(results);
      setStep('preview');
      setIsProcessing(false);
    }, 300);
  };

  const handleDecisionChange = (rowId: string, decision: ProcessedRow['userDecision']) => {
    setProcessedRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        let newStatus = row.proposedLeadStatus;
        if (decision === 'apply_target') newStatus = 'Fresh Prospect';
        else if (decision === 'apply_owned') newStatus = 'In Salesforce (Duplicate)';
        else if (decision === 'apply_recent') newStatus = 'Contacted (Email)';
        else if (decision === 'remove_lead') newStatus = 'Not Interested';

        return {
          ...row,
          userDecision: decision,
          proposedLeadStatus: newStatus,
        };
      })
    );
  };

  const handleExecuteSync = () => {
    const updatedLeadsList = [...leads];
    const newLeadsToAdd: Lead[] = [];

    // Automatically record all synced business names as sent to Claude so AI search excludes them
    const syncedNames = processedRows.map(r => r.businessName).filter(Boolean);
    addSentToClaudeNames(syncedNames);

    processedRows.forEach(row => {
      if (row.userDecision === 'skip_change') return;

      if (row.matchedLeadId) {
        // Update existing lead in pipeline
        const idx = updatedLeadsList.findIndex(l => l.id === row.matchedLeadId);
        if (idx >= 0) {
          if (row.userDecision === 'remove_lead') {
            updatedLeadsList.splice(idx, 1);
          } else {
            updatedLeadsList[idx] = {
              ...updatedLeadsList[idx],
              leadStatus: row.proposedLeadStatus,
              salesforceMatchStatus: row.proposedSFStatus,
              notes: row.detectedNotes
                ? `${updatedLeadsList[idx].notes || ''}\n[Claude Sync]: ${row.detectedNotes} (${row.reasonText})`.trim()
                : updatedLeadsList[idx].notes,
              lastContactedDate: row.lastContactedInfo || updatedLeadsList[idx].lastContactedDate,
            };
          }
        }
      } else if (row.userDecision === 'apply_target' || row.userDecision === 'apply_recent') {
        // Add as a new lead if not present
        const newLeadObj: Lead = {
          id: `claude-sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          businessName: row.businessName,
          category: 'Reformer Pilates',
          currentSoftware: (row.currentSoftware as any) || 'Momence',
          country: 'Australia',
          region: 'NSW',
          suburb: 'Sydney',
          postcode: '2000',
          address: 'CBD Studio',
          website: row.website || 'https://www.example.com.au',
          phone: row.phone || '+61 2 9000 0000',
          email: row.email || 'hello@example.com.au',
          decisionMakerName: 'Owner / Studio Director',
          decisionMakerTitle: 'Owner',
          leadStatus: row.proposedLeadStatus,
          salesforceMatchStatus: row.proposedSFStatus,
          fatigueScore: row.userDecision === 'apply_recent' ? 7 : 1,
          knownPainPoints: ['Merchant fee surcharges in AUD', 'Lack of integrated marketplace exposure'],
          switchingTriggers: ['Wants Mindbody consumer app integration'],
          suggestedAngle: 'Highlight Mindbody ANZ marketplace and Direct Debit rates.',
          addedAt: new Date().toISOString().split('T')[0],
          notes: `[Claude Import]: ${row.reasonText}`,
          contactAttemptsCount: row.userDecision === 'apply_recent' ? 2 : 0,
          isSingleSite: true,
        };
        newLeadsToAdd.push(newLeadObj);
      }
    });

    onSyncLeads(updatedLeadsList, newLeadsToAdd);
    onClose();
  };

  const actionableCount = processedRows.filter(r => r.categoryTag === 'actionable' || r.categoryTag === 'new_lead').length;
  const ownedCount = processedRows.filter(r => r.categoryTag === 'owned_by_other').length;
  const recentCount = processedRows.filter(r => r.categoryTag === 'contacted_recently').length;

  const filteredRows = processedRows.filter(row => {
    if (filterTag === 'actionable') return row.categoryTag === 'actionable' || row.categoryTag === 'new_lead';
    if (filterTag === 'owned_by_other') return row.categoryTag === 'owned_by_other';
    if (filterTag === 'contacted_recently') return row.categoryTag === 'contacted_recently';
    return true;
  });

  const sampleTemplateText = `Business_Name,Owner,Salesforce_Status,Contacted_Recently,Notes
Body & Soul Pilates,John Smith (Colleague),Owned Account,Yes,Assigned to John Smith in NSW team - DO NOT CONTACT
Surry Hills Golf Simulators,Unassigned,New Prospect,No,Fresh target single-site location
Ponsonby Wellness Hub,Jane Doe,Contacted 3 days ago,Yes,Jane sent intro email on Tuesday
Fortitude Movement Studio,Unassigned,New Prospect,No,High priority Momence user seeking AUD rates`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Import & Sync Claude / Salesforce Spreadsheet
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Filter out leads assigned to colleagues or contacted recently, keeping only 100% actionable targets in your queue.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <Sparkles className="w-4 h-4 text-[#F25F22]" />
                  How Claude Sync Works:
                </div>
                <p className="text-slate-700 font-medium">
                  Paste the table or CSV results generated by <strong>Claude Enterprise</strong> after cross-referencing your Salesforce accounts. The system will automatically detect owner assignments (e.g. colleagues), recent touches, and mark disqualified accounts as duplicates.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Paste Claude CSV / TSV / Excel Output
                  </label>
                  <button
                    onClick={() => setInputText(sampleTemplateText)}
                    className="text-[11px] font-bold text-[#F25F22] hover:underline"
                  >
                    Paste Sample Claude Data
                  </button>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={9}
                  placeholder={`Paste CSV data here, e.g.:\nBusiness_Name, Owner, Status, Notes\nSurry Hills Pilates, Unassigned, Target, Fresh single-site studio\nManly Golf Center, John Smith (SF Rep), Owned, Assigned to colleague`}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              {/* File upload alternative */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" /> Upload .CSV File
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) setInputText(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
                <span className="text-xs text-slate-500 font-medium">Supports .csv, .tsv or direct clipboard text</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Actionable Targets
                    </span>
                    <span className="text-lg font-black text-emerald-700">{actionableCount}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Unassigned fresh leads ready for outreach</p>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" /> Owned by Colleague
                    </span>
                    <span className="text-lg font-black text-red-700">{ownedCount}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Auto-flagged as SF Duplicate / Excluded</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" /> Contacted Too Recently
                    </span>
                    <span className="text-lg font-black text-amber-700">{recentCount}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Marked as recent touch to prevent burnout</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-[#F25F22]" /> Filter View:
                  </span>
                  <button
                    onClick={() => setFilterTag('all')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterTag === 'all'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({processedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterTag('actionable')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterTag === 'actionable'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Targets ({actionableCount})
                  </button>
                  <button
                    onClick={() => setFilterTag('owned_by_other')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterTag === 'owned_by_other'
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Owned by Other ({ownedCount})
                  </button>
                  <button
                    onClick={() => setFilterTag('contacted_recently')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterTag === 'contacted_recently'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Contacted Recently ({recentCount})
                  </button>
                </div>

                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-paste Data
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3">Studio Business Name</th>
                      <th className="p-3">Claude Audit Findings</th>
                      <th className="p-3">Pipeline Status Update</th>
                      <th className="p-3 text-right">AE Action Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <div>{row.businessName}</div>
                          {row.matchedLeadId ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">Matched in Pipeline</span>
                          ) : (
                            <span className="text-[10px] text-purple-700 font-semibold">New Import Candidate</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-medium">{row.reasonText}</div>
                          {row.detectedOwner && (
                            <span className="text-[10px] text-slate-500">Owner: {row.detectedOwner}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.categoryTag === 'owned_by_other' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold text-[10px]">
                              🚫 SF Duplicate / Owned
                            </span>
                          )}
                          {row.categoryTag === 'contacted_recently' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              ⏱️ Contacted Recently
                            </span>
                          )}
                          {(row.categoryTag === 'actionable' || row.categoryTag === 'new_lead') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                              ✅ Fresh Target
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={row.userDecision}
                            onChange={(e) => handleDecisionChange(row.id, e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                          >
                            <option value="apply_target">Keep as Fresh Target</option>
                            <option value="apply_owned">Mark SF Duplicate (Exclude)</option>
                            <option value="apply_recent">Mark Contacted Recently (Skip)</option>
                            <option value="skip_change">Do Not Change</option>
                            <option value="remove_lead">Remove from Pipeline</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            Cancel
          </button>

          {step === 'input' ? (
            <button
              onClick={handleProcessInput}
              disabled={!inputText.trim() || isProcessing}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Spreadsheet...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analyze & Categorize Rows
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleExecuteSync}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Apply Salesforce & Claude Sync
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
