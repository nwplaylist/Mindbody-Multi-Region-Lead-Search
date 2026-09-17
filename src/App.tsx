import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeadFinderView } from './components/LeadFinderView';
import { SalesforceCrossReferenceModal } from './components/SalesforceCrossReferenceModal';
import { ExportLeadsModal } from './components/ExportLeadsModal';
import { AddLeadModal } from './components/AddLeadModal';
import { Lead, GlobalRegion } from './types';
import { enrichContactDetails } from './utils/contactEnrichment';
import { loadStoredLeads, saveStoredLeads, appendPermanentExclusions } from './utils/persistentStorage';
import { addSentToClaudeNames } from './utils/claudeMemory';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>(() => loadStoredLeads());
  const [currentGlobalRegion, setCurrentGlobalRegion] = useState<GlobalRegion | 'All'>('North America');
  const [isSalesforceModalOpen, setIsSalesforceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Automatically persist any state changes to localStorage
  useEffect(() => {
    saveStoredLeads(leads);
  }, [leads]);

  // Add new leads into state without duplicates
  const handleAddLeads = (newLeads: Lead[]) => {
    const enrichedNew = newLeads.map(enrichContactDetails);
    setLeads((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const existingNames = new Set(prev.map((l) => (l.businessName || '').toLowerCase().trim()));
      
      const filtered = enrichedNew.filter(
        (l) => !existingIds.has(l.id) && !existingNames.has((l.businessName || '').toLowerCase().trim())
      );
      return [...filtered, ...prev];
    });
  };

  // Fresh search replaces previous un-cadenced leads while safely preserving all cadenced leads
  const handleFreshSearchLeads = (newLeads: Lead[]) => {
    const enrichedNew = newLeads.map(enrichContactDetails);
    
    // 1. Identify previous un-cadenced leads from current state and archive them to exclusions outside setState
    const unCadencedPrev = leads.filter((l) => !l.addedToCadence);
    const unCadencedNames = unCadencedPrev.map((l) => l.businessName.trim()).filter(Boolean);
    if (unCadencedNames.length > 0) {
      appendPermanentExclusions(unCadencedNames);
      addSentToClaudeNames(unCadencedNames);
    }

    setLeads((prev) => {
      // 2. Keep all cadenced leads
      const cadencedLeads = prev.filter((l) => l.addedToCadence);
      const cadencedIds = new Set(cadencedLeads.map((l) => l.id));
      const cadencedNames = new Set(cadencedLeads.map((l) => (l.businessName || '').toLowerCase().trim()));

      // 3. Filter out any newly returned lead that might match an already cadenced lead
      const freshOnly = enrichedNew.filter(
        (l) => !cadencedIds.has(l.id) && !cadencedNames.has((l.businessName || '').toLowerCase().trim())
      );

      return [...cadencedLeads, ...freshOnly];
    });
  };

  const handleClearUncadencedLeads = () => {
    const unCadenced = leads.filter((l) => !l.addedToCadence);
    const unCadencedNames = unCadenced.map((l) => l.businessName.trim()).filter(Boolean);
    if (unCadencedNames.length > 0) {
      appendPermanentExclusions(unCadencedNames);
      addSentToClaudeNames(unCadencedNames);
    }
    setLeads((prev) => prev.filter((l) => l.addedToCadence));
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const enriched = enrichContactDetails(updatedLead);
    setLeads((prev) => prev.map((l) => (l.id === enriched.id ? enriched : l)));
  };

  const handleDeleteLead = (leadId: string) => {
    const target = leads.find((l) => l.id === leadId);
    if (target) {
      appendPermanentExclusions([target.businessName]);
      addSentToClaudeNames([target.businessName]);
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleUpdateLeadsWithSalesforceStatus = (updatedLeads: Lead[]) => {
    const enriched = updatedLeads.map(enrichContactDetails);
    setLeads(enriched);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Sticky Header */}
      <Header
        leads={leads}
        currentGlobalRegion={currentGlobalRegion}
        onSelectGlobalRegion={setCurrentGlobalRegion}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSalesforceModal={() => setIsSalesforceModalOpen(true)}
      />

      {/* Main Single-Screen Application View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <LeadFinderView
          leads={leads}
          currentGlobalRegion={currentGlobalRegion}
          onSelectGlobalRegion={setCurrentGlobalRegion}
          onAddLeads={handleAddLeads}
          onFreshSearchLeads={handleFreshSearchLeads}
          onClearUncadencedLeads={handleClearUncadencedLeads}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
          onOpenSalesforceModal={() => setIsSalesforceModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </main>

      {/* Modals */}
      <SalesforceCrossReferenceModal
        isOpen={isSalesforceModalOpen}
        onClose={() => setIsSalesforceModalOpen(false)}
        leads={leads}
        onUpdateLeadsWithSalesforceStatus={handleUpdateLeadsWithSalesforceStatus}
      />

      <ExportLeadsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leads={leads}
      />

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLead={(lead) => handleAddLeads([lead])}
      />
    </div>
  );
}
