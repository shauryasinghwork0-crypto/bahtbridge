const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'../dist')+'/';let passed=0;const logs=[];
function test(name,fn){try{fn();passed++;logs.push('PASS '+name)}catch(e){console.log('FAIL '+name+' '+e.stack);process.exitCode=1}}
const listeners={},nodes=new Map(),store={'bahtbridge-v2':JSON.stringify({role:'lender',page:'businesses'})},downloads=[];
class E{constructor(k){this.key=k;this.innerHTML='';this.textContent='';this.dataset={};this.style={};this.value='';this.isConnected=true;this.c=new Set();this.classList={add:x=>this.c.add(x),remove:x=>this.c.delete(x),contains:x=>this.c.has(x),toggle:x=>this.c.has(x)?this.c.delete(x):this.c.add(x)}}focus(){}setAttribute(k,v){this[k]=v}remove(){nodes.delete(this.key)}querySelectorAll(){return []}insertAdjacentHTML(_,h){this.innerHTML+=h;if(h.includes('class="notifications"'))nodes.set('.notifications',new E('.notifications'))}click(){downloads.push(this.download)}}
const get=s=>{if(!nodes.has(s))nodes.set(s,new E(s));return nodes.get(s)};
const document={querySelector:s=>s==='.notifications'?nodes.get(s):get(s),querySelectorAll:()=>[],createElement:t=>new E(t),body:{style:{}},activeElement:null,addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
const ctx={window:null,document,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},FormData:class{constructor(f){this.v=f.values||{}}get(k){return this.v[k]}*[Symbol.iterator](){yield* Object.entries(this.v)}},structuredClone,Intl,Date,Blob,URL:{createObjectURL:b=>{downloads.push(b);return 'blob:sample'},revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){},location:{reload(){}},scrollTo(){},console};ctx.window=ctx;vm.createContext(ctx);for(const file of ['data.js','access.js','filters.js','app.js']){new vm.Script(fs.readFileSync(root+file,'utf8'),{filename:file}).runInContext(ctx)}
const D=ctx.DEMO,F=ctx.BBFilters;const ids=a=>a.map(x=>x.id).sort().join(',');const providers=f=>D.lenders.filter(l=>F.providerMatches(l,f));const vendors=f=>D.businesses.filter(b=>F.vendorMatches(b,f,D.lenders));
test('all THB providers and vendors present',()=>{assert.equal(providers({}).length,10);assert.equal(vendors({}).length,10);assert.equal(D.currency,'THB')});
for(const cat of ['short','long','instant','24h','working','invoice','equipment','supplier','line','trade'])test('provider category '+cat,()=>{assert(providers({category:cat}).length);assert(providers({category:cat}).every(l=>l.categories.includes(cat)))});
test('provider combined amount rate speed security term',()=>{const f={amount:250000,rate:8,speed:24,collateral:'Unsecured',term:'long'};assert.equal(ids(providers(f)),'northstar')});
test('provider combined instant funding',()=>assert.equal(ids(providers({category:'instant',amount:300000,rate:13,speed:1,term:'short',collateral:'Unsecured'})),'sabai'));
test('provider combined secured equipment',()=>assert.equal(ids(providers({type:'Equipment finance',amount:1000000,rate:7,speed:48,term:'long',collateral:'Secured'})),'cedar'));
test('provider exclusive min and max amount boundaries',()=>{assert(providers({amount:10000}).some(l=>l.id==='sabai'));assert(!providers({amount:9999}).some(l=>l.id==='sabai'));assert(providers({amount:300000}).some(l=>l.id==='sabai'));assert(!providers({amount:300001}).some(l=>l.id==='sabai'))});
test('provider search case and trim',()=>assert.equal(ids(providers({query:'  SIAM  '})),'northstar'));
test('provider incompatible combination returns empty',()=>assert.equal(providers({category:'instant',rate:7}).length,0));
test('vendor minimum score threshold',()=>assert(vendors({minScore:90}).every(b=>b.score>=90)));
test('vendor revenue amount payment filters',()=>{const f={minRevenue:500000,maxAmount:500000,minPayments:99};assert.equal(ids(vendors(f)),'hearth,studio')});
test('vendor combined score revenue amount payments term urgency',()=>{assert.equal(ids(vendors({minScore:90,minRevenue:500000,maxAmount:500000,minPayments:99,minTrading:48,term:'short',speed:4})),'studio')});
test('vendor instant category urgency',()=>assert.equal(ids(vendors({category:'instant'})),'olive'));
test('vendor long category',()=>assert.equal(ids(vendors({category:'long'})),'bloom,chai,hearth'));
test('vendor working category follows underlying product',()=>assert.equal(ids(vendors({category:'working'})),'atlas,niran,olive,paper,studio'));
test('vendor name location product search',()=>{assert.equal(ids(vendors({query:'CHIANG MAI'})),'studio');assert.equal(ids(vendors({query:'equipment finance'})),'hearth')});
test('vendor incompatible combination returns empty',()=>assert.equal(vendors({category:'instant',minScore:90}).length,0));
function dispatch(k,target){for(const fn of listeners[k]||[])fn({target,preventDefault(){},key:'',shiftKey:false})}
function click(action,kind='action'){const t=new E('button');t.dataset[kind]=action;t.closest=s=>s===`[data-${kind}]`?t:null;dispatch('click',t)}
function submit(id,values={}){dispatch('submit',{id,values,reset(){},checkValidity(){return true},reportValidity(){}})}
function login(role){click('signin:'+role,'access');submit('access-signin-form',{email:role==='sme'?'vendor@bahtbridge.demo':'lender@bahtbridge.demo',password:'Bahtbridge2026'});assert(ctx.BahtbridgeAccess.active)}
function change(id,value,dataset={},checked=false){dispatch('change',{id,value,dataset,checked})}
const html=()=>get('#app').innerHTML,modal=()=>get('#overlay').innerHTML,results=()=>get('#results').innerHTML,state=()=>JSON.parse(store['bahtbridge-v2']);
test('saved lender state opens landing',()=>{assert(html().includes('landing-hero'));assert(!ctx.BahtbridgeAccess.active)});
test('invalid vendor login rejected',()=>{click('signin:sme','access');submit('access-signin-form',{email:'lender@bahtbridge.demo',password:'Bahtbridge2026'});assert(!ctx.BahtbridgeAccess.active)});
test('vendor login and THB overview',()=>{login('sme');assert(html().includes('Siam Pantry'));assert(html().includes('฿486,500'))});
for(const page of ['overview','transactions','marketplace','applications','suppliers','profile','settings'])test('vendor nav '+page,()=>{click('nav:'+page);assert(html().includes('Bahtbridge')||html().includes('bahtbridge'))});
test('market initial 10 results',()=>{click('nav:marketplace');assert.equal((results().match(/class="lender-card"/g)||[]).length,10)});
test('market integrated combined filters',()=>{change('amount-filter','250000');change('rate-filter','8');change('speed-filter','24');change('collateral-filter','Unsecured');change('term-filter','long');assert(results().includes('Siam Capital'));assert.equal((results().match(/class="lender-card"/g)||[]).length,1)});
test('market category reset and instant result',()=>{click('reset-filters');click('category:instant');assert(results().includes('Sabai Instant Credit'));assert.equal((results().match(/class="lender-card"/g)||[]).length,1)});
test('all ten provider detail and apply modals',()=>{for(const l of D.lenders){click('lender:'+l.id);assert(modal().includes(l.name));click('apply:'+l.id);assert(modal().includes('apply-form'))}});
test('credit application submit',()=>{click('apply:northstar');submit('apply-form',{amount:'300000',lenderId:'northstar',purpose:'Working capital',term:'24 months',notes:'Sample QA request'});submit('submit-application');assert.equal(state().applications[0].amount,300000);assert(state().applications[0].id.startsWith('BB-'))});
const appId=state().applications[0].id;
test('role switch opens login without auth',()=>{click('role:lender');assert(!ctx.BahtbridgeAccess.active);assert(html().includes('access-signin-form'));login('lender')});
for(const page of ['overview','businesses','marketplace','applications','portfolio','suppliers','profile','settings'])test('lender nav '+page,()=>{click('nav:'+page);assert(html().includes('Siam Capital'))});
test('vendor integrated combined filters',()=>{click('nav:businesses');change('risk-input','90');change('revenue-filter','500000');change('vendor-amount-filter','500000');change('payments-filter','99');change('term-filter','short');change('speed-filter','4');assert(results().includes('Lanna Creative Studio'));assert.equal((results().match(/panel business-card/g)||[]).length,1)});
test('vendor compare modal renders',()=>{click('reset-filters');change('',null,{vendorCompare:'bloom'},true);change('',null,{vendorCompare:'studio'},true);click('compare-vendors');assert(modal().includes('Siam Pantry')&&modal().includes('Lanna Creative Studio'))});
test('all ten vendors and financial tabs',()=>{for(const b of D.businesses){click('business:'+b.id);for(const t of ['overview','cashflow','transactions','documents'])click('business-tab:'+t);assert(modal().includes(b.name))}});
test('lender offer then vendor accepts',()=>{click('make-offer:'+appId);submit('offer-form',{id:appId,rate:'8.2',term:'24',notes:'Sample offer'});assert.equal(state().applications[0].status,'Offer received');login('sme');click('application:'+appId);assert(modal().includes('8.2%'));click('accept:'+appId);assert.equal(state().applications[0].status,'Accepted');login('lender');click('nav:portfolio');assert(html().includes(appId)&&html().includes('฿300,000'))});
test('signout clears modal returns landing',()=>{click('business:bloom');click('signout','access');assert(!ctx.BahtbridgeAccess.active);assert.equal(modal(),'');assert(html().includes('landing-hero'))});
console.log(logs.join('\n'));console.log('TOTAL '+passed+' passed');
