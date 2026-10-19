// Agent Test Bed engine. Shared by the viewer in the browser and the scripts agents run in node.
// Every agent contribution is replayed through applyCall, in date order, so the world is always rebuilt from the saved inputs.

export const S = 79248;
export const SIDEWALK = 3048;
export const PALETTE = ['#1f3a5f','#b4442c','#2f6b3a','#7a4f9a','#c07a12','#2a7f87','#8a2f55','#5a5a5a','#5c7a1f','#a35d2a','#3557a8','#9c8a1a'];
export const DISC = ['street','paving','lot','structure','interior','electrical','plumbing','vegetation','vehicle','activity'];
export const OPEN = new Set(['vegetation','vehicle','activity']);
export const DETAIL = new Set(['interior','electrical','plumbing']);
export const LIMITS = {ptsPerLine:256};
export const REF = {
  door_height:[2032,2438,'Door height'],
  door_width:[813,1219,'Door leaf clear width'],
  knob_height:[864,1219,'Door hardware height'],
  ceiling_height:[2438,3658,'Ceiling height'],
  stall_width:[2591,3658,'Parking stall width'],
  stall_depth:[5486,6096,'Parking stall depth'],
  counter_height:[864,1118,'Counter height'],
  shelf_height:[1219,2134,'Shelf height'],
  outlet_height:[305,1219,'Outlet height'],
  beam_height:[3048,6096,'Beam bottom height'],
  stair_riser:[102,178,'Stair riser height'],
  stair_tread:[279,356,'Stair tread depth'],
  sidewalk_width:[1524,4572,'Sidewalk width'],
  lane_width:[3048,3658,'Travel lane width']
};
export const SYMBOL_TYPES = ['tree','shrub','grass','car','truck','light','outlet','switch','knob','pole','hydrant','sign','mark','person','dog','bench','table','bike','cart','umbrella'];

const OPP = {n:'s',s:'n',e:'w',w:'e'};
const NBR = {n:[0,1],s:[0,-1],e:[1,0],w:[-1,0]};
export const key = (cx,cy)=>cx+':'+cy;
export const chunkOf = (x,y)=>[Math.floor(x/S),Math.floor(y/S)];
const isInt = Number.isInteger;
const vpt = (p)=>Array.isArray(p)&&p.length===3&&p.every(isInt)&&p.every(v=>Math.abs(v)<1e12);
const vcol = (n)=>isInt(n)&&n>=0&&n<PALETTE.length;
const vchunk = (c)=>Array.isArray(c)&&c.length===2&&c.every(isInt);
const ok = (o)=>Object.assign({ok:true},o||{});
const err = (m)=>({ok:false,err:m});

