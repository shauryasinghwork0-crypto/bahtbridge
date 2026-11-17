const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

const source=name=>fs.readFileSync(path.resolve(__dirname,'../dist',name),'utf8');

// A small DOM model for the state that localisation owns. Values behave like
// native controls: option labels supply their value until an explicit value is
// set, while user input and textarea values are independent of translated copy.
function environment({storedLanguage,storageFails=false}={}) {
  const jobs=[],listeners={},observers=[];
  const storage=new Map(storedLanguage===undefined?[]:[['bahtbridge-language',storedLanguage]]);
  const descendants=element=>element.children.flatMap(child=>child.nodeType===1?[child,...descendants(child)]:[]);
  const within=(node,ancestor)=>{for(let current=node;current;current=current.parentElement)if(current===ancestor)return true;return false;};
  function notify(target,type,attributeName) {
    for(const observer of observers) {
      if(!observer.target||!within(target,observer.target))continue;
      if(type==='attributes'&&!observer.options.attributeFilter.includes(attributeName))continue;
      observer.records.push({target,type,attributeName});
      if(observer.pending)continue;
      observer.pending=true;
      jobs.push(()=>{
        observer.pending=false;
        const records=observer.records.splice(0);
        if(records.length)observer.callback(records,observer);
      });
    }
  }
  function matches(element,selector) {
    return selector.split(',').some(part=>{
      part=part.trim();
      if(part.startsWith('#'))return element.id===part.slice(1);
      const attr=part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if(attr)return element.hasAttribute(attr[1])&&(attr[2]===undefined||element.getAttribute(attr[1])===attr[2]);
      return element.tagName===part.toUpperCase();
    });
  }
  class Text {
    constructor(value){this.nodeType=3;this._value=value;this.parentElement=null;}
    get nodeValue(){return this._value;}
    set nodeValue(value){this._value=value;notify(this,'characterData');}
    get textContent(){return this.nodeValue;}
  }
  class Element {
    constructor(tag){this.nodeType=1;this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.parentElement=null;this._value='';}
    append(...nodes){for(let node of nodes){if(typeof node==='string')node=new Text(node);node.parentElement=this;this.children.push(node);}notify(this,'childList');}
    get textContent(){return this.children.map(child=>child.textContent).join('');}
    set textContent(value){for(const child of this.children)child.parentElement=null;this.children=[];this.append(String(value));}
    get value(){return this.tagName==='OPTION'?(this.getAttribute('value')??this.textContent):this._value;}
    set value(value){if(this.tagName==='OPTION')this.setAttribute('value',value);else this._value=value;}
    setAttribute(name,value){this.attributes.set(name,String(value));notify(this,'attributes',name);}
    getAttribute(name){return this.attributes.has(name)?this.attributes.get(name):null;}
    hasAttribute(name){return this.attributes.has(name);}
    get id(){return this.getAttribute('id')||'';}
    set id(value){this.setAttribute('id',value);}
    closest(selector){for(let element=this;element;element=element.parentElement)if(matches(element,selector))return element;return null;}
    querySelectorAll(selector){return descendants(this).filter(element=>matches(element,selector));}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  }
  const html=new Element('html'),body=new Element('body');html.append(body);
  const document={
    documentElement:html,body,title:'Bahtbridge | Business credit in Thai baht',
    createElement:tag=>new Element(tag),
    querySelectorAll:selector=>html.querySelectorAll(selector),
    querySelector:selector=>html.querySelector(selector),
    addEventListener(type,listener){(listeners[type]||=[]).push(listener);},
    createTreeWalker(root){
      const textNodes=[];
      const visit=element=>element.children.forEach(child=>child.nodeType===3?textNodes.push(child):visit(child));
      visit(root);let index=0;
      return {nextNode:()=>textNodes[index++]||null};
    }
  };
  const make=(tag,text,attrs={})=>{const element=new Element(tag);if(text!==undefined)element.append(text);for(const [key,value]of Object.entries(attrs))element.setAttribute(key,value);return element;};
  const heading=make('h1','  Overview \n');
  const paragraph=make('p','Transactions');
  const input=make('input',undefined,{placeholder:'Search lenders or finance products','aria-label':'Search lenders or finance products'});input.value='Overview';
  const image=make('img',undefined,{alt:'Illustrative vendor cash flow',title:'Business profile'});
  const select=make('select');const implicitOption=make('option','Under review');const explicitOption=make('option','Accepted',{value:'accepted-id'});select.append(implicitOption,explicitOption);
  const textarea=make('textarea','Overview');textarea.value='My own text';
  const pre=make('pre','Overview');
  const editable=make('div','Overview',{contenteditable:'true'});
  const skipped=make('div','Overview',{'data-no-translate':''});
  const name=make('p','Siam Capital'),amount=make('p','฿250,000'),container=make('section');
  const button=make('button',undefined,{'data-locale-toggle':'','data-no-translate':'','aria-label':'Switch to Thai'});button.append(make('span','ไทย'));
  body.append(heading,paragraph,input,image,select,textarea,pre,editable,skipped,name,amount,container,button);
  class MutationObserver {
    constructor(callback){this.callback=callback;this.records=[];this.pending=false;observers.push(this);}
    observe(target,options){this.target=target;this.options=options;}
    disconnect(){this.target=null;this.records=[];}
  }
  const context={console,Intl,NodeFilter:{SHOW_TEXT:4},document,MutationObserver,queueMicrotask:fn=>jobs.push(fn),window:{},localStorage:{
    getItem(key){if(storageFails)throw Error('Storage unavailable');return storage.get(key)||null;},
    setItem(key,value){if(storageFails)throw Error('Storage unavailable');storage.set(key,value);}
  }};
  vm.createContext(context);
  for(const name of ['data.js','filters.js','th-public.js','th-workspace.js','th-workflows.js','locale.js'])vm.runInContext(source(name),context,{filename:name});
  const flush=()=>{let count=0;while(jobs.length){assert(count++<50,'localisation must settle without a mutation loop');jobs.shift()();}return count;};
  const click=target=>listeners.click.forEach(listener=>listener({target,preventDefault(){}}));
  return {locale:context.window.BBLocale,filters:context.window.BBFilters,data:context.window.DEMO,document,make,body,heading,paragraph,input,image,implicitOption,explicitOption,textarea,pre,editable,skipped,name,amount,container,button,storage,flush,click};
}

