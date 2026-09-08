export const ZOVRO_SERVICE_CATEGORIES = [
  {
    id: 'auto-roadside',
    icon: '🚗',
    priority: 1,
    launchPriority: true,
    label: { en: 'Auto & Roadside', es: 'Auto y asistencia vial' },
    services: [
      ['roadside-assistance','Roadside Assistance','Asistencia vial',true],
      ['mobile-mechanic','Mobile Mechanic','Mecánico móvil',true],
      ['auto-diagnostics','Auto Diagnostics','Diagnóstico automotriz',false],
      ['auto-electrician','Auto Electrician','Electricista automotriz',false],
      ['tire-change','Tire Change','Cambio de llanta',true],
      ['mobile-tire-service','Mobile Tire Service','Servicio móvil de llantas',true],
      ['flat-tire-repair','Flat Tire Repair','Reparación de llanta pinchada',true],
      ['jump-start','Jump Start','Arranque de batería',true],
      ['battery-replacement','Battery Replacement','Reemplazo de batería',true],
      ['fuel-delivery','Fuel Delivery','Entrega de combustible',true],
      ['vehicle-lockout','Vehicle Lockout','Apertura de vehículo',true],
      ['towing','Towing','Remolque',true],
      ['windshield-repair','Windshield Repair / Replacement','Reparación / reemplazo de parabrisas',false],
      ['mobile-detailing','Mobile Auto Detailing','Detallado móvil de autos',false],
      ['motorcycle-assistance','Motorcycle Assistance','Asistencia para motocicletas',true]
    ]
  },
  {
    id: 'home-services',
    icon: '🏠',
    priority: 2,
    launchPriority: true,
    label: { en: 'Home Services', es: 'Servicios del hogar' },
    services: [
      ['handyman','Handyman','Mantenimiento general',false],
      ['plumbing','Plumbing','Plomería',true],
      ['electrical','Electrical','Electricidad',true],
      ['hvac','HVAC','Climatización HVAC',true],
      ['appliance-repair','Appliance Repair','Reparación de electrodomésticos',false],
      ['carpenter','Carpenter','Carpintero',false],
      ['locksmith','Locksmith','Cerrajero',true],
      ['garage-door','Garage Door Repair & Installation','Reparación e instalación de garaje',false],
      ['painting','Painting','Pintura',false],
      ['flooring','Flooring Installation & Repair','Instalación y reparación de pisos',false],
      ['drywall','Drywall Repair','Reparación de drywall',false],
      ['furniture-assembly','Furniture Assembly','Ensamblaje de muebles',false],
      ['tv-mounting','TV Mounting','Instalación de TV',false],
      ['smart-home','Smart Home Installation','Instalación de hogar inteligente',false],
      ['doors-windows','Door & Window Repair','Reparación de puertas y ventanas',false]
    ]
  },
  {
    id: 'emergency-sos',
    icon: '🚨',
    priority: 3,
    launchPriority: true,
    label: { en: 'Emergency / SOS', es: 'Emergencia / SOS' },
    services: [
      ['emergency-roadside','Emergency Roadside Assistance','Asistencia vial de emergencia',true],
      ['emergency-mechanic','Emergency Mobile Mechanic','Mecánico móvil de emergencia',true],
      ['emergency-towing','Emergency Towing','Remolque de emergencia',true],
      ['emergency-plumber','Emergency Plumber','Plomero de emergencia',true],
      ['emergency-electrician','Emergency Electrician','Electricista de emergencia',true],
      ['emergency-locksmith','Emergency Locksmith','Cerrajero de emergencia',true],
      ['emergency-hvac','Emergency HVAC','HVAC de emergencia',true],
      ['water-damage','Water Damage Cleanup','Limpieza por daños de agua',true]
    ]
  },
  {
    id: 'construction-property',
    icon: '🏗️',
    priority: 4,
    label: { en: 'Construction & Property', es: 'Construcción y propiedad' },
    services: [
      ['general-contractor','General Contractor','Contratista general',false],
      ['roofing','Roofing','Techos',true],
      ['concrete','Concrete','Concreto',false],
      ['masonry','Masonry','Mampostería',false],
      ['fence','Fence Installation & Repair','Instalación y reparación de cercas',false],
      ['deck','Deck Installation & Repair','Instalación y reparación de terrazas',false],
      ['insulation','Insulation','Aislamiento',false],
      ['siding','Siding','Revestimiento exterior',false],
      ['windows-doors','Windows & Doors','Ventanas y puertas',false],
      ['glass','Glass Repair & Installation','Reparación e instalación de vidrio',false],
      ['waterproofing','Waterproofing','Impermeabilización',true],
      ['demolition','Demolition','Demolición',false],
      ['property-maintenance','Property Maintenance','Mantenimiento de propiedades',false]
    ]
  },
  {
    id: 'outdoor-seasonal',
    icon: '🌳',
    priority: 5,
    label: { en: 'Outdoor & Seasonal', es: 'Exterior y temporada' },
    services: [
      ['landscaping','Landscaping','Paisajismo',false],
      ['lawn-mowing','Lawn Mowing','Corte de césped',false],
      ['yard-cleanup','Yard Cleanup','Limpieza de jardín',false],
      ['tree-service','Tree Service','Servicio de árboles',false],
      ['sprinkler-repair','Sprinkler Repair','Reparación de riego',false],
      ['gutter-cleaning','Gutter Cleaning','Limpieza de canaletas',false],
      ['pressure-washing','Pressure Washing','Lavado a presión',false],
      ['leaf-removal','Leaf Removal','Retiro de hojas',false],
      ['snow-removal','Snow Removal','Retiro de nieve',true],
      ['snow-plowing','Snow Plowing','Arado de nieve',true],
      ['ice-removal','Ice Removal','Retiro de hielo',true],
      ['storm-cleanup','Storm Cleanup','Limpieza después de tormentas',true]
    ]
  },
  {
    id: 'cleaning',
    icon: '🧹',
    priority: 6,
    label: { en: 'Cleaning', es: 'Limpieza' },
    services: [
      ['house-cleaning','House Cleaning','Limpieza de casas',false],
      ['deep-cleaning','Deep Cleaning','Limpieza profunda',false],
      ['move-in-cleaning','Move-In Cleaning','Limpieza de entrada',false],
      ['move-out-cleaning','Move-Out Cleaning','Limpieza de salida',false],
      ['carpet-cleaning','Carpet Cleaning','Limpieza de alfombras',false],
      ['window-cleaning','Window Cleaning','Limpieza de ventanas',false],
      ['commercial-cleaning','Commercial Cleaning','Limpieza comercial',false],
      ['post-construction-cleaning','Post-Construction Cleaning','Limpieza post-construcción',false]
    ]
  },
  {
    id: 'moving-hauling',
    icon: '🚚',
    priority: 7,
    label: { en: 'Moving & Hauling', es: 'Mudanza y transporte' },
    services: [
      ['moving','Moving','Mudanza',false],
      ['furniture-moving','Furniture Moving','Mudanza de muebles',false],
      ['loading-unloading','Loading & Unloading','Carga y descarga',false],
      ['furniture-delivery','Furniture Delivery','Entrega de muebles',false],
      ['appliance-delivery','Appliance Delivery','Entrega de electrodomésticos',false],
      ['pickup-help','Pickup-Truck Help','Ayuda con camioneta pickup',false],
      ['junk-removal','Junk Removal','Retiro de basura y objetos',false],
      ['hauling','Hauling','Transporte de carga',false],
      ['local-courier','Local Courier','Mensajería local',false]
    ]
  },
  {
    id: 'business-services',
    icon: '🏢',
    priority: 8,
    label: { en: 'Business Services', es: 'Servicios comerciales' },
    services: [
      ['commercial-hvac','Commercial HVAC','HVAC comercial',true],
      ['commercial-plumbing','Commercial Plumbing','Plomería comercial',true],
      ['commercial-electrical','Commercial Electrical','Electricidad comercial',true],
      ['refrigeration-repair','Commercial Refrigeration Repair','Reparación de refrigeración comercial',true],
      ['restaurant-equipment','Restaurant Equipment Repair','Reparación de equipos de restaurante',false],
      ['security-cameras','Security Camera Installation','Instalación de cámaras de seguridad',false],
      ['access-control','Access Control','Control de acceso',false],
      ['sign-repair','Sign Installation & Repair','Instalación y reparación de letreros',false],
      ['office-maintenance','Office & Store Maintenance','Mantenimiento de oficinas y tiendas',false]
    ]
  },
  {
    id: 'other-help',
    icon: '✨',
    priority: 99,
    label: { en: 'Other / I Need Help', es: 'Otro / Necesito ayuda' },
    services: [['other','Other / I Need Help','Otro / Necesito ayuda',false]]
  }
].map(category => ({
  ...category,
  services: category.services.map(([id,en,es,urgentCapable]) => ({ id, label:{en,es}, urgentCapable }))
}));

