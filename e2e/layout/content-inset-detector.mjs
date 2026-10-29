/** Separate content-inset contract checker. The original geometry detector is unchanged. */
export function inspectTextInsetContract() {
  const visible=e=>{
    if(!e||e.closest('[hidden],[aria-hidden="true"],script,style,noscript,.sr-only'))return false;
    for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;if(p.tagName==='DETAILS'&&!p.open&&p!==e&&!p.querySelector(':scope>summary')?.contains(e))return false;}
    return e.getClientRects().length>0;
  };
  const rectsOf=e=>{
    const rects=[],walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||!visible(n.parentElement))continue;const r=document.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width>0&&q.height>0)rects.push(q);}
    return rects;
  };
  return [...document.querySelectorAll('.site-experience [data-content-inset]')].filter(visible).map((e,index)=>{
    const b=e.getBoundingClientRect(),s=getComputedStyle(e),profile=e.dataset.contentInset==='compact'?'compact':'card',required=profile==='compact'?12:16;
    const rects=rectsOf(e),padding={top:parseFloat(s.paddingTop),right:parseFloat(s.paddingRight),bottom:parseFloat(s.paddingBottom),left:parseFloat(s.paddingLeft)};
    const text=rects.length?{left:Math.min(...rects.map(q=>q.left-b.left)),right:Math.min(...rects.map(q=>b.right-q.right)),top:Math.min(...rects.map(q=>q.top-b.top)),bottom:Math.min(...rects.map(q=>b.bottom-q.bottom))}:null;
    const paddingPass=Object.values(padding).every(v=>v>=required-.5),textPass=!text||Object.values(text).every(v=>v>=required-.5);
    return{index,tag:e.tagName.toLowerCase(),classes:String(e.className),profile,required,padding,text,width:b.width,height:b.height,textFragmentCount:rects.length,paddingPass,textPass,pass:paddingPass&&textPass,sample:e.textContent.replace(/\s+/g,' ').trim().slice(0,90)};
  });
}

/** Legacy family inventory records actual text gaps even before a shell is opted in. */
export function inspectInsetFamilies() {
  const definitions=[
    ['benefit','.home-benefit-body',16],['tilt','.tilt-body:not(.home-benefit-body)',16],
    ['story','.story-chapter',16],['next-step','.story-next-card',16],
    ['seo-body','[class*="sectionBody"]',16],['fact','[class*="factCard"]',16],['related','[class*="relatedCopy"]',16],
    ['faq','[class*="faqCards"]>details,.home-faq-list>details',12],
    ['catalog','.catalog-result',16],['hub','[class*="hubCardCopy"],[class*="cardCopy"]',16],
    ['navigation','.guide-discovery-categories a',12],['map','.state-guide-atlas-grid a',12],
    ['starter','.vsh-start',16],['quote','.quote-survey-full',16],['field','.vsh-start__field',12],
    ['record','.dt-record',12],['reference-row','.table-wrap[data-wide] tbody tr,.table-wrap[data-reflow] tbody tr',12],
    ['native-card','main .rounded-card.shadow-e1',16],
  ];
  const visible=e=>{
    if(e.closest('[hidden],[aria-hidden="true"],script,style,noscript,.sr-only'))return false;
    for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;if(p.tagName==='DETAILS'&&!p.open&&p!==e&&!p.querySelector(':scope>summary')?.contains(e))return false;}
    return !!e.getClientRects().length;
  };
  return definitions.flatMap(([family,selector,required])=>[...document.querySelectorAll(selector)].filter(visible).map((e,index)=>{
    const b=e.getBoundingClientRect(),s=getComputedStyle(e),rects=[],walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||!visible(n.parentElement))continue;const r=document.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width>0&&q.height>0)rects.push(q);}
    const text=rects.length?{left:Math.min(...rects.map(q=>q.left-b.left)),right:Math.min(...rects.map(q=>b.right-q.right)),top:Math.min(...rects.map(q=>q.top-b.top)),bottom:Math.min(...rects.map(q=>b.bottom-q.bottom))}:null;
    return{family,index,tag:e.tagName.toLowerCase(),classes:String(e.className),marked:e.hasAttribute('data-content-inset'),profile:e.dataset.contentInset??null,required,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],text,width:b.width,height:b.height,pass:!text||Object.values(text).every(v=>v>=required-.5),sample:e.textContent.replace(/\s+/g,' ').trim().slice(0,90)};
  }));
}
