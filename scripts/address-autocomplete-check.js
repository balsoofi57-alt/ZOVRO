'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('address-autocomplete.js','utf8');
const context={
  window:{addEventListener(){}},
  document:{addEventListener(){}},
};
vm.runInNewContext(source,context,{filename:'address-autocomplete.js'});
const api=context.window.ZOVRO_ADDRESS_AUTOCOMPLETE;
assert.ok(api,'Autocomplete API must initialize without requesting GPS');
const match=api._isLocalCitySuggestion;
assert.equal(typeof match,'function');
assert.equal(match('Main St, Dearborn, MI 48124','dearborn'),true);
assert.equal(match('123 Dearborn Ave, Toledo, OH 43605','dearborn'),false);
assert.equal(match('123 Dearborn Rd, Pontiac, MI 48340','dearborn'),false);
assert.equal(match('123 Main St, Dearborn, MO 64439','dearborn'),false);
assert.equal(match('Street, Dearborn Heights, MI 48127','dearborn heights'),true);
assert.equal(match('Street, Dearborn, MI 48124','dearborn heights'),false);
assert.equal(match('Street, Detroit, MI 48201','detroit'),true);
assert.equal(match('Street, Detroit, MI 48201','dearborn'),false);
assert.match(source,/if\(local&&!isLocalCitySuggestion\(t,place\)\)continue/);
assert.match(source,/countryCode:'USA'/);
assert.match(source,/searchExtent=SOUTHEAST_MI_EXTENT/);
console.log('Address autocomplete: explicit Michigan city filtering PASS; nationwide manual entry preserved');
