import { Lead } from '../types';
import { SEED_LEADS } from '../data/seedLeads';
import { enrichContactDetails } from './contactEnrichment';
import { isAustralianBusiness, normalizeAustralianLead } from './geoValidation';
import { getGlobalRegionForCountry } from '../data/regionsData';

const STORAGE_KEY_LEADS = 'mindbody_radar_stored_leads_v4';
const STORAGE_KEY_EXCLUSIONS = 'mindbody_radar_permanent_exclusions_v4';

/**
 * Loads stored leads from localStorage or initializes with seed leads
 */
export function loadStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Retain all valid leads across regions, ensuring Australian ones are normalized and all have globalRegion
        const validLeads = parsed
          .filter((l: any) => l && l.businessName)
          .map((l: any) => {
            const normalized = isAustralianBusiness(l) ? normalizeAustralianLead(l) : l;
            return {
              ...normalized,
              globalRegion: normalized.globalRegion || getGlobalRegionForCountry(normalized.country || ''),
            };
          })
          .map(enrichContactDetails);

        // Ensure global seed leads are accessible even if previous session only stored Oceania leads
        const existingNames = new Set(validLeads.map((l: Lead) => (l.businessName || '').toLowerCase().trim()));
        const missingGlobalSeeds = SEED_LEADS
          .filter((s) => !existingNames.has((s.businessName || '').toLowerCase().trim()))
          .map(enrichContactDetails);

        const combined = [...validLeads, ...missingGlobalSeeds];

        if (combined.length > 0) {
          return combined;
        }
      }
    }
  } catch (err) {
    console.error('Failed to read leads from localStorage:', err);
  }
  return SEED_LEADS.map(enrichContactDetails);
}

/**
 * Saves the active leads list to localStorage
 */
export function saveStoredLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    // Also update permanent exclusion list so these are never re-scanned
    const names = leads.map(l => l.businessName.trim().toLowerCase());
    appendPermanentExclusions(names);
  } catch (err) {
    console.error('Failed to write leads to localStorage:', err);
  }
}

/**
 * Gets all permanent exclusion business names to prevent re-finding the same studio
 */
export function getPermanentExclusions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXCLUSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to get permanent exclusions:', err);
  }
  return [];
}

/**
 * Appends business names to permanent exclusion memory
 */
export function appendPermanentExclusions(newNames: string[]): void {
  try {
    const existing = getPermanentExclusions();
    const set = new Set([...existing, ...newNames.map(n => n.trim().toLowerCase())]);
    localStorage.setItem(STORAGE_KEY_EXCLUSIONS, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save exclusions:', err);
  }
}

/**
 * Removes a specific business name from permanent exclusion memory
 */
export function removePermanentExclusion(nameToRemove: string): string[] {
  try {
    const existing = getPermanentExclusions();
    const updated = existing.filter(n => n.toLowerCase() !== nameToRemove.toLowerCase().trim());
    localStorage.setItem(STORAGE_KEY_EXCLUSIONS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove exclusion:', err);
    return [];
  }
}

/**
 * Clear permanent exclusions memory
 */
export function clearPermanentExclusions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_EXCLUSIONS);
  } catch (err) {
    console.error('Failed to clear exclusions:', err);
  }
}

/**
 * Clear stored leads and reset to seed
 */
export function resetStoredLeads(): Lead[] {
  try {
    localStorage.removeItem(STORAGE_KEY_LEADS);
  } catch (err) {
    console.error('Failed to reset leads in localStorage:', err);
  }
  return SEED_LEADS.map(enrichContactDetails);
}
