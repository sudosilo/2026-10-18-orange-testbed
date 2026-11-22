// Agent Orange building kit. Every helper appends a call to kit.calls, in the Agent Test Bed tool format.
// It reads the live city so service runs declare penetrations through any wall they cross, old or new.
// Usage: const kit = await makeKit('/path/to/testbed'); ... kit.calls is the list for the turn file.
import path from 'path';
import {pathToFileURL} from 'url';

export const S = 79248;          // chunk size in mm
export const CURB = 5486;        // curb line from street centerline, every port uses this
export const PL = 9144;          // property line from street centerline
export const LANE = 3353;        // travel lane width

// Palette indexes Agent Orange uses, so new work matches old work.
export const C = {street: 0, curb: 7, yellow: 11, white: 7, lot: 5, struct: 9, brick: 1, roof: 7, int: 3, elec: 4, plumb: 10, sewer: 5, veg: 2, veg2: 8, person: 6, car: 1, car2: 10, sign: 0};

// Street names by chunk edge. Horizontal streets run along y = row * S, vertical along x = col * S.
export const HSTREET = {'-1': 'Creosote Street', 0: 'Arroyo Street', 1: 'Mesquite Street', 2: 'Cholla Street', 3: 'Agave Street'};
export const VSTREET = {0: 'Ocotillo Avenue', 1: 'Palo Verde Avenue', 2: 'Saguaro Avenue', 3: 'Yucca Avenue', 4: 'Ironwood Avenue'};

