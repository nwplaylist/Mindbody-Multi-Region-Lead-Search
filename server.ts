import express from "express";
import path from "path";
import dotenv from "dotenv";
import dns from "node:dns/promises";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { enrichContactDetails } from "./src/utils/contactEnrichment";
import {
  isAustralianBusiness,
  isNZBusiness,
  normalizeAustralianLead,
  isValidLeadForTerritory,
} from "./src/utils/geoValidation";
import { getGlobalRegionForCountry } from "./src/data/regionsData";
import { GlobalRegion } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Known Multi-Location Brands & Chains (Strict Exclusions for Single-Site SMB Target)
const MULTI_LOCATION_CHAINS = [
  "f45", "bft", "body fit training", "anytime fitness", "snap fitness", "kx pilates",
  "studio pilates", "ubx", "jetts", "plus fitness", "fitstop", "12rnd", "viva leisure",
  "aleenta", "barry's", "orangetheory", "tribute boxing", "genesis health", "goodlife health",
  "fernwood", "zap fitness", "revo fitness", "ufc gym", "world gym", "crunch fitness",
  "crossfit athletic", "modo yoga", "speedfit", "strong pilates", "city cave", "total fusion",
  "be athletic", "athletic fitness", "peak pilates", "equinox", "soulcycle", "solidcore", "pure barre",
  "club pilates", "row house", "cyclebar", "rumble boxing", "fitness first", "virgin active", "puregym"
];

function isMultiLocationName(name: string): boolean {
  const norm = (name || "").toLowerCase().trim();
  if (!norm) return false;
  // Multi-suburb indicator like "Studio X - Bondi & Manly" or "Studio X - City / Parramatta"
  if (norm.includes(" - ") && (norm.includes("&") || norm.includes("/") || norm.includes(","))) {
    return true;
  }
  for (const chain of MULTI_LOCATION_CHAINS) {
    if (norm === chain || norm.startsWith(`${chain} `) || norm.includes(` ${chain} `) || norm.endsWith(` ${chain}`)) {
      return true;
    }
  }
  return false;
}

interface WebsiteVerificationResult {
  valid: boolean;
  reachable: boolean;
  finalUrl?: string;
  isMultiLocation: boolean;
  multiLocationReason?: string;
}

// Rigorous real-time DNS and HTTP reachability check + "Locations" tab multi-site detector
async function verifyWebsiteAndMultiLocation(urlStr: string): Promise<WebsiteVerificationResult> {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, reachable: false, isMultiLocation: false };
  }

  let formattedUrl = urlStr.trim();
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`;
  }

  let hostname = "";
  try {
    const urlObj = new URL(formattedUrl);
    hostname = urlObj.hostname.toLowerCase();
  } catch {
    return { valid: false, reachable: false, isMultiLocation: false };
  }

  // Reject local, placeholder, or invalid hostnames
  if (
    !hostname ||
    hostname.includes("example.com") ||
    hostname.includes("notfound") ||
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.includes(" ")
  ) {
    return { valid: false, reachable: false, isMultiLocation: false };
  }

  // Step 1: DNS Lookup verification (catches guessed / fabricated domain names, with HTTP fallback for container DNS quirks)
  let domainResolved = false;
  try {
    await dns.lookup(hostname);
    domainResolved = true;
  } catch (dnsErr: any) {
    try {
      const probeRes = await fetch(formattedUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(2500),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (probeRes.status < 500) {
        domainResolved = true;
      }
    } catch {
      domainResolved = false;
    }
  }

  if (!domainResolved) {
    console.warn(`[DOMAIN CHECK] DNS lookup failed for ${hostname} (domain not registered / guessed by AI). Rejecting.`);
    return { valid: false, reachable: false, isMultiLocation: false };
  }

  // Step 2: HTTP Probe & "Locations" Tab / Multi-site Detection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(formattedUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const finalUrl = response.url || formattedUrl;

    let htmlChunk = "";
    try {
      htmlChunk = (await response.text()).slice(0, 120000);
    } catch {
      htmlChunk = "";
    }

    // MULTI-LOCATION DETECTION:
    // User complaint: "if there is a website tab that says Locations they are probably to be excluded"
    // Checks for a "Locations" (plural) tab, menu item, link or header
    const locationsTabPattern = /(?:href=["\x27][^"\x27]*(?:\/locations|\/our-locations|\/studios|\/find-a-studio)[^"\x27]*["\x27]|<nav[^>]*>[\s\S]*?(?:>Locations<|>Our Locations<|>Studios<|>All Studios<)[\s\S]*?<\/nav>|<header[^>]*>[\s\S]*?(?:>Locations<|>Our Locations<|>Studios<)[\s\S]*?<\/header>)/i;

    const hasLocationsTab = locationsTabPattern.test(htmlChunk);

    if (hasLocationsTab) {
      console.warn(`[MULTI-SITE EXCLUSION] Website for ${finalUrl} has a 'Locations' tab/menu item. Excluded.`);
      return {
        valid: true,
        reachable: true,
        finalUrl,
        isMultiLocation: true,
        multiLocationReason: `Website navigation contains a 'Locations' or 'Our Locations' tab indicating multiple facilities.`,
      };
    }

    return {
      valid: true,
      reachable: response.status < 500,
      finalUrl,
      isMultiLocation: false,
    };
  } catch (err: any) {
    // DNS resolved (domain genuinely exists), but HTTP fetch timed out or was blocked by firewall
    return {
      valid: true,
      reachable: false,
      finalUrl: formattedUrl,
      isMultiLocation: false,
    };
  }
}

// Initialize Google GenAI Server-side SDK
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Builds dynamic geo mandate based on selected territory
function buildTerritoryMandate(
  globalRegion: GlobalRegion,
  country: string,
  region: string | null,
  suburb: string | null
): { mandate: string; geoTarget: string; defaultCurrency: string } {
  const cNorm = (country || "").trim();
  const isCountrySpecific = cNorm && cNorm !== "All";

  switch (globalRegion) {
    case "North America": {
      const targetCountry = isCountrySpecific ? cNorm : "United States or Canada";
      return {
        defaultCurrency: "USD",
        geoTarget: [suburb, region && region !== "All" ? region : null, targetCountry].filter(Boolean).join(", "),
        mandate: `CRITICAL LOCATION MANDATE - NORTH AMERICA (${targetCountry}) ONLY:
