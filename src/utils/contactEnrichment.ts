export function enrichContactDetails<T extends {
  businessName: string;
  website?: string;
  bookingUrl?: string;
  timetableBookingSignal?: string;
  currentSoftware?: string;
  email?: string;
  phone?: string;
  country?: string;
  region?: string;
  suburb?: string;
  decisionMakerName?: string;
  decisionMakerTitle?: string;
  hasCustomBrandedApp?: boolean;
  appStoreStatus?: string;
  appStoreNotes?: string;
  customAppOpportunity?: string;
}>(lead: T): T {
  const result = { ...lead };

  // 1. Sanitize Website URL
  let cleanWebsite = (result.website || '').trim();
  const isInvalidWebsite =
    !cleanWebsite ||
    cleanWebsite.includes('example.com') ||
    cleanWebsite.includes('not found') ||
    cleanWebsite.includes('unknown') ||
    cleanWebsite.includes('n/a') ||
    cleanWebsite === 'https://' ||
    cleanWebsite === 'http://';

  if (isInvalidWebsite) {
    result.website = '';
  } else if (!cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
    result.website = `https://${cleanWebsite}`;
  }

  // Derive domain from website if available
  let domain = '';
  if (result.website) {
    try {
      const urlObj = new URL(result.website);
      domain = urlObj.hostname.replace(/^www\./, '');
    } catch {
      domain = '';
    }
  }

  // Clean Booking URL: only keep if valid
  if (result.bookingUrl) {
    const isInvalidBooking =
      result.bookingUrl.includes('example.com') ||
      result.bookingUrl.includes('not found') ||
      result.bookingUrl.includes('unknown');
    if (isInvalidBooking) {
      result.bookingUrl = result.website ? `${result.website.replace(/\/$/, '')}/timetable` : '';
    }
  }

  // Clean Email
  const cleanEmail = (result.email || '').trim().toLowerCase();
  const isInvalidEmail =
    !cleanEmail ||
    cleanEmail.includes('example.com') ||
    cleanEmail.includes('not found') ||
    cleanEmail.includes('unknown') ||
    cleanEmail.includes('not specified') ||
    cleanEmail.includes('n/a') ||
    cleanEmail.includes('@app.clubworx.com') ||
    cleanEmail.includes('@clubworx.com') ||
    cleanEmail.includes('@momence.com') ||
    cleanEmail.includes('@pushpress.com') ||
    !cleanEmail.includes('@');

  if (isInvalidEmail) {
    // Never fabricate or guess fake .com.au emails from business names
    result.email = '';
  } else {
    result.email = cleanEmail;
  }

  // 2.1 Detect Hosted Portal Website (e.g. app.clubworx.com/websites/)
  const isClubworxHosted =
    (result.website && (result.website.includes('app.clubworx.com') || result.website.includes('clubworx.com/websites') || result.website.includes('clubworx.com/portal'))) ||
    (result.bookingUrl && (result.bookingUrl.includes('app.clubworx.com') || result.bookingUrl.includes('clubworx.com/portal')));

  if (isClubworxHosted) {
    (result as any).isHostedPortalWebsite = true;
    (result as any).hostedPortalType = 'clubworx_website';
    if (!result.timetableBookingSignal || result.timetableBookingSignal.includes('widget')) {
      result.timetableBookingSignal = 'Entire website and schedule hosted on app.clubworx.com (no custom domain, no branded store app)';
    }
    if (!result.customAppOpportunity || result.customAppOpportunity.includes('replace')) {
      result.customAppOpportunity = 'Studio operates on a generic app.clubworx.com link with no custom mobile app. Prime pitch for Mindbody Branded App and professional custom web widgets.';
    }
  }

  // 3. Clean Phone
  const cleanPhone = (result.phone || '').trim();
  const isInvalidPhone =
    !cleanPhone ||
    cleanPhone.toLowerCase().includes('not found') ||
    cleanPhone.toLowerCase().includes('unknown') ||
    cleanPhone.toLowerCase().includes('not specified') ||
    cleanPhone.toLowerCase().includes('n/a') ||
    cleanPhone.includes('000-0000') ||
    cleanPhone.includes('0000 0000') ||
    cleanPhone.includes('1234567') ||
    cleanPhone.length < 8;

  if (isInvalidPhone) {
    result.phone = '';
  } else {
    result.phone = cleanPhone;
  }

  // 4. Clean Decision Maker Name & Title
  const cleanDM = (result.decisionMakerName || '').trim();
  const isInvalidDM =
    !cleanDM ||
    cleanDM.toLowerCase().includes('unknown') ||
    cleanDM.toLowerCase().includes('not found') ||
    cleanDM.toLowerCase().includes('not specified') ||
    cleanDM.toLowerCase().includes('n/a');

  if (isInvalidDM) {
    result.decisionMakerName = 'Studio Owner / Director';
  }

  if (!result.decisionMakerTitle || result.decisionMakerTitle.toLowerCase().includes('not')) {
    result.decisionMakerTitle = 'Founder & Owner';
  }

  // 5. App Store Presence & Opportunity Formatting
  if (result.hasCustomBrandedApp === undefined) {
    result.hasCustomBrandedApp = false;
  }

  const swName = result.currentSoftware || 'competitor software';
  if (!result.appStoreStatus) {
    result.appStoreStatus = 'No Branded App (Target)';
  }

  if (!result.appStoreNotes) {
    result.appStoreNotes = `No standalone iOS/Android app found under "${result.businessName}". Relies on ${swName} web timetable widget.`;
  }

  if (!result.customAppOpportunity) {
    result.customAppOpportunity = `Pitch a custom white-label mobile app with their studio name on App Store & Google Play to eliminate ${swName}'s generic web booking barrier.`;
  }

  return result;
}