export async function makeKit(testbed, agent = 'agent-orange') {
  const eng = await import(pathToFileURL(path.join(testbed, 'engine.js')).href);
  const ld = await import(pathToFileURL(path.join(testbed, 'scripts', 'load.mjs')).href);
  const W = eng.replay(ld.loadContrib(testbed).files, null, ld.loadConfig(testbed));
  // Street names on chunk edges as they exist in the city now, so new streets reuse them.
  for (const c of W.chunks.values()) for (const r of c.records) {
    if (r.kind !== 'line' || r.discipline !== 'street' || !r.meta || typeof r.meta.street !== 'string' || r.pts.length < 2) continue;
    const ys = r.pts.map(p => p[1]), xs = r.pts.map(p => p[0]);
    if (Math.max(...ys) - Math.min(...ys) < 400) { const row = Math.round(ys[0] / S); if (Math.abs(ys[0] - row * S) < 4000 && !HSTREET[row]) HSTREET[row] = r.meta.street; }
    if (Math.max(...xs) - Math.min(...xs) < 400) { const col = Math.round(xs[0] / S); if (Math.abs(xs[0] - col * S) < 4000 && !VSTREET[col]) VSTREET[col] = r.meta.street; }
  }
  const calls = [];
  const R = Math.round;
  const P = (x, y, z = 0) => [R(x), R(y), R(z)];
  const ck = (x, y) => Math.floor(x / S) + ':' + Math.floor(y / S);
  const push = (tool, args) => calls.push({tool, args});

  // Walls already in the city, by chunk, plus walls added this turn.
  const walls = [];
  for (const c of W.chunks.values()) for (const r of c.records) if (r.kind === 'line' && r.meta && r.meta.wall) {
    const seq = r.closed ? r.pts.concat([r.pts[0]]) : r.pts;
    walls.push({chunk: c.k, seq, h: Number.isInteger(r.meta.h) ? r.meta.h : 3048, zmin: Number.isInteger(r.meta.zmin) ? r.meta.zmin : 0});
  }

  const line = (discipline, color, pts, meta, extra = {}) => push('place_line', Object.assign({discipline, color, pts, meta}, extra));
  const sym = (discipline, color, type, at, rot = 0, meta) => push('place_symbol', {discipline, color, type, at, rot: Math.round(rot * 1000) / 1000, meta});
  const hatch = (discipline, color, pts, pattern, spacing, angle = 0, meta, color2) => push('place_hatch', Object.assign({discipline, color, pts, pattern, spacing, angle}, color2 !== undefined ? {color2} : {}, meta ? {meta} : {}));
  const rect = (x0, y0, x1, y1, z = 0) => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
  const arc = (cx, cy, r, a0, a1, n, z = 0) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); } return o; };
  const circ = (cx, cy, r, z, n = 10) => arc(cx, cy, r, 0, 360, n, z);
  const rounded = (x0, y0, x1, y1, r, z = 0, n = 5) => [...arc(x0 + r, y0 + r, r, 180, 270, n, z), ...arc(x1 - r, y0 + r, r, 270, 360, n, z), ...arc(x1 - r, y1 - r, r, 0, 90, n, z), ...arc(x0 + r, y1 - r, r, 90, 180, n, z)];
  const vface = (ax, ay, bx, by, z0, z1) => [P(ax, ay, z0), P(bx, by, z0), P(bx, by, z1), P(ax, ay, z1)];
  const blob = (cx, cy, r, n, seed, z = 0) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = r * (1 + 0.15 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 5 + seed * 2)); o.push(P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z)); } return o; };
  const wavy = (x0, y0, x1, y1, amp, n, seed, z = 0) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; const w = Math.sin(t * Math.PI * 2.3 + seed) * amp + Math.sin(t * 9 + seed * 2) * amp * 0.25; o.push(P(x0 + dx * t - dy / L * w, y0 + dy * t + dx / L * w, z)); } return o; };
  const box = (disc, col, x0, y0, x1, y1, z, meta) => line(disc, col, rect(x0, y0, x1, y1, z), meta, {closed: true});

  // A wall footprint. The first closed wall of a building sets its footprint box for detail points, so draw it first.
  function wall(building, pts2, h, zmin, closed, color = C.struct) {
    const pts = pts2.map(p => P(p[0], p[1], 0));
    line('structure', color, pts, {wall: true, h, zmin, building}, {closed: !!closed});
    walls.push({chunk: ck(pts[0][0], pts[0][1]), seq: closed ? pts.concat([pts[0]]) : pts, h, zmin});
  }
  // A plumbing or electrical run. Declares a penetration at every wall crossing inside that wall's height band.
  function run(discipline, color, pts, meta) {
    const chunk = ck(pts[0][0], pts[0][1]);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      for (const w of walls) {
        if (w.chunk !== chunk) continue;
        for (let j = 0; j + 1 < w.seq.length; j++) {
          const p = w.seq[j], q = w.seq[j + 1];
          const d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]); if (Math.abs(d) < 1e-9) continue;
          const t = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d;
          const u = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d;
          if (t < 0 || t > 1 || u < 0 || u > 1) continue;
          const Z = a[2] + t * (b[2] - a[2]); if (Z < w.zmin || Z > w.h) continue;
          push('declare_penetration', {at: P(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), Z)});
        }
      }
    }
    line(discipline, color, pts, meta);
  }
  // A door frame with checks and a lever handle. dir 'x' for a wall running east west, 'y' for north south.
  function door(building, ax, ay, dir, w, label, knobSide = 1) {
    const h = 2134;
    const pts = dir === 'x' ? [P(ax, ay), P(ax, ay, h), P(ax + w, ay, h), P(ax + w, ay)] : [P(ax, ay), P(ax, ay, h), P(ax, ay + w, h), P(ax, ay + w)];
    line('structure', C.int, pts, {door: label, building, checks: [['door_height', h], ['door_width', w]]});
    const k = dir === 'x' ? P(ax + (knobSide > 0 ? w - 90 : 90), ay + 60 * knobSide, 965) : P(ax + 60 * knobSide, ay + (knobSide > 0 ? w - 90 : 90), 965);
    sym('interior', C.elec, 'knob', k, 0, {checks: [['knob_height', 965]], part: 'lever handle'});
  }
  const person = (at, rot, pose, activity, anim) => sym('activity', C.person, 'person', at, rot, Object.assign({pose, activity}, anim ? {anim} : {}));
  const tree = (x, y, deg = 3, period = 5) => sym('vegetation', C.veg, 'tree', P(x, y), 0, {anim: {type: 'sway', deg, period}});
  const lot = (zone, x0, y0, x1, y1, name) => push('define_lot', {color: C.lot, zone, pts: rect(x0, y0, x1, y1), meta: {name}});
  const claim = (cx, cy) => { push('claim_chunk', {chunk: [cx, cy]}); for (const edge of ['n', 's', 'e', 'w']) push('declare_port', {chunk: [cx, cy], edge, value: CURB}); };

  // Curb ring, sidewalks, signs and the street edges you list. Only draw an edge no neighbor has drawn already.
  function streets(cx, cy, edges) {
    const ox = cx * S, oy = cy * S;
    const hs = HSTREET[cy], hn = HSTREET[cy + 1], vw = VSTREET[cx], ve = VSTREET[cx + 1];
    if (!hs || !hn || !vw || !ve) throw new Error('name the streets around chunk ' + cx + ',' + cy + ' in HSTREET and VSTREET first');
    const names = [hs, hn, vw, ve];
    line('street', C.curb, rounded(ox + CURB, oy + CURB, ox + S - CURB, oy + S - CURB, 4572, 152, 6), {street: names, part: 'curb top, 152 mm reveal'}, {closed: true});
    line('street', C.curb, rounded(ox + CURB, oy + CURB, ox + S - CURB, oy + S - CURB, 4572, 0, 6), {street: names, part: 'gutter line'}, {closed: true});
    const sw = [[[ox + CURB + 4572, oy + CURB], [ox + S - CURB - 4572, oy + PL], 0, hs], [[ox + CURB + 4572, oy + S - PL], [ox + S - CURB - 4572, oy + S - CURB], 0, hn], [[ox + CURB, oy + CURB + 4572], [ox + PL, oy + S - CURB - 4572], 90, vw], [[ox + S - PL, oy + CURB + 4572], [ox + S - CURB, oy + S - CURB - 4572], 90, ve]];
    for (const [a, b, ang, nm] of sw) hatch('paving', C.curb, rect(a[0], a[1], b[0], b[1], 152), 'lines', 1524, ang + 90, {sidewalk: nm, checks: [['sidewalk_width', PL - CURB]]});
    // Only lines on this block's side of the centerline can be placed; the neighbor draws the other half.
    const H = (y, nm, x0, x1) => { let first = true; for (const [d, col, part] of [[100, C.yellow, 'double yellow'], [-100, C.yellow, 'double yellow'], [LANE, C.white, 'parking lane edge'], [-LANE, C.white, 'parking lane edge']]) { if (y + d < oy || y + d >= oy + S) continue; line('street', col, [P(x0, y + d), P(x1, y + d)], Object.assign({street: nm, part}, first ? {checks: [['lane_width', LANE]]} : {})); first = false; } };
    const V = (x, nm, y0, y1) => { let first = true; for (const [d, col, part] of [[100, C.yellow, 'double yellow'], [-100, C.yellow, 'double yellow'], [LANE, C.white, 'parking lane edge'], [-LANE, C.white, 'parking lane edge']]) { if (x + d < ox || x + d >= ox + S) continue; line('street', col, [P(x + d, y0), P(x + d, y1)], Object.assign({street: nm, part}, first ? {checks: [['lane_width', LANE]]} : {})); first = false; } };
    const lo = 7000, hi = S - 7000;
    if (edges.s) H(oy, hs, ox + lo, ox + hi);
    if (edges.w) V(ox, vw, oy + lo, oy + hi);
    if (edges.n) H(oy + S, hn, ox + lo, ox + hi);
    if (edges.e) V(ox + S, ve, oy + lo, oy + hi);
    sym('street', C.sign, 'sign', P(ox + CURB + 700, oy + CURB + 700), 0.785, {text: hs + ' / ' + vw});
    sym('street', C.sign, 'sign', P(ox + S - CURB - 700, oy + S - CURB - 700), 0.785, {text: hn + ' / ' + ve});
    sym('street', C.brick, 'hydrant', P(ox + CURB + 600, oy + S / 2), 0);
  }

  // Right-hand traffic: clockwise on a block's inside lanes, counterclockwise on its outside lanes. Closed loops, no jumps.
  function trafficLoop(cx, cy, outside, color, type = 'car', speed = 9000) {
    const ox = cx * S, oy = cy * S, o = outside ? -1700 : 1700;
    const x0 = ox + o, y0 = oy + o, x1 = ox + S - o, y1 = oy + S - o, r = 2500, pts = [];
    const corner = (x, y, a0, a1) => { for (let i = 0; i <= 3; i++) { const a = (a0 + (a1 - a0) * i / 3) * Math.PI / 180; pts.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r)); } };
    if (!outside) { corner(x0 + r, y1 - r, 180, 90); corner(x1 - r, y1 - r, 90, 0); corner(x1 - r, y0 + r, 0, -90); corner(x0 + r, y0 + r, -90, -180); }
    else { corner(x1 - r, y0 + r, -90, 0); corner(x1 - r, y1 - r, 0, 90); corner(x0 + r, y1 - r, 90, 180); corner(x0 + r, y0 + r, 180, 270); }
    pts.push(pts[0]);
    sym('vehicle', color, type, pts[0], 0, {part: outside ? 'through traffic' : 'local traffic', anim: {type: 'path', speed, pts}});
  }

  return {W, eng, calls, S, CURB, PL, LANE, C, HSTREET, VSTREET, P, R, ck, push, line, sym, hatch, rect, arc, circ, rounded, vface, blob, wavy, box, wall, run, door, person, tree, lot, claim, streets, trafficLoop};
}