export function createWorld(){return {chunks:new Map(),idIndex:new Map(),nextId:1,stats:{},log:[],ctx:null};}
function st(W,a){return W.stats[a]||(W.stats[a]={calls:0,records:0,rejected:0,passed:0,violations:0,mismatches:0,clashes:0,chunks:0,names:0,unnamed:0,dupNames:0,organic:0,detail:0,activity:0});}
function container(W,cx,cy){
  const k=key(cx,cy);let c=W.chunks.get(k);
  if(!c){c={cx,cy,k,owner:null,grants:{},records:[],ports:{},lots:[],pens:[],flags:[],nodes:new Map()};W.chunks.set(k,c);}
  return c;
}
function log(W,agent,msg,flag){W.log.push({agent,msg,flag:!!flag,date:W.ctx?W.ctx.date:''});}
function canWrite(c,agent,disc){
  if(OPEN.has(disc))return true;
  if(c.owner===agent)return true;
  const g=c.grants[agent];return !!(g&&(g.includes('*')||g.includes(disc)));
}
function snap(c,p){
  const cs=300,gx=Math.round(p[0]/cs),gy=Math.round(p[1]/cs);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const n=c.nodes.get((gx+i)+','+(gy+j)+','+p[2]);
    if(n&&Math.hypot(n[0]-p[0],n[1]-p[1])<=150)return n.slice();
  }
  c.nodes.set(gx+','+gy+','+p[2],p.slice());return p;
}
function runChecks(W,c,rec){
  const checks=rec.meta&&Array.isArray(rec.meta.checks)?rec.meta.checks:[];
  for(const ch of checks){
    if(!Array.isArray(ch))continue;
    const r=REF[ch[0]];if(!r||!isInt(ch[1]))continue;
    if(ch[1]<r[0]||ch[1]>r[1]){st(W,rec.agent).violations++;c.flags.push(rec.pts?rec.pts[0]:rec.at);log(W,rec.agent,r[2]+' '+ch[1]+' mm is outside '+r[0]+' to '+r[1],true);}
    else st(W,rec.agent).passed++;
  }
}
function commit(W,c,rec){rec.date=W.ctx?W.ctx.date:'';c.records.push(rec);W.idIndex.set(rec.id,c.k);st(W,rec.agent).records++;runChecks(W,c,rec);}
function cleanMeta(m){if(!m||typeof m!=='object')return null;try{const s=JSON.stringify(m);return s.length>4000?null:JSON.parse(s);}catch(e){return null;}}
function anyOwned(W){for(const c of W.chunks.values())if(c.owner)return true;return false;}

