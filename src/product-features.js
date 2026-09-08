'use strict';
const BRAND={name:'ZOVRO',slogan:'ANYWHERE. ANYTIME. NEAR YOU.',defaultLanguage:'en',languages:['en','es'],languageDisplay:'English | Spanish'};
const PRODUCT_FEATURES={
branding:{nightCityTheme:true,blueGoldBlack:true,noPeople:true,englishPrimary:true,spanishOptional:true},
launchCore:{sosDispatch:true,nearbyProviders:true,messaging:true,locationSharing:true,ratings:true,securePayments:true,requestLifecycle:true,providerAvailability:true,smartMatch:true,iNeedHelp:true},
requestExperience:{typedProblemDescription:true,voiceProblemDescription:true,photoAttachments:true,videoAttachments:true,availableNow:true,scheduleForLater:true,multipleQuotes:true,instantJob:true,beforeAfterPhotos:true,recurringServices:true,partsMaterialsDisclosure:true},
trustSafety:{identityVerifiedBadge:true,licensedBadge:true,insuredBadge:true,pinJobStart:true,providerCheckInOut:true,disputeCenter:true,cancellationNoShowRules:true,emergencyContactSharing:true,fraudAbuseProtection:true,zovroGuaranteeFramework:true},
providerTools:{portfolio:true,serviceRadius:true,onlineBusyOffline:true,workingHours:true,providerCalendar:true,teamAccounts:true,performanceMetrics:true,serviceQualityScore:true},
customerConvenience:{liveTracking:true,eta:true,favoriteProvider:true,rebookProvider:true,jobHistory:true,savedProperties:true,savedVehicles:true,vehicleProfiles:true,serviceReminders:true,waitlistNotifyMe:true,dynamicServiceArea:true,tips:true},
commercial:{businessAccounts:true,propertyManagerMode:true,fleetAccounts:true,multiStopJobs:true,taxDocuments:true,providerSubscriptions:true,referralRewards:true},
jobControl:{estimates:true,customerApproval:true,changeOrders:true,warrantyRecords:true,receipts:true},
platform:{englishSpanishTranslation:true,accessibility:true,customerProviderBusinessModes:true,adminCommandCenter:true,supportSystem:true}
};
const LAUNCH_PHASES=[
{id:'launch',name:'Launch Core',priorities:['Auto & Roadside','Home Services','Emergency / SOS','Nearby provider discovery','Messaging','Location sharing','Payments','Ratings','Smart Match / I Need Help']},
{id:'growth',name:'Growth',priorities:['Schedule for Later','Multiple Quotes','Photo / video requests','Before & After','Favorites and rebooking','Recurring services','Business accounts','Property Manager Mode','Fleet Accounts']},
{id:'scale',name:'Scale & Operations',priorities:['Admin Command Center','Provider teams','Performance scoring','Dispute Center','Fraud protection','Guarantee framework','Referral rewards','Provider subscriptions']}
];
function isFeatureEnabled(group,feature){return Boolean(PRODUCT_FEATURES[group]?.[feature])}
const api={BRAND,PRODUCT_FEATURES,LAUNCH_PHASES,isFeatureEnabled};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.ZOVRO_FEATURES=api;
