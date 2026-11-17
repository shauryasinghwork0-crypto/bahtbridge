(() => {
  'use strict';
  const storageKey='bahtbridge-language';
  let language='en';
  try { if(localStorage.getItem(storageKey)==='th')language='th'; } catch {}
  const textMemory=new WeakMap(), attributeMemory=new WeakMap();
  const attributes=['aria-label','placeholder','title','alt'];
  const ignored='script,style,textarea,input,code,pre,[contenteditable="true"],[data-no-translate]';
  const normalise=text=>String(text??'').replace(/\s+/g,' ').trim();
  const dictionary=new Map(Object.entries(window.BB_THAI||{}).map(([key,value])=>[normalise(key),value]));
  const caseDictionary=new Map([...dictionary].map(([key,value])=>[key.toLowerCase(),value]));
  const months={Jan:'ม.ค.',Feb:'ก.พ.',Mar:'มี.ค.',Apr:'เม.ย.',May:'พ.ค.',Jun:'มิ.ย.',Jul:'ก.ค.',Aug:'ส.ค.',Sep:'ก.ย.',Oct:'ต.ค.',Nov:'พ.ย.',Dec:'ธ.ค.'};
  const commonPatterns=[
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?: (\d{4}))?$/,(_match,day,month,year)=>`${day} ${months[month]}${year?' '+year:''}`],
    [/^(\d+)\s+months?$/i,(_match,number)=>`${number} เดือน`],
    [/^(\d+)\s+days?$/i,(_match,number)=>`${number} วัน`],
    [/^(\d+)\s+hours?$/i,(_match,number)=>`${number} ชั่วโมง`],
    [/^(\d+)M$/,(_match,number)=>`${number} เดือน`],
    [/^฿([\d,.]+)([km])$/i,(_match,number,unit)=>new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(Number(number.replaceAll(',',''))*(unit.toLowerCase()==='k'?1000:1000000))],
    [/^(฿[\d,.]+[km]?) to (฿[\d,.]+[km]?)$/i,(_match,min,max)=>`${translate(min)} ถึง ${translate(max)}`],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/,(_match,month)=>months[month]]
  ];
  let depth=0;
  function translate(value) {
    const text=normalise(value);
    if(!text||language!=='th')return text;
    if(dictionary.has(text))return dictionary.get(text);
    if(caseDictionary.has(text.toLowerCase()))return caseDictionary.get(text.toLowerCase());
    if(depth>8)return text;
    depth++;
    try {
      for(const [pattern,replacement] of [...(window.BB_THAI_PATTERNS||[]),...commonPatterns]) {
        pattern.lastIndex=0;
        if(pattern.test(text)){pattern.lastIndex=0;return text.replace(pattern,replacement);}
      }
      if(text.includes(' · '))return text.split(' · ').map(part=>translate(part)).join(' · ');
      return text;
    } finally { depth--; }
  }
  function preserveSpace(source) {
    if(language==='en'||!source.trim())return source;
    return (source.match(/^\s*/)?.[0]||'')+translate(source)+(source.match(/\s*$/)?.[0]||'');
  }
  function translateNode(node) {
    if(!node.parentElement||node.parentElement.closest(ignored))return;
    let memory=textMemory.get(node);
    if(!memory||node.nodeValue!==memory.output)memory={source:node.nodeValue};
    const parent=node.parentElement;
    // Keep form values stable when native options have no explicit value.
    if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.setAttribute('value',parent.textContent);
    memory.output=preserveSpace(memory.source);
    if(node.nodeValue!==memory.output)node.nodeValue=memory.output;
    textMemory.set(node,memory);
  }
  function translateAttributes(element) {
    if(element.closest('[data-no-translate]'))return;
    let memory=attributeMemory.get(element)||{};
    for(const name of attributes) {
      if(!element.hasAttribute(name))continue;
      const current=element.getAttribute(name);
      if(!memory[name]||current!==memory[name].output)memory[name]={source:current};
      memory[name].output=language==='th'?translate(memory[name].source):memory[name].source;
      if(current!==memory[name].output)element.setAttribute(name,memory[name].output);
    }
    attributeMemory.set(element,memory);
  }
  let observer=null, scheduled=false, titleMemory=null;
  function apply() {
    observer?.disconnect();
    try {
      document.documentElement.lang=language;
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode()))translateNode(node);
      document.body.querySelectorAll('[aria-label],[placeholder],[title],[alt]').forEach(translateAttributes);
      if(!titleMemory||document.title!==titleMemory.output)titleMemory={source:document.title};
      titleMemory.output=language==='th'?translate(titleMemory.source):titleMemory.source;
      if(document.title!==titleMemory.output)document.title=titleMemory.output;
      document.querySelectorAll('[data-locale-toggle]').forEach(button=>{
        const label=language==='th'?'เปลี่ยนเป็นภาษาอังกฤษ':'Switch to Thai';
        button.setAttribute('aria-label',label);button.setAttribute('title',label);
        const text=button.querySelector('span');
        if(text){text.textContent=language==='th'?'English':'ไทย';text.lang=language==='th'?'en':'th';}
      });
    } finally {
      observer?.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});
      scheduled=false;
    }
  }
  function schedule() { if(!scheduled){scheduled=true;queueMicrotask(apply);} }
  function setLanguage(next) {
    language=next==='th'?'th':'en';
    try{localStorage.setItem(storageKey,language);}catch{}
    apply();
    const status=document.querySelector('#locale-status');
    if(status)status.textContent=language==='th'?'เปลี่ยนภาษาเป็นไทยแล้ว':'Language changed to English.';
  }
  window.BBLocale={t:translate,setLanguage,apply,get language(){return language;}};
  const status=document.createElement('div');status.id='locale-status';status.className='visually-hidden';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('data-no-translate','');document.body.append(status);
  document.addEventListener('click',event=>{if(event.target.closest('[data-locale-toggle]')){event.preventDefault();setLanguage(language==='en'?'th':'en');}});
  if(typeof MutationObserver!=='undefined')observer=new MutationObserver(schedule);
  apply();
})();