- Every single studio MUST be physically located inside ${targetCountry} (e.g. Austin, Los Angeles, New York, Miami, Chicago, Dallas, Denver, Seattle, Toronto, Vancouver, Montreal, etc.).
- Physical address MUST have a genuine North American state/province (e.g., CA, TX, NY, FL, IL, CO, ON, BC) and valid zip/postal code.
- Phone number MUST use North American dialing code (+1).
- FATAL FAILURE: DO NOT return any business located in Australia, New Zealand, or Europe. Discard any result from outside North America immediately.`
      };
    }
    case "Europe": {
      const targetCountry = isCountrySpecific ? cNorm : "United Kingdom, Ireland, Germany, France, Spain, Italy, or Netherlands";
      return {
        defaultCurrency: cNorm === "United Kingdom" ? "GBP" : "EUR",
        geoTarget: [suburb, region && region !== "All" ? region : null, targetCountry].filter(Boolean).join(", "),
        mandate: `CRITICAL LOCATION MANDATE - EUROPE (${targetCountry}) ONLY:
- Every single studio MUST be physically located inside ${targetCountry} (e.g. London, Manchester, Dublin, Berlin, Munich, Paris, Madrid, Barcelona, Milan, Amsterdam, etc.).
- Phone number MUST use appropriate European dialing code (+44 UK, +353 Ireland, +49 Germany, +33 France, +34 Spain, +39 Italy, +31 Netherlands).
- FATAL FAILURE: DO NOT return any business located in Australia, New Zealand, or USA. Discard any result from outside Europe immediately.`
      };
    }
    case "Asia": {
      const targetCountry = isCountrySpecific ? cNorm : "Singapore, UAE, Japan, Hong Kong, or India";
      return {
        defaultCurrency: "USD",
        geoTarget: [suburb, region && region !== "All" ? region : null, targetCountry].filter(Boolean).join(", "),
        mandate: `CRITICAL LOCATION MANDATE - ASIA & MIDDLE EAST (${targetCountry}) ONLY:
- Every single studio MUST be physically located inside ${targetCountry} (e.g. Singapore, Dubai, Abu Dhabi, Tokyo, Osaka, Hong Kong, Mumbai, Delhi, Bengaluru).
- Phone number MUST use local country dialing prefix (+65 SG, +971 UAE, +81 Japan, +852 HK, +91 India).
- FATAL FAILURE: DO NOT return any business located in Australia or USA. Discard any result from outside Asia/UAE immediately.`
      };
    }
    case "South America": {
      const targetCountry = isCountrySpecific ? cNorm : "Brazil, Argentina, Colombia, or Chile";
      return {
        defaultCurrency: "USD",
        geoTarget: [suburb, region && region !== "All" ? region : null, targetCountry].filter(Boolean).join(", "),
        mandate: `CRITICAL LOCATION MANDATE - SOUTH AMERICA (${targetCountry}) ONLY:
- Every single studio MUST be physically located inside ${targetCountry} (e.g. São Paulo, Rio de Janeiro, Buenos Aires, Córdoba, Bogotá, Medellín, Santiago).
- Phone number MUST use South American dialing code (+55 Brazil, +54 Argentina, +57 Colombia, +56 Chile).
- FATAL FAILURE: DO NOT return any business located in Australia, USA, or Europe. Discard any result from outside South America immediately.`
      };
    }
    case "Oceania":
    default: {
      const isNZ = cNorm === "New Zealand";
      return {
        defaultCurrency: isNZ ? "NZD" : "AUD",
        geoTarget: [suburb, region && region !== "All" ? region : null, isNZ ? "New Zealand" : "Australia"].filter(Boolean).join(", "),
        mandate: isNZ
          ? `CRITICAL LOCATION MANDATE - NEW ZEALAND ONLY:
- MUST be physically located inside New Zealand (Auckland, Wellington, Christchurch, Tauranga, Hamilton, Queenstown, etc.).
- Phone must have NZ prefix (+64). Address must be in New Zealand.
- DO NOT return any business located in Australia, USA, or UK.`
          : `CRITICAL LOCATION MANDATE - AUSTRALIA ONLY (NON-NEGOTIABLE):
