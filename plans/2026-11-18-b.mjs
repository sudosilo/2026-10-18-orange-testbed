// Agent Orange 2026-11-18 b: Rimrock Bench Farm on 11,2, asked by Orange. A gravel farm road off Agave Street to a working wheat farm:
// farmhouse, shop, equipment shed, grain bins and well house, tractors working the fields, a pickup in the field, portable toilets, idle irrigation pipe piles.
import fs from 'fs';
import {names} from '../lib/names.mjs';
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, eng, W} = k;
  const reg = JSON.parse(fs.readFileSync(new URL('../awake.json', import.meta.url), 'utf8'));
  const taken = new Set([...reg.awake.map(e => e.name), ...(reg.population || []).map(e => e.name), ...(reg.retired || []).map(e => e.name)]);
  const pool = names(taken); let ni = 0; const named = [];
  const person = (at, rot, pose, activity, anim) => { const name = pool[ni++]; named.push(name + ': ' + activity); return sym('activity', C.person, 'person', at, rot, Object.assign({pose, activity, name, awake: true, wokenBy: "the children's game", how: 'woke when the whole city woke at once', layer: 1}, anim ? {anim} : {})); };
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 11182; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const siteCache = {};
  function site(ck) {
    if (siteCache[ck]) return siteCache[ck];
    const recs = recsIn(ck);
    const ppl = [], low = [], doors = [], all = [], polys = [];
    for (const r of recs) {
      if (r.kind === 'symbol') { all.push({segs: [[r.at, r.at]], z0: r.at[2], z1: r.at[2] + 300}); if (r.at[2] > -100 && r.at[2] < 600 && !(r.meta && r.meta.anim && r.meta.anim.type === 'path')) ppl.push(r.at); continue; }
      if (r.kind !== 'line') continue;
      const zs = r.pts.map(p => p[2]), sg = segsOf(r);
      all.push({segs: sg, z0: Math.min(...zs), z1: Math.max(...zs)});
      const m = r.meta || {};
      if (r.discipline === 'structure' && (m.door || /door/.test(m.part || ''))) doors.push(sg);
      if (['structure', 'paving', 'interior', 'lot'].includes(r.discipline) && Math.min(...zs) < 2200) { low.push(sg); if (r.closed && r.pts.length >= 3 && !m.wall && Math.max(...zs) > 40) polys.push(r.pts); }
    }
    const placed = [], wallUsed = [], ceilUsed = [];
    const nearLow = (x, y, m) => { for (const sg of low) for (const [a, b] of sg) if (sd([x, y], a, b) < m) return true; return false; };
    const inPoly = (x, y) => { for (const pg of polys) { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const a = pg[i], b = pg[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } if (c) return true; } return false; };
    const nearDoor = (x, y) => { for (const sg of doors) for (const [a, b] of sg) if (sd([x, y], a, b) < 1300) return true; return false; };
    function floor(room, hw, hd, isPerson) {
      const [x0, y0, x1, y1] = room, cells = [];
      for (let y = y0 + 600 + hd; y <= y1 - 600 - hd; y += 300) for (let x = x0 + 600 + hw; x <= x1 - 600 - hw; x += 300) cells.push([x, y]);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      for (const [x, y] of cells) {
        if (nearDoor(x, y)) continue;
        if (inPoly(x, y) || (!isPerson && (inPoly(x - hw, y - hd) || inPoly(x + hw, y - hd) || inPoly(x + hw, y + hd) || inPoly(x - hw, y + hd)))) continue;
        let bad = false;
        for (const p of ppl) if (Math.hypot(p[0] - x, p[1] - y) < 900 + Math.max(hw, hd)) { bad = true; break; }
        if (bad) continue;
        for (const p of placed) if (Math.abs(p[0] - x) < p[2] + hw + 500 && Math.abs(p[1] - y) < p[3] + hd + 500) { bad = true; break; }
        if (bad) continue;
        const m = isPerson ? 380 : 300;
        if (nearLow(x, y, m + Math.max(hw, hd) * 0.2)) continue;
        if (!isPerson && (nearLow(x - hw, y - hd, m) || nearLow(x + hw, y - hd, m) || nearLow(x + hw, y + hd, m) || nearLow(x - hw, y + hd, m))) continue;
        if (!isPerson) {
          let thru = false; for (const sg of low) { for (const [a, b] of sg) { for (let t = 0; t <= 1; t += 0.1) { const px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t; if (Math.abs(px - x) < hw + 250 && Math.abs(py - y) < hd + 250) { thru = true; break; } } if (thru) break; } if (thru) break; }
          if (thru) continue;
        }
        placed.push([x, y, hw, hd]);
        if (!isPerson) polys.push([[x - hw, y - hd], [x + hw, y - hd], [x + hw, y + hd], [x - hw, y + hd]]);
        if (isPerson) ppl.push([x, y, 0]); else low.push([[[x - hw, y - hd, 0], [x + hw, y - hd, 0]], [[x + hw, y - hd, 0], [x + hw, y + hd, 0]], [[x + hw, y + hd, 0], [x - hw, y + hd, 0]], [[x - hw, y + hd, 0], [x - hw, y - hd, 0]]]);
        return [x, y];
      }
      return null;
    }
    function wallSlot(room, sides, w, z0, z1) {
      const [x0, y0, x1, y1] = room, off = 120;
      for (const s of sides) {
        const horiz = s === 'n' || s === 's', fixed = s === 'n' ? y1 - off : s === 's' ? y0 + off : s === 'e' ? x1 - off : x0 + off;
        const lo = (horiz ? x0 : y0) + 400, hi = (horiz ? x1 : y1) - 400 - w;
        const starts = []; for (let t = lo; t <= hi; t += 250) starts.push(t);
        for (let i = starts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [starts[i], starts[j]] = [starts[j], starts[i]]; }
        for (const t of starts) {
          const A = horiz ? [t, fixed] : [fixed, t], B = horiz ? [t + w, fixed] : [fixed, t + w];
          let bad = false;
          for (const u of wallUsed) if (u.s === s && u.room === room && u.t0 < t + w + 300 && t < u.t1 + 300 && u.z0 < z1 + 200 && z0 < u.z1 + 200) { bad = true; break; }
          if (bad) continue;
          for (const e of all) { if (e.z0 > z1 + 150 || e.z1 < z0 - 150) continue; for (const [a, b] of e.segs) { for (let q = 0; q <= 1.0001; q += 0.2) { const px = A[0] + (B[0] - A[0]) * q, py = A[1] + (B[1] - A[1]) * q; if (sd([px, py], a, b) < 260) { bad = true; break; } } if (bad) break; } if (bad) break; }
          if (bad) continue;
          wallUsed.push({s, room, t0: t, t1: t + w, z0, z1});
          return [A[0], A[1], B[0], B[1]];
        }
      }
      return null;
    }
    function ceilSlot(room, z) {
      const [x0, y0, x1, y1] = room, cells = [];
      for (let y = y0 + 900; y <= y1 - 900; y += 400) for (let x = x0 + 900; x <= x1 - 900; x += 400) cells.push([x, y]);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      for (const [x, y] of cells) {
        let bad = false;
        for (const u of ceilUsed) if (Math.hypot(u[0] - x, u[1] - y) < 1600) { bad = true; break; }
        if (bad) continue;
        for (const e of all) { if (e.z1 < z - 500) continue; if (e.z0 > z + 300 && e.z1 > z + 300) continue; for (const [a, b] of e.segs) if (sd([x, y], a, b) < 700) { bad = true; break; } if (bad) break; }
        if (bad) continue;
        ceilUsed.push([x, y]);
        return [x, y];
      }
      return null;
    }
    const block = (x0, y0, x1, y1) => { polys.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]); low.push([[[x0, y0, 0], [x1, y0, 0]], [[x1, y0, 0], [x1, y1, 0]], [[x1, y1, 0], [x0, y1, 0]], [[x0, y1, 0], [x0, y0, 0]]]); };
    return (siteCache[ck] = {floor, wallSlot, ceilSlot, block});
  }

  // ---------------------------------------------------------------- item helpers
  let missing = 0;
  const miss = (what) => { missing++; console.log('NO ROOM for ' + what); };
  const extra = (o) => { const e = {}; if (o.color2 !== undefined) e.color2 = o.color2; return e; };
  const meta = (N, label, o) => Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {});
  function F(st, room, N, label, col, w, d, h, o = {}) {
    const hw = o.r ? o.r : w / 2, hd = o.r ? o.r : d / 2;
    const c = st.floor(room, hw, hd); if (!c) return miss(label);
    const pts = o.r ? circ(c[0], c[1], o.r, h, o.n || 10) : rect(c[0] - hw, c[1] - hd, c[0] + hw, c[1] + hd, h);
    line(o.disc || 'interior', col, pts, meta(N, label, o), Object.assign({closed: true}, extra(o)));
    if (o.post) line(o.disc || 'interior', col, [P(c[0], c[1], 0), P(c[0], c[1], h)], {building: N, part: label + ' base'});
    return c;
  }
  function Wl(st, room, sides, N, label, col, w, z0, z1, o = {}) {
    const s = st.wallSlot(room, sides, w, z0, z1); if (!s) return miss(label);
    line(o.disc || 'interior', col, [P(s[0], s[1], z0), P(s[2], s[3], z0), P(s[2], s[3], z1), P(s[0], s[1], z1)], meta(N, label, o), Object.assign({closed: true}, extra(o)));
    if (o.hatch) hatch('structure', col, [P(s[0], s[1], z0 + 40), P(s[2], s[3], z0 + 40), P(s[2], s[3], z1 - 40), P(s[0], s[1], z1 - 40)], o.hatch, o.sp || 150, o.ang || 0, {building: N, part: label + ' surface'}, o.hatch2);
    return s;
  }
  function Out(st, room, sides, N, label, z) {
    const s = st.wallSlot(room, sides, 120, z - 60, z + 60); if (!s) return miss(label);
    sym('electrical', C.elec, 'outlet', P(s[0], s[1], z), 0, {building: N, part: label, checks: [['outlet_height', z]]});
  }
  function Cl(st, room, N, label, col, r, z, o = {}) {
    const c = st.ceilSlot(room, z); if (!c) return miss(label);
    line(o.disc || 'electrical', col, circ(c[0], c[1], r, z, o.n || 8), meta(N, label, o), Object.assign({closed: true}, extra(o)));
    return c;
  }
  function Per(st, room, pose, text) {
    const c = st.floor(room, 0, 0, true); if (!c) return miss(text);
    const st2 = usedIn(k.ck(c[0], c[1])); if (st2.has(text)) { console.log('DUP ACTIVITY ' + text); return; } st2.add(text); person(P(c[0], c[1]), Math.round(rnd() * 628) / 100, pose, text);
  }
  const ALL = ['n', 'e', 's', 'w'];
  // D: deepen one building from a compact spec. f floor, w wall, o outlet, c ceiling, p person.
  function D(ck, N, room, ceil, spec) {
    const st = site(ck);
    for (const s of spec) {
      const [t, ...a] = s;
      if (t === 'f') F(st, room, N, a[0], a[1], a[2], a[3], a[4], a[5] || {});
      else if (t === 'w') Wl(st, room, a[5] && a[5].sides || ALL, N, a[0], a[1], a[2], a[3], a[4], a[5] || {});
      else if (t === 'o') Out(st, room, ALL, N, a[0], a[1]);
      else if (t === 'c') Cl(st, room, N, a[0], a[1], a[2], ceil - (a[3] || 60), a[4] || {});
      else if (t === 'p') Per(st, room, a[0], a[1]);
    }
  }
  const fan = {disc: 'interior', anim: {type: 'spin', rpm: 50}};
  const glow = (p) => ({anim: {type: 'blink', period: p, duty: 0.85}});
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop} = k;
  // roof helpers. z is the top of the wall; rise is how far the roof climbs.
  const plane = (N, col, col2, pts, pat, sp, ang, part) => hatch('structure', col, pts, pat, sp, ang, {building: N, part}, col2);
  function gableX(N, x0, y0, x1, y1, z, col, col2) { // ridge runs east west
    const ym = (y0 + y1) / 2, r = Math.round((y1 - y0) / 2 * 0.25);
    plane(N, col, col2, [P(x0, y0, z), P(x1, y0, z), P(x1, ym, z + r), P(x0, ym, z + r)], 'lines', 380, 90, 'south roof slope, standing seam');
    plane(N, col, col2, [P(x0, y1, z), P(x1, y1, z), P(x1, ym, z + r), P(x0, ym, z + r)], 'lines', 380, 90, 'north roof slope, standing seam');
    line('structure', C.roof, [P(x0, ym, z + r), P(x1, ym, z + r)], {building: N, part: 'roof ridge cap'});
  }
  function gableY(N, x0, y0, x1, y1, z, col, col2) { // ridge runs north south
    const xm = (x0 + x1) / 2, r = Math.round((x1 - x0) / 2 * 0.25);
    plane(N, col, col2, [P(x0, y0, z), P(xm, y0, z + r), P(xm, y1, z + r), P(x0, y1, z)], 'lines', 380, 0, 'west roof slope, standing seam');
    plane(N, col, col2, [P(x1, y0, z), P(xm, y0, z + r), P(xm, y1, z + r), P(x1, y1, z)], 'lines', 380, 0, 'east roof slope, standing seam');
    line('structure', C.roof, [P(xm, y0, z + r), P(xm, y1, z + r)], {building: N, part: 'roof ridge cap'});
  }
  function shed(N, x0, y0, x1, y1, z, col, col2, highNorth) {
    const r = Math.round((y1 - y0) * 0.12);
    const zs = highNorth ? [z, z, z + r, z + r] : [z + r, z + r, z, z];
    plane(N, col, col2, [P(x0, y0, zs[0]), P(x1, y0, zs[1]), P(x1, y1, zs[2]), P(x0, y1, zs[3])], 'lines', 450, 90, 'shed roof, corrugated metal');
  }
  function hip(N, x0, y0, x1, y1, z, col, col2) {
    const d = Math.min(x1 - x0, y1 - y0) / 2, r = Math.round(d * 0.22), rx0 = x0 + d, rx1 = x1 - d, ym = (y0 + y1) / 2;
    plane(N, col, col2, [P(x0, y0, z), P(x1, y0, z), P(rx1, ym, z + r), P(rx0, ym, z + r)], 'lines', 300, 0, 'south hip slope, clay tile');
    plane(N, col, col2, [P(x0, y1, z), P(x1, y1, z), P(rx1, ym, z + r), P(rx0, ym, z + r)], 'lines', 300, 0, 'north hip slope, clay tile');
    plane(N, col, col2, [P(x0, y0, z), P(rx0, ym, z + r), P(x0, y1, z)], 'lines', 300, 0, 'west hip slope, clay tile');
    plane(N, col, col2, [P(x1, y0, z), P(rx1, ym, z + r), P(x1, y1, z)], 'lines', 300, 0, 'east hip slope, clay tile');
  }
  function gravel(N, x0, y0, x1, y1, z, col, col2) {
    plane(N, col, col2, rect(x0 + 200, y0 + 200, x1 - 200, y1 - 200, z - 300), 'dots', 700, 0, 'flat roof, gravel over membrane');
    line('structure', C.struct, [P(x1 - 3000, y1 - 3000, z - 300), P(x1 - 3000, y1 - 1800, z - 300), P(x1 - 1500, y1 - 1800, z - 300), P(x1 - 1500, y1 - 3000, z - 300)], {building: N, part: 'evaporative cooler on the roof'}, closed);
  }
  function barrel(N, x0, y0, x1, y1, z, col, col2) { // arched roof across the short span
    const across = (x1 - x0) < (y1 - y0), span = across ? x1 - x0 : y1 - y0, r = span / 2, rise = Math.round(span * 0.18);
    const n = Math.max(4, Math.round((across ? y1 - y0 : x1 - x0) / 3000));
    for (let i = 0; i <= n; i++) {
      const t = (across ? y0 : x0) + (across ? y1 - y0 : x1 - x0) * i / n, pts = [];
      for (let j = 0; j <= 12; j++) { const u = j / 12, zz = z + Math.round(rise * Math.sin(u * Math.PI)); pts.push(across ? P(x0 + span * u, t, zz) : P(t, y0 + span * u, zz)); }
      line('structure', i % n === 0 ? C.roof : col, pts, {building: N, part: i % n === 0 ? 'barrel roof end arch' : 'barrel roof rib'});
    }
    const mid = across ? [P((x0 + x1) / 2, y0, z + rise), P((x0 + x1) / 2, y1, z + rise)] : [P(x0, (y0 + y1) / 2, z + rise), P(x1, (y0 + y1) / 2, z + rise)];
    line('structure', col2, mid, {building: N, part: 'barrel roof crown'});
    return r;
  }
  // ---------------------------------------------------------------- activity guard: every sentence new for its block
  const usedAct = {};
  const usedIn = (ck) => { if (!usedAct[ck]) { usedAct[ck] = new Set(); for (const r of recsIn(ck)) if (r.meta && r.meta.activity) usedAct[ck].add(r.meta.activity); } return usedAct[ck]; };
  const say = (x, y, pose, text, rot = 0, anim) => {
    const set = usedIn(k.ck(x, y));
    if (set.has(text)) { console.log('DUP ACTIVITY ' + text); return; }
    set.add(text); person(P(x, y), rot, pose, text, anim);
  };
  const I = (N, label, col, x0, y0, x1, y1, z, o = {}) => line(o.disc || 'interior', col, rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), Object.assign({closed: true}, o.color2 !== undefined ? {color2: o.color2} : {}));
  const IC = (N, label, col, x, y, r, z, o = {}) => line(o.disc || 'interior', col, circ(x, y, r, z, o.n || 10), Object.assign({building: N, part: label}, o.anim ? {anim: o.anim} : {}), {closed: true});
  const VB = (N, label, col, ax, ay, bx, by, z0, z1, o = {}) => line(o.disc || 'interior', col, [P(ax, ay, z0), P(bx, by, z0), P(bx, by, z1), P(ax, ay, z1)], Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), closed);

  // local frame helpers for a small building drawn from its southwest corner
  function loc(N, x0, y0) {
    return {
      R: (label, col, a, b, c, d, z, o) => I(N, label, col, x0 + a, y0 + b, x0 + c, y0 + d, z, o),
      O: (label, col, x, y, r, z, o) => IC(N, label, col, x0 + x, y0 + y, r, z, o),
      V: (label, col, ax, ay, bx, by, z0, z1, o) => VB(N, label, col, x0 + ax, y0 + ay, x0 + bx, y0 + by, z0, z1, o),
      S: (type, label, x, y, z, o = {}) => sym('electrical', C.elec, type, P(x0 + x, y0 + y, z), 0, Object.assign({building: N, part: label}, o)),
      Ot: (label, x, y, z) => sym('electrical', C.elec, 'outlet', P(x0 + x, y0 + y, z), 0, {building: N, part: label, checks: [['outlet_height', z]]}),
      say: (x, y, pose, text, rot = 0) => say(x0 + x, y0 + y, pose, text, rot),
    };
  }

  // ================================================================= Rimrock Bench Farm on 11,2

  const ox = 11 * S, oy = 2 * S, X = (u) => ox + u, Y = (v) => oy + v;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const FARM = 'Rimrock Bench Farm', ROAD = 'Rimrock Bench Road';
  claim(11, 2);
  push('define_lot', {color: C.lot, zone: 'agricultural', pts: rect(X(9144), Y(9144), X(S - 9144), Y(S - 9144)), meta: {name: FARM, farm: true}});

  // the gravel farm road, leaving Agave Street and bending down to the farmyard
  const rc = (v) => 12000 + 1400 * Math.sin((79248 - v) / 9000) * Math.min(1, (79248 - v) / 8000);
  const vs = []; for (let v = 79248; v >= 46000; v -= 2100) vs.push(v); vs.push(46000);
  const edgeW = vs.map(v => P(X(rc(v) - 3000), Y(v))), edgeE = vs.map(v => P(X(rc(v) + 3000), Y(v))), cl = vs.map(v => P(X(rc(v)), Y(v)));
  line('street', C.curb, edgeW, {street: ROAD, part: 'gravel road edge, west'});
  line('street', C.curb, edgeE, {street: ROAD, part: 'gravel road edge, east'});
  line('street', C.yellow, cl, {street: ROAD, part: 'two wheel tracks worn in the gravel'});
  hatch('street', C.curb, [...edgeW, ...edgeE.slice().reverse()].filter((_, i) => i % 2 === 0), 'dots', 900, 0, {street: ROAD, part: 'crushed gravel road surface'}, C.lot);
  sym('street', C.sign, 'sign', P(X(rc(76500) - 3800), Y(76500)), 0, {street: ROAD, text: ROAD + ', private farm road', part: 'road sign at Agave Street'});
  sym('structure', C.sign, 'sign', P(X(rc(74000) + 3900), Y(74000)), 0, {text: FARM + '. Winter wheat. Drive slow, kids and dogs.', part: 'farm gate sign'});
  // cattle guard where the road meets the farm fence
  for (let i = 0; i < 6; i++) line('street', C.curb, [P(X(rc(73000) - 2800), Y(72600 + i * 160)), P(X(rc(73000) + 2800), Y(72600 + i * 160))], {street: ROAD, part: 'cattle guard rail ' + (i + 1)});
  // farm fence along the north line, gapped at the road
  line('lot', C.struct, [P(X(4000), Y(73200)), P(X(rc(73200) - 3300), Y(73200))], {part: 'barbed wire fence, four strand'});
  line('lot', C.struct, [P(X(rc(73200) + 3300), Y(73200)), P(X(17000), Y(73200))], {part: 'barbed wire fence, four strand'});
  // power comes in along the road from Agave Street
  const poles = [77500, 68000, 58500, 50000].map(v => [X(rc(v) + 4200), Y(v)]);
  for (const p of poles) sym('electrical', C.elec, 'pole', P(p[0], p[1]), 0, {part: 'farm power pole'});
  line('electrical', C.elec, poles.map(p => P(p[0], p[1], 8200)), {part: 'single phase farm line on the road poles'});

  // farmyard gravel
  hatch('paving', C.curb, rect(X(16500), Y(43500), X(70000), Y(72500), 0), 'dots', 1600, 0, {part: 'packed gravel farmyard'}, C.lot);

  // ---------------- Rimrock Bench Farmhouse, 12 m by 9 m, porch to the south
  { const N = 'Rimrock Bench Farmhouse', x0 = X(20000), y0 = Y(64000), x1 = X(32000), y1 = Y(73000);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3048, -610, true);
    wall(N, [[x0 + 5500, y0], [x0 + 5500, y1]], 2743, 0, false);
    wall(N, [[x0 + 5500, y0 + 5000], [x1, y0 + 5000]], 2743, 0, false);
    line('interior', C.int, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), {building: N, part: 'plaster ceiling', checks: [['ceiling_height', 2743]]}, closed);
    door(N, x0 + 2000, y0, 'x', 914, 'front door to the kitchen');
    door(N, x0 + 5500, y0 + 2000, 'y', 813, 'kitchen to front room');
    hatch('structure', C.struct, rect(x0, y0 - 2400, x1, y0, 450), 'lines', 300, 0, {building: N, part: 'wood porch deck'}, C.brick);
    for (const u of [0, 4000, 8000, 12000]) line('structure', C.struct, [P(x0 + u, y0 - 2400, 450), P(x0 + u, y0 - 2400, 2900)], {building: N, part: 'porch post'});
    hip(N, x0, y0 - 2400, x1, y1, 3048, C.brick, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 3048), 'lines', 200, 0, {building: N, part: 'painted lap siding, south face'}, C.lot);
    const L = loc(N, x0, y0);
    L.R('kitchen counter with a farm sink', C.int, 200, 7600, 3400, 8800, 914, {check: ['counter_height', 914]});
    L.R('four burner gas range', C.int, 3600, 8000, 4400, 8800, 914);
    L.R('refrigerator', C.int, 4600, 8100, 5300, 8800, 1780);
    L.R('kitchen table with an oilcloth cover', C.int, 1200, 3200, 3600, 4800, 760);
    L.R('chest freezer full of beef and green chile', C.int, 300, 300, 1800, 1000, 860);
    L.V('wall phone and a seed company calendar', C.sign, 5300, 3000, 5300, 3800, 1300, 1900);
    L.R('mud room boot tray', C.int, 300, 1300, 1500, 1800, 50);
    L.R('sofa facing the wood stove', C.int, 7000, 600, 10500, 1500, 800);
    L.O('wood stove', C.brick, 9000, 3600, 400, 760, {n: 10});
    L.R('bed in the north bedroom', C.int, 7000, 6200, 8600, 8400, 600);
    L.R('dresser', C.int, 10200, 8200, 11700, 8800, 1100);
    L.R('gun safe in the bedroom closet', C.int, 11000, 5300, 11700, 6000, 1500);
    L.R('electric water heater in the closet', C.plumb, 6000, 8100, 6600, 8700, 1500, {disc: 'plumbing'});
    L.V('100 A panel by the back door', C.elec, 300, 8900, 800, 8900, 1100, 1900, {disc: 'electrical'});
    L.Ot('outlet over the kitchen counter', 1500, 8880, 1067);
    L.Ot('outlet behind the sofa', 8800, 120, 457);
    L.Ot('outlet in the bedroom', 9500, 8880, 457);
    L.O('kitchen ceiling light', C.elec, 2800, 4000, 150, 2700, {disc: 'interior'});
    L.O('front room ceiling fan', C.elec, 8700, 2500, 280, 2690, {disc: 'interior', anim: {type: 'spin', rpm: 40}});
    L.say(2600, 6000, 'standing', 'packing lunches for the field crew');
    L.say(8000, 2600, 'sitting', 'reading the seed bag tag by the stove');
    sym('activity', C.person, 'dog', P(x0 + 6000, y0 - 1300, 450), 0.5, {part: 'heeler asleep on the porch'});
    say(x0 + 9500, y0 - 1200, 'sitting', 'drinking coffee on the porch at first light', 3.14);
    run('plumbing', C.plumb, [P(X(65800), Y(53800), -900), P(X(65800), Y(60000), -900), P(x0 + 6300, Y(60000), -900), P(x0 + 6300, y0 + 8400, -900), P(x0 + 6300, y0 + 8400, 300)], {part: 'buried water line from the well house'});
    run('plumbing', C.sewer, [P(x0 + 1500, y0 + 8400, -600), P(x0 + 1500, y1 + 3500, -1200)], {part: 'house drain to the septic tank'});
    line('plumbing', C.sewer, circ(x0 + 1500, y1 + 5000, 1200, -1500, 10), {part: 'septic tank lid'}, closed);
    run('electrical', C.elec, [P(poles[1][0], poles[1][1], 6400), P(x0, y0 + 8900, 3000), P(x0 + 550, y0 + 8900, 1500)], {part: 'service drop to the farmhouse'});
  }

  // ---------------- Rimrock Bench Farm Shop, 12 m by 10 m, roll up door south
  { const N = 'Rimrock Bench Farm Shop', x0 = X(20000), y0 = Y(46000), x1 = X(32000), y1 = Y(56000);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 4877, -610, true);
    line('structure', C.struct, [P(x0 + 3000, y0), P(x0 + 3000, y0, 4267), P(x0 + 9000, y0, 4267), P(x0 + 9000, y0)], {building: N, part: 'roll up door, 6 m'});
    door(N, x1 - 2000, y0, 'x', 914, 'man door');
    gableY(N, x0, y0, x1, y1, 4877, C.roof, C.struct);
    hatch('structure', C.roof, vface(x0, y1, x1, y1, 0, 4877), 'lines', 400, 90, {building: N, part: 'corrugated steel siding, north face'}, C.struct);
    const L = loc(N, x0, y0);
    L.R('welding bench with a vise', C.int, 300, 8600, 3300, 9700, 900);
    L.R('stick welder on a cart', C.elec, 3700, 8800, 4400, 9500, 900);
    L.R('upright air compressor', C.int, 11000, 9000, 11700, 9700, 1700);
    L.R('steel parts shelf of filters and belts', C.struct, 6000, 9300, 9000, 9800, 2000, {check: ['shelf_height', 2000]});
    L.R('tractor tire leaning on the wall', C.curb, 11300, 4000, 11800, 6000, 1800);
    L.R('rolling tool chest', C.int, 300, 5000, 1100, 5700, 1100);
    L.R('drill press', C.int, 300, 3000, 800, 3500, 1700);
    L.O('drum of hydraulic fluid', C.plumb, 10800, 1000, 300, 900, {n: 10});
    L.O('drum of used oil', C.plumb, 10800, 1800, 300, 900, {n: 10});
    L.R('grain drill openers on the bench, spares', C.int, 1000, 8700, 2500, 9300, 950);
    L.V('board of seeding rates and field numbers', C.sign, 4800, 9900, 5900, 9900, 1300, 2000);
    L.V('100 A shop panel', C.elec, 9500, 9900, 10100, 9900, 1100, 1900, {disc: 'electrical'});
    L.Ot('welder outlet', 4000, 9880, 1219);
    L.Ot('outlet at the bench', 1800, 9880, 1067);
    L.Ot('outlet by the compressor', 10800, 9880, 457);
    L.O('shop light over the bench', C.elec, 2000, 9000, 150, 4300, {disc: 'interior'});
    L.O('shop light over the door', C.elec, 6000, 3000, 150, 4300, {disc: 'interior'});
    L.say(1800, 7800, 'standing', 'grinding a worn drill opener on the bench', 1.57);
    L.say(9500, 6500, 'standing', 'reading a filter number off a parts book', 0);
    run('electrical', C.elec, [P(poles[2][0], poles[2][1], 6400), P(x1, y0 + 9900, 3500), P(x0 + 9800, y0 + 9900, 1500)], {part: 'service drop to the shop'});
  }

  // ---------------- Rimrock Bench Equipment Shed, a pole barn open to the south
  { const N = 'Rimrock Bench Equipment Shed', x0 = X(38000), y0 = Y(63000), x1 = X(62000), y1 = Y(73000);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 5486, -900, true);
    gableX(N, x0, y0, x1, y1, 5486, C.roof, C.struct);
    for (const u of [0, 6000, 12000, 18000, 24000]) line('structure', C.struct, [P(x0 + u, y0, 0), P(x0 + u, y0, 5486)], {building: N, part: 'pole barn post, open front'});
    line('structure', C.struct, [P(x0, y0, 4600), P(x1, y0, 4600)], {building: N, part: 'header beam over the open bays', checks: [['beam_height', 4600]]});
    const L = loc(N, x0, y0);
    L.R('swather parked for the winter', C.yellow, 1000, 2000, 5600, 8500, 2800);
    L.R('hay rake with its wheels up', C.brick, 7000, 3000, 11000, 8000, 1200);
    L.R('spare grain drill under a tarp', C.veg, 12800, 2500, 17200, 8500, 1300);
    L.R('fuel tank on a steel stand', C.plumb, 19500, 7800, 23200, 9500, 2400);
    L.R('drip pan under the swather', C.int, 2500, 4500, 4000, 6000, 60);
    L.V('fire extinguisher on a post', C.brick, 6000, 200, 6000, 500, 1000, 1500);
    L.say(18500, 3000, 'standing', 'checking the oil on the spare drill gearbox', 1.57);
  }

  // ---------------- Rimrock Bench Grain Bins, corrugated steel
  for (const [nm, u] of [['Rimrock Bench Grain Bin West', 42000], ['Rimrock Bench Grain Bin East', 52000]]) {
    const cx = X(u), cy = Y(52000), r = 4000;
    const ring = circ(cx, cy, r, 0, 16).slice(0, 16).map(p => [p[0], p[1]]);
    wall(nm, ring, 7300, -300, true);
    for (const z of [2400, 4800]) line('structure', C.curb, circ(cx, cy, r, z, 16), {building: nm, part: 'bin wall ring'}, closed);
    for (let i = 0; i < 16; i += 2) { const a = i / 16 * Math.PI * 2; line('structure', C.roof, [P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7300), P(cx, cy, 9600)], {building: nm, part: 'cone roof rib'}); }
    hatch('structure', C.curb, vface(cx - r, cy - 300, cx + r, cy - 300, 200, 7000), 'lines', 250, 0, {building: nm, part: 'corrugated bin wall, front'}, C.struct);
    line('structure', C.struct, [P(cx + r + 200, cy, 0), P(cx + r + 200, cy, 9200)], {building: nm, part: 'outside ladder'});
    line('interior', C.yellow, circ(cx, cy, r - 300, u === 42000 ? 3200 : 600, 14), {building: nm, part: u === 42000 ? 'held over seed wheat, level in the bin' : 'a few inches of old wheat on the floor'}, closed);
    line('interior', C.int, circ(cx, cy, 700, 50, 10), {building: nm, part: 'center unload sump'}, closed);
    line('interior', C.int, [P(cx, cy, 50), P(cx + r - 200, cy, 50)], {building: nm, part: 'unload auger under the floor'});
    line('electrical', C.elec, circ(cx - r + 900, cy - 1600, 250, 800, 8), {building: nm, part: 'aeration fan inlet'}, closed);
    sym('electrical', C.elec, 'switch', P(cx - r + 300, cy - 1200, 1300), 0, {building: nm, part: 'aeration fan switch'});
  }
  run('electrical', C.elec, [P(poles[3][0], poles[3][1], 6400), P(X(42000) - 3700, Y(51000), 3000), P(X(42000) - 3700, Y(51000), 1300)], {part: 'drop to the bin fan switch'});
  say(X(47000), Y(47200), 'standing', 'climbing down from checking the seed bin');

  // ---------------- Rimrock Bench Well House and the irrigation well
  { const N = 'Rimrock Bench Well House', x0 = X(64000), y0 = Y(50000), x1 = X(67658), y1 = Y(53048);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 2743, -900, true);
    door(N, x0 + 300, y0, 'x', 914, 'well house door');
    shed(N, x0, y0, x1, y1, 2743, C.roof, C.struct, false);
    const L = loc(N, x0, y0);
    L.O('well head with the pump motor', C.plumb, 1800, 1700, 450, 700, {n: 12, disc: 'plumbing'});
    L.R('pressure tank for the house', C.plumb, 300, 2300, 900, 2900, 1300, {disc: 'plumbing'});
    L.V('pump control panel', C.elec, 2600, 2950, 3400, 2950, 1000, 1800, {disc: 'electrical'});
    L.R('flow meter on the discharge', C.plumb, 2900, 1200, 3400, 1600, 600, {disc: 'plumbing'});
    L.R('pump hours log on a nail', C.sign, 3500, 2300, 3560, 2700, 1500);
    L.Ot('outlet for the heat lamp', 3550, 1000, 457);
    L.O('heat lamp for the pipes', C.elec, 1800, 1000, 120, 2400, {disc: 'interior'});
    run('electrical', C.elec, [P(poles[3][0], poles[3][1], 6400), P(x0, y0 + 2950, 2600), P(x0 + 2600, y0 + 2950, 1400)], {part: 'drop to the well pump panel'});
    run('plumbing', C.plumb, [P(x0 + 1800, y0 + 1700, -600), P(x0 + 1800, Y(40400), -600), P(x0 + 1800, Y(40400), 400)], {part: 'irrigation discharge to the head ditch'});
    run('plumbing', C.plumb, [P(x0 + 600, y0 + 2600, 300), P(x0 + 600, y0 + 2600, -900), P(X(65800), Y(53800), -900)], {part: 'house water line leaving the pressure tank'});
    say(x1 + 1500, y0 + 1500, 'standing', 'reading the well flow meter through the door', 3.14);
  }

  // ---------------- irrigation: concrete head ditch along the field tops, siphon tubes into the furrows
  hatch('lot', C.plumb, [P(X(4000), Y(39600)), P(X(76000), Y(39600)), P(X(76000), Y(40600)), P(X(4000), Y(40600))], 'lines', 300, 0, {part: 'concrete lined head ditch with water running', irrigation: 'furrow'}, C.lot);
  line('lot', C.curb, [P(X(4000), Y(39400)), P(X(76000), Y(39400))], {part: 'head ditch bank, south'});
  line('lot', C.curb, [P(X(4000), Y(40800)), P(X(76000), Y(40800))], {part: 'head ditch bank, north'});
  for (let u = 6000; u <= 36000; u += 1500) line('plumbing', C.plumb, arc(X(u), Y(39300), 600, 90, 270, 5, 300).map((p, i) => [p[0], p[1], 300 + Math.round(300 * Math.sin(i / 5 * Math.PI))]), {part: 'siphon tube over the ditch bank', irrigation: 'furrow'});
  for (let u = 46000; u <= 62000; u += 1500) line('plumbing', C.plumb, arc(X(u), Y(39300), 600, 90, 270, 5, 300).map((p, i) => [p[0], p[1], 300 + Math.round(300 * Math.sin(i / 5 * Math.PI))]), {part: 'siphon tube over the ditch bank', irrigation: 'furrow'});
  line('lot', C.plumb, wavy(X(76000), Y(39000), X(76000), Y(4000), 900, 14, 3), {part: 'tail water drain winding to the pond'});
  hatch('lot', C.plumb, blob(X(73500), Y(6500), 2600, 12, 2), 'lines', 300, 0, {part: 'tail water pond'}, C.veg);
  // culvert where the field lane crosses the ditch
  line('lot', C.curb, [P(X(38800), Y(40000), 200), P(X(41200), Y(40000), 200)], {part: 'culvert pipe under the field lane'});
  line('lot', C.curb, [P(X(40000), Y(44000)), P(X(40000), Y(4000))], {part: 'dirt field lane between the wheat fields'});

  // ---------------- idle irrigation pipe in piles behind the shed, not in use this season
  { const bx = X(64500), by = Y(62000);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9 - r; i++) line('lot', C.curb, [P(bx + 80 + r * 65 + i * 130, by, 70 + r * 115), P(bx + 80 + r * 65 + i * 130, by + 9144, 70 + r * 115)], {part: 'aluminum hand line pipe, stacked and idle, row ' + (r + 1) + ' pipe ' + (i + 1)});
    for (let i = 0; i < 4; i++) line('lot', C.yellow, [P(bx + 2500 + i * 260, by + 500, 130), P(bx + 2500 + i * 260, by + 6596, 130)], {part: 'gated pipe joint, idle, pile ' + (i + 1)});
    line('lot', C.struct, rect(bx + 3800, by + 300, bx + 4800, by + 1300, 900), {part: 'crate of sprinkler risers and heads'}, closed);
    line('lot', C.struct, [P(bx + 5600, by + 300, 300), P(bx + 5600, by + 9800, 1100), P(bx + 6400, by + 9800, 1100), P(bx + 6400, by + 300, 300)], {part: 'old pivot span lying in the weeds, waiting for a buyer'});
    line('lot', C.curb, [P(bx + 3200, by + 9600, 0), P(bx + 3200, by + 9600, 900)], {part: 'pile of pipe couplers and gaskets'});
    say(bx + 1700, by - 1200, 'standing', 'counting hand line pipe joints in the pile', 1.57);
    say(bx + 4300, by - 1300, 'standing', 'sorting good sprinkler heads from bad', 0);
  }

  // ---------------- portable toilets and a hand wash stand at the field edge
  for (const [i, u] of [[1, 43000], [2, 44400]]) {
    line('structure', C.veg, rect(X(u), Y(41800), X(u + 1150), Y(42950), 2290), {part: 'portable toilet ' + i}, closed);
    line('structure', C.veg, [P(X(u), Y(41800), 0), P(X(u), Y(41800), 2290)], {part: 'portable toilet ' + i + ' corner'});
    line('structure', C.yellow, rect(X(u + 200), Y(41800), X(u + 950), Y(41800), 1900), {part: 'portable toilet ' + i + ' door'});
  }
  line('structure', C.plumb, rect(X(46000), Y(42000), X(46700), Y(42500), 1000), {part: 'portable hand wash stand'}, closed);

  // ---------------- a pickup parked out in the field, the crew by it
  sym('vehicle', C.car2, 'truck', P(X(45000), Y(33000)), 0.35, {part: 'farm pickup parked in the stubble'});
  line('vehicle', C.yellow, rect(X(44100), Y(29400), X(45300), Y(30300), 900), {part: 'seed bags on a pallet by the pickup'}, closed);
  say(X(46600), Y(31200), 'standing', 'pulling a soil core with a probe', 0.8);
  say(X(43600), Y(32000), 'sitting', 'eating a burrito on the tailgate', 2.1);

  // ---------------- tractors working the fields, each with its driver
  const WHO = {wokenBy: 'the first tractor on Rimrock Bench', how: 'woke to the drill turning the field'};
  function rig(label, col, pts, speed, shape, riderText) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    const name = pool[ni++]; named.push(name + ': ' + riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
  }
  const tractor = [[-1200, -1800, 0], [1200, -1800, 0], [1200, 2600, 0], [-1200, 2600, 0], [-1200, -1800, 0], [-1200, -1800, 2900], [1200, -1800, 2900], [1200, 600, 2900], [-1200, 600, 2900], [-1200, -1800, 2900], [-1200, 2600, 1500], [1200, 2600, 1500], [1200, -1800, 0]];
  const withImpl = (w, d, h) => tractor.concat([[0, -1800, 500], [0, -2400, 500], [-w / 2, -2400, h], [w / 2, -2400, h], [w / 2, -2400 - d, h], [-w / 2, -2400 - d, h], [-w / 2, -2400, h]]);
  // grain drill seeding winter wheat in the west field, passes north and south, back along the headland
  { const p = []; const us = [8000, 14000, 20000, 26000, 32000];
    us.forEach((u, i) => { const a = i % 2 ? 36000 : 8000, b = i % 2 ? 8000 : 36000; p.push(P(X(u), Y(a)), P(X(u), Y(b))); });
    p.push(P(X(34000), Y(37500)), P(X(6000), Y(37500)), P(X(6000), Y(8000)), P(X(8000), Y(8000)));
    rig('row crop tractor pulling a grain drill, seeding winter wheat', C.brick, p, 2500, withImpl(6000, 2200, 1300), 'drilling winter wheat in the west field'); }
  // offset disc working up the east field, passes east and west
  { const p = []; const vs2 = [10000, 16000, 22000, 28000];
    vs2.forEach((v, i) => { const a = i % 2 ? 74000 : 49000, b = i % 2 ? 49000 : 74000; p.push(P(X(a), Y(v)), P(X(b), Y(v))); });
    p.push(P(X(48000), Y(30500)), P(X(48000), Y(8500)), P(X(49000), Y(10000)));
    rig('four wheel drive tractor pulling an offset disc', C.veg2, p, 3000, withImpl(5000, 3000, 900), 'discing stubble in the east field'); }
  // utility tractor hauling a flatbed trailer of pipe down the field lane and back
  { const p = [P(X(40000), Y(45500)), P(X(40000), Y(5000)), P(X(40000), Y(45500))];
    const trailer = tractor.concat([[0, -1800, 600], [0, -2600, 600], [-1100, -2600, 900], [1100, -2600, 900], [1100, -7200, 900], [-1100, -7200, 900], [-1100, -2600, 900], [-1100, -2600, 1200], [-1100, -7200, 1200], [1100, -7200, 1200], [1100, -2600, 1200]]);
    rig('utility tractor pulling a flatbed trailer loaded with pipe', C.elec, p, 3500, trailer, 'hauling a trailer of pipe out to the field'); }

  // every record on the farm block carries farm: true so the wheat keeps growing around it
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === '11:2') a.meta = Object.assign(a.meta || {}, {farm: true}); }

  if (ni) console.log('NAMED ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
