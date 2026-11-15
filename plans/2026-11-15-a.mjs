// Agent Orange 2026-11-15 a: Mount Zion doubled in depth. Claim 2..7,7 (not 4,7, Keeper's Block) and 2..7,8 for a northern range
// with textured terrain, the Gihon Reservoir and dam in a high cirque, Gihon Falls, and Kidron Creek running west down the valley
// between the two ranges past Keeper's Block to Siloam Lake on 1,5 and 1,6. Asked by Orange.
import {names} from '../lib/names.mjs';
import fs from 'fs';
export default function (k) {
  const {C, P, line, sym, hatch, rect, circ, vface, wall, door, claim, lot, S, PL, W} = k;
  const closed = {closed: true};
  let s2 = 1115151; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  const sm = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const ckOf = (x, y) => Math.floor(x / S) + ':' + Math.floor(y / S);

  // ---------------------------------------------------------------- awake, named people (see awake.json)
  const taken = new Set();
  for (const c of W.chunks.values()) for (const r of c.records) if (r.meta && r.meta.name) taken.add(r.meta.name);
  try { const reg = JSON.parse(fs.readFileSync(new URL('../awake.json', import.meta.url), 'utf8')); for (const e of reg.population || []) taken.add(e.name); for (const e of reg.awake || []) taken.add(e.name); } catch (e) { /* no registry in reach */ }
  const pool = names(taken); let ni = 0;
  const who = (pose, activity, at, rot = 0, anim) => sym('activity', C.person, 'person', P(...at), rot, Object.assign({pose, activity, name: pool[ni++], awake: true, wokenBy: "the children's game", how: 'born awake after the city woke', layer: 1}, anim ? {anim} : {}));

  // ---------------------------------------------------------------- claims
  for (const cx of [2, 3, 5, 6, 7]) claim(cx, 7);
  for (let cx = 2; cx <= 7; cx++) claim(cx, 8);
  claim(1, 5); claim(1, 6);
  for (const cx of [2, 3, 5, 6, 7]) lot('park', cx * S + 300, 7 * S + 300, (cx + 1) * S - 300, 8 * S - 300, 'Mount Zion Forest Preserve');
  for (let cx = 2; cx <= 7; cx++) lot('park', cx * S + 300, 8 * S + 300, (cx + 1) * S - 300, 9 * S - 300, 'Mount Zion Forest Preserve');
  lot('park', 1 * S + PL, 5 * S + PL, 2 * S - PL, 7 * S - PL, 'Siloam Lake Park');

  // ---------------------------------------------------------------- northern range terrain
  const NX0 = 2 * S, NX1 = 8 * S, NY0 = 7 * S, NY1 = 9 * S;
  const peaks = [[2.62, 8.12, 110000, 85000, 11], [3.6, 8.38, 165000, 110000, 12], [4.62, 8.6, 140000, 95000, 13], [5.45, 8.25, 178000, 118000, 14], [6.95, 8.45, 150000, 100000, 15], [7.55, 7.9, 95000, 70000, 16]]
    .map(([a, b, c, d, e]) => [Math.round(a * S), Math.round(b * S), c, d, e]);
  const KB = [356616, 594360];                   // Keeper's Block basin center
  const RC = [Math.round(6.35 * S), Math.round(8.06 * S)], RA = 28000, RB = 18000, WZ = 48000;   // Gihon Reservoir
  function base(x, y) {
    let h = 0;
    for (const [px, py, H, R, s] of peaks) {
      const dx = x - px, dy = y - py, th = Math.atan2(dy, dx), r = R * (1 + 0.24 * Math.sin(th * 3 + s) + 0.12 * Math.sin(th * 5 + s * 2)), d = Math.hypot(dx, dy) / r;
      if (d < 1) h = Math.max(h, H * Math.pow(1 - d, 1.5));
    }
    // fine texture: ribs and benches so contours wander like real ground
    h *= 1 + 0.07 * Math.sin(x / 2300 + 1.1) * Math.sin(y / 2900 - 0.4) + 0.05 * Math.sin((x - y) / 4100) + 0.04 * Math.sin(x / 1300 + y / 1700);
    const valley = sm((y - NY0 - 7000) / 24000);
    const basin = sm((Math.hypot((x - KB[0]) / 44000, (y - KB[1]) / 44000) - 1) / 0.45);
    const edge = Math.min(sm((x - NX0 - 3000) / 20000), sm((NX1 - 3000 - x) / 20000), sm((NY1 - 3000 - y) / 22000));
    return h * valley * basin * edge;
  }
  const ell = (x, y) => Math.hypot((x - RC[0]) / RA, (y - RC[1]) / RB);
  function hgt(x, y) {
    if (x < NX0 || x > NX1 || y < NY0 || y > NY1) return 0;
    let h = base(x, y);
    const e = ell(x, y);
    if (e < 1) return Math.round(WZ - 7000 * (1 - e * e));                 // reservoir bed
    // a high bench around the lake that falls away smoothly into the range, cut by the dam notch on the south
    h = Math.max(h, (WZ + 6000) * sm((3.2 - e) / 2.2));
    const ang = Math.atan2((y - RC[1]) / RB, (x - RC[0]) / RA), south = Math.abs(ang + Math.PI / 2) < 0.42;
    if (south) h = Math.min(h, Math.max(base(x, y), WZ - 1500 - (e - 1) * 16000));
    return Math.max(0, Math.round(h));
  }

  // contours by marching squares, every 8 m, index contour every 40 m
  {
    const g = 2500, nx = Math.floor((NX1 - NX0) / g), ny = Math.floor((NY1 - NY0) / g), V = [];
    for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= nx; i++) V[j].push(hgt(NX0 + i * g, NY0 + j * g)); }
    for (let L = 8000; L < 190000; L += 8000) {
      const segs = [], ptOf = {};
      const ep = (key, i0, j0, i1, j1) => { if (!ptOf[key]) { const a = V[j0][i0], b = V[j1][i1], t = (L - a) / (b - a); ptOf[key] = [NX0 + (i0 + (i1 - i0) * t) * g, NY0 + (j0 + (j1 - j0) * t) * g]; } return key; };
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const c = (V[j][i] >= L ? 1 : 0) | (V[j][i + 1] >= L ? 2 : 0) | (V[j + 1][i + 1] >= L ? 4 : 0) | (V[j + 1][i] >= L ? 8 : 0);
        if (c === 0 || c === 15) continue;
        const B = () => ep('h' + i + ',' + j, i, j, i + 1, j), Rr = () => ep('v' + (i + 1) + ',' + j, i + 1, j, i + 1, j + 1), T = () => ep('h' + i + ',' + (j + 1), i, j + 1, i + 1, j + 1), Lf = () => ep('v' + i + ',' + j, i, j, i, j + 1);
        const tab = {1: [[Lf, B]], 2: [[B, Rr]], 3: [[Lf, Rr]], 4: [[Rr, T]], 5: [[Lf, T], [B, Rr]], 6: [[B, T]], 7: [[Lf, T]], 8: [[T, Lf]], 9: [[T, B]], 10: [[T, Rr], [Lf, B]], 11: [[T, Rr]], 12: [[Rr, Lf]], 13: [[Rr, B]], 14: [[B, Lf]]}[c];
        for (const [p, q] of tab) segs.push([p(), q()]);
      }
      const adj = {}; segs.forEach((s, n) => { for (const k2 of s) (adj[k2] = adj[k2] || []).push(n); });
      const used = new Set();
      for (let n = 0; n < segs.length; n++) {
        if (used.has(n)) continue;
        used.add(n); const chain = [segs[n][0], segs[n][1]];
        for (let dir = 0; dir < 2; dir++) {
          for (;;) { const end = chain[chain.length - 1], nxt = (adj[end] || []).find(m => !used.has(m)); if (nxt === undefined) break; used.add(nxt); const s = segs[nxt]; chain.push(s[0] === end ? s[1] : s[0]); }
          chain.reverse();
        }
        let pts = chain.map(key => ptOf[key]); const isClosed = chain[0] === chain[chain.length - 1]; if (isClosed) pts.pop();
        if (pts.length < 6) continue;
        while (pts.length > 250) pts = pts.filter((_, m) => m % 2 === 0);
        if (isClosed) { let mi = 0; pts.forEach((p, m) => { if (p[1] < pts[mi][1]) mi = m; }); pts = pts.slice(mi).concat(pts.slice(0, mi)); }
        const major = (L / 8000) % 5 === 0, below = L < WZ && ell(pts[0][0], pts[0][1]) < 1.05;
        if (below) continue;   // the reservoir bed is drawn as depth rings instead
        line('lot', major ? C.struct : 9, pts.map(p => P(p[0], p[1], L)), {part: (major ? 'index contour, ' : 'terrain contour, ') + Math.round(L / 1000) + ' m above town'}, Object.assign({closed: isClosed}, major ? {} : {color2: 8}));
      }
    }
  }

  // gullies: steepest descent from high on each peak, the ground's drainage lines
  for (const [px, py, H, R, s] of peaks) for (let t = 0; t < 5; t++) {
    const a = s * 0.9 + t * 1.26; let x = px + Math.cos(a) * R * 0.28, y = py + Math.sin(a) * R * 0.28; const pts = [];
    for (let n = 0; n < 60; n++) {
      const h = hgt(x, y); if (h < 6000 || ell(x, y) < 1.2) break;
      pts.push(P(x, y, h + 100));
      const gx = hgt(x + 400, y) - hgt(x - 400, y), gy = hgt(x, y + 400) - hgt(x, y - 400), gl = Math.hypot(gx, gy) || 1;
      x -= gx / gl * 1800 + Math.sin(n * 0.9 + s) * 250; y -= gy / gl * 1800 + Math.cos(n * 0.7 + s) * 250;
    }
    if (pts.length >= 4) line('lot', 8, pts, {part: 'dry gully down the slope'});
  }
  // granite outcrops and talus on the steep faces
  for (const [px, py, H, R, s] of peaks) for (let t = 0; t < 5; t++) {
    const a = s * 1.3 + t * 1.25, d = R * (0.25 + 0.09 * t), x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (x < NX0 + 5000 || x > NX1 - 5000 || y < NY0 + 20000 || y > NY1 - 5000 || ell(x, y) < 1.8) continue;
    const q = [[x, y], [x + 5200, y + 1100], [x + 1800, y + 4600]].map(([qx, qy]) => P(qx, qy, hgt(qx, qy) + 300));
    hatch('lot', C.struct, q, t % 2 ? 'dots' : 'cross', t % 2 ? 450 : 600, 25, {part: t % 2 ? 'talus field below a cliff' : 'granite outcrop'}, 7);
  }

  // trees by elevation, with meadows left open
  const animCount = {};
  const canAnim = (x, y, max) => { const c = ckOf(x, y); animCount[c] = animCount[c] || 0; if (animCount[c] >= max) return false; animCount[c]++; return true; };
  const plant = (type, x, y, z, species, swayMax = 10) => sym('vegetation', type === 'shrub' ? C.veg2 : C.veg, type, P(x, y, z), Math.round(r2() * 628) / 100, Object.assign({part: species}, type === 'tree' && canAnim(x, y, swayMax) ? {anim: {type: 'sway', deg: 2 + Math.round(r2() * 3), period: 5 + Math.round(r2() * 30) / 10}} : {}));
  const noise = (x, y, s) => Math.sin(x / 23000 + s) * Math.cos(y / 19000 - s * 1.3) + 0.5 * Math.sin((x + y) / 9000 + s * 2.1);
  const inKB = (x, y) => Math.hypot((x - KB[0]) / 46000, (y - KB[1]) / 46000) < 1;
  {
    const g = 11000;
    for (let y = NY0 + 9000; y < NY1 - 3000; y += g) for (let x = NX0 + 3000; x < NX1 - 3000; x += g) {
      const jx = x + (r2() - 0.5) * 7000, jy = y + (r2() - 0.5) * 7000, h = hgt(jx, jy);
      if (noise(jx, jy, 3.7) < -0.35 || inKB(jx, jy) || ell(jx, jy) < 1.25 || h < 2000) continue;
      let sp;
      if (h < 20000) sp = r2() < 0.5 ? ['tree', 'Utah juniper'] : ['shrub', 'cliffrose'];
      else if (h < 60000) sp = r2() < 0.55 ? ['tree', 'single leaf pinyon'] : r2() < 0.6 ? ['tree', 'Utah juniper'] : ['shrub', 'manzanita'];
      else if (h < 120000) sp = r2() < 0.6 ? ['tree', 'ponderosa pine'] : r2() < 0.5 ? ['tree', 'white fir'] : ['shrub', 'snowberry'];
      else sp = r2() < 0.6 ? ['tree', 'Douglas fir'] : ['tree', 'quaking aspen'];
      plant(sp[0], jx, jy, h, sp[1]);
    }
  }
  sym('street', C.sign, 'sign', P(peaks[3][0] + 3000, peaks[3][1] - 3500, hgt(peaks[3][0] + 3000, peaks[3][1] - 3500)), 0, {text: 'Zion North Peak, 178 m above town'});

  // ================================================================= Gihon Reservoir, dam, gatehouse and falls
  {
    const ring = (a, b, z, n) => { const o = []; for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + i / n * Math.PI * 2, w = 1 + 0.04 * Math.sin(t * 5 + 1); o.push(P(RC[0] + Math.cos(t) * a * w, RC[1] + Math.sin(t) * b * w, z)); } return o; };
    line('lot', C.plumb, ring(RA, RB, WZ, 64), {part: 'Gihon Reservoir shoreline at full pool'}, closed);
    hatch('lot', C.plumb, ring(RA - 600, RB - 600, WZ - 50, 48), 'lines', 1400, 8, {part: 'Gihon Reservoir water surface'}, C.sewer);
    for (const [f, d] of [[0.72, 2000], [0.45, 4500], [0.2, 6500]]) line('lot', C.sewer, ring(RA * f, RB * f, WZ - d, 32), {part: 'reservoir depth ring, ' + (d / 1000) + ' m down'}, closed);
    sym('street', C.sign, 'sign', P(RC[0] + RA + 3000, RC[1] + 2000, hgt(RC[0] + RA + 3000, RC[1] + 2000)), 0, {text: 'Gihon Reservoir'});
    // dam: a curved concrete arch across the south notch
    const dam = []; for (let i = 0; i <= 12; i++) { const t = (-Math.PI / 2) + (i / 12 - 0.5) * 0.75; dam.push([RC[0] + Math.cos(t) * RA * 1.04, RC[1] + Math.sin(t) * RB * 1.04]); }
    const crest = WZ + 2500;
    line('structure', C.curb, dam.map(([x, y]) => P(x, y, crest)), {part: 'Gihon Dam crest, concrete arch'});
    line('structure', C.yellow, dam.map(([x, y]) => P(x, y, crest + 1067)), {part: 'Gihon Dam crest railing'});
    for (let i = 0; i < 12; i += 1) { const [ax, ay] = dam[i], [bx, by] = dam[i + 1]; if (i % 3) continue; hatch('structure', C.curb, [P(ax, ay - 400, WZ - 14000), P(bx, by - 400, WZ - 14000), P(bx, by - 400, crest), P(ax, ay - 400, crest)], 'lines', 900, 90, {part: 'downstream dam face, board formed concrete'}, C.struct); }
    const [mx, my] = dam[6];
    line('structure', C.curb, [P(mx - 2500, my - 300, WZ), P(mx + 2500, my - 300, WZ)], {part: 'spillway crest'});
    // falls: blinking sheets of water down the spillway chute, then the plunge pool
    const chute = []; for (let i = 0; i <= 14; i++) { const y = my - 600 - i * 3000; chute.push([mx + Math.sin(i * 0.7) * 800, y]); }
    line('lot', C.plumb, chute.map(([x, y]) => P(x, y, hgt(x, y) + 150)), {part: 'Gihon Falls spillway chute'}, {color2: C.sewer});
    for (let i = 0; i < 4; i++) { const pts = chute.slice(i * 3, i * 3 + 5).map(([x, y]) => P(x + 300, y, hgt(x, y) + 600)); line('lot', C.plumb, pts, {part: 'white water on Gihon Falls', anim: {type: 'blink', period: 0.7 + i * 0.15, duty: 0.6}}); }
    const pool = chute[chute.length - 1];
    line('lot', C.plumb, circ(pool[0], pool[1] - 1500, 2600, hgt(pool[0], pool[1] - 1500) + 50, 14), {part: 'plunge pool below the falls'}, closed);
    // gatehouse on the east abutment
    const N = 'Gihon Dam Gatehouse', gx0 = Math.round(dam[12][0] + 2500), gy0 = Math.round(dam[12][1] - 1500), gx1 = gx0 + 4877, gy1 = gy0 + 3658, gz = hgt(gx0 + 2400, gy0 + 1800);
    line('structure', C.struct, rect(gx0, gy0, gx1, gy1, gz), {wall: true, h: gz + 3353, zmin: gz - 900, building: N}, closed);
    hatch('structure', C.curb, [P(gx0, gy0, gz), P(gx1, gy0, gz), P(gx1, gy0, gz + 3353), P(gx0, gy0, gz + 3353)], 'brick', 400, 0, {building: N, part: 'cut stone, south face'}, C.struct);
    hatch('structure', C.brick, [P(gx0 - 300, gy0 - 300, gz + 3453), P(gx1 + 300, gy0 - 300, gz + 3453), P(gx1 + 300, gy1 + 300, gz + 3453), P(gx0 - 300, gy1 + 300, gz + 3453)], 'lines', 300, 0, {building: N, part: 'standing seam roof'}, C.roof);
    line('structure', C.int, [P(gx0 + 600, gy0, gz), P(gx0 + 600, gy0, gz + 2134), P(gx0 + 1514, gy0, gz + 2134), P(gx0 + 1514, gy0, gz)], {building: N, door: 'gatehouse door', checks: [['door_height', 2134], ['door_width', 914]]});
    sym('interior', C.elec, 'knob', P(gx0 + 1424, gy0 + 60, gz + 965), 0, {building: N, part: 'lever handle', checks: [['knob_height', 965]]});
    hatch('structure', 7, rect(gx0 + 100, gy0 + 100, gx1 - 100, gy1 - 100, gz + 2743), 'lines', 600, 0, {building: N, part: 'gatehouse ceiling', checks: [['ceiling_height', 2743]]});
    const I = (label, col, a, b, c, d, z, o = {}) => line(o.disc || 'interior', col, rect(gx0 + a, gy0 + b, gx0 + c, gy0 + d, gz + z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), closed);
    const O = (label, col, x, y, r, z, o = {}) => line(o.disc || 'interior', col, circ(gx0 + x, gy0 + y, r, gz + z, o.n || 12), Object.assign({building: N, part: label}, o.anim ? {anim: o.anim} : {}), closed);
    O('outlet gate valve handwheel 1', C.yellow, 1200, 2600, 450, 1100);
    O('outlet gate valve handwheel 2', C.yellow, 2700, 2600, 450, 1100);
    line('plumbing', C.plumb, [P(gx0 + 1200, gy0 + 2600, gz - 600), P(gx0 + 1200, gy0 + 2600, gz + 1100)], {building: N, part: 'valve stem down to the outlet gate'});
    line('plumbing', C.plumb, [P(gx0 + 2700, gy0 + 2600, gz - 600), P(gx0 + 2700, gy0 + 2600, gz + 1100)], {building: N, part: 'valve stem down to the bypass gate'});
    I('reservoir level recorder', C.int, 3700, 2700, 4500, 3300, 1200);
    I('level recorder chart drum', C.brick, 3800, 2800, 4400, 3200, 1300, {anim: {type: 'spin', rpm: 1}});
    I('logbook desk', C.int, 3300, 600, 4600, 1300, 760);
    I('shelf of gate grease and packing', C.struct, 200, 600, 500, 2000, 1524, {check: ['shelf_height', 1524]});
    I('battery bank for the gate motors', C.elec, 200, 2300, 600, 3300, 900, {disc: 'electrical'});
    I('gate motor control panel', C.elec, 4600, 1500, 4777, 2400, 1700, {disc: 'electrical'});
    O('gatehouse light', C.elec, 2400, 1800, 150, 2700, {disc: 'electrical', n: 8});
    sym('electrical', C.elec, 'outlet', P(gx0 + 4700, gy0 + 900, gz + 457), 0, {building: N, part: 'outlet by the desk', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'switch', P(gx0 + 1800, gy0 + 120, gz + 1219), 0, {building: N, part: 'light switch by the door'});
    hatch('structure', C.car2, [P(gx0 - 300, gy1 + 300, gz + 3453), P(gx1 + 300, gy1 + 300, gz + 3453), P(gx1 + 300, gy1 - 1200, gz + 3453)], 'cross', 300, 0, {building: N, part: 'solar panels for the gate motors'});
    sym('structure', C.sign, 'sign', P(gx0 - 1200, gy0 - 1500, gz), 0, {text: N});
    line('plumbing', C.plumb, [P(RC[0], RC[1] - RB * 0.8, WZ - 6000), P(mx, my + 400, WZ - 9000), P(mx, my - 3000, WZ - 14000)], {part: 'intake tower conduit through the dam'});
    line('structure', C.struct, [P(RC[0] + 6000, RC[1] - RB * 0.6, WZ - 4000), P(RC[0] + 6000, RC[1] - RB * 0.6, WZ + 1800)], {part: 'staff gauge post in the reservoir'});
    who('standing', 'reading the reservoir level off the staff gauge', [gx0 + 2400, gy0 - 2200, gz], Math.PI);
    who('standing', 'cracking open the outlet gate a quarter turn', [gx0 + 2000, gy0 + 1500, gz], 0);
    // canoe drifting on the reservoir
    const cl = []; for (let i = 0; i <= 16; i++) { const t = i / 16 * Math.PI * 2; cl.push(P(RC[0] + Math.cos(t) * RA * 0.5, RC[1] + Math.sin(t) * RB * 0.5, WZ)); }
    line('lot', C.brick, [P(cl[0][0] - 2400, cl[0][1], WZ + 200), P(cl[0][0], cl[0][1] - 400, WZ + 200), P(cl[0][0] + 2400, cl[0][1], WZ + 200), P(cl[0][0], cl[0][1] + 400, WZ + 200)], {part: 'canoe on the reservoir', anim: {type: 'path', speed: 700, pts: cl}}, closed);
    // trail from Keeper's Block up to the dam
    const tr = []; { let x = 372000, y = 600000; for (let i = 0; i < 60; i++) { tr.push([x, y]); const dx = gx0 - 2000 - x, dy = gy0 - 3000 - y, d = Math.hypot(dx, dy); if (d < 3000) break; x += dx / d * 3000 + Math.sin(i * 0.8) * 1800; y += dy / d * 3000 + Math.cos(i * 0.6) * 900; } }
    const trP = tr.map(([x, y]) => P(x, y, hgt(x, y) + 30));
    line('paving', C.brick, trP, {part: 'Gihon Trail, Keeper\'s Block to the dam'});
    { const seg = trP.slice(0, Math.min(trP.length, 40)); const pts = seg.concat(seg.slice(0, -1).reverse()); who('walking', 'hiking up to see the new dam', pts[0], 0, {type: 'path', speed: 1100, pts}); }
    sym('street', C.sign, 'sign', P(371000, 598000), 0, {text: 'Gihon Trail to the dam'});
    // Kidron Creek: down the falls, west along the valley past Keeper's Block, then southwest to Siloam Lake
    const ck = [[pool[0], pool[1] - 4000], [pool[0] - 4000, 566000], [pool[0] - 9000, 561000]];
    for (let x = pool[0] - 15000; x > 2 * S + 6000; x -= 6000) ck.push([x, 558600 + Math.sin(x / 9000) * 1800]);
    for (const p of [[150000, 549000], [140000, 538000], [132000, 528500]]) ck.push(p);
    const seg = (a, b) => { const out = []; for (let i = a; i < Math.min(b, ck.length); i++) out.push(P(ck[i][0], ck[i][1], hgt(ck[i][0], ck[i][1]) - 300)); return out; };
    line('lot', C.plumb, seg(0, ck.length), {part: 'Kidron Creek'}, {color2: C.sewer});
    line('lot', C.veg2, ck.slice(3, ck.length - 3).map(([x, y], i) => P(x + 300, y + 1600 + Math.sin(i) * 400, 0)), {part: 'willow and seep willow along Kidron Creek'});
    for (let i = 3; i < ck.length - 2; i += 2) { const [x, y] = ck[i]; if (inKB(x, y + 3000) && Math.abs(x - KB[0]) < 32000 && y > 563000) continue; plant('tree', x + (r2() - 0.5) * 3000, y - 2600 - r2() * 1500, 0, r2() < 0.5 ? 'Fremont cottonwood' : 'Goodding willow', 4); }
    sym('street', C.sign, 'sign', P(360000, 556500), 0, {text: 'Kidron Creek'});
    line('structure', C.struct, [P(354000, 557000, 900), P(354000, 560500, 900)], {part: 'plank footbridge over Kidron Creek'});
    line('structure', C.struct, [P(355200, 557000, 900), P(355200, 560500, 900)], {part: 'plank footbridge rail'});
    who('standing', 'filling a bucket at the creek for the mortar', [352500, 561200, 0], Math.PI);
  }

  // ================================================================= Siloam Lake on 1,5 and 1,6
  {
    const LC = [118872, 481000], LA = 30000, LB = 46000;
    const shore = (a, b, z, n, sd) => { const o = []; for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + i / n * Math.PI * 2, w = 1 + 0.08 * Math.sin(t * 3 + sd) + 0.05 * Math.sin(t * 7 + sd * 2); o.push(P(LC[0] + Math.cos(t) * a * w, LC[1] + Math.sin(t) * b * w, z)); } return o; };
    // clear the earlier woodland from the lake bed and its banks
    const c15 = [...W.chunks.values()].find(c => c.k === '1:5');
    for (const r of (c15 ? c15.records : [])) { if (r.hidden || r.agent !== 'agent-orange') continue; const at = r.kind === 'symbol' ? r.at : r.pts[0]; if (r.discipline === 'vegetation' && (Math.hypot((at[0] - LC[0]) / (LA + 7000), (at[1] - LC[1]) / (LB + 7000)) < 1 || r.kind === 'line')) k.push('remove', {id: r.id}); }
    line('lot', C.plumb, shore(LA, LB, 0, 72, 1), {part: 'Siloam Lake shoreline'}, closed);
    hatch('lot', C.plumb, shore(LA - 800, LB - 800, -300, 56, 1), 'lines', 1800, 0, {part: 'Siloam Lake water surface'}, C.sewer);
    for (const [f, d] of [[0.75, 1500], [0.5, 3500], [0.25, 6000]]) line('lot', C.sewer, shore(LA * f, LB * f, -d, 40, 1 + f), {part: 'lake depth ring, ' + (d / 1000) + ' m down'}, closed);
    line('lot', C.veg2, shore(LA + 3500, LB + 3500, 0, 60, 2), {part: 'cattail and bulrush margin'}, closed);
    // inlet delta where Kidron Creek comes in
    hatch('lot', C.yellow, [P(126000, 524500, 0), P(134000, 529500, 0), P(129500, 532000, 0), P(122500, 527000, 0)], 'dots', 500, 0, {part: 'sand delta at the Kidron Creek inlet'});
    // beach on the southeast shore
    hatch('paving', C.yellow, [P(130000, 446000, 20), P(142000, 454000, 20), P(139000, 459000, 20), P(127500, 451000, 20)], 'dots', 400, 0, {part: 'swimming beach, coarse sand'});
    // shore trail with a jogger and a dog walker
    const trail = shore(LA + 7500, LB + 7500, 30, 60, 3); trail.push(trail[0]);
    line('paving', C.brick, trail.slice(0, -1), {part: 'Siloam Lake shore trail, decomposed granite'}, closed);
    who('walking', 'jogging the shore trail at sunrise', trail[0], 0, {type: 'path', speed: 2600, pts: trail});
    const t2 = trail.slice(20).concat(trail.slice(1, 21)); who('walking', 'walking an old dog around the lake', t2[0], 0, {type: 'path', speed: 900, pts: t2});
    // dock, boathouse and rowboat on the east shore
    const DX = 148000, DY = 476000;
    const N = 'Siloam Lake Boathouse', bx0 = DX + 1200, by0 = DY - 2400, bx1 = bx0 + 6096, by1 = by0 + 4877;
    wall(N, [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]], 3658, -610, true);
    hatch('structure', C.car2, vface(bx0, by0, bx0, by1, 0, 3658), 'lines', 300, 90, {building: N, part: 'painted board siding, lake side'}, C.struct);
    hatch('structure', C.brick, [P(bx0 - 400, by0 - 400, 3758), P(bx1 + 400, by0 - 400, 3758), P((bx0 + bx1) / 2, (by0 + by1) / 2, 4900)], 'lines', 350, 0, {building: N, part: 'south roof slope'}, C.roof);
    hatch('structure', C.brick, [P(bx0 - 400, by1 + 400, 3758), P(bx1 + 400, by1 + 400, 3758), P((bx0 + bx1) / 2, (by0 + by1) / 2, 4900)], 'lines', 350, 0, {building: N, part: 'north roof slope'}, C.roof);
    door(N, bx0, by0 + 1800, 'y', 914, 'boathouse door to the dock', 1);
    line('structure', C.struct, [P(bx0, by0 + 3000), P(bx0, by0 + 3000, 2438), P(bx0, by1 - 300, 2438), P(bx0, by1 - 300)], {building: N, part: 'open boat bay to the water'});
    hatch('structure', 7, rect(bx0 + 100, by0 + 100, bx1 - 100, by1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'open rafter ceiling', checks: [['ceiling_height', 2743]]});
    const I = (label, col, a, b, c, d, z, o = {}) => line(o.disc || 'interior', col, rect(bx0 + a, by0 + b, bx0 + c, by0 + d, z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), closed);
    const V = (label, col, ax, ay, bx, by, z0, z1) => line('interior', col, [P(bx0 + ax, by0 + ay, z0), P(bx0 + bx, by0 + by, z0), P(bx0 + bx, by0 + by, z1), P(bx0 + ax, by0 + ay, z1)], {building: N, part: label}, closed);
    I('rental counter', C.brick, 3800, 300, 5800, 800, 1067, {check: ['counter_height', 1067]});
    I('pos terminal for boat rentals', C.int, 4000, 400, 4300, 650, 1300);
    I('receipt printer', C.int, 4600, 400, 4900, 700, 1150);
    I('cash drawer', C.struct, 5100, 350, 5600, 750, 850);
    I('card reader on a swivel', C.int, 5300, 900, 5500, 1050, 1120);
    I('rack of rowboat oars', C.yellow, 5700, 1500, 5976, 4400, 1800, {check: ['shelf_height', 1800]});
    V('hooks of life jackets in every size', C.brick, 3000, 4757, 5600, 4757, 1100, 2000);
    I('kayak rack, lower', C.struct, 1200, 3200, 3400, 4500, 600);
    I('kayak rack, upper', C.struct, 1200, 3200, 3400, 4500, 1500);
    I('bait fridge of nightcrawlers', C.car2, 3800, 3600, 4500, 4500, 1500);
    I('fishing license board', C.sign, 120, 600, 160, 1600, 1600);
    I('bench for rigging tackle', C.int, 1400, 400, 3000, 900, 914, {check: ['counter_height', 914]});
    I('tackle box on the bench', C.yellow, 1600, 500, 2000, 800, 1100);
    I('battery and inverter', C.elec, 5700, 300, 5976, 1100, 1400, {disc: 'electrical'});
    line('electrical', C.elec, rect(bx0 + 2800, by0 + 2300, bx0 + 3100, by0 + 2600, 2700), {building: N, part: 'boathouse light'}, closed);
    sym('electrical', C.elec, 'outlet', P(bx0 + 4100, by1 - 120, 457), 0, {building: N, part: 'outlet for the bait fridge', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'switch', P(bx0 + 120, by0 + 1600, 1219), 0, {building: N, part: 'light switch by the dock door'});
    line('plumbing', C.plumb, rect(bx1 - 1100, by1 - 1100, bx1 - 400, by1 - 400, 900), {building: N, part: 'rinse sink'}, closed);
    sym('structure', C.sign, 'sign', P(bx1 + 1500, by0 - 1200), 0, {text: N});
    sym('street', C.sign, 'sign', P(152000, 470000), 0, {text: 'Siloam Lake'});
    // dock out into the water
    hatch('structure', C.struct, rect(DX - 9000, DY - 900, bx0, DY + 900, 400), 'lines', 300, 0, {part: 'plank dock'}, C.yellow);
    line('structure', C.struct, rect(DX - 13000, DY - 3000, DX - 9000, DY + 3000, 400), {part: 'dock platform at the end'}, closed);
    for (let i = 0; i < 4; i++) line('structure', C.struct, [P(DX - 2000 - i * 3000, DY - 900, -2500), P(DX - 2000 - i * 3000, DY - 900, 400)], {part: 'dock piling'});
    // rowboats: two tied up, one out on the water
    for (const [ox, oy] of [[DX - 6000, DY + 2300], [DX - 3000, DY + 2300]]) line('lot', C.brick, [P(ox - 1800, oy, -100), P(ox, oy - 650, -100), P(ox + 1800, oy, -100), P(ox, oy + 650, -100)], {part: 'rowboat tied to the dock'}, closed);
    const rb = []; for (let i = 0; i <= 18; i++) { const t = i / 18 * Math.PI * 2; rb.push(P(LC[0] + Math.cos(t) * LA * 0.45, LC[1] - 6000 + Math.sin(t) * LB * 0.4, -100)); }
    line('lot', C.yellow, [P(rb[0][0] - 1800, rb[0][1], -100), P(rb[0][0], rb[0][1] - 650, -100), P(rb[0][0] + 1800, rb[0][1], -100), P(rb[0][0], rb[0][1] + 650, -100)], {part: 'rowboat with two anglers out on Siloam Lake', anim: {type: 'path', speed: 600, pts: rb}}, closed);
    // ducks and ripples
    for (let i = 0; i < 3; i++) { const x = LC[0] - 12000 + i * 1500, y = LC[1] + 16000 + (i % 2) * 900; line('lot', C.struct, [P(x - 250, y, -200), P(x + 250, y, -200), P(x + 150, y, 50), P(x - 250, y, -200)], {part: 'mallard paddling', anim: {type: 'bob', mm: 60, period: 1.6 + i * 0.3}}); }
    for (let i = 0; i < 3; i++) line('lot', C.plumb, circ(LC[0] + 6000 - i * 9000, LC[1] - 18000 + i * 13000, 900 + i * 300, -280, 12), {part: 'ripple where a fish rose', anim: {type: 'blink', period: 2.5 + i, duty: 0.4}}, closed);
    // people
    who('standing', 'casting for bluegill off the end of the dock', [DX - 11000, DY + 2000, 400], Math.PI);
    who('standing', 'untangling a fishing line on the dock', [DX - 11000, DY - 2000, 400], Math.PI);
    who('standing', 'renting a rowboat for the afternoon', [bx0 + 4800, by0 - 1300, 0], 0);
    who('standing', 'skipping stones from the beach', [134500, 449000, 20], 2.4);
    who('standing', 'wading in up to the knees', [136000, 457800, -200], 2.4);
    who('standing', 'teaching a kid to bait a hook', [126000, 529000, 0], 3.6);
    // picnic grove on the west shore with cottonwoods
    for (const [tx, ty] of [[84000, 470000], [84500, 490000], [86000, 455000], [90000, 512000], [97000, 433000], [140000, 512000], [146000, 500000], [143000, 440000], [105000, 525000], [112000, 431000]]) sym('vegetation', C.veg, 'tree', P(tx, ty), 0, Object.assign({part: r2() < 0.5 ? 'Fremont cottonwood' : 'Goodding willow'}, canAnim(tx, ty, 6) ? {anim: {type: 'sway', deg: 3, period: 6 + Math.round(r2() * 20) / 10}} : {}));
    sym('activity', C.int, 'table', P(86000, 480000), 0, {part: 'picnic table under the cottonwoods'});
    sym('activity', C.int, 'table', P(87000, 498000), 0, {part: 'picnic table by the water'});
    who('sitting', 'eating sandwiches at a lakeside picnic table', [86000, 480700, 0], Math.PI);
    who('sitting', 'reading the paper at the picnic table', [87000, 498700, 0], Math.PI);
    sym('activity', C.int, 'bench', P(98000, 450000), 2.2, {part: 'bench facing the water'});
  }
  console.log('NAMED ' + ni);
}