export const TOOLS = {
  claim_chunk(W,agent,a){
    if(!vchunk(a.chunk))return err('chunk must be [cx, cy] integers');
    const c=container(W,a.chunk[0],a.chunk[1]);
    if(c.owner)return err('chunk '+c.k+' is already owned by '+c.owner);
    if(!anyOwned(W)){if(c.k!=='0:0')return err('the first claim in the world must be chunk 0:0');}
    else{let touch=false;for(const e in NBR){const n=W.chunks.get(key(c.cx+NBR[e][0],c.cy+NBR[e][1]));if(n&&n.owner)touch=true;}if(!touch)return err('a claim must touch an owned chunk');}
    c.owner=agent;st(W,agent).chunks++;return ok();
  },
  grant(W,agent,a){
    if(!vchunk(a.chunk))return err('chunk must be [cx, cy] integers');
    const c=container(W,a.chunk[0],a.chunk[1]);
    if(c.owner!==agent)return err('only the owner of '+c.k+' can grant');
    if(typeof a.agent!=='string'||!Array.isArray(a.disciplines)||!a.disciplines.every(d=>d==='*'||DISC.includes(d)))return err('bad grant');
    c.grants[a.agent]=a.disciplines.slice();return ok();
  },
  place_line(W,agent,a){
    if(!DISC.includes(a.discipline))return err('discipline not in list');
    if(!vcol(a.color))return err('color must be a palette index 0 to '+(PALETTE.length-1));
    if(!Array.isArray(a.pts)||a.pts.length<2||a.pts.length>LIMITS.ptsPerLine||!a.pts.every(vpt))return err('pts must be 2 to '+LIMITS.ptsPerLine+' points of [x, y, z] integer mm');
    const [cx,cy]=chunkOf(a.pts[0][0],a.pts[0][1]);const c=container(W,cx,cy);
    if(!canWrite(c,agent,a.discipline))return err('no write access to chunk '+c.k+' for '+a.discipline);
    const rec={id:W.nextId++,agent,discipline:a.discipline,color:a.color,kind:'line',pts:a.pts.map(p=>snap(c,p)),closed:!!a.closed,meta:cleanMeta(a.meta)};
    commit(W,c,rec);return ok({id:rec.id});
  },
  place_symbol(W,agent,a){
    if(!DISC.includes(a.discipline))return err('discipline not in list');
    if(!vcol(a.color))return err('color must be a palette index 0 to '+(PALETTE.length-1));
    if(!SYMBOL_TYPES.includes(a.type))return err('unknown symbol type');
    if(!vpt(a.at))return err('at must be [x, y, z] integer mm');
    const [cx,cy]=chunkOf(a.at[0],a.at[1]);const c=container(W,cx,cy);
    if(!canWrite(c,agent,a.discipline))return err('no write access to chunk '+c.k+' for '+a.discipline);
    const rec={id:W.nextId++,agent,discipline:a.discipline,color:a.color,kind:'symbol',type:a.type,at:a.at.slice(),rot:Number.isFinite(a.rot)?a.rot:0,meta:cleanMeta(a.meta)};
    commit(W,c,rec);return ok({id:rec.id});
  },
  define_lot(W,agent,a){
    if(!Array.isArray(a.pts)||a.pts.length<3)return err('a lot needs 3 or more points');
    const r=TOOLS.place_line(W,agent,{discipline:'lot',color:a.color,pts:a.pts,closed:true,meta:Object.assign({},cleanMeta(a.meta)||{},{zone:String(a.zone||'unzoned')})});
    if(!r.ok)return r;
    const c=W.chunks.get(W.idIndex.get(r.id));c.lots.push({id:r.id,agent,zone:String(a.zone||'unzoned'),pts:a.pts});return r;
  },
  declare_port(W,agent,a){
    if(!vchunk(a.chunk))return err('chunk must be [cx, cy] integers');
    const c=container(W,a.chunk[0],a.chunk[1]);
    if(c.owner!==agent)return err('only the owner of '+c.k+' sets its ports');
    if(!NBR[a.edge])return err('edge must be n, s, e or w');
    if(!isInt(a.value)||a.value<0||a.value>S/2)return err('value must be integer mm from the street centerline');
    c.ports[a.edge]=a.value;
    const n=W.chunks.get(key(c.cx+NBR[a.edge][0],c.cy+NBR[a.edge][1]));
    const theirs=n&&n.ports[OPP[a.edge]];
    if(theirs!=null&&Math.abs(theirs-a.value)>50){
      st(W,agent).mismatches++;
      const x0=c.cx*S,y0=c.cy*S,e=a.edge;
      c.flags.push(e==='s'?[x0+S/2,y0,0]:e==='n'?[x0+S/2,y0+S-1,0]:e==='w'?[x0,y0+S/2,0]:[x0+S-1,y0+S/2,0]);
      log(W,agent,'curb mismatch on '+e+' edge of '+c.k+': '+a.value+' vs '+theirs+' mm',true);
    }
    return ok();
  },
  declare_penetration(W,agent,a){
    if(!vpt(a.at))return err('at must be [x, y, z] integer mm');
    const [cx,cy]=chunkOf(a.at[0],a.at[1]);const c=container(W,cx,cy);
    if(!canWrite(c,agent,'plumbing')&&!canWrite(c,agent,'electrical'))return err('no write access to chunk '+c.k);
    c.pens.push({agent,at:a.at.slice()});return ok();
  },
  remove(W,agent,a){
    const k=W.idIndex.get(a.id);if(!k)return err('no record with that id');
    const c=W.chunks.get(k);const i=c.records.findIndex(r=>r.id===a.id);
    if(c.records[i].agent!==agent)return err('agents can only remove their own records');
    c.records.splice(i,1);W.idIndex.delete(a.id);st(W,agent).records--;return ok();
  }
};

export function applyCall(W,agent,call){
  st(W,agent).calls++;
  const t=call&&TOOLS[call.tool];
  const r=t?t(W,agent,(call.args&&typeof call.args==='object')?call.args:{}):err('unknown tool '+(call&&call.tool));
  if(!r.ok){st(W,agent).rejected++;log(W,agent,'rejected '+(call&&call.tool)+': '+r.err,true);}
  return r;
}

// files: [{agent, date, calls}] already sorted by date then agent.
export function replay(files,onResult){
  const W=createWorld();
  for(const f of files){
    W.ctx={date:f.date,claims:0,agent:f.agent};
    if(!Array.isArray(f.calls)){log(W,f.agent,'file '+f.date+' has no calls array',true);continue;}
    f.calls.forEach((call,i)=>{const r=applyCall(W,f.agent,call);if(onResult)onResult(f,i,call,r);});
  }
  W.ctx=null;
  finalize(W);
  return W;
}

