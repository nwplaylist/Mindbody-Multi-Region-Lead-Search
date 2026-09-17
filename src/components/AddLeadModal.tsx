import React, { useState } from 'react';
import { X, Building2, MapPin, User, Phone, Mail, Globe, Plus } from 'lucide-react';
import { Lead, FitnessCategory, CompetitorSoftware, Country, Region } from '../types';
import { GLOBAL_REGIONS, getGlobalRegionForCountry } from '../data/regionsData';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onAddLead }) => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<FitnessCategory>('Reformer Pilates');
  const [currentSoftware, setCurrentSoftware] = useState<CompetitorSoftware>('Momence');
  const [timetableBookingSignal, setTimetableBookingSignal] = useState('Momence live timetable widget iframe on /timetable');
  const [bookingUrl, setBookingUrl] = useState('');
  const [country, setCountry] = useState<Country>('Australia');
  const [region, setRegion] = useState<Region>('NSW');
  const [suburb, setSuburb] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [decisionMakerName, setDecisionMakerName] = useState('');
  const [decisionMakerTitle, setDecisionMakerTitle] = useState('Studio Owner');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    const assignedRegion = getGlobalRegionForCountry(country) || 'Oceania';

    const newLead: Lead = {
      id: `manual-lead-${Date.now()}`,
      businessName,
      category,
      currentSoftware,
      timetableBookingSignal: timetableBookingSignal || `${currentSoftware} booking widget detected on website`,
      bookingUrl: bookingUrl || website,
      globalRegion: assignedRegion,
      country,
      region,
      suburb: suburb || 'Unknown Suburb',
      postcode: '2000',
      address: `${suburb}, ${region} ${country}`,
      website: website || 'https://example.com',
      phone: phone || '+61 2 9000 0000',
      email: email || 'info@example.com',
      decisionMakerName: decisionMakerName || 'Owner / Manager',
      decisionMakerTitle,
      leadStatus: 'Fresh Prospect',
      salesforceMatchStatus: 'Not in Salesforce',
      fatigueScore: 1,
      isSingleSite: true,
      knownPainPoints: ['Manually added single-site prospect'],
      switchingTriggers: ['Added for direct outreach'],
      suggestedAngle: 'Evaluate current software performance and Mindbody Marketplace reach.',
      addedAt: new Date().toISOString().split('T')[0],
      contactAttemptsCount: 0,
      notes,
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 border border-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-[#F25F22]" />
          <h3 className="text-lg font-bold text-slate-900">Add New Single-Site Prospect To Territory</h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Studio / Business Name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Bondi Reformer Club"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Fitness Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FitnessCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              >
                <option value="Reformer Pilates">Reformer Pilates</option>
                <option value="Mat Pilates & Yoga">Mat Pilates & Yoga</option>
                <option value="Martial Arts & BJJ">Martial Arts & BJJ</option>
                <option value="Functional / CrossFit">Functional / CrossFit</option>
                <option value="24/7 Gym & Health Club">24/7 Gym & Health Club</option>
                <option value="Boutique Strength & HIIT">Boutique Strength & HIIT</option>
                <option value="Allied Health & Wellness">Allied Health & Wellness</option>
                <option value="Spa, Sauna & Recovery">Spa, Sauna & Recovery</option>
                <option value="Dance & Rhythm Cycle">Dance & Rhythm Cycle</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Current Competitor Software</label>
              <select
                value={currentSoftware}
                onChange={(e) => setCurrentSoftware(e.target.value as CompetitorSoftware)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-purple-900 font-bold focus:outline-none focus:bg-white focus:border-[#F25F22]"
              >
                <option value="Momence">Momence</option>
                <option value="Clubworx">Clubworx</option>
                <option value="GymMaster">GymMaster</option>
                <option value="Hapana">Hapana</option>
                <option value="Wodify">Wodify</option>
                <option value="PushPress">PushPress</option>
                <option value="Gymdesk">Gymdesk</option>
                <option value="Zen Planner">Zen Planner</option>
                <option value="Glofox">Glofox</option>
                <option value="No Software / Manual">No Software / Manual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  const c = e.target.value as Country;
                  setCountry(c);
                  setRegion(c === 'Australia' ? 'NSW' : c === 'United States' ? 'California' : 'All');
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              >
                {Object.entries(GLOBAL_REGIONS).map(([regName, regConfig]) => (
                  <optgroup key={regName} label={`${regConfig.flag} ${regName}`}>
                    {regConfig.countries.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">State / Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                placeholder="NSW, VIC, Auckland"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Suburb / City</label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Bondi"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Decision Maker Name</label>
              <input
                type="text"
                value={decisionMakerName}
                onChange={(e) => setDecisionMakerName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Title</label>
              <input
                type="text"
                value={decisionMakerTitle}
                onChange={(e) => setDecisionMakerTitle(e.target.value)}
                placeholder="e.g. Owner / Founder"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Phone (+61 / +64)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+61 400 000 000"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@studio.com.au"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-widest mb-1">AE Initial Call / Discovery Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial observations..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-[#F25F22] font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-xs border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#F25F22] hover:bg-[#d94e15] text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Save Lead To Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
