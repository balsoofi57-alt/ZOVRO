export const ZOVRO_FEATURES = {
  branding: {
    enabled: true,
    slogan: 'ANYWHERE. ANYTIME. NEAR YOU.',
    languages: ['en','es'],
    defaultLanguage: 'en',
    languageDisplay: 'English | Spanish'
  },
  launchCore: {
    sosDispatch: true,
    nearbyProviders: true,
    messaging: true,
    locationSharing: true,
    ratings: true,
    securePayments: true,
    requestLifecycle: true,
    providerAvailability: true,
    smartMatch: true,
    iNeedHelp: true
  },
  requestExperience: {
    typedProblemDescription: true,
    voiceProblemDescription: true,
    photoAttachments: true,
    videoAttachments: true,
    availableNow: true,
    scheduleForLater: true,
    multipleQuotes: true,
    instantJob: true,
    beforeAfterPhotos: true,
    recurringServices: true,
    partsMaterialsDisclosure: true
  },
  trustSafety: {
    identityVerifiedBadge: true,
    licensedBadge: true,
    insuredBadge: true,
    pinJobStart: true,
    providerCheckInOut: true,
    disputeCenter: true,
    cancellationNoShowRules: true,
    emergencyContactSharing: true,
    fraudAbuseProtection: true,
    zovroGuaranteeFramework: true
  },
  providerTools: {
    portfolio: true,
    serviceRadius: true,
    onlineBusyOffline: true,
    workingHours: true,
    providerCalendar: true,
    teamAccounts: true,
    performanceMetrics: true,
    serviceQualityScore: true
  },
  customerConvenience: {
    liveTracking: true,
    eta: true,
    favoriteProvider: true,
    rebookProvider: true,
    jobHistory: true,
    savedProperties: true,
    savedVehicles: true,
    vehicleProfiles: true,
    serviceReminders: true,
    waitlistNotifyMe: true,
    dynamicServiceArea: true,
    tips: true
  },
  commercial: {
    businessAccounts: true,
    propertyManagerMode: true,
    fleetAccounts: true,
    multiStopJobs: true,
    taxDocuments: true,
    providerSubscriptions: true,
    referralRewards: true
  },
  jobControl: {
    estimates: true,
    customerApproval: true,
    changeOrders: true,
    warrantyRecords: true,
    receipts: true
  },
  platform: {
    englishSpanishTranslation: true,
    accessibility: true,
    customerProviderBusinessModes: true,
    adminCommandCenter: true,
    supportSystem: true
  }
};

export const ZOVRO_RELEASE_PHASES = [
  {
    id: 'launch',
    name: 'Launch Core',
    priorities: [
      'Auto & Roadside',
      'Home Services',
      'Emergency / SOS',
      'Nearby provider discovery',
      'Messaging',
      'Location sharing',
      'Payments',
      'Ratings',
      'Smart Match / I Need Help'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    priorities: [
      'Schedule for Later',
      'Multiple Quotes',
      'Photo / video requests',
      'Before & After',
      'Favorites and rebooking',
      'Recurring services',
      'Business accounts',
      'Property Manager Mode',
      'Fleet Accounts'
    ]
  },
  {
    id: 'scale',
    name: 'Scale & Operations',
    priorities: [
      'Admin Command Center',
      'Provider teams',
      'Performance scoring',
      'Dispute Center',
      'Fraud protection',
      'Guarantee framework',
      'Referral rewards',
      'Provider subscriptions'
    ]
  }
];

export function isFeatureEnabled(group, feature) {
  return Boolean(ZOVRO_FEATURES[group]?.[feature]);
}
