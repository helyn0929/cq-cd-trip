// ---- 每日地圖（示意圖）----
const NS="http://www.w3.org/2000/svg";
const M={IW:470,MX:105,MY:70,FT:22,FL:19,PR:17};
const el=(tag,attrs={},parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e};
const tw=(s,fs)=>[...s].reduce((w,c)=>w+(c.charCodeAt(0)>255?fs:fs*.6),0);
const shortName=n=>{let t=n.replace(/（.*?）/g,"");if(t.length>7)t=t.split(/[＋／ ]/)[0];return t};
function pathOf(P,pts,close){return pts.map((q,i)=>{const [x,y]=P(q[0],q[1]);return (i?"L":"M")+x.toFixed(1)+","+y.toFixed(1)}).join(" ")+(close?"Z":"")}
function inView(x,y,W,H,m=30){return x>m&&x<W-m&&y>m&&y<H-m}
function drawBase(svg,day,P,s,W,H,mPerPx){
  const g=el("g",{"aria-hidden":"true"},svg);
  el("rect",{x:0,y:0,width:W,height:H,class:"r-land"},g);
  const txt=(x,y,c,t)=>{const e=el("text",{x,y,class:c},g);e.textContent=t;return e};
  if(day.base==="region"){
    REGION.forEach(([pv,name,ring])=>{el("path",{d:pathOf(P,ring.map(c=>[c[1],c[0]]),true),class:"r-county "+pv},g)});
    [["重 慶",29.95,106.35],["四 川",30.95,104.75]].forEach(([n,la,ln])=>{const [x,y]=P(la,ln);if(inView(x,y,W,H,10))txt(x,y,"r-provtx",n)});
    return;
  }
  const rivers=day.base==="cq"?CQ_RIVERS:CD_RIVERS, parks=day.base==="cq"?CQ_PARKS:CD_PARKS;
  parks.forEach(pk=>{if(!pk.r)return;const [x,y]=P(pk.lat,pk.lng),r=pk.r/mPerPx;el("ellipse",{cx:x,cy:y,rx:r*1.15,ry:r*.85,class:"r-park"},g);if(pk.n&&r>18&&inView(x,y,W,H))txt(x,y+r*.85+17,"r-parktx",pk.n)});
  if(day.base==="cd"){
    const [la0,ln0]=CD_CENTER,k=Math.cos(la0*Math.PI/180);
    CD_RINGS.forEach(([n,km])=>{
      const pts=[];for(let a=0;a<=72;a++){const t=a/72*2*Math.PI,sq=1+.12*Math.cos(4*t);pts.push([la0+km*sq/111*Math.sin(t),ln0+km*sq/(111*k)*Math.cos(t)])}
      const d=pathOf(P,pts,true);el("path",{d,class:"r-roadcase","stroke-width":9},g);el("path",{d,class:"r-road","stroke-width":5},g);
      for(const t of [Math.PI*.25,Math.PI*1.25,Math.PI*.75,Math.PI*1.75]){const sq=1+.12*Math.cos(4*t);const [x,y]=P(la0+km*sq/111*Math.sin(t),ln0+km*sq/(111*k)*Math.cos(t));if(inView(x,y,W,H,50)){txt(x+5,y-8,"r-roadtx",n);break}}
    });
  }
  const rw=Math.min(Math.max(420/mPerPx,10),36);
  rivers.forEach(r=>el("path",{d:pathOf(P,r.pts),class:"r-riveredge","stroke-width":rw+4},g));
  rivers.forEach(r=>el("path",{d:pathOf(P,r.pts),class:"r-river","stroke-width":rw},g));
  rivers.forEach(r=>{const [x,y]=P(r.label[0],r.label[1]);if(inView(x,y,W,H,30)){const t=txt(x,y+5,"r-rivername",r.name);t.setAttribute("text-anchor","middle")}});
  if(day.base==="cq"){
    CQ_BRIDGES.forEach(([a,b])=>{const [x1,y1]=P(a[0],a[1]),[x2,y2]=P(b[0],b[1]);el("line",{x1,y1,x2,y2,class:"r-bridge"},g)});
    CQ_DISTRICTS.forEach(([n,la,ln])=>{const [x,y]=P(la,ln);if(inView(x,y,W,H,60))txt(x,y,"r-district",n)});
    if(day.id==="d2"){
      el("path",{d:pathOf(P,CQ_METRO.map(m=>[m[1],m[2]])),class:"r-metro"},g);
      CQ_METRO.forEach(([n,la,ln])=>{const [x,y]=P(la,ln);el("circle",{cx:x,cy:y,r:4,class:"r-metrost"},g)});
      const [x,y]=P(29.5385,106.5215);txt(x+10,y,"r-metrotx","輕軌 2 號線");
    }
  }
}
function drawMap(day,onPin){
  const pts=day.pts, lat0=pts.reduce((a,p)=>a+p.lat,0)/pts.length, kx=Math.cos(lat0*Math.PI/180);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  pts.forEach(p=>{const x=p.lng*kx,y=-p.lat;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)});
  const sx=maxX-minX||.01, sy=maxY-minY||.01, s=Math.min(M.IW/sx, 640/sy);
  const h=Math.max(sy*s,300), W=M.IW+2*M.MX, H=h+2*M.MY;
  const ox=(W-sx*s)/2, oy=(H-sy*s)/2+6;
  const P=(lat,lng)=>[ox+(lng*kx-minX)*s, oy+(-lat-minY)*s];
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":`${day.title} 路線示意圖`});
  const mk=el("marker",{id:"ah-"+day.id,viewBox:"0 0 10 10",refX:"7",refY:"5",markerWidth:"5",markerHeight:"5",orient:"auto-start-reverse"},el("defs",{},svg));
  el("path",{d:"M0,0 L10,5 L0,10 z",class:"r-head"},mk);
  const mPerPx=111000/s;
  drawBase(svg,day,P,s,W,H,mPerPx);
  const legG=el("g",{},svg), labG=el("g",{},svg), legLabels=[], boxes=[];
  const ov=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const cost=b=>boxes.reduce((s,o)=>s+ov(b,o),0)+(b.x<2||b.x+b.w>W-2||b.y<2||b.y+b.h>H-2?5000:0);
  boxes.push({x:14,y:H-62,w:140,h:52},{x:W-56,y:8,w:48,h:60});
  pts.forEach(p=>{if(p.k==="opt")return;const [x,y]=P(p.lat,p.lng),r=M.PR;boxes.push({x:x-r,y:y-r,w:2*r,h:2*r})});
  day.legs.forEach(([a,b,mode,label,o={}],i)=>{
    const [x1,y1]=P(pts[a].lat,pts[a].lng),[x2,y2]=P(pts[b].lat,pts[b].lng);
    const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    const bend=(o.bend!=null?o.bend*Math.min(L,420):.18*Math.min(L,260)*(i%2?-1:1));
    const cx=(x1+x2)/2+nx*bend, cy=(y1+y2)/2+ny*bend;
    const trim=(xa,ya,xb,yb,r)=>{const l=Math.hypot(xb-xa,yb-ya)||1;return [xa+(xb-xa)/l*r,ya+(yb-ya)/l*r]};
    const [a1,b1]=trim(x1,y1,cx,cy,M.PR+4),[a2,b2]=trim(x2,y2,cx,cy,M.PR+5);
    const d=`M${a1.toFixed(1)},${b1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${a2.toFixed(1)},${b2.toFixed(1)}`;
    el("path",{d,class:"r-leg"+(mode==="walk"?" walk":""),"stroke-width":mode==="rail"?6.5:4.2,"marker-end":`url(#ah-${day.id})`},legG);
    if(mode==="rail")el("path",{d,class:"r-rail-in"},legG);
    if(label&&!o.hide){const mx=.25*x1+.5*cx+.25*x2,my=.25*y1+.5*cy+.25*y2,sg=Math.sign(bend||1);
      legLabels.push({x:mx+nx*sg*15,y:my+ny*sg*15,label})}
  });
  pts.forEach(p=>{
    if(p.k==="opt")return;
    const [x,y]=P(p.lat,p.lng), g=el("g",{class:"pt"},svg);
    let off=M.PR+5;
    if(p.k==="hotel"){el("rect",{x:x-14,y:y-14,width:28,height:28,rx:4,class:"r-hotel"},g);const t=el("text",{x,y:y+1,class:"r-hoteltx"},g);t.textContent="宿";off=21}
    else if(p.k==="bf"){el("rect",{x:x-14,y:y-14,width:28,height:28,rx:4,class:"r-bf"},g);const t=el("text",{x,y:y+1,class:"r-bftx"},g);t.textContent=p.b||"早";off=21}
    else if(p.k==="city"){el("circle",{cx:x,cy:y,r:10,class:"r-city"},g);off=17}
    else{el("circle",{cx:x,cy:y,r:M.PR,class:"r-pin"+(p.food?" food":"")},g);const t=el("text",{x,y:y+1,class:"r-pinnum"},g);t.textContent=p.n;
      if(onPin){g.style.cursor="pointer";g.addEventListener("click",ev=>{ev.stopPropagation();onPin(p.n)})}}
    if(p.nolabel)return;
    const name=p.k==="hotel"||p.k==="bf"?p.name:shortName(p.name), w=tw(name,M.FT)+16, th=32;
    const cand=s=>{switch(s){case"l":return{x:x-off-w,y:y-th/2};case"t":return{x:x-w/2,y:y-off-th};case"b":return{x:x-w/2,y:y+off};default:return{x:x+off,y:y-th/2}}};
    const order=[p.side||"r",...["r","l","t","b"].filter(q=>q!==(p.side||"r"))];
    let best=null;for(const q of order){const c=cand(q),b={x:c.x,y:c.y,w,h:th},k=cost(b);if(!best||k<best.k-1)best={...b,k};if(k===0)break}
    if(best.k>w*th*.25&&p.k!=="hotel")return;
    boxes.push(best);let bx=Math.max(4,Math.min(W-w-4,best.x)),by=best.y;
    const kind=p.k==="hotel"?" hotel":(p.food||p.k==="bf")?" food":"";
    el("rect",{x:bx,y:by,width:w,height:th,rx:3,class:"r-tag"+kind},g);
    const t=el("text",{x:bx+8,y:by+th/2+1,class:"r-tagtx"+kind},g);t.textContent=name;
  });
  legLabels.forEach(l=>{const w=tw(l.label,M.FL)+6,b={x:l.x-w/2,y:l.y-M.FL/2-4,w,h:M.FL+4};if(cost(b)>0)return;boxes.push(b);
    const t=el("text",{x:l.x.toFixed(1),y:(l.y+6).toFixed(1),class:"r-leglabel","text-anchor":"middle"},labG);t.textContent=l.label});
  svg.appendChild(labG);
  const nice=[100,200,500,1000,2000,5000,10000,20000,50000,100000],m=nice.find(v=>v/mPerPx>=90)||100000,px=m/mPerPx;
  el("path",{d:`M22,${H-30} v8 h${px.toFixed(1)} v-8`,class:"r-scale"},svg);
  const st=el("text",{x:22,y:H-38,class:"r-scaletx"},svg);st.textContent=m>=1000?`${m/1000} 公里`:`${m} 公尺`;
  el("path",{d:`M${W-32},20 l9,22 l-9,-6 l-9,6 z`,class:"r-n"},svg);
  const nt=el("text",{x:W-32,y:60,class:"r-scaletx","text-anchor":"middle"},svg);nt.textContent="N";
  return svg;
}
