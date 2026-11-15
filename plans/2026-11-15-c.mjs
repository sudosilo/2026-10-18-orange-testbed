// Agent Orange 2026-11-15 c: deepen the oldest blocks 3,1 and 6,1. New Pecan Hollow Cracking Shed on 3,1 and
// Chinchweed Fire Academy Air Fill Room on 6,1, plus D() items in the pump house, chicken coop and apparatus barn.
import fs from 'fs';
import {names} from '../lib/names.mjs';
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, eng, W} = k;
  const reg = JSON.parse(fs.readFileSync(new URL('../awake.json', import.meta.url), 'utf8'));
  const taken = new Set([...reg.awake.map(e => e.name), ...(reg.population || []).map(e => e.name)]);
  const pool = names(taken); let ni = 0; const named = [];
  const person = (at, rot, pose, activity, anim) => { const name = pool[ni++]; named.push(name + ': ' + activity); return sym('activity', C.person, 'person', at, rot, Object.assign({pose, activity, name, awake: true, wokenBy: "the children's game", how: 'woke when the whole city woke at once', layer: 1}, anim ? {anim} : {})); };
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611141; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 3,1 Pecan Hollow Cracking Shed, south of the equipment barn
  {
    const N = 'Pecan Hollow Cracking Shed', x0 = 285000, x1 = 290486, y0 = 122500, y1 = 126767, H = 3353;
    const {R, O, V, S, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.struct, vface(x0, y1, x1, y1, 0, H), 'lines', 300, 90, {building: N, part: 'corrugated metal siding, north front'}, C.curb);
    hatch('structure', C.brick, vface(x0, y0, x0, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'shell dust drifted at the base, west wall'}, C.yellow);
    hatch('structure', C.yellow, vface(x1, y0, x1, y1, 0, H), 'brick', 400, 0, {building: N, part: 'painted block, east wall'}, C.brick);
    gableX(N, x0, y0, x1, y1, H + 100, C.roof, C.struct);
    door(N, x0 + 1600, y1, 'x', 914, 'cracking shed front door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 3300, y1 + 900), 0, {text: N + ', custom cracking by the pound'});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 3048), 'lines', 600, 0, {building: N, part: 'plywood ceiling under the rafters', checks: [['ceiling_height', 3048]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 450, 0, {building: N, part: 'sealed concrete floor, swept'});
    // cracking line along the north half
    R('pecan cracker with rotating drums', C.struct, 600, 2600, 1600, 3500, 1200);
    O('feed hopper on the cracker', C.yellow, 1100, 3050, 380, 1550, {n: 8});
    R('belt conveyor to the separator', C.curb, 1600, 2900, 3200, 3200, 900);
    R('shell separator with aspirator fan', C.brick, 3200, 2500, 4300, 3600, 1700);
    O('aspirator fan housing', C.struct, 3750, 3050, 260, 1900, {anim: {type: 'spin', rpm: 90}});
    R('chute of clean halves', C.yellow, 4300, 2700, 4700, 3000, 700);
    // picking and sorting
    R('stainless picking table', C.int, 1600, 600, 3800, 1300, 914, {check: ['counter_height', 914]});
    R('tray of halves and pieces on the table', C.yellow, 1800, 700, 2900, 1200, 940);
    R('tray of shell bits picked out', C.brick, 3000, 700, 3600, 1200, 940);
    O('tote of cracked halves', C.car2, 3900, 1900, 350, 800);
    R('pallet of in shell pecan sacks', C.struct, 4500, 300, 5300, 1300, 700);
    R('floor scale platform for sacks', C.curb, 4500, 3700, 5300, 4100, 80);
    R('scale readout on a stand', C.elec, 5000, 3600, 5250, 3700, 1300, {disc: 'electrical'});
    // custom cracking counter by the door
    R('custom cracking counter', C.brick, 700, 300, 1100, 1900, 965, {check: ['counter_height', 965]});
    R('pos terminal on the counter', C.int, 750, 450, 1050, 700, 1250);
    R('receipt printer', C.int, 750, 900, 1050, 1150, 1100);
    R('cash drawer under the counter', C.struct, 720, 1250, 1080, 1650, 800);
    R('card reader on a cord', C.int, 800, 1700, 1000, 1850, 1100);
    R('book of claim tickets for drop off sacks', C.yellow, 780, 1880, 1020, 1900, 980);
    V('price board for cracking per pound', C.sign, 120, 600, 120, 1800, 1600, 2200);
    // plumbing
    R('hand wash sink', C.plumb, 5000, 1600, 5400, 2000, 900, {disc: 'plumbing'});
    O('point of use water heater', C.plumb, 5200, 2500, 220, 1200, {disc: 'plumbing'});
    // power and light
    R('60 A subpanel', C.elec, 5300, 2800, 5420, 3300, 1676, {disc: 'electrical'});
    V('motor disconnect for the cracker', C.elec, 120, 2700, 120, 3000, 1300, 1700, {disc: 'electrical'});
    V('motor disconnect for the aspirator', C.elec, 3400, 4147, 3700, 4147, 1300, 1700, {disc: 'electrical'});
    S('light', 'shop light over the cracker', 1100, 2400, 3000);
    S('light', 'shop light over the picking table', 2700, 950, 3000);
    S('light', 'shop light over the counter', 900, 1100, 3000);
    S('switch', 'switch by the front door', 1300, 4147, 1219);
    Ot('outlet by the counter', 120, 300, 457);
    Ot('outlet at the picking table', 2700, 120, 1067);
    Ot('outlet by the scale', 5366, 3900, 457);
    // services: underground feeder and water from the pump house, sink to a dry well
    run('electrical', C.elec, [P(294200, 139900, 1676), P(294200, 139900, -600), P(294200, 127300, -600), P(290200, 127300, -600), P(290200, 125550, -600), P(290200, 125550, 1676), P(290300, 125550, 1676)], {building: 'Pecan Hollow Pump House', part: 'underground feeder to the cracking shed'});
    run('plumbing', C.plumb, [P(291588, 140150, 300), P(291588, 140150, -900), P(291588, 124300, -900), P(290200, 124300, -900), P(290200, 124300, 300)], {building: 'Pecan Hollow Pump House', part: 'water line from the pressure tank to the cracking shed'});
    run('plumbing', C.sewer, [P(290100, 124000, -300), P(292600, 123200, -700)], {building: N, part: 'sink drain to the dry well'});
    line('plumbing', C.sewer, circ(292600, 123200, 600, -700, 12), {part: 'gravel dry well'}, closed);
    // yard
    line('lot', C.brick, blob(282400, 124200, 1300, 14, 7, 600), {part: 'pile of pecan shells for mulch'}, closed);
    hatch('paving', C.curb, rect(x0 + 1500, y1, x0 + 2700, y1 + 3000), 'dots', 600, 0, {part: 'gravel apron at the cracking shed door'});
    sym('activity', C.car2, 'cart', P(x0 + 4200, y1 + 1500), 0.4, {part: 'hand cart of pecan sacks'});
    sy(350, 1100, 'standing', 'ringing up a custom cracking order', Math.PI / 2);
    sy(1350, 1100, 'standing', 'dropping off a sack of pecans to crack', -Math.PI / 2);
    sy(2700, 1650, 'standing', 'picking shell bits out of the halves', Math.PI);
    sy(1100, 2250, 'standing', 'pouring pecans into the cracker hopper', 0);
    say(x0 - 900, y0 + 1700, 'standing', 'forking spent shells onto the mulch pile', -Math.PI / 2);
  }

  // ================================================================= 6,1 Chinchweed Fire Academy Air Fill Room, between the student lot and the prop yard
  {
    const N = 'Chinchweed Fire Academy Air Fill Room', x0 = 516000, x1 = 519658, y0 = 102600, y1 = 105648, H = 3048;
    const {R, O, V, S, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, H), 'lines', 350, 0, {building: N, part: 'red metal panel siding, south face'}, C.struct);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'soot and dust at the base, east wall'}, C.brick);
    shed(N, x0, y0, x1, y1, H + 100, C.roof, C.struct, false);
    door(N, x0 + 2400, y0, 'x', 914, 'air fill room door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 1200, y0 - 900), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 90, {building: N, part: 'metal liner panel ceiling', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'epoxy floor'});
    R('breathing air compressor skid', C.struct, 200, 1900, 1400, 2800, 1300);
    R('compressor running light', C.elec, 1250, 1950, 1350, 2000, 1310, {disc: 'electrical', anim: {type: 'blink', period: 2.5, duty: 0.8}});
    R('air purification cartridge tower', C.curb, 1450, 2400, 1700, 2650, 1600);
    O('compressor intake fan', C.int, 800, 2350, 200, 1400, {anim: {type: 'spin', rpm: 70}});
    for (let i = 0; i < 4; i++) O('cascade storage cylinder ' + (i + 1), C.yellow, 400 + i * 350, 350, 140, 1700, {n: 10});
    R('cascade manifold with pressure gauges', C.plumb, 300, 520, 1600, 600, 1500);
    R('fill station containment cabinet', C.brick, 2000, 2300, 2900, 2900, 1600);
    R('fill whips and gauges on the cabinet face', C.int, 2100, 2280, 2800, 2300, 1450);
    R('rack of empty and full scba bottles', C.car2, 3100, 1200, 3500, 2800, 1219, {check: ['shelf_height', 1219]});
    V('scba packs on wall hooks', C.struct, 1500, 2928, 1950, 2928, 1200, 1800);
    R('bench for bottle checks', C.int, 150, 600, 650, 1600, 914, {check: ['counter_height', 914]});
    R('air quality test kit', C.curb, 250, 800, 550, 1100, 1000);
    R('bottle hydro test date log', C.yellow, 250, 1250, 550, 1500, 930);
    O('mask sanitizing tub', C.plumb, 2800, 1000, 250, 500);
    R('100 A panel', C.elec, 1700, 120, 2100, 240, 1676, {disc: 'electrical'});
    V('compressor disconnect', C.elec, 300, 2928, 600, 2928, 1500, 1900, {disc: 'electrical'});
    S('light', 'ceiling light over the compressor', 900, 1500, 2743);
    S('light', 'ceiling light over the fill cabinet', 2700, 1500, 2743);
    S('switch', 'switch by the door', 2200, 120, 1219);
    Ot('outlet behind the bench', 120, 1800, 1067);
    Ot('outlet by the bottle rack', 3538, 600, 457);
    Ot('outlet on the north wall', 1100, 2928, 457);
    run('electrical', C.elec, [P(544992, 108392, 6400), P(544992, 108392, 0), P(544992, 108392, -760), P(518500, 108392, -760), P(518500, 102900, -760), P(517900, 102900, -760), P(517900, 102900, 1676)], {part: 'underground service from the academy pole line to the air fill room'});
    hatch('paving', C.curb, rect(x0 + 2300, y0 - 1800, x0 + 3400, y0), 'dots', 600, 0, {part: 'concrete pad at the air fill room door'});
    sy(2450, 1850, 'standing', 'topping off an air bottle in the fill cabinet', 0);
    sy(1000, 950, 'standing', 'reading the cascade pressure gauge', Math.PI);
    sy(1900, 1150, 'standing', 'logging a bottle fill on a clipboard', 0);
    say(x0 + 3800, y0 - 1200, 'standing', 'carrying two full bottles back to the engine', Math.PI);
  }

  // ---- D() items in the older buildings of 3,1 and 6,1
  D('3:1', 'Pecan Hollow Pump House', [290888, 138352, 294546, 141400], 2438, [
    ['f', 'spare submersible pump motor on a pallet', C.struct, 600, 600, 300],
    ['w', 'flow meter totalizer readout', C.elec, 300, 1300, 1600, {disc: 'electrical'}],
    ['o', 'outlet for the chlorine injector', 457],
    ['c', 'pump house ceiling light', C.int, 140, 0, {disc: 'interior'}],
    ['p', 'standing', 'writing the flow totalizer number in the log'],
  ]);
  D('3:1', 'Pecan Hollow Chicken Coop', [296888, 142352, 300546, 144790], 2438, [
    ['w', 'heat lamp clamped to a stud', C.elec, 250, 1500, 1800, {disc: 'electrical'}],
    ['o', 'outlet for the waterer heater', 457],
    ['p', 'standing', 'checking under a broody hen for eggs'],
  ]);
  D('6:1', 'Chinchweed Fire Academy Apparatus Barn', [520632, 132392, 541968, 146108], 5800, [
    ['f', 'turnout gear extractor washer', C.int, 1000, 1000, 1400],
    ['f', 'pallet of foam concentrate pails', C.yellow, 1200, 1000, 800],
    ['f', 'spare hose rolls on a pallet', C.car2, 1200, 1000, 600],
    ['w', 'ladder rack with roof and extension ladders', C.struct, 4000, 1500, 2400],
    ['w', 'wall board of nozzle types', C.sign, 1200, 1200, 1900],
    ['w', 'gear drying rack', C.int, 1500, 600, 2000],
    ['o', 'outlet for the extractor', 1067],
    ['o', 'outlet for the battery chargers', 1067],
    ['c', 'high bay light over the bay', C.elec, 140, 0],
    ['c', 'high bay light by the back wall', C.elec, 140, 0],
    ['p', 'standing', 'loading wet turnout coats into the extractor'],
    ['p', 'standing', 'checking the date tag on a ladder'],
  ]);

  if (ni) console.log('NAMED ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
