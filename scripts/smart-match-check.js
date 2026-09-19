const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');

function mustContain(value,label){assert(html.includes(value),`Missing ${label}: ${value}`)}

mustContain("service:'Roadside Assistance'",'roadside Smart Match rule');
mustContain("service:'Mobile Mechanic'",'mobile mechanic Smart Match rule');
mustContain("service:'Plumbing'",'plumbing Smart Match rule');
mustContain("service:'Electrical'",'electrical Smart Match rule');
mustContain("service:'HVAC'",'HVAC Smart Match rule');
mustContain("service:'Appliance Repair'",'appliance Smart Match rule');
mustContain("service:'Moving'",'moving Smart Match rule');
mustContain("service:'Lawn & Snow'",'lawn and snow Smart Match rule');
mustContain("service:'Pest & Rodent Control'",'pest Smart Match rule');
mustContain("sub:'Bed Bugs'",'bed bug subservice rule');
mustContain("sub:'Mice'",'mice subservice rule');
mustContain("sub:'Rats'",'rats subservice rule');
mustContain("oninput=\"smartMatchDetails()\"",'live Smart Match input hook');
mustContain("Smart Match: ${match.service}",'visible Smart Match confirmation');
mustContain("smartMatchDetails();const service=$('reqService').value",'pre-submit Smart Match enforcement');

const representative=[
 ['flat tire','Roadside Assistance'],
 ['car wont start','Mobile Mechanic'],
 ['clogged drain','Plumbing'],
 ['outlet not working','Electrical'],
 ['ac not working','HVAC'],
 ['fridge not cooling','Appliance Repair'],
 ['need movers','Moving'],
 ['snow removal','Lawn & Snow'],
 ['bed bugs','Pest & Rodent Control'],
 ['mice','Pest & Rodent Control']
];
for(const [phrase,service] of representative){
  assert(html.includes(`'${phrase}'`)||html.includes(`\"${phrase}\"`),`Missing phrase coverage: ${phrase}`);
  assert(html.includes(`service:'${service}'`),`Missing service mapping: ${service}`);
}

console.log('Smart Match QA passed');
