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
  const mkw=el("marker",{id:"ahw-"+day.id,viewBox:"0 0 10 10",refX:"7",refY:"5",markerWidth:"5",markerHeight:"5",orient:"auto-start-reverse"},svg.querySelector("defs"));el("path",{d:"M0,0 L10,5 L0,10 z",class:"r-head walk"},mkw);
  const mPerPx=111000/s;
  drawBase(svg,day,P,s,W,H,mPerPx);
  // ---- 版面：先把太近的點推開，再放標籤，避免重疊 ----
  const legG=el("g",{},svg), pinG=el("g",{},svg), labG=el("g",{},svg);
  const hard=[], soft=[];
  const ov=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const oob=b=>b.x<4||b.x+b.w>W-4||b.y<4||b.y+b.h>H-4;
  const hcost=b=>oob(b)?1e9:hard.reduce((s,o)=>s+ov(b,o),0);
  const scost=b=>soft.reduce((s,o)=>s+ov(b,o),0);
  hard.push({x:14,y:H-62,w:150,h:52},{x:W-56,y:8,w:48,h:60});
  const vis=pts.map(p=>p.k!=="opt");
  const pos=pts.map(p=>P(p.lat,p.lng));
  const R0=M.PR+5, minD=2*R0;
  for(let it=0;it<60;it++){let moved=false;
    for(let i=0;i<pos.length;i++)for(let j=i+1;j<pos.length;j++){if(!vis[i]||!vis[j])continue;
      const dx=pos[j][0]-pos[i][0],dy=pos[j][1]-pos[i][1],d=Math.hypot(dx,dy);
      if(d<minD){const ux=d?dx/d:1,uy=d?dy/d:0,push=(minD-d)/2+.5;
        pos[i]=[pos[i][0]-ux*push,pos[i][1]-uy*push];pos[j]=[pos[j][0]+ux*push,pos[j][1]+uy*push];moved=true}}
    if(!moved)break}
  pos.forEach((q,i)=>{if(vis[i])hard.push({x:q[0]-R0,y:q[1]-R0,w:2*R0,h:2*R0})});
  const legLabels=[];
  day.legs.forEach(([a,b,mode,label,o={}],i)=>{
    const [x1,y1]=pos[a],[x2,y2]=pos[b];
    const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    const bend=(o.bend!=null?o.bend*Math.min(L,420):.18*Math.min(L,260)*(i%2?-1:1));
    const cx=(x1+x2)/2+nx*bend, cy=(y1+y2)/2+ny*bend;
    const trim=(xa,ya,xb,yb,r)=>{const l=Math.hypot(xb-xa,yb-ya)||1;return [xa+(xb-xa)/l*r,ya+(yb-ya)/l*r]};
    const [a1,b1]=trim(x1,y1,cx,cy,M.PR+4),[a2,b2]=trim(x2,y2,cx,cy,M.PR+5);
    const d=`M${a1.toFixed(1)},${b1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${a2.toFixed(1)},${b2.toFixed(1)}`;
    el("path",{d,class:"r-leg"+(mode==="walk"?" walk":""),"stroke-width":mode==="rail"?6.5:4.2,"marker-end":`url(#${mode==="walk"?"ahw-":"ah-"}${day.id})`},legG);
    if(mode==="rail")el("path",{d,class:"r-rail-in"},legG);
    const Q=t=>[(1-t)*(1-t)*x1+2*(1-t)*t*cx+t*t*x2,(1-t)*(1-t)*y1+2*(1-t)*t*cy+t*t*y2];
    const n=Math.max(2,Math.ceil(L/12));for(let k=1;k<n;k++){const [px,py]=Q(k/n);soft.push({x:px-5,y:py-5,w:10,h:10})}
    if(label&&!o.hide)legLabels.push({Q,nx,ny,sg:Math.sign(bend||1),label,walk:mode==="walk"});
  });
  // 點
  const DIRS=[["r",1,0],["l",-1,0],["t",0,-1],["b",0,1],["tr",1,-1],["br",1,1],["tl",-1,-1],["bl",-1,1]];
  const order=pts.map((p,i)=>i).filter(i=>vis[i]).sort((a,b)=>{const r=p=>p.k==="hotel"?0:p.n?1:2;return r(pts[a])-r(pts[b])||(pts[a].n||0)-(pts[b].n||0)});
  const groups={};
  pts.forEach((p,i)=>{
    if(!vis[i])return;
    const [x,y]=pos[i], g=el("g",{class:"pt"},pinG);groups[i]=g;
    if(p.k==="hotel"){el("rect",{x:x-14,y:y-14,width:28,height:28,rx:4,class:"r-hotel"},g);const t=el("text",{x,y:y+1,class:"r-hoteltx"},g);t.textContent="宿"}
    else if(p.k==="bf"){el("rect",{x:x-14,y:y-14,width:28,height:28,rx:4,class:"r-bf"},g);const t=el("text",{x,y:y+1,class:"r-bftx"},g);t.textContent=p.b||"早"}
    else if(p.k==="city"){el("circle",{cx:x,cy:y,r:10,class:"r-city"},g)}
    else{el("circle",{cx:x,cy:y,r:M.PR,class:"r-pin"+(p.food?" food":"")},g);const t=el("text",{x,y:y+1,class:"r-pinnum"},g);t.textContent=p.n;
      if(onPin){g.style.cursor="pointer";g.addEventListener("click",ev=>{ev.stopPropagation();onPin(p.n)})}}
  });
  order.forEach(i=>{
    const p=pts[i];if(p.nolabel)return;
    const [x,y]=pos[i], name=p.k==="hotel"||p.k==="bf"?p.name:shortName(p.name);
    const pref=p.side||"r";
    const dirs=[...DIRS].sort((a,b)=>(b[0]===pref)-(a[0]===pref));
    let best=null;
    for(const fs of [M.FT,19,16]){
      const w=tw(name,fs)+fs*.7, th=Math.round(fs*1.45);
      for(const extra of [0,10,22])for(const [dn,ux,uy] of dirs){
        const off=R0+3+extra, bx=ux>0?x+off*(uy?.75:1):ux<0?x-off*(uy?.75:1)-w:x-w/2, by=uy>0?y+off*(ux?.75:1):uy<0?y-off*(ux?.75:1)-th:y-th/2;
        const b={x:bx,y:by,w,h:th}, hc=hcost(b);if(hc>0)continue;
        const sc=scost(b)+extra*3+(dn===pref?0:15)+(fs<M.FT?(M.FT-fs)*60:0);
        if(!best||sc<best.sc)best={...b,sc,fs};
      }
      if(best&&best.sc<200)break;
    }
    if(!best)return;
    hard.push(best);
    const kind=p.k==="hotel"?" hotel":(p.food||p.k==="bf")?" food":"";
    const g=groups[i];
    const nx0=Math.max(best.x,Math.min(x,best.x+best.w)),ny0=Math.max(best.y,Math.min(y,best.y+best.h));
    if(Math.hypot(nx0-x,ny0-y)>R0+8)g.insertBefore(el("line",{x1:x,y1:y,x2:nx0,y2:ny0,class:"r-leader"}),g.firstChild);
    el("rect",{x:best.x,y:best.y,width:best.w,height:best.h,rx:3,class:"r-tag"+kind},g);
    const t=el("text",{x:best.x+best.fs*.35,y:best.y+best.h/2+1,class:"r-tagtx"+kind,style:`font-size:${best.fs}px`},g);t.textContent=name;
  });
  legLabels.forEach(l=>{
    for(const fs of [M.FL,15]){
      const w=tw(l.label,fs)+6,h=fs+4;
      for(const t of [.5,.42,.58,.34,.66])for(const side of [l.sg,-l.sg])for(const d of [15,24]){
        const [px,py]=l.Q(t), cx=px+l.nx*side*d, cy=py+l.ny*side*d, b={x:cx-w/2,y:cy-h/2,w,h};
        if(hcost(b)>0)continue;
        hard.push(b);const e=el("text",{x:cx.toFixed(1),y:(cy+fs*.35).toFixed(1),class:"r-leglabel"+(l.walk?" walk":""),"text-anchor":"middle",style:`font-size:${fs}px`},labG);e.textContent=l.label;
        return;
      }
    }
  });
  const nice=[100,200,500,1000,2000,5000,10000,20000,50000,100000],m=nice.find(v=>v/mPerPx>=90)||100000,px=m/mPerPx;
  el("path",{d:`M22,${H-30} v8 h${px.toFixed(1)} v-8`,class:"r-scale"},svg);
  const st=el("text",{x:22,y:H-38,class:"r-scaletx"},svg);st.textContent=m>=1000?`${m/1000} 公里`:`${m} 公尺`;
  el("path",{d:`M${W-32},20 l9,22 l-9,-6 l-9,6 z`,class:"r-n"},svg);
  const nt=el("text",{x:W-32,y:60,class:"r-scaletx","text-anchor":"middle"},svg);nt.textContent="N";
  return svg;
}