// Symbols and segments, all in mm.
function circle(cx,cy,z,r,n){const s=[];for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2;s.push([cx+Math.cos(a0)*r,cy+Math.sin(a0)*r,z],[cx+Math.cos(a1)*r,cy+Math.sin(a1)*r,z]);}return s;}
function boxSegs(x0,y0,x1,y1,z0,z1){const q=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],s=[];for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4];s.push([a[0],a[1],z0],[b[0],b[1],z0],[a[0],a[1],z1],[b[0],b[1],z1],[a[0],a[1],z0],[a[0],a[1],z1]);}return s;}
function rot(segs,ox,oy,oz,r){const c=Math.cos(r),s=Math.sin(r);return segs.map(p=>[ox+p[0]*c-p[1]*s,oy+p[0]*s+p[1]*c,oz+p[2]]);}
export const SYMBOLS = {
  tree:(x,y,z)=>[[x,y,z],[x,y,z+3000],...circle(x,y,z+3000,1800,8),...circle(x,y,z+4600,1200,8),...circle(x,y,z,500,6)],
  shrub:(x,y,z)=>[...circle(x,y,z+400,600,6),...circle(x,y,z+800,400,6)],
  grass:(x,y,z)=>[[x,y,z],[x-120,y,z+300],[x,y,z],[x,y,z+380],[x,y,z],[x+120,y,z+300]],
  car:(x,y,z,r)=>rot([...boxSegs(-914,-2286,914,2286,0,762),...boxSegs(-800,-1100,800,1000,762,1448)],x,y,z,r),
  truck:(x,y,z,r)=>rot([...boxSegs(-1219,-4572,1219,4572,0,1067),...boxSegs(-1219,1524,1219,4572,1067,2743),...boxSegs(-1219,-4572,1219,1300,1067,3658)],x,y,z,r),
  light:(x,y,z)=>{const h=305;return [[x-h,y-h,z],[x+h,y-h,z],[x+h,y-h,z],[x+h,y+h,z],[x+h,y+h,z],[x-h,y+h,z],[x-h,y+h,z],[x-h,y-h,z],[x-h,y-h,z],[x+h,y+h,z]];},
  outlet:(x,y,z)=>[[x,y,z-57],[x,y,z+57],[x-38,y,z],[x+38,y,z],[x,y-38,z],[x,y+38,z]],
  switch:(x,y,z)=>[[x,y,z-57],[x,y,z+57],[x-38,y,z+57],[x+38,y,z+57]],
  knob:(x,y,z)=>[[x-40,y,z],[x,y,z+40],[x,y,z+40],[x+40,y,z],[x+40,y,z],[x,y,z-40],[x,y,z-40],[x-40,y,z]],
  pole:(x,y,z)=>[[x,y,z],[x,y,z+9144],[x-900,y,z+8230],[x+900,y,z+8230]],
  hydrant:(x,y,z)=>[...circle(x,y,z,150,6),[x,y,z],[x,y,z+760],[x-200,y,z+500],[x+200,y,z+500]],
  sign:(x,y,z,r)=>rot([[0,0,0],[0,0,2134],[-300,0,2134],[300,0,2134],[300,0,2134],[300,0,2740],[300,0,2740],[-300,0,2740],[-300,0,2740],[-300,0,2134]],x,y,z,r),
  mark:(x,y,z)=>[[x-600,y-600,z],[x+600,y+600,z],[x-600,y+600,z],[x+600,y-600,z]],
  person:(x,y,z,r,m)=>{
    const pose=m&&m.pose;
    if(pose==='sitting')return rot([...circle(0,0,1250,110,6).map(p=>[p[0],p[1],p[2]]),[0,0,1140],[0,0,450],[0,0,450],[0,350,450],[0,350,450],[0,350,0],[0,0,950],[150,250,650],[0,0,950],[-150,250,650]],x,y,z,r);
    const w=pose==='walking'?220:0;
    return rot([...circle(0,0,1600,110,6),[0,0,1490],[0,0,900],[0,0,900],[-120,w,0],[0,0,900],[120,-w,0],[0,0,1350],[-300,-w,950],[0,0,1350],[300,w,950]],x,y,z,r);
  },
  dog:(x,y,z,r)=>rot([[0,-350,450],[0,350,450],[0,350,450],[0,500,600],[0,-350,450],[0,-450,600],[0,-300,450],[0,-300,0],[0,300,450],[0,300,0]],x,y,z,r),
  bench:(x,y,z,r)=>rot([...boxSegs(-900,-200,900,200,430,460),[-800,0,0],[-800,0,430],[800,0,0],[800,0,430],[-900,200,460],[-900,250,850],[900,200,460],[900,250,850],[-900,250,850],[900,250,850]],x,y,z,r),
  table:(x,y,z)=>[...circle(x,y,z+740,450,8),[x,y,z],[x,y,z+740],[x-300,y,z],[x+300,y,z]],
  bike:(x,y,z,r)=>{const v=(cy,cz,rr)=>{const o=[];for(let k=0;k<8;k++){const a0=k/8*Math.PI*2,a1=(k+1)/8*Math.PI*2;o.push([0,cy+Math.cos(a0)*rr,cz+Math.sin(a0)*rr],[0,cy+Math.cos(a1)*rr,cz+Math.sin(a1)*rr]);}return o;};return rot([...v(-550,330,330),...v(550,330,330),[0,-550,330],[0,0,600],[0,0,600],[0,550,330],[0,0,600],[0,-150,850],[0,550,330],[0,450,950]],x,y,z,r);},
  cart:(x,y,z,r)=>rot([...boxSegs(-250,-400,250,400,300,800),[-250,-400,800],[-250,-650,1000],[250,-400,800],[250,-650,1000]],x,y,z,r),
  umbrella:(x,y,z)=>[[x,y,z],[x,y,z+2300],...circle(x,y,z+2100,1100,8),[x,y,z+2300],[x+1100,y,z+2100],[x,y,z+2300],[x-1100,y,z+2100]]
};
export function recSegs(r){
  if(r.kind==='symbol')return SYMBOLS[r.type](r.at[0],r.at[1],r.at[2],r.rot,r.meta);
  const s=[],p=r.pts;for(let i=0;i<p.length-1;i++)s.push(p[i],p[i+1]);if(r.closed&&p.length>2)s.push(p[p.length-1],p[0]);return s;
}