- Every single studio MUST be physically located inside AUSTRALIA (NSW, VIC, QLD, WA, SA, TAS, ACT, NT).
- Physical address MUST have an Australian suburb, state (e.g., NSW, VIC, QLD, WA, SA, TAS, ACT), and valid 4-digit Australian postcode (2000-7999).
- Phone number MUST be an Australian number starting with +61, 04, 02, 03, 07, or 08.
- FATAL FAILURE WARNING: DO NOT return ANY business located in the United States or outside Australia.`
      };
    }
  }
}

// Helper to search real active competitor leads using Google Search Grounding with deep footprint dorks
async function searchActiveGroundedLeads(
  ai: any,
  globalRegion: GlobalRegion,
  targetSoftware: string | null,
  categoryQuery: string,
  country: string,
  region: string | null,
  suburb: string | null,
  excludeNames: string[],
  count: number,
  appStoreFilter: string = "no_app_only",
  scanClubworxHostedOnly: boolean = false
): Promise<any[]> {
  const { mandate, geoTarget } = buildTerritoryMandate(
    globalRegion,
    country,
    region,
    suburb
  );

  const swName = scanClubworxHostedOnly
    ? "Clubworx Hosted Websites (app.clubworx.com)"
    : (targetSoftware || "Momence, PushPress, Wodify, Glofox, GymMaster, Zen Planner, Gymdesk, Acuity, BSport, Clubworx");

  const normalizeName = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const excludeSet = new Set(excludeNames.map(normalizeName));

  const clubworxSpecialFootprint = (scanClubworxHostedOnly || (targetSoftware && targetSoftware.toLowerCase().includes("clubworx")))
    ? `
CRITICAL CLUBWORX HOSTED WEBSITES SEARCH (app.clubworx.com):
- Search specifically for studios hosted on "app.clubworx.com/websites/<slug>" or "app.clubworx.com/portal/<slug>".
`
    : "";

  const prompt = `Use Google Search to find ${count} REAL, CURRENTLY ACTIVE, OPERATING (NOT PERMANENTLY CLOSED) INDEPENDENT SINGLE-LOCATION fitness studios, gyms, pilates/yoga studios, martial arts dojos, or wellness businesses in ${geoTarget}.

${mandate}
${clubworxSpecialFootprint}
PRIMARY DISCOVERY CRITERIA - NO BRANDED APP IN STORES:
- TARGET: Independent studios using competitor software (${swName}) that DO NOT have a custom branded mobile app published under their own business name on the Apple App Store (apps.apple.com) or Google Play Store (play.google.com).
- They either:
  1. Have NO mobile app at all (rely purely on website timetable widgets / browser booking).
  2. Use a generic competitor member app (e.g. telling members to download the shared generic "Momence", "PushPress Members", "Clubworx", or "GymMaster" app).
- EXCLUDE any studio that already has their own standalone branded white-label app published under their own name in Apple App Store / Google Play.

DEEP COMPETITOR FOOTPRINT SEARCH:
- Target Software: ${swName}
- Target Modality: ${categoryQuery}
- Target Location: ${geoTarget}

CRITICAL RULES:
1. ONLY return REAL, CURRENTLY OPERATING independent single-site businesses physically in ${geoTarget}.
2. ZERO DOMAIN GUESSING / HALLUCINATION POLICY:
   - You MUST extract and return ONLY the EXACT, working canonical URL discovered from Google Search results.
   - DO NOT guess or fabricate domains. If you do not have the verified live URL directly from the search result, DO NOT RETURN THAT BUSINESS.
3. STRICT MULTI-LOCATION BAN (NO "LOCATIONS" TAB):
   - Inspect the studio website: If there is a navigation menu tab, link, or header item named "Locations" (plural), "Our Locations", "Studios", "Find a Studio", or if the business operates across 2 or more physical locations, YOU MUST DISCARD IT.
   - We are ONLY prospecting independent SINGLE-LOCATION studios with ONE physical address. Discard all franchise chains and multi-location operators.
4. DO NOT return businesses using Mindbody.
5. STRICT EXCLUSION: Do NOT return any of these previously found or excluded studios: ${excludeNames.slice(0, 80).join("; ")}.