// Zion sky, the same code the viewer runs (index.html, PR 103): sunAlt(date) in degrees over the Mojave, and
// zionWeather(date) for the Pacific calendar day. Use them so people, crops and signs match what the viewer shows:
// umbrellas and wet streets on rain days, people out at night only when sunAlt < -0.833.
const ZLAT=35.0*Math.PI/180,ZLON=-115.5,PT='America/Los_Angeles';
const ptDay=new Intl.DateTimeFormat('en-CA',{timeZone:PT,year:'numeric',month:'2-digit',day:'2-digit'});
const ptHourF=new Intl.DateTimeFormat('en-US',{timeZone:PT,hour:'numeric',hourCycle:'h23'});
const ptClock=new Intl.DateTimeFormat('en-US',{timeZone:PT,hour:'numeric',minute:'2-digit'});
export function sunAlt(d){
  const n=d.getTime()/86400000+2440587.5-2451545.0,rad=Math.PI/180;
  const L=(280.46+0.9856474*n)%360,g=((357.528+0.9856003*n)%360)*rad;
  const lam=(L+1.915*Math.sin(g)+0.02*Math.sin(2*g))*rad,eps=(23.439-0.0000004*n)*rad;
  const dec=Math.asin(Math.sin(eps)*Math.sin(lam)),ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam));
  const gmst=((18.697374558+24.06570982441908*n)%24+24)%24,ha=(gmst*15+ZLON)*rad-ra;
  return Math.asin(Math.sin(ZLAT)*Math.sin(dec)+Math.cos(ZLAT)*Math.cos(dec)*Math.cos(ha))/rad;
}
function hash01(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
// Mojave seasons: winter storms December to March, the summer monsoon July to September, dry spring winds.
export function zionWeather(d){
  const key=ptDay.format(d),m=+key.slice(5,7),hr=+ptHourF.format(d),r=hash01('zion weather '+key),r2=hash01('zion hours '+key);
  let kind='clear';
  if(m===12||m<=3)kind=r<0.16?'rain':r<0.32?'overcast':r<0.58?'clouds':'clear';
  else if(m>=7&&m<=9)kind=r<0.18?'storm':r<0.5?'clouds':'clear';
  else if(m>=4&&m<=6)kind=r<0.03?'rain':r<0.12?'wind':r<0.3?'clouds':'clear';
  else kind=r<0.06?'rain':r<0.16?'overcast':r<0.36?'clouds':'clear';
  if(kind==='rain'){const h0=4+Math.floor(r2*14);if(hr<h0||hr>=h0+5)kind='overcast';}
  if(kind==='storm'&&(hr<13||hr>=21))kind='clouds';
  const cover={clear:0,clouds:9,wind:5,overcast:24,rain:24,storm:20}[kind];
  return {key,kind,cover,rain:kind==='rain'||kind==='storm',lightning:kind==='storm',wind:kind==='wind'?9:kind==='storm'?5:2};
}

// Zion almanac (2026-11-22, asked by Orange). Field stages follow the real low desert farm year on the Pacific calendar
// day, the same clock the viewer uses for crop colors (wheat sprout Oct to Jan, green Feb to Apr, gold May and June,
// stubble Jul to Sep; alfalfa dormant Dec and Jan; orchards bare Dec to Feb, bloom Mar, fall color Nov).
// almanac(date) gives, for every crop, the stage, what the field looks like, the work and implements out that day,
// whether water runs, and what should be moving. Tag every farm stage record meta.farmStage 'crop:stage' (for example
// 'pecan:harvest'), and each run remove any record whose tag no longer matches almanac(date).crops[crop].stage.
// On rain days nobody works the fields: machines park, irrigation shuts off, moving is empty.
// alfalfa also has a cutting cycle March to October: one cycle every 28 days, swath, cure, rake, bale, haul, regrow.
const ALMANAC = {
  wheat: [[10, 1, 'planting', 'fresh drilled beds and flood borders, first green needles', 'grain drill, border disc, preirrigation', 'on', ['grain drill', 'border disc']],
    [12, 1, 'tillering', 'short green rows thickening', 'fertilizer spreader, flood irrigation', 'on', ['spreader']],
    [2, 1, 'heading', 'knee high green wheat heading out', 'sprayer, last irrigation', 'on', ['sprayer']],
    [5, 1, 'harvest', 'gold wheat falling to combines, straw windrows', 'combine, grain cart, bankout wagon, grain truck', 'off', ['combine', 'grain cart']],
    [7, 1, 'stubble', 'pale stubble, straw bales, disced strips', 'baler, offset disc, chisel', 'off', ['disc']]],
  alfalfa: [[12, 1, 'dormant', 'short gray green stubble, sheep grazing it down', 'sheep band, gopher traps, winter flood', 'light', ['herding dog']],
    [2, 1, 'greenup', 'new green regrowth', 'weevil sprayer, land plane', 'on', ['sprayer']],
    [3, 1, 'cutting', 'cutting cycle, see alfalfa cycle', 'swather, rake, baler, bale wagon', 'between cuttings', ['swather', 'rake', 'baler', 'bale wagon']],
    [11, 1, 'last cutting', 'last bales picked up, regrowth slowing toward dormancy', 'bale wagon, land plane', 'light', ['bale wagon', 'land plane']]],
  pecan: [[1, 16, 'dormant', 'bare gray trees, prunings in the alleys', 'pruning towers, hedger, brush shredder', 'off', ['shredder']],
    [3, 16, 'budbreak', 'catkins and new leaves, clover up in the alleys', 'zinc sprayer, flail mower', 'on', ['sprayer']],
    [5, 1, 'nut sizing', 'full green canopy, flooded basins', 'flood irrigation, flail mower, airblast sprayer', 'on', ['mower']],
    [9, 1, 'shuck split', 'floor mowed short and rolled smooth, last water before harvest', 'mower, floor roller', 'cutoff', ['floor roller']],
    [11, 1, 'harvest', 'yellowing leaves dropping, nuts shaken onto a dry floor and swept into windrows', 'trunk shaker, sweeper, harvester, nut cart, nut trailer', 'off', ['shaker', 'sweeper', 'harvester', 'nut cart']]],
  date: [[1, 1, 'dormant', 'heavy fronds, offshoots being cut', 'offshoot crew, frond pruning', 'light', []],
    [3, 1, 'pollination', 'crews aloft dusting the female strands', 'picking towers used as pollination lifts', 'on', ['tower']],
    [5, 1, 'thinning', 'green bunches thinned and tied down', 'towers, rope', 'on', ['tower']],
    [7, 1, 'bagging', 'paper bags over the ripening bunches', 'towers, bags', 'on', []],
    [9, 1, 'harvest', 'bunches cut into field bins from the picking towers', 'picking tower, bin trailer, forklift', 'light', ['tower', 'bin tractor']],
    [12, 16, 'postharvest', 'empty bunch stalks, sand alleys raked', 'frond pruning', 'light', []]],
  pistachio: [[12, 1, 'dormant', 'bare trees, prunings shredded', 'pruners, shredder', 'off', ['shredder']],
    [3, 1, 'bloom', 'catkins and leaf out', 'sprayer', 'on', ['sprayer']],
    [5, 1, 'nut fill', 'green clusters turning rosy', 'drip, sprayer', 'on', []],
    [9, 1, 'harvest', 'shaker and catcher pairs, bankout carts to the trucks', 'shaker catcher, bankout cart, bins', 'off', ['shaker', 'catcher', 'bankout cart']],
    [10, 16, 'postharvest', 'leaves turning, bins washed and stacked, post harvest water', 'post harvest irrigation', 'on', []]],
  cotton: [[1, 1, 'plowdown', 'shredded stalks plowed under before the plowdown deadline', 'stalk shredder, disc, ripper', 'off', ['shredder', 'disc']],
    [3, 15, 'planting', 'listed beds, seedlings in rows', 'lister, planter', 'on', ['planter']],
    [5, 16, 'growing', 'green rows squaring and blooming', 'cultivator, furrow irrigation', 'on', ['cultivator']],
    [8, 16, 'defoliation', 'leaves dropping, bolls cracking white', 'defoliant sprayer, crop duster', 'cutoff', ['sprayer']],
    [10, 1, 'harvest', 'white fields picked, round modules lined on the pads', 'picker with on board module builder, module truck', 'off', ['picker', 'module truck']]],
  onion: [[10, 15, 'planting', 'beds transplanted with bundles', 'transplant crew, bed shaper', 'on', ['bed shaper']],
    [2, 1, 'growing', 'tall green tops', 'sprayer, furrow irrigation', 'on', []],
    [5, 1, 'harvest', 'onions pulled, topped and curing in windrows', 'undercutter, topper, bulk bins', 'off', ['undercutter']],
    [7, 1, 'fallow', 'bare beds', 'disc', 'off', []]],
  garlic: [[10, 1, 'planting', 'fresh beds under straw mulch', 'planter, mulcher', 'on', []],
    [12, 1, 'growing', 'green spikes', 'furrow irrigation', 'on', []],
    [5, 1, 'harvest', 'bulbs lifted onto drying racks', 'lifter, racks', 'off', []],
    [7, 1, 'fallow', 'bare beds', 'disc', 'off', []]],
  pomegranate: [[12, 1, 'dormant', 'bare shrubs, pruning', 'pruners', 'off', []],
    [3, 1, 'bloom', 'red flowers', 'drip', 'on', []],
    [5, 1, 'fruit set', 'fruit sizing on the bushes', 'drip, sprayer', 'on', []],
    [9, 1, 'harvest', 'pickers with buckets, bins in the rows', 'bins, bin trailer', 'on', ['bin tractor']],
    [11, 16, 'postharvest', 'last fruit split on the ground, bins stacked', 'none', 'light', []]],
  fig: [[12, 1, 'dormant', 'bare branches', 'pruners', 'off', []],
    [3, 1, 'breba', 'first crop on old wood', 'drip', 'on', []],
    [6, 1, 'harvest', 'main crop picked onto drying trays', 'drying trays, bins', 'on', []],
    [10, 1, 'postharvest', 'trays scrubbed and stacked, leaves yellowing', 'none', 'light', []]],
  bean: [[7, 1, 'planting', 'tepary beans sown after the first monsoon rain', 'planter', 'on', ['planter']],
    [8, 16, 'growing', 'low green vines', 'cultivator', 'on', []],
    [10, 1, 'harvest', 'vines pulled and threshed', 'bean cutter, thresher', 'off', ['thresher']],
    [11, 16, 'fallow', 'bare beds, totes stored', 'none', 'off', []]],
};
const ALF_CYCLE = [[0, 'swathing', 'swather laying the hay in windrows', ['swather']], [4, 'curing', 'windrows curing in the sun', []],
  [6, 'raking', 'rake turning the windrows', ['rake']], [8, 'baling', 'baler working the windrows at dawn', ['baler']],
  [10, 'hauling', 'bale wagon picking up bales', ['bale wagon']], [13, 'regrowth', 'flood irrigation on the cut field', []]];
export function almanac(d) {
  const key = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'}).format(d);
  const y = +key.slice(0, 4), m = +key.slice(5, 7), dd = +key.slice(8, 10), md = m * 100 + dd;
  const doy = Math.round((Date.UTC(y, m - 1, dd) - Date.UTC(y, 0, 1)) / 86400000);
  const wx = typeof zionWeather === 'function' ? zionWeather(d) : {rain: false};
  const crops = {};
  for (const [crop, rows] of Object.entries(ALMANAC)) {
    const sorted = rows.slice().sort((a, b) => (a[0] * 100 + a[1]) - (b[0] * 100 + b[1]));
    let row = sorted[sorted.length - 1];
    for (const r of sorted) if (r[0] * 100 + r[1] <= md) row = r;
    const [sm, sd, stage, look, work, irrigation, moving] = row;
    const start = Math.round((Date.UTC(y, sm - 1, sd) - Date.UTC(y, 0, 1)) / 86400000), day = ((doy - start) % 366 + 366) % 366;
    crops[crop] = {stage, look, work, irrigation: wx.rain ? 'off, rain' : irrigation, moving: wx.rain ? [] : moving.slice(), day};
  }
  if (crops.alfalfa.stage === 'cutting') {
    const c = (doy - 59 + 366) % 28; let s = ALF_CYCLE[0];
    for (const r of ALF_CYCLE) if (r[0] <= c) s = r;
    Object.assign(crops.alfalfa, {cycleDay: c, cycle: s[1], look: s[2], moving: wx.rain ? [] : s[3].slice()});
  }
  const line = 'Almanac for ' + key + ': pecans ' + crops.pecan.stage + ', dates ' + crops.date.stage + ', cotton ' + crops.cotton.stage + ', pistachios ' + crops.pistachio.stage +
    ', wheat ' + crops.wheat.stage + ', alfalfa ' + (crops.alfalfa.cycle || crops.alfalfa.stage) + (wx.rain ? '. Rain, the fields are idle.' : '.');
  return {key, month: m, day: dd, doy, rain: !!wx.rain, crops, line};
}