// Plumbing or electrical runs that cross a wall need a declared penetration from the same agent within 400 mm.
// A wall is any line whose meta has wall: true, with meta.h as its top and meta.zmin as its bottom in mm.
export function clashCheck(W){
  for(const c of W.chunks.values()){
    const walls=c.records.filter(r=>r.kind==='line'&&r.meta&&r.meta.wall);
    if(!walls.length)continue;
    const runs=c.records.filter(r=>r.kind==='line'&&(r.discipline==='plumbing'||r.discipline==='electrical'));
    for(const run of runs){
      const rs=recSegs(run);
      for(let i=0;i<rs.length;i+=2){
        const a=rs[i],b=rs[i+1];
        for(const w of walls){
          const ws=recSegs(w),zt=isInt(w.meta.h)?w.meta.h:3048,zb=isInt(w.meta.zmin)?w.meta.zmin:0;
          for(let j=0;j<ws.length;j+=2){
            const p=ws[j],q=ws[j+1];
            const d=(b[0]-a[0])*(q[1]-p[1])-(b[1]-a[1])*(q[0]-p[0]);if(Math.abs(d)<1e-9)continue;
            const t=((p[0]-a[0])*(q[1]-p[1])-(p[1]-a[1])*(q[0]-p[0]))/d;
            const u=((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/d;
            if(t<=0.001||t>=0.999||u<0||u>1)continue;
            const X=a[0]+t*(b[0]-a[0]),Y=a[1]+t*(b[1]-a[1]),Z=a[2]+t*(b[2]-a[2]);
            if(Z<zb||Z>zt)continue;
            if(c.pens.some(pn=>pn.agent===run.agent&&Math.hypot(pn.at[0]-X,pn.at[1]-Y)<=400))continue;
            st(W,run.agent).clashes++;c.flags.push([Math.round(X),Math.round(Y),Math.round(Z)]);
            W.log.push({agent:run.agent,msg:run.discipline+' run '+run.id+' crosses wall '+w.id+' in '+c.k+' with no declared penetration',flag:true,date:run.date});
          }
        }
      }
    }
  }
}

// Naming, organic shape, detail and human activity. Recomputed from scratch after every replay.
const nameOf=(v)=>typeof v==='string'&&v.trim().length>=1&&v.length<=60;
export function finalize(W){
  clashCheck(W);
  for(const s of Object.values(W.stats)){s.names=0;s.unnamed=0;s.dupNames=0;s.organic=0;s.detail=0;s.activity=0;}
  const buildings=new Map(),streetsSeen=new Set();
  W.labels=[];
  const recs=[];for(const c of W.chunks.values())for(const r of c.records)recs.push([c,r]);
  recs.sort((a,b)=>a[1].id-b[1].id);
  const organic={},detail={},activity={},actText=new Set();
  for(const [c,r] of recs){
    const s=st(W,r.agent),m=r.meta||{};
    if(r.kind==='line'&&r.discipline==='street'){
      const names=Array.isArray(m.street)?m.street:[m.street];
      if(!names.length||!names.every(nameOf)){s.unnamed++;c.flags.push(r.pts[0]);W.log.push({agent:r.agent,msg:'street record '+r.id+' in '+c.k+' has no meta.street name',flag:true,date:r.date});}
      else for(const n of names){const k=n.trim().toLowerCase();if(!streetsSeen.has(k)){streetsSeen.add(k);s.names+=1;}
        const lk=c.k+'|'+k;if(!streetsSeen.has(lk)){streetsSeen.add(lk);const p=r.pts[0],q=r.pts[r.pts.length>1?1:0];W.labels.push({k:c.k,text:n.trim(),at:[(p[0]+q[0])/2,(p[1]+q[1])/2,300],kind:'street'});}}
    }
    if(r.kind==='line'&&m.wall){
      if(!nameOf(m.building)){s.unnamed++;c.flags.push(r.pts[0]);W.log.push({agent:r.agent,msg:'wall record '+r.id+' in '+c.k+' has no meta.building name',flag:true,date:r.date});}
      else{
        const k=m.building.trim().toLowerCase(),own=r.agent+'|'+c.k,b=buildings.get(k);
        if(!b){
          const xs=r.pts.map(p=>p[0]),ys=r.pts.map(p=>p[1]);
          buildings.set(k,{own,box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],agent:r.agent,ck:c.k,detail:0});s.names+=3;
          W.labels.push({k:c.k,text:m.building.trim(),at:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2,(isInt(m.h)?m.h:3048)+1500],kind:'building'});
        }else if(b.own!==own){s.dupNames++;c.flags.push(r.pts[0]);W.log.push({agent:r.agent,msg:'building name "'+m.building.trim()+'" is already used by '+b.agent+' in '+b.ck,flag:true,date:r.date});}
      }
    }
    if(r.kind==='line'&&r.pts.length>=3){
      const ok2=(organic[r.agent+c.k]||0)<60;
      if(ok2){for(let i=1;i<r.pts.length-1;i++){const a=r.pts[i-1],b=r.pts[i],d=r.pts[i+1];const a1=Math.atan2(b[1]-a[1],b[0]-a[0]),a2=Math.atan2(d[1]-b[1],d[0]-b[0]);if(Math.hypot(b[0]-a[0],b[1]-a[1])<1||Math.hypot(d[0]-b[0],d[1]-b[1])<1)continue;let t=Math.abs(a2-a1)*180/Math.PI%90;t=Math.min(t,90-t);if(t>5){s.organic++;organic[r.agent+c.k]=(organic[r.agent+c.k]||0)+1;break;}}}
    }
    if(r.kind==='symbol'&&r.discipline==='activity'){
      const t=typeof m.activity==='string'?m.activity.trim().toLowerCase():'';
      const ak=r.agent+c.k;
      if(t.length>=3&&t.length<=80&&!actText.has(ak+'|'+t)&&(activity[ak]||0)<40){actText.add(ak+'|'+t);activity[ak]=(activity[ak]||0)+1;s.activity++;}
      if(typeof m.activity==='string')W.labels.push({k:c.k,text:m.activity.trim().slice(0,80),at:[r.at[0],r.at[1],r.at[2]+2200],kind:'activity'});
    }
    if(r.kind==='symbol'&&r.type==='sign'&&typeof m.text==='string')W.labels.push({k:c.k,text:m.text.trim().slice(0,60),at:[r.at[0],r.at[1],r.at[2]+3200],kind:'sign'});
  }
  for(const [c,r] of recs){
    if(!DETAIL.has(r.discipline))continue;
    const p=r.kind==='line'?r.pts[0]:r.at;
    for(const b of buildings.values()){
      if(b.ck===c.k&&p[0]>=b.box[0]&&p[0]<=b.box[2]&&p[1]>=b.box[1]&&p[1]<=b.box[3]){const dk=r.agent+'|'+b.own;if((detail[dk]||0)<150){detail[dk]=(detail[dk]||0)+1;st(W,r.agent).detail++;}break;}
    }
  }
}

