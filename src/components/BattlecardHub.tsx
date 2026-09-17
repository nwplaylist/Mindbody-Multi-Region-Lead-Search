import React, { useState } from 'react';
import { Swords, CheckCircle2, AlertTriangle, HelpCircle, Copy, Check, Sparkles, RefreshCw, Zap, CreditCard, DollarSign, Smartphone, Send } from 'lucide-react';
import { COMPETITOR_BATTLECARDS, MINDBODY_PRICING_AND_RATES } from '../data/competitorData';
import { CompetitorBattlecard, CompetitorSoftware } from '../types';

export const BattlecardHub: React.FC = () => {
  const [selectedSoftware, setSelectedSoftware] = useState<CompetitorSoftware>('Momence');
  const [activeBattlecard, setActiveBattlecard] = useState<CompetitorBattlecard>(
    COMPETITOR_BATTLECARDS[0]
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customCompetitorInput, setCustomCompetitorInput] = useState('');
  const [customModalityInput, setCustomModalityInput] = useState('Reformer Pilates');

  const handleSelectCompetitor = (sw: CompetitorSoftware) => {
    setSelectedSoftware(sw);
    const found = COMPETITOR_BATTLECARDS.find(b => b.softwareName === sw);
    if (found) {
      setActiveBattlecard(found);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateCustomBattlecard = async () => {
    if (!customCompetitorInput.trim()) return;
    setIsGeneratingCustom(true);
    try {
      const response = await fetch('/api/battlecard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorSoftware: customCompetitorInput,
          studioModality: customModalityInput,
        }),
      });

      const data = await response.json();
      if (data.success && data.battlecard) {
        setActiveBattlecard({
          id: `custom-${Date.now()}`,
          softwareName: customCompetitorInput as any,
          ...data.battlecard,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mindbody Unbeatable Rates & Platform Value Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-50 text-[#D94E15] border border-orange-200 font-bold">
              <DollarSign className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Mindbody Core Pricing & Official AU/NZ Payment Rates
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
            🔥 Top Competitive Advantages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-[#F25F22]" /> Platform Tiers
            </div>
            <p className="text-sm font-black text-slate-900">$89/mo — $369/mo</p>
            <p className="text-[11px] text-slate-600 font-medium">Top platform tier capped at $369/mo</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Direct Debit (DD / BECS)
            </div>
            <p className="text-sm font-black text-emerald-700">1.95% + 25c</p>
            <p className="text-[11px] text-slate-600 font-medium">Unbeatable rate for recurring fees</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Card Not Present / Card Present
            </div>
            <p className="text-xs font-bold text-slate-800">CNP: <span className="text-slate-900">2.7% + 25c</span> | CP: <span className="text-slate-900">2.7% + 5c</span></p>
            <p className="text-[11px] text-slate-600 font-medium">Online/App vs In-Studio Terminals</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Send className="w-3.5 h-3.5 text-purple-600" /> Attentive SMS + Branded App
            </div>
            <p className="text-xs font-bold text-purple-800">Exclusive Partnership</p>
            <p className="text-[11px] text-slate-600 font-medium">High-ROI SMS & native mobile app</p>
          </div>
        </div>
      </div>

      {/* Competitor Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                <Swords className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Competitor Battlecard & Switch Matrix (AU & NZ)</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Arm yourself with regional product weaknesses, AUD/NZD price mechanics, discovery trap questions, and objection scripts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl font-bold self-start">
            <Zap className="w-4 h-4 text-purple-600 shrink-0" />
            Tailored for Mindbody ANZ Account Executives
          </div>
        </div>

        {/* Competitor Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {COMPETITOR_BATTLECARDS.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectCompetitor(b.softwareName)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSoftware === b.softwareName
                  ? 'bg-[#F25F22] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              vs {b.softwareName}
            </button>
          ))}
        </div>

        {/* Custom Competitor AI Generator Drawer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Need a niche battlecard?</span>
          <input
            type="text"
            value={customCompetitorInput}
            onChange={(e) => setCustomCompetitorInput(e.target.value)}
            placeholder="e.g. Mariana Tek, WellnessLiving, Vagaro"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] w-48 font-medium"
          />
          <button
            onClick={handleGenerateCustomBattlecard}
            disabled={isGeneratingCustom || !customCompetitorInput.trim()}
            className="text-xs font-bold px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50 shadow-2xs"
          >
            {isGeneratingCustom ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> AI Custom Battlecard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Active Battlecard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Weaknesses & Mindbody Advantages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Banner */}
          <div className="bg-[#0B192C] text-white rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-[#F25F22] text-white text-xs font-bold rounded-full">
                Mindbody ANZ Battlecard
              </span>
              <span className="text-xs text-slate-300 font-mono">VS {activeBattlecard.softwareName}</span>
            </div>

            <h3 className="text-2xl font-black text-white">
              Mindbody vs {activeBattlecard.softwareName}
            </h3>

            <p className="text-xs text-slate-200 font-medium">
              <span className="font-bold text-[#F25F22]">ANZ Market Footprint:</span> {activeBattlecard.marketShareANZ}
            </p>
            <p className="text-xs text-slate-300 font-medium">
              <span className="font-bold text-slate-100">Typical Studio Profile:</span> {activeBattlecard.typicalCustomerProfile}
            </p>
          </div>

          {/* Weaknesses vs Advantages Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competitor Weaknesses */}
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {activeBattlecard.softwareName} AU/NZ Flaws & Vulnerabilities
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {activeBattlecard.keyWeaknesses?.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mindbody Advantages */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mindbody Unfair Advantages in AUD/NZD
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {activeBattlecard.mindbodyAdvantages?.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Objection Handlers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Bulletproof Objection Handlers for Mindbody AEs
            </h4>

            <div className="space-y-3">
              {activeBattlecard.commonObjectionsAndHandlers?.map((obj, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                      Studio Objection #{i + 1}: "{obj.objection}"
                    </span>
                    <button
                      onClick={() => handleCopy(obj.handler)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedText === obj.handler ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Script
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                    🗣️ <span className="font-bold text-purple-800">AE Response:</span> "{obj.handler}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Discovery Questions & Win Story */}
        <div className="space-y-6">
          {/* Killer Discovery Questions */}
          <div className="bg-amber-50 text-slate-900 rounded-2xl p-6 shadow-sm border border-amber-200 space-y-4">
            <h4 className="text-base font-bold text-amber-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D94E15]" />
              3 Trap Discovery Questions
            </h4>
            <p className="text-xs text-slate-700 font-medium">
              Ask these during cold calls or discovery meetings to expose hidden frustrations with {activeBattlecard.softwareName}:
            </p>

            <div className="space-y-2.5">
              {activeBattlecard.killerDiscoveryQuestions?.map((q, i) => (
                <div
                  key={i}
                  className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 font-medium leading-relaxed relative group"
                >
                  <span className="text-[#D94E15] font-bold block mb-1">Question {i + 1}:</span>
                  {q}
                  <button
                    onClick={() => handleCopy(q)}
                    className="mt-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Question
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Win Story */}
          <div className="bg-emerald-50 text-slate-900 border border-emerald-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              ANZ Switch Proof
            </span>
            <h4 className="text-base font-bold text-emerald-950">Recent Switch Win Story</h4>
            <p className="text-xs text-slate-800 leading-relaxed italic font-medium">
              "{activeBattlecard.recentSwitchWinStory}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