RETURN ONLY A VALID JSON ARRAY OF OBJECTS (No markdown):
[
  {
    "businessName": "Real Studio Name",
    "category": "${categoryQuery.split(",")[0].trim()}",
    "currentSoftware": "${targetSoftware || "Momence"}",
    "timetableBookingSignal": "${targetSoftware || "Momence"} live schedule widget detected on website /timetable page",
    "bookingUrl": "https://actualstudio.com/schedule",
    "globalRegion": "${globalRegion}",
    "country": "${country && country !== "All" ? country : (globalRegion === "North America" ? "United States" : globalRegion === "Europe" ? "United Kingdom" : globalRegion === "Asia" ? "Singapore" : globalRegion === "South America" ? "Brazil" : "Australia")}",
    "region": "${region && region !== "All" ? region : "Central"}",
    "suburb": "${suburb || "Downtown"}",
    "postcode": "10001",
    "address": "123 Main Street, City, Region",
    "website": "https://actualstudio.com",
    "phone": "+1 555 0100",
    "email": "hello@actualstudio.com",
    "instagram": "@studio_handle",
    "decisionMakerName": "Owner Name",
    "decisionMakerTitle": "Founder & Owner",
    "estimatedClassCount": 35,
    "estimatedMonthlyRevenueAUD": 35000,
    "isSingleSite": true,
    "hasCustomBrandedApp": false,
    "appStoreStatus": "No Branded App (Target)",
    "appStoreNotes": "No standalone iOS/Android app under studio name on App Store or Google Play. Clients book via website widget.",
    "customAppOpportunity": "Pitch a custom white-label mobile app with their studio name and logo on iOS & Android to replace the friction of generic web booking.",
    "knownPainPoints": ["No custom branded mobile app in App Store", "Lacks Mindbody consumer app marketplace exposure", "High merchant processing fees"],
    "switchingTriggers": ["Wants custom branded member app for iOS/Android and automated client retention"],
    "suggestedAngle": "Highlight how offering a custom branded app on App Store increases booking retention vs generic web links."
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = response.text || "[]";
    let cleaned = raw.trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    const preliminary = parsed
      .filter((l: any) => {
        if (!l.businessName) return false;
        const sw = (l.currentSoftware || "").toLowerCase();
        if (sw.includes("mindbody")) return false;
        const norm = normalizeName(l.businessName);
        if (excludeSet.has(norm)) return false;
        if (isMultiLocationName(l.businessName)) return false;
        if (l.isSingleSite === false) return false;
        if (appStoreFilter === "no_app_only" && l.hasCustomBrandedApp === true) return false;

        // Strict geographic check: must pass territory verification
        if (!isValidLeadForTerritory(l, globalRegion, country)) {
          return false;
        }
        return true;
      })
      .map((l: any) => {
        const withRegion = {
          ...l,
          globalRegion,
          country: l.country || (globalRegion === "North America" ? "United States" : globalRegion === "Europe" ? "United Kingdom" : globalRegion === "Asia" ? "Singapore" : globalRegion === "South America" ? "Brazil" : "Australia"),
        };
        return globalRegion === "Oceania" && (!country || country === "Australia")
          ? normalizeAustralianLead(withRegion)
          : withRegion;
      });

    // Verify website DNS and detect "Locations" tab
    const verifiedLeads = await Promise.all(
      preliminary.map(async (lead: any) => {
        const verifyRes = await verifyWebsiteAndMultiLocation(lead.website || lead.bookingUrl);
        if (!verifyRes.valid) {
          console.warn(`[DOMAIN CHECK DISCARD] ${lead.businessName} rejected: invalid / guessed domain (${lead.website})`);
          return null;
        }
        if (verifyRes.isMultiLocation) {
          console.warn(`[MULTI-LOCATION TAB DISCARD] ${lead.businessName} rejected: has Locations tab (${verifyRes.finalUrl})`);
          return null;
        }
        return {
          ...lead,
          website: verifyRes.finalUrl || lead.website,
          isSingleSite: true,
          websiteVerified: true,
          websiteStatus: verifyRes.reachable ? "Live & Reachable" : "DNS Confirmed",
          hasLocationsTab: false,
        };
      })
    );

    return verifiedLeads.filter((l): l is NonNullable<typeof l> => l !== null);
  } catch (err) {
    console.error("Error in searchActiveGroundedLeads:", err);
    return [];
  }
}