test('language switch translates text, accessible labels and page title, then restores exact source text',()=>{
  const e=environment();
  assert.equal(e.document.documentElement.lang,'en');
  assert.equal(e.heading.textContent,'  Overview \n');
  e.click(e.button.querySelector('span'));e.flush();
  assert.equal(e.document.documentElement.lang,'th');
  assert.equal(e.heading.textContent,'  ภาพรวม \n');
  assert.equal(e.paragraph.textContent,'รายการรับจ่าย');
  assert.match(e.input.getAttribute('placeholder'),/[\u0e00-\u0e7f]/);
  assert.match(e.input.getAttribute('aria-label'),/[\u0e00-\u0e7f]/);
  assert.match(e.image.getAttribute('alt'),/[\u0e00-\u0e7f]/);
  assert.match(e.image.getAttribute('title'),/[\u0e00-\u0e7f]/);
  assert.equal(e.document.title,'Bahtbridge | สินเชื่อธุรกิจในสกุลเงินบาท');
  assert.equal(e.button.querySelector('span').textContent,'English');
  assert.equal(e.button.getAttribute('aria-label'),'เปลี่ยนเป็นภาษาอังกฤษ');
  e.click(e.button);e.flush();
  assert.equal(e.heading.textContent,'  Overview \n');
  assert.equal(e.input.getAttribute('placeholder'),'Search lenders or finance products');
  assert.equal(e.document.title,'Bahtbridge | Business credit in Thai baht');
  assert.equal(e.button.querySelector('span').textContent,'ไทย');
});

test('translated option labels retain original submitted values',()=>{
  const e=environment();e.locale.setLanguage('th');e.flush();
  assert.equal(e.implicitOption.textContent,'กำลังพิจารณา');
  assert.equal(e.implicitOption.value,'Under review');
  assert.equal(e.explicitOption.value,'accepted-id');
  assert.match(e.explicitOption.textContent,/[\u0e00-\u0e7f]/);
  const newOption=e.make('option','Information requested');
  e.implicitOption.parentElement.append(newOption);e.flush();
  assert.equal(newOption.value,'Information requested');
  assert.match(newOption.textContent,/[\u0e00-\u0e7f]/);
  e.locale.setLanguage('en');e.flush();
  assert.equal(e.implicitOption.textContent,'Under review');
  assert.equal(e.implicitOption.value,'Under review');
  assert.equal(e.explicitOption.value,'accepted-id');
});

