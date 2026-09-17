import { CompetitorBattlecard } from '../types';

export const MINDBODY_PRICING_AND_RATES = {
  tierPricing: 'Flexible platform tiers starting from $89/month up to $369/month for top-tier ultimate capabilities.',
  paymentRates: {
    cardNotPresent: '2.7% + 25c (CNP - Online, App, Auto-pays)',
    cardPresent: '2.7% + 5c (CP - Terminal & In-Studio EFTPOS)',
    directDebit: '1.95% + 25c (DD - Direct Debit / BECS)',
  },
  keyDifferentiators: [
    'Exclusive Attentive Partnership: Industry-leading SMS & marketing automation natively driving high member LTV.',
    'Branded Mobile App: Dedicated custom iOS/Android app experience natively integrated for studio members.',
    'Unbeatable AU/NZ Rates: Direct Debit at 1.95% + 25c and Terminal EFTPOS at 2.7% + 5c saves studios thousands vs Stripe/Square fees.',
    'Mindbody Consumer Marketplace: Unmatched local discovery bringing thousands of new member bookings across AU & NZ.'
  ]
};

export const COMPETITOR_BATTLECARDS: CompetitorBattlecard[] = [
  {
    id: 'bat-momence',
    softwareName: 'Momence',
    marketShareANZ: 'Fast growing in Reformer Pilates, Yoga & Boutique Studios across NSW/VIC/Auckland',
    typicalCustomerProfile: 'Modern boutique studio owners, heavy emphasis on Instagram aesthetics and online video hosting.',
    keyWeaknesses: [
      'Lacks native Attentive SMS integration — Momence relies on basic, expensive internal SMS credits or Zapier workarounds.',
      'Hidden transaction surcharges and expensive add-ons for branded mobile apps or video hosting.',
      'No ClassPass direct API integration — leads to double bookings or manual roster sync.',
      'Lacks Mindbody Marketplace reach — Momence relies entirely on studio self-marketing.',
      'Higher card processing fees in AUD/NZD compared to Mindbody rates (1.95% + 25c Direct Debit).'
    ],
    mindbodyAdvantages: [
      'Mindbody Exclusive Attentive Partnership: Turnkey SMS marketing and automated lifecycle funnels driving high retention.',
      'Branded Mobile App included natively, delivering a custom iOS/Android experience for members.',
      'Highly Competitive AU/NZ Payment Rates: 2.7% + 25c CNP, 2.7% + 5c CP (terminals), and 1.95% + 25c Direct Debit.',
      'Top platform pricing from $89/mo to $369/mo with zero hidden add-on fees.',
      'Mindbody Marketplace exposes studio to millions of active wellness consumers in Sydney, Melbourne, Brisbane & Auckland.'
    ],
    killerDiscoveryQuestions: [
      '"What percentage are you paying on merchant transaction fees and SMS credits with Momence every month?"',
      '"How are you currently running automated SMS marketing, and how much would exclusive Attentive automation boost your retention?"',
      '"How many new clients walked through your door last month directly from consumer marketplace discovery rather than your own Instagram ads?"'
    ],
    pricingOverview: 'Starts around $129-$249 USD/mo + hidden transaction fees on add-ons vs Mindbody $89-$369 AUD/mo.',
    commonObjectionsAndHandlers: [
      {
        objection: 'Momence is much cheaper and easier to use than Mindbody.',
        handler: 'Momence appears cheaper on base price, but once you add SMS credits, app fees, and higher transaction surcharges, Mindbody is actually more cost-effective—starting from $89/mo with our unbeatable 1.95% + 25c Direct Debit rates and exclusive Attentive marketing partnership.'
      },
      {
        objection: 'We switched from Mindbody to Momence 2 years ago and loved the cleaner UI.',
        handler: 'We completely understand why studios looked for alternatives back then. Mindbody has completely redesigned our interface, added our exclusive Attentive SMS marketing engine, and launched top platform pricing from $89 to $369/mo. Let me show you 5 minutes of the new Mindbody experience.'
      }
    ],
    recentSwitchWinStory: 'Form & Flow Pilates in Sydney switched from Momence to Mindbody, saving $420/month on processing fees with 1.95% Direct Debit and gaining 38 new monthly recurring members in 60 days via Mindbody Marketplace.'
  },
  {
    id: 'bat-xoda',
    softwareName: 'Xoda',
    marketShareANZ: 'Active in Australian boutique fitness, Reformer Pilates, and group training studios',
    typicalCustomerProfile: 'Australian boutique fitness owners needing member management and scheduling.',
    keyWeaknesses: [
      'Lacks the global and regional consumer marketplace exposure of Mindbody.',
      'No exclusive Attentive SMS marketing automation partnership.',
      'Limited branded app customisation options compared to Mindbody native Branded App.',
      'Lacks deep reporting and multi-resource / multi-studio scheduling analytics.'
    ],
    mindbodyAdvantages: [
      'Exclusive Attentive Marketing integration for automated SMS retention workflows.',
      'Mindbody Branded Mobile App providing a high-end, dedicated app experience.',
      'Superior AU/NZ merchant pricing: 2.7% + 25c CNP, 2.7% + 5c CP (terminals), 1.95% + 25c Direct Debit.',
      'Platform tiers starting at just $89/mo up to $369/mo for complete top-tier platform features.',
      'Mindbody Marketplace driving high organic discovery across AU & NZ.'
    ],
    killerDiscoveryQuestions: [
      '"How are you currently handling SMS re-engagement for lapsed members in Xoda?"',
      '"What are your current merchant rates for Direct Debit and card transactions in Xoda?"'
    ],
    pricingOverview: 'Varies from $150-$300 AUD/mo with variable processing fees.',
    commonObjectionsAndHandlers: [
      {
        objection: 'Xoda gives us local Australian support.',
        handler: 'Mindbody has a dedicated Sydney-based team offering full local phone support, integrated 1.95% Direct Debit, and our exclusive Attentive marketing suite starting at just $89/month.'
      }
    ],
    recentSwitchWinStory: 'Pulse Movement Studio in Melbourne switched from Xoda to Mindbody and boosted member retention by 22% using Attentive SMS campaigns.'
  },
  {
    id: 'bat-pushpress',
    softwareName: 'PushPress',
    marketShareANZ: 'Popular among CrossFit boxes, functional gyms, and martial arts studios in AU/NZ',
    typicalCustomerProfile: 'Functional fitness coaches, boutique gyms, and boutique class operators.',
    keyWeaknesses: [
      'Lacks consumer marketplace discovery network for attracting non-traditional gym goers.',
      'No exclusive Attentive marketing partnership for automated lifecycle SMS.',
      'Limited capability for multi-resource scheduling (e.g. saunas, PT rooms, golf simulator bays).',
      'Higher transaction fees on online and auto-pay memberships.'
    ],
    mindbodyAdvantages: [
      'Seamless multi-resource scheduling for classes, 1-on-1 sessions, saunas, and simulator bays.',
      'Mindbody Exclusive Attentive Marketing Suite for maximum member lifecycle value.',
      'Industry-leading payment rates: 2.7% + 25c CNP, 2.7% + 5c CP, 1.95% + 25c Direct Debit.',
      'Mindbody Branded Mobile App elevates studio brand image.',
      'Transparent pricing from $89/mo to $369/mo.'
    ],
    killerDiscoveryQuestions: [
      '"How do you handle automated SMS follow-ups for prospects who drop off after a trial class in PushPress?"',
      '"If you want to add recovery rooms or private PT appointments, how easily does PushPress monetize that?"'
    ],
    pricingOverview: 'Starts free with high transaction cuts or $159-$229 USD/mo.',
    commonObjectionsAndHandlers: [
      {
        objection: 'PushPress is easy for basic gym check-ins.',
        handler: 'PushPress is fine for basic gym check-ins, but when you want to scale revenue with automated Attentive SMS marketing, lower 1.95% Direct Debit rates, and marketplace discovery, Mindbody gives you a far complete growth engine starting at $89/month.'
      }
    ],
    recentSwitchWinStory: 'Forge Athletic in Brisbane switched from PushPress to Mindbody, saving 1.2% per Direct Debit transaction and filling 35 extra class spots monthly.'
  },
  {
    id: 'bat-clubworx',
    softwareName: 'Clubworx',
    marketShareANZ: 'Popular in Australian regional gyms, Martial Arts, BJJ, and local community fitness centres',
    typicalCustomerProfile: 'Single-owner martial arts dojos, local gyms, and Australian community fitness centres.',
    keyWeaknesses: [
      'Heavy reliance on generic app.clubworx.com hosted pages: studios lack their own independent domain or custom store app, severely hurting local Google SEO authority.',
      'Outdated mobile apps with frequent Android check-in freezes and lack of dedicated branded app in stores.',
      'No automated direct debit retry engine or low 1.95% Direct Debit rates.',
      'Extremely limited marketing automation — lacks native Attentive partnership.',
      'Lacks appointment scheduling for 1-on-1 personal training or treatment rooms.'
    ],
    mindbodyAdvantages: [
      'Mindbody payment processing rates: 2.7% + 25c CNP, 2.7% + 5c CP, 1.95% + 25c Direct Debit.',
      'Dedicated Branded Mobile App published under your studio name in Apple & Google Play stores.',
      'High-converting embeddable website widgets allowing full brand equity on your own custom domain.',
      'Exclusive Attentive Partnership for automated welcome, win-back, and SMS campaigns.',
      'Seamless combination of group classes, belt grading events, and 1-on-1 PT appointments in one platform.'
    ],
    killerDiscoveryQuestions: [
      '"I noticed your studio runs directly on an app.clubworx.com/websites portal—have you considered how lacking your own custom domain and dedicated store app impacts prospective member trust and local Google SEO?"',
      '"How many hours a week do you or your staff spend manually chasing up failed direct debits or expired cards?"',
      '"How much could you save on merchant processing if your Direct Debit rate was capped at 1.95% + 25c?"'
    ],
    pricingOverview: 'Starts around $99 AUD/mo for basic tiers, scaling up with member count.',
    commonObjectionsAndHandlers: [
      {
        objection: 'Clubworx gives us a free hosted website at app.clubworx.com so we do not have to build one.',
        handler: 'Having your website on app.clubworx.com/websites means all Google SEO search authority builds Clubworx’s domain instead of your business. With Mindbody, you get beautiful embed widgets on your own domain plus a standalone custom iOS/Android app published under your own business name starting at $89/month.'
      },
      {
        objection: 'Clubworx is an Australian company and we like supporting local software.',
        handler: 'We respect local software support! Mindbody maintains a full Sydney team with local phone support, unbeatable 1.95% Direct Debit rates, and our exclusive Attentive SMS marketing integration starting at $89/mo.'
      }
    ],
    recentSwitchWinStory: 'Apex Performance Gym in Brisbane switched from Clubworx to Mindbody, saving 8 hours a week in manual payment chasing and increasing direct debit recovery by $3,200/month.'
  },
  {
    id: 'bat-gymmaster',
    softwareName: 'GymMaster',
    marketShareANZ: 'Strong presence in NZ and AU 24/7 keycard gyms and health clubs',
    typicalCustomerProfile: '24/7 unstaffed keycard/Bluetooth door access gyms, traditional fitness clubs.',
    keyWeaknesses: [
      'Poor experience for boutique group fitness, Pilates, or wellness appointments.',
      'Clunky, non-responsive email marketing templates without Attentive SMS.',
      'Weak consumer discovery app presence compared to Mindbody Marketplace.',
      'Unrefined reporting for boutique class package pass utilization.'
    ],
    mindbodyAdvantages: [
      'Combines robust 24/7 door access control with world-class boutique class & appointment scheduling.',
      'Mindbody Branded Mobile App allows members to unlock door gates directly via phone Bluetooth/NFC.',
      'Mindbody Exclusive Attentive Marketing Suite with AI-driven win-back campaigns.',
      'Superior financial reporting with 2.7% + 25c CNP and 1.95% + 25c Direct Debit rates.'
    ],
    killerDiscoveryQuestions: [
      '"How effectively does GymMaster help you upsell your 24/7 gym members into higher-ticket group classes or PT packages using SMS?"',
      '"Are your merchant fees optimized with 1.95% Direct Debit rates?"'
    ],
    pricingOverview: 'Starts from $89-$199 USD/mo + door hardware modules.',
    commonObjectionsAndHandlers: [
      {
        objection: 'GymMaster handles our door hardware gate access perfectly.',
        handler: 'Door access is crucial, and Mindbody integrates seamlessly with leading 24/7 access control systems while giving you a vastly superior consumer mobile app, Attentive SMS marketing engine, and 1.95% Direct Debit rates.'
      }
    ],
    recentSwitchWinStory: 'The Vault 24/7 Fitness in Auckland added $14,000 in high-margin class add-ons within 90 days after switching from GymMaster to Mindbody.'
  },
  {
    id: 'bat-hapana',
    softwareName: 'Hapana',
    marketShareANZ: 'Higher-end boutique fitness franchises and premium multi-location hubs in Sydney/Melbourne',
    typicalCustomerProfile: 'High-volume boutique franchises (HIIT, Cycle, Functional) needing custom app builds.',
    keyWeaknesses: [
      'Very high monthly software cost ($350-$600+ AUD/mo) compared to Mindbody ($89-$369/mo).',
      'Customer support SLA response times can take up to 48 hours.',
      'Lacks the consumer foot-traffic volume of Mindbody Marketplace.',
      'Complex setup and steep learning curve for new reception staff.'
    ],
    mindbodyAdvantages: [
      'Top platform pricing from $89/mo to $369/mo — saving up to $300+/month vs Hapana.',
      'Exclusive Attentive Partnership for automated high-converting SMS marketing.',
      'Dedicated local Sydney-based Account Executive and Support Team with fast resolution times.',
      'Unbeatable AU/NZ payment processing rates: 2.7% + 25c CNP, 2.7% + 5c CP, 1.95% + 25c Direct Debit.'
    ],
    killerDiscoveryQuestions: [
      '"Why pay Hapana $400-$600/month when Mindbody top platform caps at $369/month with our exclusive Attentive SMS partnership?"',
      '"How many new clients does Hapana actively bring into your studio each month without you spending money on Facebook ads?"'
    ],
    pricingOverview: 'High tier pricing starting from $350-$600+ AUD/mo per site vs Mindbody $89-$369 AUD/mo.',
    commonObjectionsAndHandlers: [
      {
        objection: 'Hapana built a custom branded app for us.',
        handler: 'Mindbody offers custom Branded Mobile Apps with equal or superior UI, but at $89-$369/mo total software cost and backed by our exclusive Attentive SMS marketing engine and 1.95% Direct Debit rates.'
      }
    ],
    recentSwitchWinStory: 'Radiant Sun Wellness in Manly switched from Hapana to Mindbody, cutting software overhead by $250/month while gaining Sydney local support and Attentive SMS automation.'
  },
  {
    id: 'bat-wodify',
    softwareName: 'Wodify',
    marketShareANZ: 'CrossFit affiliates, functional training boxes, and barbell clubs',
    typicalCustomerProfile: 'CrossFit box owners and workout tracking enthusiast coaches.',
    keyWeaknesses: [
      'Expensive pricing tiers with frequent rate increases.',
      'Limited capability for non-CrossFit modalities like 1-on-1 PT, massage, or recovery saunas.',
      'No consumer marketplace discovery for general fitness seekers or Attentive SMS partnership.'
    ],
    mindbodyAdvantages: [
      'Allows studios to seamlessly expand into recovery, wellness, 1-on-1 PT, and golf simulator bays.',
      'Exclusive Attentive SMS marketing for member lifecycle retention.',
      'Transparent platform tiers from $89/mo to $369/mo with 1.95% + 25c Direct Debit rates.',
      'Massive marketplace exposure to attract non-traditional CrossFitters.'
    ],
    killerDiscoveryQuestions: [
      '"If you wanted to offer private PT sessions, recovery saunas, or golf bays tomorrow, how easily could Wodify schedule and monetize that?"'
    ],
    pricingOverview: 'Ranges from $149-$299 USD/mo.',
    commonObjectionsAndHandlers: [
      {
        objection: 'Our members love logging their workouts on Wodify leaderboards.',
        handler: 'Leaderboards are great, but if you want to grow past a 150-member cap and attract broader wellness consumers in your suburb with Attentive SMS and 1.95% Direct Debit rates, Mindbody gives you a complete growth engine starting at $89/mo.'
      }
    ],
    recentSwitchWinStory: 'Kilo Functional in Melbourne switched from Wodify to Mindbody and filled 40% more off-peak class slots through Mindbody Marketplace.'
  }
];