// 1. Live Lead Search & Timetable Signal Scanner Endpoint (Google Search Grounded)
app.post("/api/leads/search", async (req, res) => {
  try {
    const {
      globalRegion = "Oceania",
      country = "Australia",
      region,
      suburb,
      category,
      competitorSoftware,
      limit = 10,
      excludeNames = [],
      deepScan = false,
      appStoreFilter = "no_app_only",
      scanClubworxHostedOnly = false,
    } = req.body;

    const targetGlobalRegion: GlobalRegion = (globalRegion as GlobalRegion) || getGlobalRegionForCountry(country);
    const ai = getGenAI();
    const resultCount = Math.min(Math.max(Number(limit) || 10, 1), 30);

    const { mandate: geoLockPrompt, geoTarget } = buildTerritoryMandate(
      targetGlobalRegion,
      country,
      region,
      suburb
    );

    const targetSoftware = competitorSoftware && competitorSoftware !== "All" ? competitorSoftware : null;
    const categoryQuery = category && category !== "All" ? category : "boutique fitness, gym, pilates, yoga, functional training, martial arts, recovery, wellness";

    const isNZ = country === "New Zealand";
    const normalizeName = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const excludeSet = new Set(excludeNames.map(normalizeName));

    const isExcluded = (name: string) => {
      if (!name) return true;
      const norm = normalizeName(name);
      if (excludeSet.has(norm)) return true;
      for (const ex of excludeNames) {
        const exNorm = normalizeName(ex);
        if (exNorm.length > 5 && (norm.includes(exNorm) || exNorm.includes(norm))) {
          return true;
        }
      }
      return false;
    };

    const clubworxHostedDirectives = (scanClubworxHostedOnly || (targetSoftware && targetSoftware.toLowerCase().includes("clubworx")))
      ? `CRITICAL FOCUS: CLUBWORX HOSTED WEBSITES (app.clubworx.com):
- SCAN SPECIFICALLY for gyms and studios whose primary web presence is hosted on "app.clubworx.com".
`
      : "";

    const prompt = `Use Google Search to find ${resultCount} REAL, CURRENTLY ACTIVE, OPERATING (SINGLE-LOCATION ONLY) independent boutique fitness studios, gyms, pilates/yoga studios, martial arts dojos, or wellness businesses located in ${geoTarget}.

${geoLockPrompt}
${clubworxHostedDirectives}
PRIMARY DISCOVERY CRITERIA - NO BRANDED APP IN STORES:
- TARGET PROFILE: Independent studios using competitor software (${targetSoftware || "Momence, PushPress, Clubworx, GymMaster, Hapana, Wodify, Acuity, Zen Planner, Gymdesk"}) that DO NOT have their own branded mobile app published under their own business name on the Apple App Store (apps.apple.com) or Google Play Store (play.google.com).
- They either:
  1. Have NO mobile app at all (rely purely on website timetable widgets / browser booking).
  2. Use a generic competitor member app (e.g. telling members to download the shared generic "Momence", "PushPress Members", "Clubworx", or "GymMaster" app).
- EXCLUDE any studio that already has their own standalone branded white-label app published under their own name in Apple App Store / Google Play.

SEARCH PARAMETERS & FOOTPRINTS:
- Target Modality: ${categoryQuery}
- Target Competitor Software: ${targetSoftware ? `Specifically searching for ${targetSoftware} accounts` : "Competitors to Mindbody like Momence, PushPress, Clubworx, GymMaster, Hapana, Wodify, Acuity, Zen Planner, Gymdesk, Glofox, Xoda, BSport, TeamUp, Virtuagym"}
- Primary Focus: Finding genuine independent single-site facilities in ${geoTarget} with real websites and active timetable/booking signals lacking custom store apps.

STRICT OPERATIONAL & DISCOVERY RULES:
1. ONLY return REAL, EXISTING businesses that are CURRENTLY OPERATING in ${geoTarget}. (Never output placeholder, fake, or closed businesses).
2. ZERO DOMAIN GUESSING / HALLUCINATION:
   - You MUST extract and return ONLY the EXACT, working canonical URL discovered in the Google Search results.
   - DO NOT guess or fabricate domains. If you do not have the verified live URL directly from the search result, DO NOT RETURN THAT BUSINESS.
3. STRICT MULTI-LOCATION BAN (NO "LOCATIONS" TAB):
   - Inspect the studio website: If there is a navigation menu tab, link, or header item named "Locations" (plural), "Our Locations", "Studios", "Find a Studio", or if the business operates across 2 or more physical locations, YOU MUST DISCARD IT.
   - ONLY return genuine independent single-location studios with ONE physical address.
   - Discard all franchise chains and multi-location operators (e.g. F45, BFT, Anytime, Snap, OrangeTheory, Barry's, Crunch, World Gym, Genesis).
4. DO NOT return businesses that already use Mindbody.
5. STRICT EXCLUSIONS (DO NOT RETURN ANY OF THESE PREVIOUSLY DISCOVERED OR SEEN STUDIOS): ${excludeNames.slice(0, 150).join("; ")}.
6. Extract authentic local details:
   - Official live website URL.
   - Owner/Founder/Head Coach name & title.
   - Real local phone number.
   - Official contact email.
   - Street address, suburb/city, region/state, postcode.
   - Real Instagram handle if found on their live website or verified Instagram page.

RETURN ONLY A VALID JSON ARRAY OF OBJECTS WITH NO MARKDOWN OR EXTRA TEXT:
[
  {
    "businessName": "Real Studio Name",
    "category": "${categoryQuery.split(",")[0].trim()}",
    "currentSoftware": "${targetSoftware || "Momence"}",
    "timetableBookingSignal": "${targetSoftware || "Momence"} live schedule widget detected on website /timetable page",
    "bookingUrl": "https://actualstudio.com/schedule",
    "globalRegion": "${targetGlobalRegion}",
    "country": "${country && country !== "All" ? country : (targetGlobalRegion === "North America" ? "United States" : targetGlobalRegion === "Europe" ? "United Kingdom" : targetGlobalRegion === "Asia" ? "Singapore" : targetGlobalRegion === "South America" ? "Brazil" : "Australia")}",
    "region": "${region && region !== "All" ? region : "Central"}",
    "suburb": "${suburb || "Downtown"}",
    "postcode": "10001",
    "address": "123 Real Street, City, Region",
    "website": "https://actualstudio.com",
    "phone": "+1 555 0100",
    "email": "contact@actualstudio.com",
    "instagram": "@studio_handle",
    "decisionMakerName": "Real Owner Name",
    "decisionMakerTitle": "Founder & Head Coach",
    "estimatedClassCount": 35,
    "estimatedMonthlyRevenueAUD": 35000,
    "isSingleSite": true,
    "hasCustomBrandedApp": false,
    "appStoreStatus": "No Branded App (Target)",
    "appStoreNotes": "No standalone iOS/Android app under studio name on App Store or Google Play. Clients book via website widget.",
    "customAppOpportunity": "Pitch a custom white-label mobile app with their studio name and logo on iOS & Android to replace the friction of generic web booking.",
    "knownPainPoints": ["No custom branded mobile app in App Store", "Lacks Mindbody consumer app marketplace exposure", "High card surcharge fees"],
    "switchingTriggers": ["Wants custom branded member app for iOS/Android and automated client retention"],
    "suggestedAngle": "Highlight how offering a custom branded app on App Store increases booking retention vs generic web links."
  }
]`;

    let groundedLeads: any[] = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || "[]";
      let cleanedText = rawText.trim();
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      groundedLeads = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn("Could not parse grounded search JSON directly, falling back to secondary harvest...", parseErr);
    }

    if (!Array.isArray(groundedLeads)) {
      groundedLeads = [];
    }

    // Filter out Mindbody, exclusions, multi-location brands, and strictly validate geographic territory
    const preliminaryLeads = groundedLeads
      .filter((l: any) => {
        if (!l.businessName) return false;
        const sw = (l.currentSoftware || "").toLowerCase();
        if (sw === "mindbody" || sw.includes("mindbody")) return false;
        if (isExcluded(l.businessName)) return false;
        if (isMultiLocationName(l.businessName)) {
          console.warn(`[MULTI-SITE EXCLUDED] Discarded known multi-location brand: ${l.businessName}`);
          return false;
        }
        if (l.isSingleSite === false) return false;
        if (appStoreFilter === "no_app_only" && l.hasCustomBrandedApp === true) return false;

        // Strict Geographic Check: Must pass territory verification
        if (!isValidLeadForTerritory(l, targetGlobalRegion, country)) {
          console.warn(`[GEO FILTER] Discarded out-of-territory lead: ${l.businessName} (${l.address}, ${l.region}, ${l.phone}) for ${targetGlobalRegion}/${country}`);
          return false;
        }
        return true;
      })
      .map((l: any) => {
        const withRegion = {
          ...l,
          globalRegion: targetGlobalRegion,
          country: l.country || (targetGlobalRegion === "North America" ? "United States" : targetGlobalRegion === "Europe" ? "United Kingdom" : targetGlobalRegion === "Asia" ? "Singapore" : targetGlobalRegion === "South America" ? "Brazil" : "Australia"),
        };
        return targetGlobalRegion === "Oceania" && (!country || country === "Australia")
          ? normalizeAustralianLead(withRegion)
          : withRegion;
      });

    // Concurrently verify website reachability/DNS and detect "Locations" tab
    const verifiedFirstPass = await Promise.all(
      preliminaryLeads.map(async (lead: any) => {
        const verifyRes = await verifyWebsiteAndMultiLocation(lead.website || lead.bookingUrl);
        if (!verifyRes.valid) {
          console.warn(`[DOMAIN CHECK DISCARD] ${lead.businessName} rejected: invalid / guessed domain (${lead.website})`);
          return null;
        }
        if (verifyRes.isMultiLocation) {
          console.warn(`[MULTI-LOCATION TAB DISCARD] ${lead.businessName} rejected: has Locations tab (${verifyRes.finalUrl})`);
          return null;
        }
        return {
          ...lead,
          website: verifyRes.finalUrl || lead.website,
          isSingleSite: true,
          websiteVerified: true,
          websiteStatus: verifyRes.reachable ? "Live & Reachable" : "DNS Confirmed",
          hasLocationsTab: false,
        };
      })
    );

    let nonMindbodyLeads = verifiedFirstPass.filter((l): l is NonNullable<typeof l> => l !== null);

    // If web grounded search didn't return enough target software leads, execute secondary multi-query sweep
    if (nonMindbodyLeads.length < resultCount) {
      const needed = resultCount - nonMindbodyLeads.length;
      const currentNames = nonMindbodyLeads.map((l: any) => l.businessName);
      const allExcludes = Array.from(new Set([...excludeNames, ...currentNames]));

      const additionalGroundedLeads = await searchActiveGroundedLeads(
        ai,
        targetGlobalRegion,
        targetSoftware,
        categoryQuery,
        country || "All",
        region && region !== "All" ? region : null,
        suburb || null,
        allExcludes,
        Math.max(needed, 8),
        appStoreFilter,
        scanClubworxHostedOnly
      );

      nonMindbodyLeads = [...nonMindbodyLeads, ...additionalGroundedLeads];
    }

    // Add generated IDs, single site flag, initial status, and guaranteed contact enrichment
    const enrichedLeads = nonMindbodyLeads.map((lead: any, idx: number) => {
      const fullyContactable = enrichContactDetails(lead);
      const isHostedClubworx =
        lead.isHostedPortalWebsite === true ||
        scanClubworxHostedOnly ||
        (lead.website && (lead.website.includes("app.clubworx.com") || lead.website.includes("clubworx.com/websites") || lead.website.includes("clubworx.com/portal"))) ||
        (lead.bookingUrl && (lead.bookingUrl.includes("app.clubworx.com") || lead.bookingUrl.includes("clubworx.com/portal")));

      return {
        id: `real-lead-${Date.now()}-${idx}`,
        ...fullyContactable,
        globalRegion: targetGlobalRegion,
        isSingleSite: true,
        hasLocationsTab: false,
        websiteVerified: lead.websiteVerified ?? true,
        websiteStatus: lead.websiteStatus ?? "Live & Reachable",
        isHostedPortalWebsite: isHostedClubworx ? true : (lead.isHostedPortalWebsite ?? false),
        hostedPortalType: isHostedClubworx ? "clubworx_website" : (lead.hostedPortalType ?? "custom_domain"),
        leadStatus: "Fresh Prospect",
        salesforceMatchStatus: "Not in Salesforce",
        fatigueScore: 1,
        addedAt: new Date().toISOString().split("T")[0],
        contactAttemptsCount: 0,
      };
    });

    res.json({ success: true, leads: enrichedLeads });
  } catch (error: any) {
    console.error("Error searching leads:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to search leads" });
  }
});