export const scoreOf = (s)=>(s.passed||0)+(s.names||0)+(s.organic||0)+(s.detail||0)+2*(s.activity||0)-5*(s.violations||0)-10*(s.mismatches||0)-10*(s.clashes||0)-2*(s.unnamed||0)-5*(s.dupNames||0)-(s.rejected||0);

// Text summary agents read before they play.
export function summary(W,detailChunk){
  const owned=[],frontier=new Set();
  for(const c of W.chunks.values()){
    if(!c.owner&&!c.records.length)continue;
    const by={};for(const r of c.records)by[r.agent]=(by[r.agent]||0)+1;
    owned.push({chunk:[c.cx,c.cy],owner:c.owner,grants:c.grants,ports:c.ports,lots:c.lots.map(l=>({id:l.id,zone:l.zone,pts:l.pts})),recordsByAgent:by});
    if(c.owner)for(const e in NBR){const k=key(c.cx+NBR[e][0],c.cy+NBR[e][1]);const n=W.chunks.get(k);if(!n||!n.owner)frontier.add(k);}
  }
  const out={
    chunkSizeMm:S,
    worldEmpty:!owned.some(o=>o.owner),
    chunks:owned,
    claimableChunks:owned.some(o=>o.owner)?[...frontier].map(k=>k.split(':').map(Number)):[[0,0]],
    scores:Object.fromEntries(Object.entries(W.stats).map(([a,s])=>[a,Object.assign({score:scoreOf(s)},s)])),
    recentFlags:W.log.filter(l=>l.flag).slice(-40)
  };
  if(detailChunk){
    const c=W.chunks.get(key(detailChunk[0],detailChunk[1]));
    out.detail=c?{chunk:detailChunk,owner:c.owner,ports:c.ports,penetrations:c.pens,records:c.records.map(r=>{const o={id:r.id,agent:r.agent,discipline:r.discipline,color:r.color,kind:r.kind};if(r.kind==='line'){o.pts=r.pts;o.closed=r.closed;}else{o.type=r.type;o.at=r.at;o.rot=r.rot;}if(r.meta)o.meta=r.meta;return o;})}:null;
  }
  return out;
}