export const ZOVRO_ALL_SERVICES = ZOVRO_SERVICE_CATEGORIES.flatMap(category =>
  category.services.map(service => ({ ...service, categoryId: category.id }))
);

const MATCH_RULES = [
  { terms: ['won\'t start','will not start','battery dead','dead battery','jump'], serviceId: 'jump-start' },
  { terms: ['flat tire','tire flat','puncture','blowout'], serviceId: 'flat-tire-repair' },
  { terms: ['locked out','keys in car','car locked'], serviceId: 'vehicle-lockout' },
  { terms: ['out of gas','no gas','need fuel','fuel empty'], serviceId: 'fuel-delivery' },
  { terms: ['tow','towing','stuck vehicle'], serviceId: 'towing' },
  { terms: ['leak','leaking pipe','pipe burst','faucet','toilet'], serviceId: 'plumbing' },
  { terms: ['no power','outlet','breaker','electrical'], serviceId: 'electrical' },
  { terms: ['no heat','no ac','air conditioner','furnace','hvac'], serviceId: 'hvac' },
  { terms: ['garage door','garage won\'t open'], serviceId: 'garage-door' },
  { terms: ['roof leak','roofing','shingles'], serviceId: 'roofing' },
  { terms: ['water damage','flooded','basement flood'], serviceId: 'water-damage' },
  { terms: ['snow','driveway snow'], serviceId: 'snow-removal' },
  { terms: ['move furniture','moving house','need movers'], serviceId: 'moving' },
  { terms: ['junk','old furniture removal','haul away'], serviceId: 'junk-removal' }
];

export function findServiceById(serviceId) {
  return ZOVRO_ALL_SERVICES.find(service => service.id === serviceId) || null;
}

export function smartMatchService(problemText = '') {
  const normalized = String(problemText).trim().toLowerCase();
  if (!normalized) return { service: findServiceById('other'), confidence: 0, matchedTerm: null };

  for (const rule of MATCH_RULES) {
    const matchedTerm = rule.terms.find(term => normalized.includes(term));
    if (matchedTerm) {
      return { service: findServiceById(rule.serviceId), confidence: 0.92, matchedTerm };
    }
  }

  const tokenMatches = ZOVRO_ALL_SERVICES
    .filter(service => service.id !== 'other')
    .map(service => {
      const words = service.label.en.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const score = words.filter(word => normalized.includes(word)).length;
      return { service, score };
    })
    .sort((a,b) => b.score - a.score);

  if (tokenMatches[0]?.score > 0) return { service: tokenMatches[0].service, confidence: 0.65, matchedTerm: null };
  return { service: findServiceById('other'), confidence: 0.2, matchedTerm: null };
}

export function localizedLabel(item, language = 'en') {
  return item?.label?.[language] || item?.label?.en || '';
}