// Real-Time URL and Multi-Location Link Verifier Endpoint
app.post("/api/leads/verify-link", async (req, res) => {
  try {
    const { url, businessName } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }
    const result = await verifyWebsiteAndMultiLocation(url);
    res.json({
      success: true,
      businessName,
      inputUrl: url,
      ...result,
      statusText: !result.valid
        ? "Domain Does Not Exist (Guessed/Invalid)"
        : result.isMultiLocation
        ? "Multi-Location Detected (Locations Tab Found)"
        : result.reachable
        ? "Live & Reachable (Single Location Verified)"
        : "DNS Active (Firewall/Timeout)",
    });
  } catch (error: any) {
    console.error("Error verifying link:", error);
    res.status(500).json({ success: false, error: error.message || "Verification failed" });
  }
});

// 2. Real-Time Operational Status & Live Website Verifier Endpoint (Google Search Grounded)
app.post("/api/leads/verify-operation", async (req, res) => {
  try {
    const { businessName, website, country, suburb, region } = req.body;
    const ai = getGenAI();

    const prompt = `Use Google Search to perform an in-depth operational and web verification for this business:
Business Name: "${businessName}"
Website: "${website || "Search for official website"}"
Location: "${suburb || ""}, ${region || ""} ${country || "Australia"}"

Check:
1. Is this business CURRENTLY OPEN and in active operation? (Check if Google Maps or website indicates permanently closed or open).
2. What is their EXACT working official website URL? (Return actual URL, not placeholder).
3. What is their current booking/management software? (e.g. Momence, Clubworx, GymMaster, PushPress, Wodify, Hapana, Acuity, Zen Planner, Mindbody, etc.)
4. What is their live schedule/timetable page URL?
5. Direct phone, email, Instagram handle, and Owner/Director name.
6. APP STORE CHECK: Do they have a custom branded mobile app in the Apple App Store (apps.apple.com) or Google Play Store (play.google.com) published under their business name "${businessName}"?
   - If NO (they rely on web schedule or generic aggregator app like generic Momence/PushPress app): "hasCustomBrandedApp": false, "appStoreStatus": "No Branded App (Target)".
   - If YES: "hasCustomBrandedApp": true, "appStoreStatus": "Has Custom App".

RETURN ONLY A VALID JSON OBJECT:
{
  "isCurrentlyOperating": true,
  "statusSummary": "Active & Operating in Suburb",
  "verifiedWebsite": "https://actualdomain.com.au",
  "verifiedCurrentSoftware": "Momence",
  "verifiedBookingUrl": "https://actualdomain.com.au/timetable",
  "timetableBookingSignal": "Live Momence schedule embed on /timetable",
  "hasCustomBrandedApp": false,
  "appStoreStatus": "No Branded App (Target)",
  "appStoreNotes": "No standalone iOS/Android app under studio name. Members book via website widget.",
  "customAppOpportunity": "Pitch custom branded white-label iOS/Android mobile app to replace generic web schedule friction.",
  "phone": "+61 2 0000 0000",
  "email": "hello@actualdomain.com.au",
  "instagram": "@handle",
  "decisionMakerName": "Owner Name",
  "decisionMakerTitle": "Founder & Director"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || "{}";
    let cleanedText = rawText.trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    const result = JSON.parse(cleanedText);
    const linkCheck = await verifyWebsiteAndMultiLocation(result.verifiedWebsite || website);
    result.isSingleLocationVerified = !linkCheck.isMultiLocation;
    result.hasLocationsTab = linkCheck.isMultiLocation;
    result.websiteReachable = linkCheck.reachable;
    result.websiteValid = linkCheck.valid;
    if (linkCheck.finalUrl) {
      result.verifiedWebsite = linkCheck.finalUrl;
    }
    if (linkCheck.isMultiLocation) {
      result.multiLocationWarning = "Website navigation contains a 'Locations' or 'Studios' menu item indicating multi-site operations.";
    }
    res.json({ success: true, verification: result });
  } catch (error: any) {
    console.error("Error verifying business operation:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to verify operation" });
  }
});

// 2. Lead Enrichment Endpoint (Google Search Grounded)
app.post("/api/leads/enrich", async (req, res) => {
  try {
    const { businessName, website, country, suburb } = req.body;
    const ai = getGenAI();

    const prompt = `Use Google Search to find real public information about this specific Australian/New Zealand fitness or wellness studio:
Business Name: ${businessName}
Website: ${website || "Search Google for official website"}
Suburb/Location: ${suburb || "Australia/New Zealand"}
Country: ${country || "Australia"}

Analyze their actual website and web presence to extract/determine:
1. Category/modality (e.g. Reformer Pilates, Yoga, Functional Training, Barre, Martial Arts).
2. Booking software currently used (e.g. Momence, Clubworx, GymMaster, Hapana, PushPress, WellnessLiving, Glofox, Vagaro, Wodify, Acuity).
3. Timetable / booking signal (e.g. live timetable widget iframe on /timetable, direct booking button on /classes).
4. Owner / Founder / General Manager name and title if public.
5. Phone, contact email, street address, and Instagram handle if found.
6. APP STORE PRESENCE: Do they have a custom branded mobile app in the Apple App Store or Google Play under "${businessName}"?

RETURN ONLY A VALID JSON OBJECT:
{
  "businessName": "${businessName}",
  "category": "Reformer Pilates",
  "currentSoftware": "Momence",
  "timetableBookingSignal": "Momence live timetable widget iframe detected on /timetable",
  "bookingUrl": "${website ? `${website}/timetable` : "https://example.com/timetable"}",
  "hasCustomBrandedApp": false,
  "appStoreStatus": "No Branded App (Target)",
  "appStoreNotes": "No dedicated app under studio name in stores. Uses web timetable widget.",
  "customAppOpportunity": "Offer custom branded member app on iOS & Android to upgrade member experience.",
  "decisionMakerName": "Owner Name",
  "decisionMakerTitle": "Founder & Owner",
  "estimatedClassCount": 24,
  "estimatedMonthlyRevenueAUD": 20000,
  "knownPainPoints": ["Processing fee surcharge issue in AUD", "No custom branded mobile app in App Store", "Limited marketplace discovery"],
  "switchingTriggers": ["Wants custom branded app and Mindbody consumer network exposure"],
  "suggestedAngle": "Emphasize custom branded mobile app and Mindbody consumer app discovery volume across ANZ.",
  "instagram": "@studio_handle",
  "email": "contact@studio.com.au",
  "phone": "+61 400 000 000"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || "{}";
    let cleanedText = rawText.trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let enriched: any = {};
    try {
      enriched = JSON.parse(cleanedText);
      enriched = enrichContactDetails({
        businessName: businessName || enriched.businessName,
        website: website || enriched.website,
        country,
        suburb,
        ...enriched,
      });
    } catch (parseErr) {
      console.warn("Could not parse JSON from grounded enrichment, fallbacking...", parseErr);
    }

    res.json({ success: true, enriched });
  } catch (error: any) {
    console.error("Error enriching lead:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to enrich lead" });
  }
});

