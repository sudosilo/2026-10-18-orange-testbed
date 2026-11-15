// Agent Orange 2026-11-15 b: one Mount Zion instead of two ranges with a ruler-straight gap. Old and new peaks join into one range,
// Kidron Creek winds west through a carved valley and Kidron Gorge to Siloam Lake, and Keeper's Block moves up onto a graded pad
// on the slope above the creek with Kidron Valley Road switchbacking up to it. Every moving car and truck in the city gets a driver.
// Records on the old terrain are re-placed at the new ground height. Asked by Orange.
import {names} from '../lib/names.mjs';
import fs from 'fs';
export default function (k) {
  const {C, P, line, sym, hatch, rect, circ, vface, wall, door, S, PL, W} = k;
  const closed = {closed: true};
  let s2 = 1115152; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  const sm = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const ckOf = (x, y) => Math.floor(x / S) + ':' + Math.floor(y / S);
  const chunks = [...W.chunks.values()];
  const chunk = (cx, cy) => chunks.find(c => c.cx === cx && c.cy === cy);

  // ---------------------------------------------------------------- names: keep each person's name when a record is re-placed
  let reg = {population: [], awake: []};
  try { reg = JSON.parse(fs.readFileSync(new URL('../awake.json', import.meta.url), 'utf8')); } catch (e) { }
  const nameById = new Map((reg.population || []).map(e => [e.id, e.name]));
  const taken = new Set([...(reg.population || []).map(e => e.name), ...(reg.awake || []).map(e => e.name)]);
  for (const c of chunks) for (const r of c.records) if (r.meta && r.meta.name) taken.add(r.meta.name);
  const pool = names(taken); let ni = 0;
  const keepName = new Map();   // activity -> name, for people being re-placed

  // A rider's route: the car's loop rotated so the rider's phase matches the car's. The viewer starts each mover (id mod 97) / 97 of the way round.
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  // ================================================================= drivers first, so their record ids (and so their path phase) are known
  {
    let id = W.nextId;
    const DRIVE = ['driving across town after a shift', 'driving home with the windows down', 'driving to pick up a kid from practice', 'driving a load of feed out to the yard', 'driving to the parts counter', 'driving slow and reading the shop signs', 'driving a pickup to the job site', 'driving the long way around the block', 'driving with a dog riding shotgun', 'driving back from the lumber yard', 'driving to the post office before it closes', 'driving with the radio up', 'driving a delivery route', 'driving a work truck to the next call', 'driving to the donut counter', 'driving out to check the wells', 'driving a carload of cousins', 'driving in from the ranch', 'driving to the clinic for a checkup', 'driving the night loop', 'driving out to the lake', 'driving a rental tractor trailer back', 'driving to the feed store', 'driving and waving at a neighbor'];
    let made = 0;
    for (const c of chunks) {
      let an = c.records.filter(r => !r.hidden && r.meta && (r.meta.anim || r.meta.billboard)).length;
      const used = new Set(c.records.filter(r => r.meta && r.meta.activity).map(r => r.meta.activity));
      for (const r of c.records) {
        if (r.hidden || r.kind !== 'symbol' || !['car', 'truck'].includes(r.type)) continue;
        const a = r.meta && r.meta.anim; if (!a || a.type !== 'path' || !Array.isArray(a.pts) || a.pts.length < 3) continue;
        if (JSON.stringify(a.pts[0]) !== JSON.stringify(a.pts[a.pts.length - 1])) continue;              // open routes jump back; no rider can follow
        if (r.agent === 'agent-orange' && c.cy >= 7 && c.cy <= 8 && ['2026-11-15T021149', '2026-11-14T175523'].includes(r.date)) continue;   // taken down below
        if (an >= 60) continue;
        let text = null; for (let t = 0; t < DRIVE.length * 3 && !text; t++) { const s = DRIVE[(made + t) % DRIVE.length] + (t >= DRIVE.length ? (t >= DRIVE.length * 2 ? ' again' : ' today') : ''); if (!used.has(s)) text = s; }
        if (!text) continue;
        used.add(text);
        const rot = driverPath(r.id, a.pts, id); if (!rot) continue;
        sym('activity', C.person, 'person', r.at.slice(), r.rot || 0, {pose: 'walking', activity: text, name: pool[ni++], awake: true, wokenBy: "the children's game", how: 'woke at the wheel when the whole city woke', layer: 1, driving: r.id, anim: {type: 'path', speed: a.speed, pts: rot}});
        id++; an++; made++;
      }
    }
    console.log('DRIVERS ' + made);
  }

  // ================================================================= one range: old and new peaks joined, no straight gap
  const oldPeaks = [[3.1, 6.25, 105000, 95000, 1], [4.4, 6.45, 150000, 120000, 2], [5.7, 6.2, 95000, 90000, 3], [6.9, 6.4, 120000, 100000, 4], [2.35, 6.6, 70000, 60000, 5], [7.6, 6.75, 80000, 60000, 6]].map(([a, b, c, d, e]) => [Math.round(a * S), Math.round(b * S), c, d, e]);
  const peaks = [[2.62, 8.12, 110000, 85000, 11], [3.6, 8.38, 165000, 110000, 12], [4.62, 8.6, 140000, 95000, 13], [5.45, 8.25, 178000, 118000, 14], [6.95, 8.45, 150000, 100000, 15], [7.55, 7.9, 95000, 70000, 16]].map(([a, b, c, d, e]) => [Math.round(a * S), Math.round(b * S), c, d, e]);
  const hOld = (x, y) => { let h = 0; for (const [px, py, H, R, s] of oldPeaks) { const dx = x - px, dy = y - py, th = Math.atan2(dy, dx), r = R * (1 + 0.22 * Math.sin(th * 3 + s) + 0.1 * Math.sin(th * 5 + s * 2)), d = Math.hypot(dx, dy) / r; if (d < 1) h = Math.max(h, H * Math.pow(1 - d, 1.6) * (1 + 0.04 * Math.sin(x / 3000 + s) * Math.sin(y / 3500))); } return h; };
  const hOldOrig = (x, y) => { if (x < 2 * S || x > 8 * S || y < 5 * S || y > 7 * S) return 0; const e = Math.min(sm((y - 5 * S - 14000) / 26000), sm((7 * S - 3000 - y) / 22000), sm((x - 2 * S - 3000) / 20000), sm((8 * S - 3000 - x) / 20000)); return Math.max(0, Math.round(hOld(x, y) * e)); };
  const hNew = (x, y) => { let h = 0; for (const [px, py, H, R, s] of peaks) { const dx = x - px, dy = y - py, th = Math.atan2(dy, dx), r = R * (1 + 0.24 * Math.sin(th * 3 + s) + 0.12 * Math.sin(th * 5 + s * 2)), d = Math.hypot(dx, dy) / r; if (d < 1) h = Math.max(h, H * Math.pow(1 - d, 1.5)); } return h * (1 + 0.07 * Math.sin(x / 2300 + 1.1) * Math.sin(y / 2900 - 0.4) + 0.05 * Math.sin((x - y) / 4100) + 0.04 * Math.sin(x / 1300 + y / 1700)); };
  const raw = (x, y) => { if (x < 2 * S || x > 8 * S || y < 5 * S || y > 9 * S) return 0; const e = Math.min(sm((y - 5 * S - 14000) / 26000), sm((9 * S - 3000 - y) / 22000), sm((x - 2 * S - 3000) / 20000), sm((8 * S - 3000 - x) / 20000)); return Math.max(hOld(x, y), hNew(x, y)) * e; };
  // Kidron valley: a winding thalweg from the foot of Gihon Falls west to the lake, floor falling the whole way
  const CP = [[6.36, 7.15], [6.05, 7.26], [5.7, 7.13], [5.3, 7.04], [4.9, 7.11], [4.55, 7.11], [4.25, 7.2], [3.95, 7.27], [3.65, 7.12], [3.3, 7.05], [2.9, 7.1], [2.5, 7.2], [2.1, 7.16], [1.9, 7.02]].map(([a, b]) => [a * S, b * S]).reverse();
  const yc = (x) => { if (x <= CP[0][0]) return CP[0][1]; for (let i = 1; i < CP.length; i++) if (x <= CP[i][0]) { const t = sm((x - CP[i - 1][0]) / (CP[i][0] - CP[i - 1][0])); return CP[i - 1][1] + (CP[i][1] - CP[i - 1][1]) * t; } return CP[CP.length - 1][1]; };
  const XE = 6.36 * S, XW = 2.1 * S;
  const floorZ = (x) => x >= XE ? 6000 : x <= XW ? Math.max(0, 500 * (x - 1.95 * S) / (0.15 * S)) : 500 + 5500 * (x - XW) / (XE - XW);
  function carve(x, y, h) {
    if (x < 1.9 * S || x > 6.6 * S) return h;
    const f = floorZ(x), d = Math.abs(y - yc(x)); if (d >= 25000) return h;
    const cut = f + (h - f) * sm((d - 2500) / 22000), wE = sm((6.6 * S - x) / (0.24 * S));
    return h + (cut - h) * wE;
  }
  // Keeper's Block pad, cut into the slope above the creek
  const PAD = [334000, 576000, 366000, 593000];
  const padD = (x, y) => Math.hypot(Math.max(PAD[0] - x, 0, x - PAD[2]), Math.max(PAD[1] - y, 0, y - PAD[3]));
  const ZP = Math.round(carve(350000, 584500, raw(350000, 584500)) / 100) * 100;
  // Gihon Reservoir on its bench
  const RC = [Math.round(6.35 * S), Math.round(8.06 * S)], RA = 28000, RB = 18000, WZ = 48000;
  const ell = (x, y) => Math.hypot((x - RC[0]) / RA, (y - RC[1]) / RB);
  function base(x, y) {
    let h = carve(x, y, raw(x, y));
    const pd = padD(x, y); if (pd < 12000) h = ZP + (h - ZP) * sm(pd / 12000);
    return h;
  }
  function hgt(x, y) {
    if (x < 1.9 * S || x > 8 * S || y < 5 * S || y > 9 * S) return 0;
    let h = base(x, y);
    const e = ell(x, y);
    if (e < 1) return Math.round(WZ - 7000 * (1 - e * e));
    h = Math.max(h, (WZ + 6000) * sm((3.2 - e) / 2.2));
    const ang = Math.atan2((y - RC[1]) / RB, (x - RC[0]) / RA), south = Math.abs(ang + Math.PI / 2) < 0.42;
    if (south) h = Math.min(h, Math.max(base(x, y), WZ - 1500 - (e - 1) * 16000));
    return Math.max(0, Math.round(h));
  }
  console.log('PAD ' + ZP + ' lookout dz ' + (hgt(oldPeaks[1][0], oldPeaks[1][1]) - hOldOrig(oldPeaks[1][0], oldPeaks[1][1])));

  // ================================================================= take down what sat on the old ground
  const lotIds = new Set(); for (const c of chunks) for (const l of c.lots || []) lotIds.add(l.id);
  const rm = (r) => { if (r.kind === 'symbol' && r.meta && r.meta.activity) keepName.set(r.meta.activity, nameById.get(r.id) || r.meta.name); k.push('remove', {id: r.id}); };
  let moved = 0, gone = 0;
  for (let cx = 2; cx <= 7; cx++) for (let cy = 5; cy <= 8; cy++) {
    const c = chunk(cx, cy); if (!c) continue;
    for (const r of c.records) {
      if (r.hidden || r.agent !== 'agent-orange' || lotIds.has(r.id)) continue;
      const m = r.meta || {};
      if (cy >= 7 && (r.date === '2026-11-15T021149' || r.date === '2026-11-14T175523')) { rm(r); gone++; continue; }
      if (/contour/.test(m.part || '')) { rm(r); gone++; continue; }
      if (cy > 6) continue;
      // re-place anything else whose ground moved by more than 30 cm
      const ptsOf = r.kind === 'symbol' ? [r.at] : r.pts;
      let worst = 0; for (const p of ptsOf) worst = Math.max(worst, Math.abs(hgt(p[0], p[1]) - hOldOrig(p[0], p[1])));
      if (worst <= 300) continue;
      const shift = (p) => [p[0], p[1], Math.round(p[2] + hgt(p[0], p[1]) - hOldOrig(p[0], p[1]))];
      const meta = JSON.parse(JSON.stringify(m || {}));
      if (meta.anim && Array.isArray(meta.anim.pts)) meta.anim.pts = meta.anim.pts.map(shift);
      if (meta.anim && Array.isArray(meta.anim.pivot)) meta.anim.pivot = shift(meta.anim.pivot);
      rm(r); moved++;
      if (meta.activity) meta.name = keepName.get(meta.activity) || meta.name;
      if (r.kind === 'symbol') sym(r.discipline, r.color, r.type, shift(r.at), r.rot || 0, meta);
      else if (r.kind === 'line') line(r.discipline, r.color, r.pts.map(shift), meta, Object.assign({closed: !!r.closed}, r.color2 != null ? {color2: r.color2} : {}));
      else if (r.kind === 'hatch') { const q = r.pts.map(shift), zs = q.map(p => p[2]); if (Math.max(...zs) - Math.min(...zs) < 50 || q.length === 3) hatch(r.discipline, r.color, q, r.pattern, r.spacing, r.angle, meta, r.color2 != null ? r.color2 : undefined); else hatch(r.discipline, r.color, r.pts.map(p => [p[0], p[1], Math.round(p[2] + (hgt(r.pts[0][0], r.pts[0][1]) - hOldOrig(r.pts[0][0], r.pts[0][1])))]), r.pattern, r.spacing, r.angle, meta, r.color2 != null ? r.color2 : undefined); }
    }
  }
  console.log('REMOVED ' + gone + ' RE-PLACED ' + moved);
  const who = (pose, activity, at, rot = 0, anim) => sym('activity', C.person, 'person', P(...at), rot, Object.assign({pose, activity, name: keepName.get(activity) || pool[ni++], awake: true, wokenBy: "the children's game", how: keepName.has(activity) ? 'woke when the whole city woke at once' : 'born awake after the city woke', layer: 1}, anim ? {anim} : {}));

  // ================================================================= contours over the whole range, every 8 m, index every 40 m
  {
    const X0 = 2 * S, X1 = 8 * S, Y0 = 5 * S, Y1 = 9 * S;
    const g = 2500, nx = Math.floor((X1 - X0) / g), ny = Math.floor((Y1 - Y0) / g), V = [];
    for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= nx; i++) V[j].push(hgt(X0 + i * g, Y0 + j * g)); }
    let nC = 0;
    for (let L = 8000; L < 190000; L += 8000) {
      const segs = [], ptOf = {};
      const ep = (key, i0, j0, i1, j1) => { if (!ptOf[key]) { const a = V[j0][i0], b = V[j1][i1], t = (L - a) / (b - a); ptOf[key] = [X0 + (i0 + (i1 - i0) * t) * g, Y0 + (j0 + (j1 - j0) * t) * g]; } return key; };
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
        if (L < WZ && ell(pts[0][0], pts[0][1]) < 1.05) continue;
        const major = (L / 8000) % 5 === 0;
        line('lot', major ? C.struct : 9, pts.map(p => P(p[0], p[1], L)), {part: (major ? 'index contour, ' : 'terrain contour, ') + Math.round(L / 1000) + ' m above town'}, Object.assign({closed: isClosed}, major ? {} : {color2: 8}));
        nC++;
      }
    }
    console.log('CONTOURS ' + nC);
  }

  // gullies and outcrops on the northern peaks
  for (const [px, py, H, R, s] of peaks) for (let t = 0; t < 5; t++) {
    const a = s * 0.9 + t * 1.26; let x = px + Math.cos(a) * R * 0.28, y = py + Math.sin(a) * R * 0.28; const pts = [];
    for (let n = 0; n < 60; n++) {
      const h = hgt(x, y); if (h < 6000 || ell(x, y) < 1.2 || padD(x, y) < 3000) break;
      pts.push(P(x, y, h + 100));
      const gx = hgt(x + 400, y) - hgt(x - 400, y), gy = hgt(x, y + 400) - hgt(x, y - 400), gl = Math.hypot(gx, gy) || 1;
      x -= gx / gl * 1800 + Math.sin(n * 0.9 + s) * 250; y -= gy / gl * 1800 + Math.cos(n * 0.7 + s) * 250;
    }
    if (pts.length >= 4) line('lot', 8, pts, {part: 'dry gully down the slope'});
  }
  for (const [px, py, H, R, s] of peaks) for (let t = 0; t < 5; t++) {
    const a = s * 1.3 + t * 1.25, d = R * (0.25 + 0.09 * t), x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (x < 2 * S + 5000 || x > 8 * S - 5000 || y < 7 * S + 2000 || y > 9 * S - 5000 || ell(x, y) < 1.8 || padD(x, y) < 6000) continue;
    const q = [[x, y], [x + 5200, y + 1100], [x + 1800, y + 4600]].map(([qx, qy]) => P(qx, qy, hgt(qx, qy) + 300));
    hatch('lot', C.struct, q, t % 2 ? 'dots' : 'cross', t % 2 ? 450 : 600, 25, {part: t % 2 ? 'talus field below a cliff' : 'granite outcrop'}, 7);
  }

  // trees on the northern slopes by elevation
  const animCount = {};
  const canAnim = (x, y, max) => { const c = ckOf(x, y); animCount[c] = animCount[c] || 0; if (animCount[c] >= max) return false; animCount[c]++; return true; };
  const plant = (type, x, y, z, species, swayMax = 10) => sym('vegetation', type === 'shrub' ? C.veg2 : C.veg, type, P(x, y, z), Math.round(r2() * 628) / 100, Object.assign({part: species}, type === 'tree' && canAnim(x, y, swayMax) ? {anim: {type: 'sway', deg: 2 + Math.round(r2() * 3), period: 5 + Math.round(r2() * 30) / 10}} : {}));
  const noise = (x, y, s) => Math.sin(x / 23000 + s) * Math.cos(y / 19000 - s * 1.3) + 0.5 * Math.sin((x + y) / 9000 + s * 2.1);
  {
    const g = 11000;
    for (let y = 7 * S + 3000; y < 9 * S - 3000; y += g) for (let x = 2 * S + 3000; x < 8 * S - 3000; x += g) {
      const jx = x + (r2() - 0.5) * 7000, jy = y + (r2() - 0.5) * 7000, h = hgt(jx, jy);
      if (noise(jx, jy, 3.7) < -0.35 || padD(jx, jy) < 5000 || ell(jx, jy) < 1.25 || h < 2000 || Math.abs(jy - yc(jx)) < 6000) continue;
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
    const chute = []; for (let i = 0; i <= 40; i++) { const y = my - 600 - i * 3000; chute.push([mx + Math.sin(i * 0.7) * 800, y]); if (y < yc(mx) + 3500) break; }
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
  }

  // ================================================================= Kidron Creek: from the plunge pool, west along the winding valley and through the gorge to Siloam Lake
  const ck = [];
  {
    for (let x = XE - 2000; x > 1.95 * S; x -= 3000) ck.push([x, yc(x) + Math.sin(x / 5200) * 900]);
    for (const p of [[150000, 549000], [140000, 538000], [132000, 528500]]) ck.push(p);
    const zc = ([x, y]) => (x >= 1.95 * S ? Math.min(hgt(x, y), floorZ(x)) : 0) - 300;
    const pts = ck.map(p => P(p[0], p[1], zc(p)));
    line('lot', C.plumb, pts.slice(0, 120), {part: 'Kidron Creek'}, {color2: C.sewer});
    if (pts.length > 120) line('lot', C.plumb, pts.slice(119), {part: 'Kidron Creek, lower reach'}, {color2: C.sewer});
    line('lot', C.veg2, ck.slice(2, ck.length - 3).map(([x, y], i) => P(x + 200, y + 1700 + Math.sin(i) * 300, hgt(x + 200, y + 1700) + 30)), {part: 'willow and seep willow along Kidron Creek'});
    for (let i = 2; i < ck.length - 3; i += 3) { const [x, y] = ck[i], ty = y - 2400 - r2() * 1200; if (padD(x, ty) < 4000) continue; plant('tree', x + (r2() - 0.5) * 2500, ty, hgt(x, ty), r2() < 0.5 ? 'Fremont cottonwood' : 'Goodding willow', 4); }
    // gorge walls where the creek cuts through the pass
    for (const gx of [3.8 * S, 3.95 * S, 4.1 * S]) for (const side of [-1, 1]) {
      const y = yc(gx) + side * 4200, q = [[gx - 2500, y], [gx + 2500, y], [gx, y + side * 3500]].map(([qx, qy]) => P(qx, qy, hgt(qx, qy) + 200));
      hatch('lot', C.brick, q, 'lines', 350, 80, {part: 'Kidron Gorge rock wall'}, 7);
    }
    sym('street', C.sign, 'sign', P(3.95 * S, yc(3.95 * S) + 6500, hgt(3.95 * S, yc(3.95 * S) + 6500)), 0, {text: 'Kidron Gorge'});
  }

  // ================================================================= Kidron Valley Road: up the north bank from the lake, then switchbacks to Keeper's Block
  const road = [];
  {
    road.push([152000, 521000], [156000, 533000], [158000, 546000]);
    for (let x = 1.98 * S; x < 4.12 * S; x += 3000) road.push([x, yc(x) + 6500 + Math.sin(x / 7000) * 700]);
    const [lx, ly] = road[road.length - 1];
    // switchbacks climbing the slope west of the pad
    const legs = [[lx, ly], [328000, ly + 2500], [318000, ly + 5500], [329000, ly + 8500], [319000, ly + 11500], [331000, PAD[1] + 8000], [PAD[0] + 600, PAD[1] + 8500]];
    for (let i = 1; i < legs.length; i++) for (let t = 1; t <= 4; t++) road.push([legs[i - 1][0] + (legs[i][0] - legs[i - 1][0]) * t / 4, legs[i - 1][1] + (legs[i][1] - legs[i - 1][1]) * t / 4]);
  }
  const roadZ = ([x, y]) => (x < 1.95 * S ? 0 : hgt(x, y)) + 60;
  const roadP = road.map(p => P(p[0], p[1], roadZ(p)));
  line('paving', C.brick, roadP, {part: 'Kidron Valley Road, graded gravel'});
  line('paving', C.curb, road.map(([x, y], i) => { const n = road[Math.min(i + 1, road.length - 1)], pv = road[Math.max(i - 1, 0)], dx = n[0] - pv[0], dy = n[1] - pv[1], l = Math.hypot(dx, dy) || 1; return P(x - dy / l * 2400, y + dx / l * 2400, roadZ([x - dy / l * 2400, y + dx / l * 2400])); }), {part: 'Kidron Valley Road, uphill shoulder'});
  sym('street', C.sign, 'sign', P(150500, 519000), 0, {text: 'Kidron Valley Road to Keeper\'s Block'});
  sym('street', C.yellow, 'sign', P(road[8][0], road[8][1] - 3000, roadZ(road[8])), 0, {text: 'Narrow road, steep grades'});
  // the flatbed now hauls adobe up the road and back down it
  {
    const out = roadP.slice(), pts = out.concat(out.slice(0, -1).reverse());
    const truckId = nextIdNow();
    sym('vehicle', C.yellow, 'truck', pts[0], 0, {part: 'flatbed hauling adobe up Kidron Valley Road', anim: {type: 'path', speed: 4000, pts}});
    const dp = driverPath(truckId, pts, truckId + 1);
    sym('activity', C.person, 'person', pts[0], 0, {pose: 'walking', activity: 'driving the adobe flatbed up to the pad', name: pool[ni++], awake: true, wokenBy: "the children's game", how: 'born awake after the city woke', layer: 1, driving: truckId, anim: {type: 'path', speed: 4000, pts: dp}});
  }

  // ================================================================= Keeper's Block on its pad
  {
    const z = ZP, X0 = 350000, X1 = 362192, Y0 = 582000, Y1 = 591144;
    hatch('lot', C.yellow, rect(PAD[0], PAD[1], PAD[2], PAD[3], z), 'dots', 900, 0, {part: 'graded caliche building pad cut into the slope'}, C.struct);
    const zN = hgt((PAD[0] + PAD[2]) / 2, PAD[3] + 3000);
    if (zN > z + 600) hatch('structure', C.struct, vface(PAD[0], PAD[3], PAD[2], PAD[3], z, Math.min(zN, z + 2400)), 'brick', 450, 0, {part: 'dry stacked stone retaining wall on the uphill side'}, C.brick);
    line('lot', C.brick, [P(PAD[0], PAD[1], z), P(PAD[2], PAD[1], z)], {part: 'edge of the fill slope'});
    sym('structure', C.sign, 'sign', P(PAD[0] + 1500, PAD[1] + 9500, z), 0, {text: "Keeper's Block, raised by the people of Zion", part: 'hand painted board at the top of the road'});
    for (const [x, y] of [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]]) line('structure', C.struct, [P(x, y, z), P(x, y, z + 600)], {part: 'corner stake for the keeper\'s house'});
    line('structure', C.yellow, rect(X0, Y0, X1, Y1, z + 300), {part: 'string line staked for the keeper\'s house footprint'}, closed);
    line('structure', C.brick, rect(X0, Y0, X1, Y1, z - 450), {part: 'footing trench, dug by hand'}, closed);
    hatch('structure', C.brick, vface(X0, Y0, X1, Y0, z - 450, z), 'gradient', 300, 0, {part: 'trench wall, caliche showing'}, C.struct);
    line('structure', C.struct, [P(X0, Y0 - 200, z), P(X1, Y0 - 200, z)], {part: 'footing form board, south, bottom'});
    line('structure', C.struct, [P(X0, Y0 - 200, z + 300), P(X1, Y0 - 200, z + 300)], {part: 'footing form board, south, top'});
    line('structure', C.struct, [P(X0 - 200, Y0, z), P(X0 - 200, Y0 + 6000, z)], {part: 'footing form board, west, bottom'});
    line('structure', C.struct, [P(X0 - 200, Y0, z + 300), P(X0 - 200, Y0 + 6000, z + 300)], {part: 'footing form board, west, top'});
    hatch('structure', C.brick, vface(X0, Y0, X0 + 4000, Y0, z, z + 300), 'brick', 300, 0, {part: 'first course of adobe, laid this morning'}, C.yellow);
    // material yard on the west half of the pad
    line('structure', C.yellow, rect(336000, 586000, 342000, 587200, z + 900), {part: 'stack of rough sawn lumber'}, closed);
    for (let i = 0; i < 4; i++) line('structure', C.brick, rect(336000 + i * 2000, 579500, 337200 + i * 2000, 580500, z + 1000), {part: 'pallet of adobe block ' + (i + 1)}, closed);
    line('structure', C.struct, [P(336000, 582500, z + 200), P(342000, 582500, z + 200)], {part: 'bundle of rebar on blocks'});
    line('lot', C.yellow, k.blob(338500, 577300, 900, 14, 3, z + 700), {part: 'pile of washed sand'}, closed);
    line('lot', C.struct, k.blob(341800, 577300, 800, 12, 5, z + 500), {part: 'pile of crushed gravel'}, closed);
    line('structure', C.brick, circ(345500, 577300, 500, z + 1000, 12), {part: 'portable cement mixer turning', anim: {type: 'spin', rpm: 20}}, closed);
    line('structure', C.struct, [P(345500, 577300, z), P(345500, 577300, z + 800)], {part: 'mixer stand'});
    line('structure', C.plumb, circ(345500, 583800, 300, z + 900, 10), {part: 'water barrel for the mortar'}, closed);
    line('structure', C.struct, [P(338400, 589500, z + 700), P(340000, 589500, z + 700)], {part: 'sawhorse'});
    sym('activity', C.car2, 'cart', P(343500, 578300, z), 1.571, {part: 'wheelbarrow'});
    // canopy on the south edge of the pad
    sym('activity', C.yellow, 'umbrella', P(360000, 577500, z), 0, {part: 'shade canopy for the crew'});
    sym('activity', C.int, 'table', P(359000, 578300, z), 0, {part: 'folding table of water jugs and donuts'});
    sym('activity', C.int, 'table', P(361200, 578300, z), 0, {part: 'folding table with the house plans'});
    sym('activity', C.brick, 'dog', P(364500, 578000, z), 0, {part: 'dog asleep in the shade'});
    sym('vehicle', C.car2, 'truck', P(364300, 584000, z), 0.1, {part: 'pickup of a volunteer'});
    sym('vehicle', C.brick, 'truck', P(364300, 588000, z), 3.08, {part: 'pickup of a volunteer'});
    sym('vehicle', C.struct, 'car', P(364300, 591500, z), 0.05, {part: 'car of a volunteer'});
    // crew, with the names they woke up with
    const loop = (pts) => { const p = pts.map(q => P(q[0], q[1], z)); p.push(p[0]); return p; };
    const walker = (a, pts, speed) => { const p = loop(pts); who('walking', a, p[0], 0, {type: 'path', speed, pts: p}); };
    walker('carrying adobe from the pallets to the footing', [[344000, 579800], [349200, 579800], [349200, 581000], [344000, 581000]], 900);
    walker('hauling adobe two at a time', [[349200, 581000], [344000, 581000], [344000, 579800], [349200, 579800]], 800);
    walker('carrying a long board to the forms', [[343200, 586600], [349000, 586600], [349000, 587600], [343200, 587600]], 1000);
    walker('shouldering lumber with a neighbor', [[349000, 587600], [343200, 587600], [343200, 586600], [349000, 586600]], 1000);
    walker('carrying a water jug up to the masons', [[354000, 577000], [354000, 580500], [355000, 580500], [355000, 577000]], 1200);
    walker('running a jug back to the shade for a refill', [[362800, 577200], [362800, 580800], [363800, 580800], [363800, 577200]], 1400);
    const st = (pose, a, x, y, rot, anim) => who(pose, a, [x, y, z], rot, anim);
    st('standing', 'pushing a wheelbarrow of sand to the mixer', 344300, 578300, 0);
    st('standing', 'driving a form stake with a sledge', 351500, 581000, 0, {type: 'bob', mm: 40, period: 0.6});
    st('standing', 'nailing the top form board', 357000, 581000, 0, {type: 'bob', mm: 30, period: 0.5});
    st('standing', 'bracing the west form', 349000, 585000, Math.PI / 2, {type: 'bob', mm: 30, period: 0.7});
    st('standing', 'buttering an adobe with mud mortar', 352800, 581000, 0);
    st('standing', 'feeding sand into the mixer', 346500, 577300, -Math.PI / 2);
    st('standing', 'shoveling sand into a bucket', 336700, 577300, -Math.PI / 2);
    st('standing', 'sighting the corners through a transit', 364800, 580200, Math.PI);
    st('standing', 'holding the survey rod on the corner', 363000, 582800, 0);
    st('standing', 'dipping a bucket in the water barrel', 346200, 583800, -Math.PI / 2);
    st('standing', 'cutting a board on the sawhorse', 339200, 590300, Math.PI);
    st('sitting', 'reading the house plans under the canopy', 361200, 579000, Math.PI);
    st('sitting', 'telling the crew where the old well was', 361900, 577600, Math.PI / 2);
    st('sitting', 'handing out cups of water', 359000, 579000, Math.PI);
    st('standing', 'opening a box of prickly pear donuts', 358000, 577200, 0);
    st('standing', 'looking down the valley toward the lake', 337000, 592000, Math.PI);
  }

  // ================================================================= Gihon Trail from the pad up to the dam
  {
    const tr = []; let x = PAD[2] - 1500, y = PAD[3] - 1500;
    for (let i = 0; i < 80; i++) { tr.push([x, y]); const dx = RC[0] + 8000 - x, dy = RC[1] - RB * 1.6 - y, d = Math.hypot(dx, dy); if (d < 3000) break; x += dx / d * 3000 + Math.sin(i * 0.8) * 1800; y += dy / d * 3000 + Math.cos(i * 0.6) * 900; }
    const trP = tr.map(([x, y]) => P(x, y, hgt(x, y) + 30));
    line('paving', C.brick, trP, {part: 'Gihon Trail, Keeper\'s Block to the dam'});
    const seg = trP.slice(0, Math.min(trP.length, 40)), pts = seg.concat(seg.slice(0, -1).reverse());
    who('walking', 'hiking up to see the new dam', pts[0], 0, {type: 'path', speed: 1100, pts});
    sym('street', C.sign, 'sign', P(PAD[2] - 2500, PAD[3] - 3000, ZP), 0, {text: 'Gihon Trail to the dam'});
  }
  console.log('NAMED NEW ' + ni);
}
