/** Shared public-overlay checks. Evaluate read-only in the browser after layout settles. */
export function inspectOwnedOverlays() {
  const visible=e=>{if(!e||e.closest('[hidden],[aria-hidden="true"],script,style,noscript,.sr-only'))return false;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;if(p.tagName==='DETAILS'&&!p.open&&p!==e&&!p.querySelector(':scope>summary')?.contains(e))return false}return !!e.getClientRects().length};
  const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
  const intersect=(a,b)=>({width:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)),height:Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))});
  const overlaps=(a,b)=>{const q=intersect(a,b);return q.width>.5&&q.height>.5};
  const inside=(a,b)=>a.left>=b.left-.5&&a.right<=b.right+.5&&a.top>=b.top-.5&&a.bottom<=b.bottom+.5;
  const textRects=e=>{const items=[],w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(!n.textContent.trim()||!visible(n.parentElement))continue;const r=document.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width>0&&q.height>0)items.push({rect:{left:q.left,top:q.top,right:q.right,bottom:q.bottom},sample:n.textContent.trim().slice(0,100)})}return items};
  const checks=[];
  const stamp=document.querySelector('.home-planning-stamp'),art=document.querySelector('.home-planning-art'),copy=document.querySelector('.home-planning-copy');
  if(visible(stamp)&&visible(art)&&visible(copy)){
    const stampBox=rect(stamp),artBox=rect(art),copyBox=rect(copy);
    const hits=textRects(copy).filter(t=>overlaps(stampBox,t.rect));
    checks.push({kind:'planning-callout',classes:String(stamp.className),pass:inside(stampBox,artBox)&&!overlaps(stampBox,copyBox)&&hits.length===0,contained:inside(stampBox,artBox),stamp:stampBox,art:artBox,copy:copyBox,coveredText:hits});
  }
  for(const figure of document.querySelectorAll('figure:has([class*="photoLabel"])')){
    const label=figure.querySelector('[class*="photoLabel"]'),symbol=figure.querySelector('[class*="photoSymbol"]');
    if(!visible(figure)||!visible(label)||!visible(symbol))continue;
    const owner=rect(figure),labelBox=rect(label),symbolBox=rect(symbol);
    checks.push({kind:'photo-label-symbol',classes:String(figure.className),pass:inside(labelBox,owner)&&inside(symbolBox,owner)&&!overlaps(labelBox,symbolBox),label:labelBox,symbol:symbolBox,owner,overlap:intersect(labelBox,symbolBox)});
  }
  for(const card of document.querySelectorAll('.home-benefit-body')){
    const index=card.querySelector('.home-card-index'),heading=card.querySelector('h3');
    if(!visible(index)||!visible(heading))continue;
    const indexBox=rect(index),hits=textRects(heading).filter(t=>overlaps(indexBox,t.rect));
    checks.push({kind:'benefit-index-heading',classes:String(card.className),pass:hits.length===0,index:indexBox,coveredText:hits});
  }
  const bar=document.querySelector('.sticky-cta[data-visible="true"]'),footer=document.querySelector('footer');
  if(visible(bar)){
    const barBox=rect(bar),focused=document.activeElement;
    if(focused?.closest('main form')&&visible(focused))checks.push({kind:'focused-form-control',pass:!overlaps(barBox,rect(focused)),bar:barBox,control:rect(focused),tag:focused.tagName});
    if(visible(footer)){
      const hits=textRects(footer).filter(t=>t.rect.bottom>0&&t.rect.top<document.documentElement.clientHeight&&overlaps(barBox,t.rect));
      checks.push({kind:'fixed-action-footer',pass:hits.length===0,bar:barBox,atDocumentEnd:scrollY>=document.documentElement.scrollHeight-document.documentElement.clientHeight-1,coveredText:hits});
    }
  }
  return checks;
}