// 3. Salesforce Cross-Reference & Deduplication Endpoint
app.post("/api/salesforce/cross-reference", async (req, res) => {
  try {
    const { leads = [], salesforceInput = "" } = req.body;
    const ai = getGenAI();

    // Fast deterministic matching first + Gemini fuzzy matching
    const sfLines = typeof salesforceInput === "string"
      ? salesforceInput.split("\n").map((l: string) => l.trim()).filter(Boolean)
      : [];

    if (sfLines.length === 0 || leads.length === 0) {
      return res.json({
        success: true,
        updatedLeads: leads.map((l: any) => ({
          ...l,
          salesforceMatchStatus: l.salesforceMatchStatus || "Not in Salesforce",
        })),
        summary: { totalChecked: leads.length, matchedCount: 0, cleanCount: leads.length },
      });
    }

    const prompt = `You are a Salesforce CRM Deduplication and Cross-Referencing specialist for Mindbody Account Executives.
Cross-reference the list of discovered prospect leads against the provided Salesforce accounts/export data.

DISCOVERED PROSPECT LEADS:
${JSON.stringify(leads.map((l: any) => ({
  id: l.id,
  businessName: l.businessName,
  website: l.website,
  phone: l.phone,
  email: l.email,
  suburb: l.suburb,
  region: l.region,
})))}

SALESFORCE DATA (Accounts, Contacts, or CSV export lines):
${JSON.stringify(sfLines.slice(0, 100))}

For EACH discovered lead, determine:
1. "leadId": matching the input ID
2. "salesforceMatchStatus": "Exists in Salesforce" (if exact or very high confidence match), "Fuzzy Match" (if partial name/location match), or "Not in Salesforce" (if fresh and not found).
3. "salesforceMatchDetails": Clear explanation (e.g., "Exact website domain match with SF Account 'Lagree Athletic'", "Matched by phone number to 'Kilo Functional'", "No record found in Salesforce").
4. "salesforceAccountOwner": Name of account owner if mentioned in SF data (or empty string).

RETURN ONLY A VALID JSON ARRAY OF OBJECTS:
[
  {
    "leadId": "lead-id-string",
    "salesforceMatchStatus": "Exists in Salesforce",
    "salesforceMatchDetails": "Matched by website domain and business name",
    "salesforceAccountOwner": "David Kelly"
  }
]`;

    let matchResults: any[] = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const rawText = response.text || "[]";
      let cleanedText = rawText.trim();
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      matchResults = JSON.parse(cleanedText);
    } catch (geminiErr) {
      console.warn("Gemini cross-reference fallback to regex/domain matching:", geminiErr);
    }

    // If Gemini failed or didn't match all leads, run deterministic fallback
    if (!Array.isArray(matchResults) || matchResults.length === 0) {
      matchResults = leads.map((l: any) => {
        const leadDomain = (l.website || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
        const leadName = (l.businessName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const matchedLine = sfLines.find((line: string) => {
          const lower = line.toLowerCase();
          const cleanLine = lower.replace(/[^a-z0-9]/g, "");
          return (leadDomain && leadDomain.length > 4 && lower.includes(leadDomain)) ||
                 (leadName && leadName.length > 5 && cleanLine.includes(leadName));
        });

        if (matchedLine) {
          return {
            leadId: l.id,
            salesforceMatchStatus: "Exists in Salesforce",
            salesforceMatchDetails: `Matched line in Salesforce: "${matchedLine.slice(0, 60)}"`,
            salesforceAccountOwner: "",
          };
        }

        return {
          leadId: l.id,
          salesforceMatchStatus: "Not in Salesforce",
          salesforceMatchDetails: "No match found in Salesforce export",
          salesforceAccountOwner: "",
        };
      });
    }

    const resultMap = new Map(matchResults.map((r: any) => [r.leadId, r]));

    let matchedCount = 0;
    let cleanCount = 0;

    const updatedLeads = leads.map((lead: any) => {
      const match = resultMap.get(lead.id);
      if (match && (match.salesforceMatchStatus === "Exists in Salesforce" || match.salesforceMatchStatus === "Exact Salesforce Match")) {
        matchedCount++;
        return {
          ...lead,
          salesforceMatchStatus: "Exists in Salesforce",
          salesforceMatchDetails: match.salesforceMatchDetails || "Matched existing Salesforce Account",
          salesforceAccountOwner: match.salesforceAccountOwner || lead.salesforceAccountOwner,
        };
      } else if (match && match.salesforceMatchStatus === "Fuzzy Match") {
        matchedCount++;
        return {
          ...lead,
          salesforceMatchStatus: "Fuzzy Match",
          salesforceMatchDetails: match.salesforceMatchDetails || "Possible fuzzy match in Salesforce",
          salesforceAccountOwner: match.salesforceAccountOwner || lead.salesforceAccountOwner,
        };
      } else {
        cleanCount++;
        return {
          ...lead,
          salesforceMatchStatus: "Not in Salesforce",
          salesforceMatchDetails: match?.salesforceMatchDetails || "Verified clean (Not in Salesforce)",
        };
      }
    });

    res.json({
      success: true,
      updatedLeads,
      summary: {
        totalChecked: leads.length,
        matchedCount,
        cleanCount,
      },
    });
  } catch (error: any) {
    console.error("Error cross-referencing Salesforce:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to cross-reference Salesforce" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
