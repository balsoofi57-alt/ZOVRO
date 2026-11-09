'use strict';
// Local, decorative SVG artwork. No network, location or application state.
(function(root,factory){
  const art=factory();
  if(typeof module==='object'&&module.exports)module.exports=art;
  if(root)root.ZOVRO_ART=art;
})(typeof window==='object'?window:null,function(){
  const ink='#29425b',blue='#428bd1',green='#3b9b70',teal='#229b9b',purple='#8c6ac8',orange='#df8448',red='#db6670';
  const p=(d,fill='none',stroke=ink)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
  const r=(x,y,w,h,fill,rx=2)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'" stroke="'+ink+'" stroke-width="1.5"/>';
  const c=(x,y,radius,fill,stroke=ink)=>'<circle cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  const sparkle=p('M25 3v6M22 6h6M27 12v3M25.5 13.5h3','none',teal);
  const wheel=c(15,16,10,'#3e5269')+c(15,16,5,'#e4edf6')+p('M15 11v10M10 16h10M11.5 12.5l7 7M11.5 19.5l7-7','none','#8298ae');
  const car=r(4,13,24,10,blue,3)+p('m7 13 3-7h12l3 7z','#b9e1f2')+p('M10 9h11','none','#fff')+c(9,24,3,ink)+c(24,24,3,ink)+p('M6 17h4M23 17h3','none','#fff');
  const house=p('M4 14 16 4l12 10',orange)+p('M7 13v15h18V13','#d9e8f4')+r(13,18,6,10,blue)+r(8,15,4,5,'#fff');
  const truck=r(3,9,17,15,'#eab282')+p('M20 14h5l5 6v4H20z',blue)+p('M22 16h3l3 4h-6z','#cdeaf5')+c(9,25,3,ink)+c(24,25,3,ink)+p('M7 13h9M7 17h6','none','#fff');
  const box=p('m7 10 9-5 9 5v15l-9 5-9-5z','#e6af7a')+p('m7 10 9 5 9-5M16 15v15M12 7l9 5v5','none','#7e5436');
  const wrench=p('M23 4a8 8 0 0 0-10 10L4 23a3 3 0 0 0 5 5l9-10A8 8 0 0 0 28 8l-6 5-4-4z','#a9c9e2')+c(7,25,1,'#fff');
  const hammer=p('m9 4 9 3 5 7-5 3-5-7-6-2z','#a9bed4')+p('m16 14-9 14-4-3 9-14z','#d79d68');
  const bolt=p('m18 2-12 17h9l-1 11 12-18h-9z','#edb64e');
  const pipe=p('M4 5h9v10h14v9H9a5 5 0 0 1-5-5z','#a7d3e9')+p('M3 9h11M21 14v11','none',blue)+p('M25 27c-3 4-3 4 0 4 3 0 3-1 0-4',blue);
  const snow=p('M16 4v24M6 10l20 12M6 22 26 10M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-1-1-5M27 18l-5 1 1 5M5 18l5 1-1 5M27 14l-5-1 1-5','none',blue);
  const tree=p('M14 19h5v11h-5z','#b78456')+p('M16 3c-5-1-8 3-7 6-6 0-7 8-2 10-2 5 15 7 17 0 7-2 4-10-1-10 0-5-4-7-7-6z','#6ebd87')+p('M16 13v10m0-5-5-4m5 7 5-5','none','#357857');
  const broom=p('m20 3 3 2-10 15-3-2z','#d19a66')+p('m9 16 8 5-6 9-9-6z','#6bc2bc')+p('m5 23 7 4m-4-7-3 5m6-3-3 5','none','#277e7c');
  const spray=r(5,15,13,15,'#73c8bc',4)+p('M8 15v-5h6v5M8 10V6h13v4h-7M18 10l3 4','none',teal)+p('M24 6h4M24 10l3 2','none',blue);
  const sofa=r(5,12,22,15,'#b9a0df',4)+r(3,17,5,11,purple)+r(24,17,5,11,purple)+p('M8 22h16M8 28v3M24 28v3');
  const windowArt=r(5,4,22,25,'#b9deef')+p('M16 5v23M6 16h20M8 11l4-4M20 25l4-4','none',blue);
  const door=r(7,3,18,28,'#d6b18a')+r(11,7,10,10,'#c2e2ee')+c(21,22,1,ink);
  const building=r(5,3,22,27,'#b6ccdf')+p('M10 8h3m6 0h3M10 13h3m6 0h3M10 18h3m6 0h3','none','#fff')+r(13,23,6,7,blue);
  const washer=r(6,3,21,27,'#d7e6f1',3)+c(16.5,19,7,blue)+p('M11 20q5 5 11-1','none','#bde3f6')+p('M9 8h6M21 8h2','none',purple);
  const fridge=r(7,2,20,29,'#b5d7e8',3)+p('M8 13h18M11 7v3M11 18v6','none',blue);
  const lock=p('M9 14V9a7 7 0 0 1 14 0v5','none',purple)+r(5,14,23,16,'#c4ace5',4)+c(16.5,21,2,'#fff')+p('M16.5 23v3');
  const key=c(10,11,7,'#e4bd77')+c(10,11,2,'#fff')+p('m15 16 13 13m-5-5 3-3m-7-1 3-3','none','#9f7237');
  const clipboard=r(7,5,21,25,'#d8e5f0')+r(12,2,11,6,purple)+p('M12 14h10M12 19h6M12 24h8','none','#5c7791');
  const map=p('m3 10 8-4 10 4 8-4v20l-8 4-10-4-8 4z','#b3d9c8')+p('M11 6v20M21 10v20','none','#75b79c')+p('M18 7a6 6 0 1 1 12 0c0 5-6 11-6 11s-6-6-6-11z',blue)+c(24,7,2,'#fff');
  const shield=p('m16 3 12 5v8c0 7-12 14-12 14S4 23 4 16V8z','#a8d9c6')+p('m10 16 4 4 8-9','none','#267855');
  const toolkit=r(3,13,26,16,'#bba3dd',3)+p('M11 13V8h10v5M4 20h24M14 18h4v5h-4z','none','#62458e')+p('m8 4 3 4m14-6-4 7','none',orange);
  const art={
    car,home:house+ p('m22 20 7 7m-5-10a4 4 0 0 0-4 4','none',purple),
    clean:spray+sparkle,tree,truck,more:toolkit,pin:map,requests:clipboard+p('m19 24 3 3 7-9','none',green),
    account:c(16,10,6,'#bda1df')+p('M5 29v-5a11 11 0 0 1 22 0v5z','#d6c5ec')+p('M12 24h8','none',purple),
    nearby:map,support:p('M6 18v-4a10 10 0 0 1 20 0v4','none',purple)+r(3,15,6,11,'#c1aae1',3)+r(23,15,6,11,'#c1aae1',3)+p('M26 26v3h-8','none',purple),
    provider:r(3,10,26,19,'#a7cbdc',3)+p('M11 10V4h10v6M3 18h26M14 16h4v5h-4z','none',blue)+c(25,26,6,'#a8d8bd')+p('m22 26 2 2 4-5','none',green),
    options:p('M5 8h22M5 16h22M5 25h22','none','#627e96')+c(11,8,3,blue)+c(23,16,3,teal)+c(14,25,3,purple),security:shield,
    roadside:car+p('m23 3 6 10H17z','#f0bb69')+p('M23 6v3M23 11h.1'),
    mechanic:wrench+ c(25,25,5,'#d9e7f2')+p('M25 22v6M22 25h6','none',blue),
    diagnostics:r(3,4,26,19,'#a9d2e9')+p('M6 15h5l3-6 4 11 3-6h5','none',teal)+p('M12 24v5M8 29h16'),
    autoelectric:car+p('m24 9-7 10h5l-1 8 8-12h-5z','#efbc5f'),
    tire:wheel,
    tirechange:wheel+p('M26 4v6h-6M4 28v-6h6','none',orange),
    mobiletire:truck+c(14,15,6,'#415c73')+c(14,15,2,'#e1ebf2'),
    flat:wheel+r(20,21,10,6,orange,1)+p('m22 24 2 2 4-3','none','#fff'),
    jump:r(3,8,25,19,'#91c9bd')+r(7,4,5,4,teal,1)+r(21,4,5,4,teal,1)+p('M7 15h6M10 12v6M21 15h4','none','#fff')+p('m19 19-5 7h4l-1 5 7-9h-5z','#ebaf61'),
    battery:r(3,7,26,22,'#b3a0d6')+r(7,3,5,4,purple,1)+r(21,3,5,4,purple,1)+p('M7 14h6M10 11v6M21 14h4','none','#fff')+p('M9 23h14','none',purple),
    fuel:p('M9 3h10l4 5v21H6V8z','#dc9c72')+r(10,11,9,9,'#f6e6cd')+p('M12 4v4h7M11 24h8','none','#96562d'),
    vehiclelock:car+c(25,11,5,'#d6b4df')+p('M25 9v4','none',purple),
    tow:truck+p('M5 8V3h11l4 7M20 10v6q0 4 4 4','none',orange),
    windshield:p('m3 25 5-20h16l5 20z','#b8dfee')+p('m6 20 8-8m12 8-8-8M17 5l-4 7 5 3-4 7','none',blue),
    detailing:car+sparkle,
    motorcycle:c(7,24,5,'#48617a')+c(26,24,5,'#48617a')+p('m7 24 7-12 5 12H7l11-7h7M21 6h4l3 18M13 10h7','none',orange)+p('M9 16h10l-4 5z',blue),
    handyman:hammer+p('m23 3-9 23','none',blue)+p('M18 22l6 4 4-6','none',blue),
    plumbing:pipe,electrical:bolt,hvac:snow,
    appliance:washer,carpenter:hammer+p('m20 4 9 12-4 3-9-13z','#d6b38b'),
    locksmith:key,garage:r(4,9,25,21,'#b9cfdf')+p('M2 9 16 2l14 7M5 15h22M5 20h22M5 25h22','none',blue),
    paint:r(4,4,20,8,'#b39ad9',3)+p('M24 8h5v9H15v6','none',purple)+r(12,22,6,9,'#d8a477'),
    floor:p('m2 15 14-12 14 12-14 15z','#d9b48c')+p('m9 9 14 13M3 18 18 5M10 24l15-13','none','#987249'),
    drywall:r(4,5,24,23,'#d6dee9')+p('m15 6-4 8 8 4-4 9','none','#8b9bb0')+p('m22 9 7 5-9 10-6-4z','#b79bd9'),
    assembly:sofa+ p('M24 3v9M20 7h8','none',teal),
    tv:r(3,4,26,19,'#637f9c',3)+r(6,7,20,13,'#a9cfe3')+p('M16 24v6M11 30h10'),
    smart:house+p('M18 13q5-5 10 0m-8 3q3-3 6 0','none',teal)+c(23,20,1,teal),
    doorwindow:door+ r(1,9,10,14,'#c2e1ef')+p('M6 9v14M1 16h10','none',blue),
    watercleanup:p('m3 17 13-13 13 13M7 14v15h18V14','#d6e6ef')+p('M3 23q4-4 8 0t8 0 10 0M3 28q4-4 8 0t8 0 10 0','none',blue),
    contractor:p('M4 20v-5a12 12 0 0 1 24 0v5z','#eab879')+r(2,20,28,5,'#d98b4d')+p('M13 5v13M19 5v13','none','#a66c34'),
    roof:p('m2 16 14-13 14 13-3 4L16 10 5 20z','#cf8871')+p('m9 10 4 5m1-10 5 5m1 0 4 5M8 22v8h16v-8','none','#9e5e4b'),
    concrete:p('m3 14 13-7 13 7v10l-13 7-13-7z','#a9b9c6')+p('m3 14 13 7 13-7M16 21v10','none','#6d8496'),
    masonry:r(3,5,26,24,'#dca184',1)+p('M3 13h26M3 21h26M12 5v8M21 5v8M8 13v8M20 13v8M12 21v8M25 21v8','none','#a76a51'),
    fence:p('M5 28V9l4-5 4 5v19M19 28V9l4-5 4 5v19','#d6b182')+p('M3 15h26M3 23h26','none','#9f7449'),
    deck:p('m2 16 14-8 14 8-14 8z','#d6a67c')+p('m7 13 14 8M12 10l14 8M5 19v10M27 19v10M16 24v7','none','#926641'),
    insulation:r(4,4,24,25,'#efc4b3')+p('M8 5q-7 5 0 9t0 14M16 5q-7 5 0 9t0 14M24 5q-7 5 0 9t0 14','none','#c68c82'),
    siding:house+p('M8 16h16M8 20h16M8 24h16','none','#7c9fbb'),
    windows:windowArt+ p('M28 7v22M23 29h7','none',purple),
    glass:windowArt+p('m19 4-5 10 7 5-5 10','none','#5c99be'),
    waterproof:house+p('M27 16c-7 9-6 13 0 13s7-4 0-13',blue),
    demolition:hammer+p('M19 15h10v14H16M20 17l3 6-6 3','none',red),
    maintenance:building+p('m21 20 8 8m-2-11a5 5 0 0 0-7 7','none',orange),
    landscape:p('M3 29h27M9 29V15m0 8-6-6m6 2 6-7','none',green)+p('M5 14C-2 1 13 0 12 10M15 19c-1-11 14-11 12-2-4 5-9 5-12 2','#87c89c'),
    lawn:p('M4 18h18v8H4z','#75b98a')+c(8,27,3,ink)+c(23,27,3,ink)+p('M21 18l5-13h4M8 18v-5h8v5','none',green),
    yard:p('m6 30 12-22','none','#9a764e')+p('M11 15 24 23M13 12l13 8M9 18l13 8M20 5c-1-4 7-5 9-2 2 7-8 11-9 2','#a9c684'),
    sprinkler:p('M10 30V19h12v11M6 19h20','none',green)+p('M16 16V6M12 14 5 8m15 6 7-6M8 4l-3-2M25 4l3-2','none',blue)+c(16,4,1,blue),
    gutter:p('M3 7h21v14h5v7H17V14H3z','#a4cadd')+p('m8 14-3 9m6-7-2 8','none',blue),
    pressure:r(3,18,10,11,'#a1cbb9')+p('M9 18V9h12l4 4-5 3-3-4M25 13l5-2M26 17l4 1','none',teal)+c(7,29,2,ink),
    leaf:p('M27 3C8 0 1 15 9 23c9 7 21-3 18-20z','#d79e5e')+p('M6 29 24 8M13 20l-1-8m5 4 7 1','none','#8f6138'),
    snow:p('m10 23 10-19','none',blue)+p('m4 20 13 7-3 4-12-7z','#afd4e8')+p('M24 19v9m-4-7 8 5m-8 0 8-5','none',blue),
    plow:truck+p('M25 25 30 18v12H20z','#a9cddf'),
    ice:p('m4 9 13-5 12 9-4 15-16 1z','#b9dfea')+p('m4 9 12 10 13-6M16 19l-2 10','none',blue)+p('M21 2v7M18 5h6','none',purple),
    storm:p('M6 15c-8-1-5-12 2-11 4-6 15-4 15 3 9-1 10 10 2 11H9','#a9bad0')+p('m15 14-6 10h7l-2 7 11-13h-9z','#dfac5d'),
    houseclean:house+sparkle,
    deep:spray+broom,
    movein:door+p('M1 21h16m-5-5 5 5-5 5','none',green),
    moveout:door+p('M16 21h14m-5-5 5 5-5 5','none',orange),
    carpet:r(6,6,22,22,'#bba4d6',3)+p('M10 6v22M16 6v22M22 6v22M6 12h22M6 20h22M3 8v17','none','#8669b0'),
    windowclean:windowArt+sparkle,
    commercialclean:building+broom,
    postclean:hammer+spray,
    moving:truck+ p('M7 12h9v8H7z','#c7a6df'),
    furnituremove:sofa+p('M3 6h26m-5-4 5 4-5 4M8 2 3 6l5 4','none',orange),
    loading:box+p('M3 17V6h7m-4 4 4-4-4-4','none',blue),
    furnituredelivery:sofa+p('M3 5h21m-5-4 5 4-5 4','none',blue),
    appliancedelivery:washer+p('M2 30h28M2 30V18','none',orange)+c(4,30,1,ink),
    pickup:p('M2 17h14V9h7l6 8v8H2z',teal)+p('M18 12h4l4 5h-8z','#c1e3eb')+c(8,26,3,ink)+c(24,26,3,ink),
    junk:r(7,9,20,20,'#9fbbaa')+p('M5 9h24M12 9V5h10v4M13 14v10M21 14v10','none',green),
    hauling:truck+ p('m4 9 3-6 6 2 4-3 3 7z','#afa0c8'),
    courier:box+p('M1 7h7M1 12h4M1 17h4','none',blue)+p('m17 21 3 3 5-6','none',green),
    refrigeration:fridge+snow,
    restaurant:r(4,4,24,25,'#c8d6e3')+r(7,15,18,10,'#afc9dc')+c(10,9,2,orange)+c(22,9,2,red)+p('M11 19h10','none','#fff'),
    camera:p('m4 6 23 6-4 9L1 14z','#afc9de')+c(22,16,3,blue)+p('M8 18v7h11v5M13 24v-5'),
    access:r(6,3,20,27,'#b5a3d2')+r(10,7,12,7,'#e1d6ef')+p('M11 19h1m8 0h1M11 24h1m8 0h1','none','#fff'),
    sign:r(3,7,26,17,'#b1d4c7')+p('M8 24v7M24 24v7M8 12h16M8 18h10','none',green),
    office:building+key,
    lawnandsnow:p('M3 28h26M9 28V15m0 9-6-6m6 3 7-7','none',green)+p('M23 4v15M17 8l12 7M17 15l12-7','none',blue),
    pest:p('M16 9v17M10 14l-6-4m6 10-7 3M22 14l6-4m-6 10 7 3M12 8 9 4m11 4 3-4','none',green)+p('M10 17c-1-12 13-12 12 0 2 12-14 12-12 0z','#91bd83')+p('M16 10v17','none','#507c4a'),
    other:p('M16 3c-8 0-14 5-14 12s6 12 14 12h3l8 4-2-7c9-9 3-21-9-21z','#c0a9e2')+p('M12 11c0-7 12-5 8 1l-4 4v3M16 23h.1','none','#67498f')
  };
  const labels={
    'Roadside Assistance':'roadside','Mobile Mechanic':'mechanic','Auto Diagnostics':'diagnostics','Auto Electrician':'autoelectric',
    'Tire Services':'tire','Tire Change':'tirechange','Mobile Tire Service':'mobiletire','Flat Tire Repair':'flat','Jump Start':'jump','Battery Replacement':'battery',
    'Fuel Delivery':'fuel','Vehicle Lockout':'vehiclelock','Towing':'tow','Windshield Repair / Replacement':'windshield','Mobile Auto Detailing':'detailing','Motorcycle Assistance':'motorcycle',
    'Handyman':'handyman','Plumbing':'plumbing','Electrical':'electrical','HVAC':'hvac','Heating & Air Conditioning':'hvac',
    'Appliance Repair':'appliance','Carpenter':'carpenter','Locksmith':'locksmith','Garage Door Repair & Installation':'garage','Painting':'paint',
    'Flooring Installation & Repair':'floor','Drywall Repair':'drywall','Furniture Assembly':'assembly','TV Mounting':'tv','Smart Home Installation':'smart','Door & Window Repair':'doorwindow','Doors & Windows':'doorwindow',
    'Water Damage Cleanup':'watercleanup','General Contractor':'contractor','Roofing':'roof','Concrete':'concrete','Masonry':'masonry','Fence Installation & Repair':'fence',
    'Deck Installation & Repair':'deck','Insulation':'insulation','Siding':'siding','Windows & Doors':'windows','Glass Repair & Installation':'glass','Waterproofing':'waterproof','Demolition':'demolition','Property Maintenance':'maintenance',
    'Landscaping':'landscape','Lawn Mowing':'lawn','Yard Cleanup':'yard','Tree Service':'tree','Sprinkler Repair':'sprinkler','Gutter Cleaning':'gutter','Pressure Washing':'pressure',
    'Leaf Removal':'leaf','Snow Removal':'snow','Snow Removal & Plowing':'plow','Snow Plowing':'plow','Ice Removal':'ice','Storm Cleanup':'storm',
    'House Cleaning':'houseclean','Deep Cleaning':'deep','Move-In Cleaning':'movein','Move-Out Cleaning':'moveout','Carpet Cleaning':'carpet','Window Cleaning':'windowclean','Commercial Cleaning':'commercialclean','Post-Construction Cleaning':'postclean',
    'Moving':'moving','Furniture Moving':'furnituremove','Loading & Unloading':'loading','Furniture Delivery':'furnituredelivery','Appliance Delivery':'appliancedelivery','Pickup-Truck Help':'pickup','Junk Removal':'junk','Hauling':'hauling','Local Courier':'courier',
    'Commercial Refrigeration Repair':'refrigeration','Restaurant Equipment Repair':'restaurant','Security Camera Installation':'camera','Access Control':'access','Sign Installation & Repair':'sign','Office & Store Maintenance':'office',
    'Lawn & Snow':'lawnandsnow','Pest & Rodent Control':'pest','Other / I Need Help':'other'
  };
  const tones={car:'blue',home:'orange',clean:'teal',tree:'green',truck:'orange',more:'purple',pin:'blue',requests:'purple',account:'purple',nearby:'blue',support:'purple',provider:'purple',options:'teal',security:'green'};
  function svg(key,body,tone='blue'){return '<svg class="z-color-art" data-art="'+key+'" data-tone="'+tone+'" viewBox="0 0 32 34" aria-hidden="true" focusable="false">'+body+'</svg>'}
  function icon(name){return art[name]?svg(name,art[name],tones[name]||'blue'):null}
  function service(label,category=''){
    let text=String(label||''),emergency=text.startsWith('Emergency '),commercial=false;
    if(emergency)text=text.slice(10);
    if(!labels[text]&&text.startsWith('Commercial ')){commercial=true;text=text.slice(11)}
    if(text==='Plumber')text='Plumbing';
    if(text==='Electrician')text='Electrical';
    const key=labels[text];
    if(!key)return null;
    let body=art[key];
    if(emergency)body='<g transform="translate(0 3) scale(.82)">'+body+'</g>'+p('m25 1 6 11H19z','#e57d83')+p('M25 4v3M25 9h.1','none','#fff');
    if(commercial)body='<g transform="scale(.78)">'+body+'</g>'+r(20,19,10,13,'#b6ccdf',1)+p('M23 23h1m3 0h1m-5 4h1m3 0h1','none','#fff');
    const tone=emergency?'red':/clean|outdoor|seasonal/.test(category)?'green':/moving|construction/.test(category)?'orange':/home/.test(category)?'teal':'blue';
    return svg((emergency?'emergency-':commercial?'commercial-':'')+key,body,tone);
  }
  return {icon,service};
});
