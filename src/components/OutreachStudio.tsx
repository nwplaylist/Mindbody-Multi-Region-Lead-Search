import React, { useState } from 'react';
import { Send, Sparkles, Copy, Check, RefreshCw, Mail, Phone, Instagram, Linkedin, FileText, UserCheck, MapPin, Building2 } from 'lucide-react';
import { Lead, GeneratedOutreach } from '../types';

interface OutreachStudioProps {
  leads: Lead[];
  preselectedLead?: Lead | null;
}

export const OutreachStudio: React.FC<OutreachStudioProps> = ({
  leads,
  preselectedLead,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    preselectedLead?.id || (leads.length > 0 ? leads[0].id : '')
  );

  const currentLead = leads.find(l => l.id === selectedLeadId) || preselectedLead || leads[0];

  const [outreachType, setOutreachType] = useState<
    'email_cold' | 'email_followup' | 'phone_script' | 'instagram_dm' | 'linkedin_inmail'
  >('email_cold');

  const [personaAngle, setPersonaAngle] = useState<
    'cost_roi' | 'feature_gap' | 'growth_marketplace' | 'migration_ease' | 'community_retention'
  >('growth_marketplace');

  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState<GeneratedOutreach | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!currentLead) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: currentLead,
          outreachType,
          personaAngle,
          customContext,
        }),
      });

      const data = await response.json();
      if (data.success && data.outreach) {
        setGeneratedOutreach(data.outreach);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <Send className="w-5 h-5 text-emerald-600" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">ANZ Cold Outreach & Phone Script Generator</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Generate Aussie & Kiwi friendly, highly persuasive cold emails, Instagram DMs, and call scripts customized for prospects using Momence, Clubworx, GymMaster, etc.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 self-start">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Professional ANZ Tone
          </span>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lead Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Select Prospect from Pipeline</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.businessName} ({l.suburb}, {l.region}) • Uses {l.currentSoftware}
                </option>
              ))}
            </select>
          </div>

          {/* Outreach Channel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Outreach Channel</label>
            <select
              value={outreachType}
              onChange={(e) => setOutreachType(e.target.value as any)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="email_cold">📧 Cold Email (First Touch)</option>
              <option value="email_followup">📧 Follow-Up Email (Bump)</option>
              <option value="phone_script">📞 Cold Phone Call Script</option>
              <option value="instagram_dm">📸 Instagram Direct Message</option>
              <option value="linkedin_inmail">💼 LinkedIn InMail</option>
            </select>
          </div>

          {/* Persona Angle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Core Pitch Angle</label>
            <select
              value={personaAngle}
              onChange={(e) => setPersonaAngle(e.target.value as any)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22]"
            >
              <option value="growth_marketplace">🌟 Mindbody Marketplace & Consumer Reach</option>
              <option value="cost_roi">💰 Payment Rates (1.95% DD / 2.7% CNP) & ROI</option>
              <option value="community_retention">📲 Attentive Marketing Partnership & Branded App</option>
              <option value="feature_gap">⚡ Competitor Feature Gap (ClassPass / Multi-Location)</option>
              <option value="migration_ease">🚚 White-Glove Data Migration & $89-$369 Tiers</option>
            </select>
          </div>
        </div>

        {/* Quick Presets & Custom Context */}
        <div className="pt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Quick Value Angles:</span>
            <button
              type="button"
              onClick={() => setCustomContext("Emphasize Mindbody Direct Debit rate at 1.95% + 25c and CP rate at 2.7% + 5c vs high competitor merchant fees.")}
              className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              💳 1.95% Direct Debit Rate
            </button>
            <button
              type="button"
              onClick={() => setCustomContext("Highlight Mindbody's exclusive partnership with Attentive for automated SMS marketing & high member retention.")}
              className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              📱 Attentive SMS Partnership
            </button>
            <button
              type="button"
              onClick={() => setCustomContext("Highlight flexible $89/mo entry pricing up to $369/mo for top ultimate platform without hidden add-on fees.")}
              className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              🏷️ $89-$369 Platform Tiers
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <input
              type="text"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Optional extra AE context (e.g. 'Opening 2nd studio next month', 'Upset with Stripe fees')"
              className="w-full md:w-2/3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] placeholder-slate-400 font-medium"
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !currentLead}
              className="w-full md:w-auto px-6 py-2.5 bg-[#F25F22] hover:bg-[#d94e15] text-white font-bold text-sm rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating Outreach...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Custom Outreach Script
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Prospect Summary Badge */}
      {currentLead && (
        <div className="bg-[#0B192C] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#F25F22] text-white font-bold">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-sm text-white">{currentLead.businessName}</span>
              <span className="text-slate-300 block font-medium">
                {currentLead.decisionMakerName} ({currentLead.decisionMakerTitle}) • {currentLead.suburb}, {currentLead.region}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
              Current: {currentLead.currentSoftware}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#F25F22]/20 border border-[#F25F22]/40 text-orange-200 font-bold">
              {currentLead.category}
            </span>
          </div>
        </div>
      )}

      {/* Generated Outreach Display */}
      {generatedOutreach && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Main Copy / Script */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  {generatedOutreach.headline}
                </h3>

                <button
                  onClick={() =>
                    handleCopy(
                      `${generatedOutreach.subject ? `Subject: ${generatedOutreach.subject}\n\n` : ''}${
                        generatedOutreach.body
                      }\n\n${generatedOutreach.callToAction}`,
                      'full'
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedField === 'full' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" /> Copied Full Script!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Full Message
                    </>
                  )}
                </button>
              </div>

              {generatedOutreach.subject && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">Email Subject Line</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-bold text-slate-900">{generatedOutreach.subject}</span>
                    <button
                      onClick={() => handleCopy(generatedOutreach.subject || '', 'subject')}
                      className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-0.5 transition-colors"
                    >
                      {copiedField === 'subject' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Body */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1 tracking-wider">Message / Script Body</span>
                <div className="p-4 bg-slate-50 text-slate-900 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap border border-slate-200">
                  {generatedOutreach.body}
                </div>
              </div>

              {/* Call to action */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                <span className="font-bold text-emerald-800 block mb-0.5">Low-Friction Call To Action:</span>
                "{generatedOutreach.callToAction}"
              </div>
            </div>
          </div>

          {/* Right Col: Talking Points & Objection Prep */}
          <div className="space-y-4">
            <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> AE Key Talking Points
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {generatedOutreach.keyTalkingPoints?.map((tp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 text-amber-950 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs shadow-sm">
              <h4 className="text-sm font-bold text-amber-900">Objection Prep Note</h4>
              <p className="leading-relaxed text-amber-900 font-medium">{generatedOutreach.objectionPrep}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