test('translation preserves user input, message drafts, editable content, names and money',()=>{
  const e=environment();e.locale.setLanguage('th');e.flush();
  assert.equal(e.input.value,'Overview');
  assert.equal(e.textarea.value,'My own text');
  assert.equal(e.textarea.textContent,'Overview');
  assert.equal(e.pre.textContent,'Overview');
  assert.equal(e.editable.textContent,'Overview');
  assert.equal(e.skipped.textContent,'Overview');
  assert.equal(e.name.textContent,'Siam Capital');
  assert.equal(e.amount.textContent,'฿250,000');
});

test('new content and application text updates are translated by the observer without stale originals',()=>{
  const e=environment();e.locale.setLanguage('th');e.flush();
  const incoming=e.make('p','Settings');e.container.append(incoming);e.flush();
  assert.equal(incoming.textContent,'การตั้งค่า');
  e.paragraph.children[0].nodeValue='Applications';e.flush();
  assert.equal(e.paragraph.textContent,'คำขอสินเชื่อ');
  e.input.setAttribute('placeholder','Email address');e.flush();
  assert.match(e.input.getAttribute('placeholder'),/[\u0e00-\u0e7f]/);
  e.container.textContent='Business profile';e.flush();
  assert.equal(e.container.textContent,'ข้อมูลธุรกิจ');
  e.locale.setLanguage('en');e.flush();
  assert.equal(e.paragraph.textContent,'Applications');
  assert.equal(e.container.textContent,'Business profile');
  assert.equal(e.input.getAttribute('placeholder'),'Email address');
});

test('saved preference survives a new page and invalid preferences fall back to English',()=>{
  const first=environment();first.locale.setLanguage('th');first.flush();
  const second=environment({storedLanguage:first.storage.get('bahtbridge-language')});
  assert.equal(second.locale.language,'th');
  assert.equal(second.heading.textContent,'  ภาพรวม \n');
  assert.equal(environment({storedLanguage:'fr'}).locale.language,'en');
  second.locale.setLanguage('invalid');second.flush();
  assert.equal(second.locale.language,'en');
  assert.equal(second.heading.textContent,'  Overview \n');
});

test('unavailable storage does not block changing languages',()=>{
  const e=environment({storageFails:true});
  assert.equal(e.locale.language,'en');
  assert.doesNotThrow(()=>{e.locale.setLanguage('th');e.flush();});
  assert.equal(e.heading.textContent,'  ภาพรวม \n');
});

test('dynamic criteria and dates are translated without changing their figures',()=>{
  const e=environment();e.locale.setLanguage('th');e.flush();
  assert.equal(e.locale.t('24 months'),'24 เดือน');
  const result=e.locale.t('฿250,000 requested. Sample range: ฿100,000 to ฿1,500,000.');
  assert.match(result,/฿250,000/);assert.match(result,/฿100,000/);assert.match(result,/฿1,500,000/);
  assert.match(result,/[\u0e00-\u0e7f]/);assert.doesNotMatch(result,/requested|Sample range/);
  assert.equal(e.locale.t('17 Nov 2026'),'17 พ.ย. 2026');
});

test('Thai and English provider and vendor searches work while numeric and option filters stay unchanged',()=>{
  const e=environment(),lender=e.data.lenders[0],vendor=e.data.businesses[0];
  assert(e.filters.providerMatches(lender,{query:'SIAM CAPITAL'}));
  e.locale.setLanguage('th');e.flush();
  assert(e.filters.providerMatches(lender,{query:'siam capital'}));
  assert(e.filters.providerMatches(lender,{query:e.locale.t(lender.type)}));
  assert(e.filters.vendorMatches(vendor,{query:e.locale.t(vendor.sector)},e.data.lenders));
  assert(e.filters.vendorMatches(vendor,{query:vendor.name.toLowerCase()},e.data.lenders));
  assert(!e.filters.providerMatches(lender,{query:'คำค้นที่ไม่มีอยู่จริง'}));
  assert(!e.filters.providerMatches(lender,{query:e.locale.t(lender.type),amount:lender.max+1}));
  assert(e.filters.providerMatches(lender,{type:lender.type,collateral:lender.collateral,amount:lender.min}));
  assert(!e.filters.vendorMatches(vendor,{minRevenue:vendor.revenue+1},e.data.lenders));
});
