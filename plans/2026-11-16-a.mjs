// Agent Orange 2026-11-16 a: Tecolote Mesa Landfill on 11,3 and 11,4, Zion's first refuse service, asked by Orange.
// Scale house, recycling kiosk, cart depot, truck shop, leachate pump house, a graded active cell with a working face,
// garbage trucks with drivers on closed routes back to the landfill, carts at the curb on 0,0 1,0 1,3, dumpsters on 8,3 8,4 9,4,
// and the first Zion calendar board on 7,2.
import fs from 'fs';
import {names} from '../lib/names.mjs';
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, eng, W} = k;
  const reg = JSON.parse(fs.readFileSync(new URL('../awake.json', import.meta.url), 'utf8'));
  const taken = new Set([...reg.awake.map(e => e.name), ...(reg.population || []).map(e => e.name), ...(reg.retired || []).map(e => e.name)]);
  const pool = names(taken); let ni = 0; const named = [];
  let WHO = {wokenBy: 'the first garbage truck', how: "woke to the city's first garbage"};
  const person = (at, rot, pose, activity, anim, extra) => { const name = pool[ni++]; named.push(name + ': ' + activity); return sym('activity', C.person, 'person', at, rot, Object.assign({pose, activity, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1}, extra || {}, anim ? {anim} : {})); };
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611132; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
    person(P(c[0], c[1]), Math.round(rnd() * 628) / 100, pose, text);
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
  // ---------------------------------------------------------------- shared helpers for the warehouse district
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
  function frame(x0, y0, x1, y1, face) {
    const W = face === 's' || face === 'n' ? x1 - x0 : y1 - y0, Dp = face === 's' || face === 'n' ? y1 - y0 : x1 - x0;
    const m = (u, v) => face === 's' ? [x0 + u, y0 + v] : face === 'n' ? [x1 - u, y1 - v] : face === 'e' ? [x1 - v, y0 + u] : [x0 + v, y1 - u];
    const R = (N, label, col, u0, v0, u1, v1, z, o) => { const p = m(u0, v0), q = m(u1, v1); I(N, label, col, p[0], p[1], q[0], q[1], z, o); };
    const Cc = (N, label, col, u, v, r, z, o) => { const p = m(u, v); IC(N, label, col, p[0], p[1], r, z, o); };
    const V = (N, label, col, u0, v0, u1, v1, z0, z1, o) => { const p = m(u0, v0), q = m(u1, v1); VB(N, label, col, p[0], p[1], q[0], q[1], z0, z1, o); };
    const along = face === 's' || face === 'n' ? 'x' : 'y', across = along === 'x' ? 'y' : 'x';
    return {W, Dp, m, R, Cc, V, along, across, face};
  }
  const dr = (f, N, u, v, dir, w, label, ks = -1) => { const p0 = f.m(u, v), p1 = dir === 'along' ? f.m(u + w, v) : f.m(u, v + w); door(N, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), dir === 'along' ? f.along : f.across, w, label, ks); };
  const nearOn = (paths, x, y) => { let best = null, bd = 1e18; for (const pth of paths) for (let i = 0; i + 1 < pth.length; i++) { const A = pth[i], B = pth[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy || 1; let t = ((x - A[0]) * dx + (y - A[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); const q = [A[0] + dx * t, A[1] + dy * t, A[2] + (B[2] - A[2]) * t], d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = q; } } return best; };
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];
  const roofOf = (N, x0, y0, x1, y1, z, kind, rc, rc2) => {
    if (kind === 'flat') { plane(N, rc, rc2, rect(x0 + 300, y0 + 300, x1 - 300, y1 - 300, z - 250), 'dots', 1500, 0, 'flat roof, white membrane'); const sx = (x1 - x0) / 4, sy = (y1 - y0) / 3; for (let i = 1; i < 4; i += 2) line('structure', C.car2, rect(x0 + sx * i - 600, y0 + sy - 1200, x0 + sx * i + 600, y0 + sy + 1200, z - 200), {building: N, part: 'roof skylight'}, closed); }
    else if (kind === 'gravel') gravel(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'barrel') barrel(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'gableX') gableX(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'gableY') gableY(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'shedN') shed(N, x0, y0, x1, y1, z, rc, rc2, true);
    else if (kind === 'shedS') shed(N, x0, y0, x1, y1, z, rc, rc2, false);
    else if (kind === 'hip') hip(N, x0, y0, x1, y1, z, rc, rc2);
  };

  // A block: claim, street edges, industrial lot, pole line, private mains, hydrants at proper spacing, traffic.
  function block(cx, cy, edges, name, poleList, drives) {
    claim(cx, cy);
    streets(cx, cy, edges);
    const ox = cx * S, oy = cy * S, a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
    lot('industrial', a, ys, b, yn, name);
    const poles = poleList.map(([u, v]) => [a + u, ys + v]);
    for (const [px, py] of poles) sym('electrical', C.struct, 'pole', P(px, py), 0, {part: name + ' pole line'});
    line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 8230)), {part: name + ' primary'});
    line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 6400)), {part: name + ' secondary'});
    const WM = [[ox + 2400, ys + 700, -1219], [b - 500, ys + 700, -1219]], WB = [[a + 600, ys + 700, -1219], [a + 600, yn - 700, -1219], [b - 500, yn - 700, -1219]];
    const SM = [[ox + 3600, ys + 1700, -2134], [b - 500, ys + 1700, -1700]], SB = [[a + 1900, yn - 1900, -1700], [a + 1900, ys + 1700, -2000]];
    line('plumbing', C.plumb, WM.map(p => P(...p)), {part: name + ' water main tied to the street main'});
    line('plumbing', C.plumb, WB.map(p => P(...p)), {part: name + ' water loop'});
    line('plumbing', C.sewer, SM.map(p => P(...p)), {part: name + ' sewer to the street main'});
    line('plumbing', C.sewer, SB.map(p => P(...p)), {part: name + ' sewer west leg'});
    // hydrants: one near each corner and one at mid block on the three faces the street kit does not cover
    const inDrive = (x, y) => drives.some(d => x > d[0] - 2500 && x < d[2] + 2500 && y > d[1] - 2500 && y < d[3] + 2500);
    const hy = [[ox + CURB + 600, oy + CURB + 6400], [ox + S - CURB - 6400, oy + CURB + 600], [ox + S - CURB - 600, oy + S - CURB - 6400], [ox + CURB + 6400, oy + S - CURB - 600], [ox + S / 2 + 1500, oy + CURB + 600], [ox + S - CURB - 600, oy + S / 2 - 1500], [ox + S / 2 - 1500, oy + S - CURB - 600]];
    for (const [hx, hy2] of hy) { if (inDrive(hx, hy2)) continue; sym('street', C.brick, 'hydrant', P(hx, hy2), 0, {part: 'fire hydrant, 6 inch steamer port'}); }
    for (const d of drives) { hatch('paving', C.curb, rect(d[0], d[1], d[2], d[3]), 'dots', 1000, 0, {part: 'truck driveway'}, C.struct); }
    if (false) trafficLoop(cx, cy, true, CARCOL[(cx * 3 + cy) % 10], 'truck', 7600 + cx * 100);
    if (false) trafficLoop(cx, cy, false, CARCOL[(cx + cy * 5) % 10], 'car', 9000);
    return {ox, oy, a, b, ys, yn, X: (u) => a + u, Y: (v) => ys + v, poles, WM, WB, SM, SB,
      nearPole: (x, y) => poles.reduce((p, c) => Math.hypot(c[0] - x, c[1] - y) < Math.hypot(p[0] - x, p[1] - y) ? c : p)};
  }
  function services(B, N, f, pu, pv, wu, wv, su, sv) {
    const p = f.m(pu, pv), pole = B.nearPole(p[0], p[1]), out = f.m(pu, pv < f.Dp / 2 ? -400 : f.Dp + 400);
    run('electrical', C.elec, [P(pole[0], pole[1], 6400), P(out[0], out[1], 4200), P(out[0], out[1], 1676), P(p[0], p[1], 1676)], {building: N, part: 'service drop and meter'});
    if (wu !== undefined) { const w = f.m(wu, wv), wm = nearOn([B.WM, B.WB], w[0], w[1]); run('plumbing', C.plumb, [P(wm[0], wm[1], -1219), P(w[0], w[1], -900), P(w[0], w[1], 300)], {building: N, part: 'domestic water service'}); }
    if (su !== undefined) { const s = f.m(su, sv), sm = nearOn([B.SM, B.SB], s[0], s[1]); run('plumbing', C.sewer, [P(s[0], s[1], -300), P(sm[0], sm[1], sm[2] + 300)], {building: N, part: 'building sewer'}); }
  }

  // A warehouse. Front (v = 0) is the dock or door side. Office in the front left corner.
  function wh(B, N, x0, y0, x1, y1, face, o) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R, Cc, V} = f, H = o.H || 9144;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const fa = m(0, 0), fb = m(W, 0), ba = m(0, Dp), bb = m(W, Dp);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 0, H), o.facade || 'lines', o.facade === 'cross' ? 1200 : 3048, o.facade === 'cross' ? 0 : 90, {building: N, part: o.facadePart || 'tilt up concrete panels, front'}, C.struct);
    hatch('structure', C.struct, vface(ba[0], ba[1], bb[0], bb[1], 0, 1200), 'gradient', 300, 0, {building: N, part: 'back wall base shadow'}, C.int);
    const sg = m(o.signU || 3000, -1600); sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    roofOf(N, x0, y0, x1, y1, H + 100, o.roof || 'flat', o.rc, o.rc2);
    const oW = o.office === false ? 0 : (o.oW || 9144), oD = 7315;
    if (oW) {
      wall(N, [m(oW, 0), m(oW, oD), m(0, oD)], 3048, 0, false, C.int);
      wall(N, [m(oW - 2438, oD), m(oW - 2438, oD - 2438), m(oW, oD - 2438)], 3048, 0, false, C.int);
      const c0 = m(150, 150), c1 = m(oW - 150, oD - 150);
      hatch('structure', 7, rect(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), 2743), 'cross', 1219, 0, {building: N, part: 'office ceiling grid', checks: [['ceiling_height', 2743]]});
      dr(f, N, 1500, 0, 'along', 914, 'office front door');
      dr(f, N, oW, 3000, 'across', 914, 'door to the warehouse floor', 1);
      dr(f, N, oW - 2438, oD - 2100, 'across', 864, 'office restroom door');
      R(N, o.counter || 'will call counter', C.brick, 600, 2400, 4200, 2900, 1067, {check: ['counter_height', 1067]});
      R(N, 'pos terminal at the counter', C.int, 1400, 2500, 1700, 2800, 1350);
      R(N, 'receipt printer', C.int, 2100, 2550, 2400, 2800, 1100);
      R(N, 'card reader on a swivel', C.int, 3000, 2420, 3200, 2620, 1150);
      R(N, 'shipping label printer', C.int, 3500, 3100, 3850, 3450, 1100);
      R(N, 'office desk', C.int, 4600, 4700, 6200, 5500, 760);
      R(N, 'filing cabinet', C.struct, 4600, 6700, 5200, 7165, 1320);
      V(N, o.wallItem || 'wall map of delivery routes', C.sign, 150, 4000, 150, 6000, 1000, 2000);
      f.Cc(N, 'water closet', C.int, oW - 600, oD - 500, 260, 432, {n: 8});
      R(N, 'wall hung lavatory', C.int, oW - 2200, oD - 600, oW - 1600, oD - 150, 864, {check: ['counter_height', 864]});
      R(N, 'main switchboard', C.elec, 200, oD - 1600, 600, oD - 400, 1830, {disc: 'electrical'});
      for (const [u, v] of [[150, 3200], [oW - 2600, 150]]) { const p = m(u, v); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {building: N, part: 'office outlet', checks: [['outlet_height', 457]]}); }
      for (const [u, v] of [[2300, 4500], [6000, 2500]]) { const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], 2743), 0, {building: N, part: 'office troffer light'}); }
      services(B, N, f, 400, oD - 1000, oW - 1000, oD - 600, oW - 600, oD - 900);
    } else services(B, N, f, 400, Dp - 1000);
    // dock doors
    const docks = o.docks || 0, du0 = oW + 3000, trucks = [];
    for (let i = 0; i < docks; i++) {
      const u = du0 + i * 4267; if (u + 2743 > W - 1500) break;
      const p = m(u, 0), q = m(u + 2743, 0);
      line('structure', C.struct, [P(p[0], p[1], 1219), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1], 1219)], {building: N, part: 'dock door ' + (i + 1)});
      R(N, 'dock leveler ' + (i + 1), C.yellow, u + 300, 150, u + 2443, 2438, 1219);
      if (i % 3 !== 1) trucks.push(u + 1371);
    }
    hatch('paving', C.curb, (() => { const p = m(du0 - 1000, 0), q = m(Math.min(W - 1000, du0 + docks * 4267), -4500); return rect(Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1]), -1219); })(), 'lines', 600, 0, {building: N, part: 'depressed dock apron'}, C.struct);
    for (const u of trucks.slice(0, o.maxTrucks === undefined ? 4 : o.maxTrucks)) {
      const t0 = m(u - 1295, -400), t1 = m(u + 1295, -15000);
      line('vehicle', CARCOL[Math.floor(r2() * 10)], rect(Math.min(t0[0], t1[0]), Math.min(t0[1], t1[1]), Math.max(t0[0], t1[0]), Math.max(t0[1], t1[1]), 4100), {part: o.trailer || 'van trailer backed to the dock'}, closed);
      const c = m(u, -17500); const ang = {s: 0, n: Math.PI, e: -Math.PI / 2, w: Math.PI / 2}[face];
      sym('vehicle', CARCOL[Math.floor(r2() * 10)], 'truck', P(c[0], c[1]), ang, {part: 'tractor hooked to the trailer'});
    }
    // big drive in doors
    (o.rollups || []).forEach((u, i) => { const p = m(u, 0), q = m(u + 3658, 0); line('structure', C.struct, [P(p[0], p[1]), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1])], {building: N, part: 'drive in roll up door ' + (i + 1)}); });
    // storage
    const uS = oW ? oW + 2500 : 2000, vS = o.stage || 11000, goods = o.goods || ['boxed goods'];
    let gi = 0;
    if (o.racks === 'selective') {
      for (let u = uS; u + 2438 < W - 1800; u += 5800) { R(N, 'pallet rack row of ' + goods[gi % goods.length], C.yellow, u, vS, u + 2438, Dp - 1800, o.rackH || 6096); line('interior', C.struct, [P(...m(u + 1219, vS), 1829), P(...m(u + 1219, Dp - 1800), 1829)], {building: N, part: 'first rack beam level, row ' + (gi + 1)}); gi++; }
    } else if (o.racks === 'bulk') {
      for (let v = vS; v + 4000 < Dp - 1500; v += 5600) for (let u = uS; u + 4000 < W - 1500; u += 5600) { R(N, 'stack of ' + goods[gi % goods.length], C.veg2, u, v, u + 4000, v + 4000, o.stackH || 3658); gi++; }
    } else if (o.racks === 'cantilever') {
      for (let v = vS; v + 1500 < Dp - 1500; v += 4800) { R(N, 'cantilever rack of ' + goods[gi % goods.length], C.brick, uS, v, W - 2000, v + 1500, 4267); gi++; }
    }
    (o.items || []).forEach(it => { if (it[0] === 'c') Cc(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7]); else if (it[0] === 'v') V(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9]); else R(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8]); });
    // fire sprinklers, lights, fans, charging
    const sm0 = m(oW + 1000, Dp / 2), sm1 = m(W - 1000, Dp / 2);
    line('plumbing', C.brick, [P(sm0[0], sm0[1], H - 600), P(sm1[0], sm1[1], H - 600)], {building: N, part: 'fire sprinkler cross main'});
    for (let u = oW + 4000; u < W - 2000; u += Math.max(6000, (W - oW) / 4)) line('plumbing', C.brick, [P(...m(u, 1500), H - 700), P(...m(u, Dp - 1500), H - 700)], {building: N, part: 'fire sprinkler branch line'});
    const rz = m(W - 900, Dp - 900); IC(N, 'fire sprinkler riser with check valve', C.brick, rz[0], rz[1], 160, 1500, {disc: 'plumbing'});
    const fd = m(W - 900, Dp + 300), wm = nearOn([B.WM, B.WB], fd[0], fd[1]);
    run('plumbing', C.brick, [P(wm[0], wm[1], -1219), P(fd[0], fd[1], -1100), P(rz[0], rz[1], -1100), P(rz[0], rz[1], 300)], {building: N, part: 'fire line to the sprinkler riser'});
    line('plumbing', C.brick, [P(fd[0], fd[1], 900), P(fd[0], fd[1], 600)], {part: 'fire department connection'});
    for (let v = 4000; v < Dp - 2000; v += 9000) for (let u = oW + 4000; u < W - 2000; u += 9000) { const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], H - 1000), 0, {part: 'high bay light'}); }
    if (!o.noFan) Cc(N, 'big slow ceiling fan', C.int, (oW + W) / 2, Dp / 2, 2400, H - 1400, {n: 12, anim: {type: 'spin', rpm: 18}});
    if (o.charger !== false) R(N, 'forklift battery charging station', C.elec, W - 4200, Dp - 700, W - 2200, Dp - 150, 1500, {disc: 'electrical'});
    { const p = m(W - 150, Dp - 2500); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 1067), 0, {building: N, part: 'outlet by the back wall', checks: [['outlet_height', 1067]]}); }
    // forklift loop in the staging lane
    if (o.forklift !== false) { const v1 = Math.min(4200, vS - 2500), v2 = Math.min(vS - 1200, v1 + 2800), u0 = uS, u1 = W - 2500; const pts = [m(u0, v1), m(u1, v1), m(u1, v2), m(u0, v2), m(u0, v1)].map(p => P(p[0], p[1])); sym('vehicle', C.yellow, 'cart', pts[0], 0, {part: 'propane forklift', anim: {type: 'path', speed: 2200, pts}}); }
    // people: will call customer, clerk, dock, aisles
    const slots = [];
    if (oW) slots.push([2400, 1500], [2400, 3800]);
    slots.push([du0 + 1371, 3400], [uS + 2438 + 1680, vS + 3000], [uS + 2438 + 5800 + 1680, vS + 6000], [W - 3200, Dp - 2600]);
    (o.people || []).forEach((t, i) => { if (!slots[i]) return; const s = t[2] ? [t[2], t[3]] : slots[i]; const p = m(s[0], s[1]); say(p[0], p[1], t[0], t[1], Math.round(r2() * 628) / 100); });
    return f;
  }

  // A small building with a hand written item list.
  function small(B, N, x0, y0, x1, y1, face, o) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R, Cc, V} = f, H = o.H || 3658;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    const fa = m(0, 0), fb = m(W, 0);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 0, H), o.facade || 'lines', 300, o.facade === 'lines' || !o.facade ? 90 : 0, {building: N, part: o.facadePart || 'metal siding, front'}, C.struct);
    roofOf(N, x0, y0, x1, y1, H + 100, o.roof || 'shedN', o.rc, o.rc2);
    dr(f, N, o.doorU || 1000, 0, 'along', 914, 'front door', 1);
    const sg = m((o.doorU || 1000) + 1600, -1200); sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    const cz = o.ceil || 2743;
    if (!o.noCeil) hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, cz), 'lines', 600, 0, {building: N, part: 'ceiling', checks: [['ceiling_height', cz]]});
    const lp = m(W / 2, Dp / 2); sym('electrical', C.elec, 'light', P(lp[0], lp[1], cz), 0, {building: N, part: 'ceiling light'});
    { const p = m(W - 150, Dp / 2); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {building: N, part: 'wall outlet', checks: [['outlet_height', 457]]}); }
    R(N, 'electrical panel', C.elec, 150, Dp - 1300, 400, Dp - 500, 1500, {disc: 'electrical'});
    services(B, N, f, 300, Dp - 900, o.water ? W - 900 : undefined, o.water ? Dp - 600 : undefined, o.water ? W - 600 : undefined, o.water ? Dp - 900 : undefined);
    (o.items || []).forEach(it => { if (it[0] === 'c') Cc(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7]); else if (it[0] === 'v') V(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9]); else R(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8]); });
    (o.people || []).forEach(t => { const p = m(t[2], t[3]); say(p[0], p[1], t[0], t[1], Math.round(r2() * 628) / 100); });
    return f;
  }
  const stallRow = (x0, y0, n, dir, label, first) => { // stalls along x starting at x0, opening north (dir 1) or south (-1)
    const out = [];
    for (let i = 0; i < n; i++) { const sx = x0 + i * 2743, y1 = y0 + 5486; line('paving', C.white, dir > 0 ? [P(sx, y1), P(sx, y0), P(sx + 2743, y0), P(sx + 2743, y1)] : [P(sx, y0), P(sx, y1), P(sx + 2743, y1), P(sx + 2743, y0)], Object.assign({part: label + ' stall ' + (i + 1)}, first && i < 8 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {})); out.push([sx + 1371, y0 + 2743, dir]); }
    for (const [cx, cy, d] of out) { if (r2() > 0.6) continue; const tr = r2() < 0.45; sym('vehicle', CARCOL[Math.floor(r2() * 10)], tr ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 250), cy + Math.round((r2() - 0.5) * 400)), (d > 0 ? Math.PI : 0) + (r2() < 0.3 ? Math.PI : 0) + (r2() - 0.5) * 0.06, {part: tr ? 'work pickup' : 'employee car'}); }
  };
  const court = (x0, y0, x1, y1, label) => hatch('paving', C.curb, rect(x0, y0, x1, y1), 'dots', 1200, 0, {part: label || 'truck court, concrete'}, C.struct);
  const fence = (pts, label) => line('structure', C.struct, pts.map(p => P(p[0], p[1], 1829)), {part: label || 'chain link fence with barbed wire'});
  const trailerAt = (x, y, ang, label) => { const c = Math.cos(ang), s = Math.sin(ang), L = 14630, Wd = 2591; const pts = [[-Wd / 2, 0], [Wd / 2, 0], [Wd / 2, L], [-Wd / 2, L]].map(([px, py]) => P(x + px * c - py * s, y + px * s + py * c, 4100)); line('vehicle', CARCOL[Math.floor(r2() * 10)], pts, {part: label || 'trailer parked in the drop lot'}, closed); };
  let s2 = 113131; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  k.HSTREET[6] = 'Tobosa Street'; k.VSTREET[11] = 'Galleta Avenue';
  // ================================================================= Tecolote Mesa Landfill: Zion's first refuse service
  k.VSTREET[12] = 'Dropseed Avenue';
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const FLEET = 2; // town refuse fleet green
  const SX = (cx) => cx * S;

  // clear ground finder over the live city plus this turn's placements
  const cidx = {};
  function cix(ck) {
    if (cidx[ck]) return cidx[ck];
    const segs = [], syms = [];
    for (const r of recsIn(ck)) {
      if (r.kind === 'symbol') { if (r.at[2] < 2500 && !(r.meta && r.meta.anim && r.meta.anim.type === 'path')) syms.push(r.at); continue; }
      if (r.kind !== 'line' || r.discipline === 'street') continue;
      if (Math.min(...r.pts.map(p => p[2])) > 2500) continue;
      for (const s of segsOf(r)) segs.push(s);
    }
    return (cidx[ck] = {segs, syms, mine: []});
  }
  function clear(x, y, hw, hd, mL = 350, mS = 1000) {
    const I = cix(k.ck(x, y)), rad = Math.hypot(hw, hd);
    for (const p of I.syms) if (Math.hypot(p[0] - x, p[1] - y) < rad + mS) return false;
    for (const q of I.mine) if (Math.abs(q[0] - x) < q[2] + hw + 300 && Math.abs(q[1] - y) < q[3] + hd + 300) return false;
    for (const [a, b] of I.segs) if (sd([x, y], a, b) < rad + mL) return false;
    return true;
  }
  const take = (x, y, hw, hd) => cix(k.ck(x, y)).mine.push([x, y, hw, hd]);
  function findAlong(x, y, dir, hw, hd, span = 9000) { // slide along a curb
    for (let o = 0; o <= span; o += 400) for (const sg of [1, -1]) { const px = dir === 'x' ? x + o * sg : x, py = dir === 'x' ? y : y + o * sg; if (clear(px, py, hw, hd)) return [px, py]; }
    return null;
  }
  function findNear(x, y, hw, hd, R = 9000, mL = 350, mS = 1000) {
    const c = []; for (let dy = -R; dy <= R; dy += 400) for (let dx = -R; dx <= R; dx += 400) c.push([dx, dy]);
    c.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
    for (const [dx, dy] of c) if (clear(x + dx, y + dy, hw, hd, mL, mS)) return [x + dx, y + dy];
    return null;
  }
  // a wireframe box as one polyline that traces all twelve edges
  function wbox(disc, col, x, y, w, d, h, ang, label, z0 = 0) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const q = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * c - b * s, y + a * s + b * c]);
    const B = q.map(p => P(p[0], p[1], z0)), T = q.map(p => P(p[0], p[1], z0 + h));
    line(disc, col, [B[0], B[1], B[2], B[3], B[0], T[0], T[1], B[1], T[1], T[2], B[2], T[2], T[3], B[3], T[3], T[0]], {part: label});
  }
  const bag = (x, y, z, label, sd2) => line('activity', 0, blob(x, y, 280, 7, sd2, z), {part: label || 'black trash bag, tied off'}, closed);
  function newCart(x, y, ang, label) {
    wbox('activity', FLEET, x, y, 600, 700, 1100, ang, label || 'new 96 gallon cart, delivery sticker still on the lid');
    const c = Math.cos(ang), s = Math.sin(ang), q = [[-100, -75], [100, -75], [100, 75], [-100, 75]].map(([a, b]) => P(x + a * c - b * s, y + a * s + b * c, 1105));
    line('activity', C.yellow, q, {part: 'delivery sticker, welcome to refuse service'}, closed);
  }
  function oldDrum(x, y, sd2) {
    const r0 = circ(x, y, 290, 0, 10), r1 = circ(x, y, 290, 880, 10);
    line('activity', C.struct, r0.concat(r1), {part: 'old steel drum used as a trash can, overflowing'});
    line('activity', 0, blob(x, y, 330, 7, sd2, 1050), {part: 'bags heaped over the rim of the drum'}, closed);
  }
  let missing2 = 0;
  const nope = (w) => { missing2++; console.log('NO ROOM for ' + w); };
  // a curb set: one new cart, and on old blocks an overflowing drum and loose bags
  function curbSet(x, y, dir, old, sd2, ppl) {
    const ang = dir === 'x' ? 0 : Math.PI / 2;
    const hw = dir === 'x' ? 300 : 350, hd = dir === 'x' ? 350 : 300;
    const c = findAlong(x, y, dir, hw, hd); if (!c) return nope('cart near ' + x + ',' + y);
    newCart(c[0], c[1], ang); take(c[0], c[1], hw, hd);
    if (!old) return c;
    const step = dir === 'x' ? [1, 0] : [0, 1];
    const d = findAlong(c[0] + step[0] * 1000, c[1] + step[1] * 1000, dir, 300, 300, 3000); if (!d) return nope('drum');
    oldDrum(d[0], d[1], sd2); take(d[0], d[1], 300, 300);
    for (let i = 0; i < old; i++) { const b = findAlong(d[0] + step[0] * (800 + i * 700), d[1] + step[1] * (800 + i * 700), dir, 300, 300, 3000); if (b) { bag(b[0], b[1], 300, 'trash bag left at the curb', sd2 + i); take(b[0], b[1], 300, 300); } }
    return c;
  }
  function dumpster(x, y, ang, sd2) {
    const hw = Math.abs(Math.cos(ang)) > 0.5 ? 915 : 610, hd = Math.abs(Math.cos(ang)) > 0.5 ? 610 : 915;
    const c = findNear(x, y, hw, hd, 6000); if (!c) return nope('dumpster near ' + x + ',' + y);
    wbox('activity', FLEET, c[0], c[1], 1830, 1220, 1300, ang, 'new front load dumpster, already full, delivery sticker on the side');
    for (let i = 0; i < 3; i++) bag(c[0] + (i - 1) * 520 * Math.cos(ang), c[1] + (i - 1) * 520 * Math.sin(ang), 1420 + (i % 2) * 120, 'bag heaped over the dumpster rim', sd2 + i);
    take(c[0], c[1], hw, hd);
    for (let i = 0; i < 2; i++) { const b = findNear(c[0] + 1500, c[1], 300, 300, 2500); if (b) { bag(b[0], b[1], 300, 'bag that did not fit, left beside the dumpster', sd2 + 5 + i); take(b[0], b[1], 300, 300); } }
    return c;
  }
  function personNear(x, y, pose, text, R = 3500) {
    const c = findNear(x, y, 0, 0, R, 380, 700); if (!c) return nope(text);
    take(c[0], c[1], 200, 200); say(c[0], c[1], pose, text, Math.round(r2() * 628) / 100);
  }

  // ---------------------------------------------------------------- the woodland on 11,3 and 11,4 gives way to the landfill
  for (const ck of ['11:3', '11:4']) for (const r of recsIn(ck)) if (r.agent === 'agent-orange' && r.discipline === 'vegetation') push('remove', {id: r.id});

  const ox = SX(11), oy3 = SX(3), oy4 = SX(4);
  const X = (u) => ox + u, Y3 = (v) => oy3 + v, Y4 = (v) => oy4 + v;
  const B3 = block(11, 3, {s: true, e: true, n: true, w: true}, 'Tecolote Mesa Landfill entry and scale yard',
    [[300, 58000], [300, 40000], [300, 20000], [300, 300], [12000, 300], [21000, 300], [40000, 300], [52000, 300], [60660, 300], [60660, 20000], [60660, 40000], [60660, 58000]],
    [[X(34000), Y3(k.CURB), X(47000), Y3(k.PL + 600)], [X(35000), Y3(S - k.PL - 600), X(47000), Y3(S - k.CURB)]]);
  const B4 = block(11, 4, {s: true, e: true, n: true, w: true}, 'Tecolote Mesa Landfill active cell',
    [[300, 2000], [300, 20000], [300, 40000], [300, 60000], [20000, 60500], [40000, 60500]],
    [[X(35000), Y4(k.CURB), X(47000), Y4(k.PL + 600)]]);
  const rc = 9, rc2 = 11;
  const LF = 'Tecolote Mesa Landfill';

  // ---------------------------------------------------------------- 11,3 grounds
  court(X(34000), Y3(9144), X(48000), Y3(70104), 'compacted caliche haul road');
  court(X(11000), Y3(11000), X(32000), Y3(24500), 'concrete pad for the recycling drop off');
  court(X(52000), Y3(29000), X(69500), Y3(40500), 'fleet parking pad');
  fence([[X(34000), Y3(10144)], [X(10144), Y3(10144)], [X(10144), Y3(69104)], [X(35000), Y3(69104)]], 'chain link fence with privacy slats, west yard');
  fence([[X(47000), Y3(69104)], [X(69104), Y3(69104)], [X(69104), Y3(10144)], [X(47000), Y3(10144)]], 'chain link fence with privacy slats, east yard');
  line('structure', C.struct, [P(X(34000), Y3(10400), 0), P(X(34000), Y3(10400), 1829), P(X(22000), Y3(10400), 1829), P(X(22000), Y3(10400), 0)], {part: 'rolling gate, slid open for the day'});
  for (const u of [34000, 47000]) line('structure', C.struct, [P(X(u), Y3(10144), 0), P(X(u), Y3(10144), 2438)], {part: 'gate post'});
  sym('structure', C.sign, 'sign', P(X(31000), Y3(12200)), 0, {text: 'Tecolote Mesa Landfill. First refuse service in Zion, opened by the town.', part: 'painted sign board at the landfill gate'});
  sym('structure', C.sign, 'sign', P(X(49800), Y3(12200)), 0, {text: 'Cover your load. Stop at the scale.'});
  // inbound truck scale on the northbound lane
  hatch('paving', C.struct, rect(X(42000), Y3(15000), X(45048), Y3(36336), 200), 'cross', 600, 0, {part: 'inbound truck scale deck, 70 feet'}, C.curb);
  line('structure', C.yellow, [P(X(41800), Y3(15000), 900), P(X(41800), Y3(36336), 900)], {part: 'scale guard rail, west side'});
  sym('electrical', C.brick, 'light', P(X(45700), Y3(37200), 3000), 0, {part: 'stop and go light for the scale', anim: {type: 'blink', period: 6, duty: 0.6}});
  sym('structure', C.sign, 'sign', P(X(46200), Y3(14200)), 0, {text: 'Scale. Wait for the green light.'});
  small(B3, 'Tecolote Mesa Scale House', X(46000), Y3(22000), X(50267), Y3(27486), 'w', {H: 3353, ceil: 2438, fc: C.brick, rc, rc2, roof: 'hip', doorU: 4450,
    items: [['r', 'scale window counter', C.brick, 600, 150, 4300, 700, 1067, {check: ['counter_height', 1067]}], ['r', 'pos terminal at the scale window', C.int, 1300, 250, 1700, 600, 1350], ['r', 'scale ticket printer', C.int, 2100, 250, 2450, 600, 1100], ['r', 'card reader on a swing arm', C.int, 3000, 200, 3200, 400, 1150], ['r', 'cash drawer under the counter', C.int, 1300, 300, 1800, 650, 900], ['r', 'scale indicator head', C.int, 3500, 250, 4100, 550, 1250], ['v', 'tipping fee board', C.sign, 1000, 4117, 3000, 4117, 1300, 2100], ['r', 'office chair at the window', C.int, 1300, 1000, 2000, 1700, 450], ['r', 'camera monitor for the scale deck', C.int, 3900, 3500, 4600, 3900, 1300], ['r', 'bin of cart delivery tags', C.yellow, 2600, 3300, 3100, 3900, 500], ['r', 'ticket book and spare paper rolls', C.int, 3600, 2200, 4100, 2600, 760], ['c', 'space heater', C.brick, 900, 2600, 200, 400], ['c', 'small trash can by the desk, the first one emptied', C.int, 2300, 2100, 200, 600], ['r', 'two way radio on its charger', C.int, 650, 300, 950, 600, 1150]],
    people: [['sitting', 'ringing up the first load at the scale window', 1650, 1350]]});
  // recycling drop off, before the scale
  const BINS = ['cardboard', 'aluminum cans', 'glass bottles', 'scrap metal', 'green waste'];
  BINS.forEach((nm, i) => {
    const x0 = X(13000 + i * 3800);
    line('structure', [C.brick, C.struct, C.car2, C.curb, C.veg2][i], rect(x0, Y3(13000), x0 + 2438, Y3(19706), 1830), {part: 'roll off bin for ' + nm + ', 20 yards'}, closed);
    hatch('structure', C.struct, vface(x0, Y3(13000), x0 + 2438, Y3(13000), 0, 1830), 'lines', 300, 90, {part: 'ribbed steel side of the ' + nm + ' bin'}, [C.brick, C.struct, C.car2, C.curb, C.veg2][i]);
    if (i < 3) hatch('structure', [C.yellow, C.curb, C.veg][i], rect(x0 + 150, Y3(13150), x0 + 2288, Y3(19556), 1500), 'dots', 450, 0, {part: nm + ' piling up inside the bin'});
    sym('structure', C.sign, 'sign', P(x0 + 1219, Y3(20500)), 0, {text: nm});
  });
  say(X(14700), Y3(21500), 'standing', 'tossing flattened boxes into the cardboard bin', 3.14);
  small(B3, 'Tecolote Mesa Recycling Kiosk', X(13000), Y3(26000), X(16658), Y3(29048), 's', {H: 3048, ceil: 2438, fc: C.veg2, rc, rc2, roof: 'shedN', doorU: 600,
    items: [['r', 'attendant counter by the window', C.brick, 1900, 150, 3400, 600, 1067, {check: ['counter_height', 1067]}], ['r', 'sign in tablet for drop off loads', C.int, 2200, 250, 2450, 500, 1150], ['r', 'platform scale for scrap metal', C.struct, 700, 1000, 1500, 1700, 100], ['r', 'bucket of loose batteries', C.brick, 2900, 2200, 3300, 2600, 400], ['r', 'box of used motor oil jugs', C.yellow, 1900, 2200, 2600, 2700, 450], ['v', 'what goes in which bin chart', C.sign, 1200, 2898, 2400, 2898, 1100, 1900]],
    people: [['standing', 'pointing a pickup toward the cardboard bin', 2600, 1300]]});
  // cart depot: the new carts wait here for delivery
  const dep = small(B3, 'Tecolote Mesa Cart Depot', X(18000), Y3(31000), X(30000), Y3(39000), 's', {H: 4267, ceil: 3353, fc: C.veg, rc, rc2, roof: 'shedN', doorU: 1000,
    items: [['r', 'pallet of spare cart lids', C.veg, 600, 2500, 1800, 3700, 900], ['r', 'cart assembly table', C.struct, 4000, 1600, 6400, 2400, 914, {check: ['counter_height', 914]}], ['r', 'roll of delivery stickers', C.yellow, 5000, 1800, 5300, 2100, 1000], ['r', 'cart tag label printer', C.int, 5800, 1800, 6200, 2150, 1100], ['r', 'box of axles and wheel kits', C.struct, 7200, 1600, 8000, 2400, 600], ['r', 'assembled carts waiting for the delivery truck', C.veg, 8800, 1000, 11300, 2600, 1100], ['r', 'parts shelf of hinge pins and lids', C.yellow, 11100, 3600, 11700, 7000, 1829, {check: ['shelf_height', 1829]}]].concat([0, 1, 2, 3].map(i => ['r', 'stack of nested new 96 gallon carts, row ' + (i + 1), C.veg, 2500 + i * 2200, 4500, 3900 + i * 2200, 7300, 2400])),
    people: [['standing', 'sticking a delivery tag on a new cart lid', 5200, 3000], ['standing', 'snapping wheels onto a new cart', 7600, 3150]]});
  { const p = dep.m(5000, 0), q = dep.m(8658, 0); line('structure', C.struct, [P(p[0], p[1]), P(p[0], p[1], 3048), P(q[0], q[1], 3048), P(q[0], q[1])], {building: 'Tecolote Mesa Cart Depot', part: 'roll up door for the cart truck'}); }
  // truck shop and the new fleet
  const TS = 'Tecolote Mesa Truck Shop';
  const ts = small(B3, TS, X(53000), Y3(42000), X(69000), Y3(58000), 'w', {H: 7315, ceil: 5800, noCeil: true, fc: C.car2, facade: 'lines', rc, rc2, roof: 'gableY', water: true, doorU: 1000,
    items: [['r', 'service pit with a steel grate', C.struct, 4400, 3000, 6200, 13000, -50], ['r', 'oil drain cart', C.int, 6600, 4000, 7200, 4600, 900], ['r', 'column lift 1', C.yellow, 9000, 3500, 9600, 4100, 2400], ['r', 'column lift 2', C.yellow, 13000, 3500, 13600, 4100, 2400], ['r', 'column lift 3', C.yellow, 9000, 12000, 9600, 12600, 2400], ['r', 'column lift 4', C.yellow, 13000, 12000, 13600, 12600, 2400], ['r', 'packer blade on repair stands', C.yellow, 1500, 10000, 3000, 13500, 1100], ['r', 'hydraulic hose crimper on a bench', C.struct, 2200, 14600, 3700, 15600, 914, {check: ['counter_height', 914]}], ['r', 'welding cart with a mig welder', C.struct, 7600, 14200, 8400, 15000, 1100], ['r', 'parts shelf of cart arms and hydraulic seals', C.yellow, 14400, 9000, 15700, 15500, 2134, {check: ['shelf_height', 2134]}], ['r', 'tire cage for 22.5 inch tires', C.yellow, 14400, 1500, 15700, 3500, 1800], ['c', 'air compressor tank', C.plumb, 1000, 6000, 350, 1500], ['r', 'wash sink', C.plumb, 300, 4000, 900, 4600, 864, {check: ['counter_height', 864]}], ['r', 'diagnostic laptop cart', C.int, 8000, 9000, 8600, 9500, 1000], ['r', 'grease reel on the wall', C.brick, 11000, 15700, 11600, 15850, 1600], ['v', 'fleet service board', C.sign, 4000, 15850, 7000, 15850, 1200, 2200], ['r', 'rolling tool chest', C.brick, 4400, 13600, 5400, 14100, 1100], ['r', 'parts washer', C.struct, 5800, 13400, 6800, 14100, 950], ['c', 'bench grinder on a pedestal', C.struct, 9800, 13600, 250, 1000], ['c', 'drum of hydraulic oil', C.yellow, 10600, 13700, 300, 900], ['r', 'battery charger cart', C.elec, 12200, 13400, 12700, 13900, 900], ['r', 'jack stand', C.brick, 14600, 4300, 15000, 4700, 600], ['r', 'jack stand', C.brick, 14600, 5200, 15000, 5600, 600], ['c', 'floor drain', C.plumb, 7700, 8000, 150, 0, {disc: 'plumbing'}], ['v', 'eye wash station', C.plumb, 14600, 150, 15000, 150, 900, 1500], ['v', 'first aid cabinet', C.brick, 150, 7000, 150, 7500, 1300, 1900], ['c', 'fire extinguisher', C.brick, 1100, 15700, 100, 1000]],
    people: [['standing', 'greasing the lift arm on a side loader', 10600, 6000], ['standing', 'reading fault codes on the diagnostic laptop', 8300, 10200]]});
  [[3500, 'bay 1'], [9500, 'bay 2']].forEach(([u, nm]) => { const p = ts.m(u, 0), q = ts.m(u + 3658, 0); line('structure', C.struct, [P(p[0], p[1]), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1])], {building: TS, part: 'roll up door, ' + nm}); });
  for (const u of [2500, 6500, 10500, 14000]) { const p = ts.m(u, 300), q = ts.m(u, 15700); line('structure', C.struct, [P(p[0], p[1], 5182), P(q[0], q[1], 5182)], {building: TS, part: 'steel roof beam', checks: [['beam_height', 5182]]}); }
  for (const [u, v] of [[3000, 4000], [3600, 12000], [12000, 14500]]) { const p = ts.m(u, v); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 1219), 0, {building: TS, part: 'welder outlet on a column', checks: [['outlet_height', 1219]]}); }
  { const p = ts.m(11300, 8000); sym('vehicle', FLEET, 'truck', P(p[0], p[1]), Math.PI / 2, {part: 'side loader up on the column lifts'}); }
  [[56000, 'new side loader garbage truck, delivery sticker on the windshield'], [61000, 'new rear loader garbage truck, delivery sticker on the windshield'], [66000, 'new roll off truck with an empty bin on its rails']].forEach(([u, t]) => sym('vehicle', FLEET, 'truck', P(X(u), Y3(34500)), Math.PI / 2, {part: t}));
  sym('structure', C.sign, 'sign', P(X(53000), Y3(30200)), 0, {text: 'Zion refuse fleet parking'});
  // leachate pond in the northwest yard
  const PC = [X(22000), Y3(56000)];
  line('structure', C.struct, blob(PC[0], PC[1], 7600, 24, 3.1, 600), {part: 'pond berm top'}, closed);
  hatch('structure', C.int, blob(PC[0], PC[1], 7000, 24, 3.1, -1800), 'lines', 900, 30, {part: 'double hdpe liner on the pond floor'}, C.struct);
  hatch('structure', C.sewer, blob(PC[0], PC[1], 6400, 24, 3.1, -900), 'lines', 700, 0, {part: 'leachate in the pond'}, C.plumb);
  line('plumbing', C.plumb, circ(PC[0] + 1500, PC[1] - 800, 600, -850, 8), {part: 'floating aerator', anim: {type: 'spin', rpm: 30}}, closed);
  line('structure', C.struct, blob(PC[0], PC[1], 9000, 24, 3.1, 1829), {part: 'chain link fence around the leachate pond'}, closed);
  sym('structure', C.sign, 'sign', P(PC[0] + 9800, PC[1] - 6000), 0, {text: 'Leachate pond. Keep out.'});
  // garbage trucks: closed right hand routes on the inside lanes, each with a detour through the gate to the tipping area
  const LN = 1700, RR = 3000, k2 = 1 - Math.SQRT1_2;
  function route(verts) {
    const n = verts.length, unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
    const corner = (i) => { const v = verts[i], a = verts[(i - 1 + n) % n], b = verts[(i + 1) % n], d1 = unit(a, v), d2 = unit(v, b);
      const p = [v[0] + (d1[1] + d2[1]) * LN, v[1] + (-d1[0] - d2[0]) * LN];
      return [P(p[0] - d1[0] * RR, p[1] - d1[1] * RR), P(p[0] + (d2[0] - d1[0]) * RR * k2, p[1] + (d2[1] - d1[1]) * RR * k2), P(p[0] + d2[0] * RR, p[1] + d2[1] * RR)]; };
    const A = P(X(43500), oy3 + LN), out = [A, P(X(43500), Y4(13000)), P(X(38000), Y4(13000)), P(X(38000), oy3 + LN)];
    for (let i = 1; i < n; i++) out.push(...corner(i));
    out.push(...corner(0)); out.push(A);
    return out;
  }
  function mover(type, col, pts, speed, part, riderText) {
    const id = nextIdNow();
    sym('vehicle', col, type, pts[0], 0, {part, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    person(dp[0], 0, 'walking', riderText, {type: 'path', speed, pts: dp}, {driving: id});
  }
  const R1 = route([[SX(12), SX(3)], [SX(2), SX(3)], [SX(2), 0], [0, 0], [0, SX(4)], [SX(12), SX(4)]]);
  const R2 = route([[SX(12), SX(3)], [SX(8), SX(3)], [SX(8), SX(4)], [SX(12), SX(4)]]);
  WHO = {wokenBy: 'the first garbage truck', how: "woke to the city's first garbage"};
  mover('truck', FLEET, R1, 11000, 'rear loader garbage truck on the west side housing route', 'driving the first garbage route through the west side');
  mover('truck', FLEET, R2, 9000, 'side loader garbage truck on the Chuparosa Street commercial route', 'driving the side loader past the shop dumpsters');
  personNear(X(40000), Y3(12500), 'standing', 'handing out new cart stickers at the gate', 2500);

  // ---------------------------------------------------------------- 11,4 active cell
  const CX0 = X(12000), CX1 = X(68000), CY0 = Y4(16000), CY1 = Y4(67000), SL = 0.375, ZT = 6000;
  const hgt = (x, y) => { const d = Math.min(x - CX0, CX1 - x, y - CY0, CY1 - y); return d <= 0 ? 0 : Math.round(Math.min(ZT, d * SL)); };
  court(X(11000), Y4(10600), X(69000), Y4(15600), 'tipping apron, compacted soil');
  fence([[X(35000), Y4(10144)], [X(10144), Y4(10144)], [X(10144), Y4(69104)], [X(69104), Y4(69104)], [X(69104), Y4(10144)], [X(47000), Y4(10144)]], 'chain link perimeter fence around the active cell');
  sym('structure', C.sign, 'sign', P(X(48800), Y4(11800)), 0, {text: 'Active cell. Trucks tip at the toe.'});
  for (let z = 0; z <= ZT; z += 750) {
    const d = z / SL, rr = Math.max(600, Math.round(3000 - d * 0.15));
    let ring = rounded(CX0 + d, CY0 + d, CX1 - d, CY1 - d, rr, z, 4);
    let mi = 0; ring.forEach((p, i) => { if (p[1] < ring[mi][1]) mi = i; }); ring = ring.slice(mi).concat(ring.slice(0, mi));
    line('lot', z % 1500 === 0 ? C.struct : C.yellow, ring, {part: 'graded contour of the cell, ' + (z / 1000) + ' m', name: LF}, closed);
  }
  const dT = ZT / SL;
  const pl = (col, col2, pts, pat, sp, ang, part) => hatch('structure', col, pts, pat, sp, ang, {part}, col2);
  pl(C.struct, C.veg2, [P(CX0, CY0, 0), P(CX1, CY0, 0), P(CX1 - dT, CY0 + dT, ZT), P(CX0 + dT, CY0 + dT, ZT)], 'lines', 1500, 0, 'south slope, three to one, intermediate cover');
  pl(C.struct, C.veg2, [P(CX0, CY1, 0), P(CX1, CY1, 0), P(CX1 - dT, CY1 - dT, ZT), P(CX0 + dT, CY1 - dT, ZT)], 'lines', 1500, 0, 'north slope, seeded with saltbush');
  pl(C.struct, C.veg2, [P(CX0, CY0, 0), P(CX0 + dT, CY0 + dT, ZT), P(CX0 + dT, CY1 - dT, ZT), P(CX0, CY1, 0)], 'lines', 1500, 90, 'west slope, seeded with saltbush');
  pl(C.struct, C.veg2, [P(CX1, CY0, 0), P(CX1 - dT, CY0 + dT, ZT), P(CX1 - dT, CY1 - dT, ZT), P(CX1, CY1, 0)], 'lines', 1500, 90, 'east slope, intermediate cover');
  pl(C.yellow, C.struct, rect(CX0 + dT, CY0 + dT, CX1 - dT, CY1 - dT, ZT + 50), 'dots', 1200, 0, 'top deck, daily cover soil');
  const zf = (v) => Math.round((v - 16000) * SL) + 150;
  pl(C.int, C.brick, [P(X(30000), Y4(17000), zf(17000)), P(X(46000), Y4(17000), zf(17000)), P(X(46000), Y4(29000), zf(29000)), P(X(30000), Y4(29000), zf(29000))], 'cross', 400, 20, 'working face, fresh refuse spread in thin lifts');
  for (let i = 0; i < 9; i++) { const u = 31000 + (i * 1777) % 14000, v = 18000 + (i * 3313) % 10000; line('structure', [0, 7, 1, 10][i % 4], blob(X(u), Y4(v), 350 + (i % 3) * 120, 6, i, zf(v) + 120), {part: ['torn trash bag on the face', 'flattened box on the face', 'tangle of baling wire', 'mattress waiting to be buried'][i % 4]}, closed); }
  // fresh load tipped at the toe
  for (const [r, z] of [[1600, 0], [1100, 600], [550, 1100]]) line('structure', 0, blob(X(31500), Y4(14000), r, 9, 4.2, z), {part: 'load just tipped at the toe, the first in Zion'}, closed);
  // litter fence downwind of the face
  hatch('structure', C.curb, [P(X(30000), Y4(31000), zf(31000)), P(X(47000), Y4(31000), zf(31000)), P(X(47000), Y4(31000), zf(31000) + 4877), P(X(30000), Y4(31000), zf(31000) + 4877)], 'cross', 450, 0, {part: 'portable litter fence above the working face'});
  hatch('structure', C.curb, [P(X(48000), Y4(17000), zf(17000)), P(X(48000), Y4(30000), zf(30000)), P(X(48000), Y4(30000), zf(30000) + 4877), P(X(48000), Y4(17000), zf(17000) + 4877)], 'cross', 450, 0, {part: 'portable litter fence on the east side of the face'});
  for (let i = 0; i < 4; i++) { const v = 18000 + i * 4000; line('structure', 0, blob(X(48000), Y4(v), 250, 6, i + 9, zf(v) + 1200 + i * 400), {part: 'plastic bag caught on the litter fence'}, closed); }
  // methane vents
  for (const [u, v] of [[32000, 36000], [40000, 44000], [48000, 36000], [36000, 49000], [46000, 48000], [20000, 40000], [60000, 40000], [40000, 60000]]) {
    const x = X(u), y = Y4(v), z = hgt(x, y);
    line('plumbing', C.plumb, [P(x, y, z - 1500), P(x, y, z + 1800), P(x + 200, y, z + 2050), P(x + 400, y, z + 1850)], {part: 'passive methane vent with a gooseneck'});
  }
  // daily cover soil stockpiles
  for (const [u, v, z0] of [[55000, 13000, 0], [62000, 13000, 0], [31500, 47500, ZT]]) for (const [r, dz] of [[2100, 0], [1400, 800], [700, 1400]]) line('lot', C.brick, blob(X(u), Y4(v), r, 9, u / 1000, z0 + dz), {part: 'daily cover soil stockpile', name: LF}, closed);
  // leachate pump house and lines
  const PH = 'Tecolote Mesa Leachate Pump House';
  small(B4, PH, X(10800), Y4(11000), X(14458), Y4(14048), 'e', {H: 3048, ceil: 2438, fc: C.struct, rc, rc2, roof: 'shedS', doorU: 600,
    items: [['c', 'wet well access hatch', C.struct, 1500, 1900, 500, 30], ['v', 'duplex pump control panel', C.elec, 800, 3508, 2000, 3508, 1000, 2000, {disc: 'electrical'}], ['r', 'leachate flow meter', C.plumb, 2300, 900, 2700, 1300, 900, {disc: 'plumbing'}], ['r', 'pump alarm light', C.brick, 2400, 3350, 2600, 3500, 2300, {disc: 'electrical', anim: {type: 'blink', period: 2, duty: 0.5}}], ['r', 'sample bottle shelf', C.yellow, 2300, 2700, 2900, 3300, 1219, {check: ['shelf_height', 1219]}], ['r', 'pump log clipboard on a nail', C.int, 2950, 1800, 3000, 2100, 1500]],
    people: [['standing', 'logging leachate flow in the pump book', 1000, 1300]]});
  run('plumbing', C.sewer, [P(X(66000), Y4(16800), -900), P(X(13000), Y4(16800), -1000), P(X(12600), Y4(13500), -1100)], {part: 'perforated leachate collection header along the toe'});
  for (const u of [30000, 50000]) line('plumbing', C.sewer, [P(X(u), Y4(16800), -900), P(X(u), Y4(16800), 300)], {part: 'leachate cleanout riser'});
  run('plumbing', C.sewer, [P(X(12000), Y4(12000), 300), P(X(12000), Y4(12000), -1200), P(X(12000), Y3(70000), -1200), P(X(16500), Y3(61500), -1200), P(X(16500), Y3(61500), 700), P(X(17300), Y3(60700), 400)], {part: 'leachate force main to the pond'});
  // the dozer and the compactor work the face, each with its operator
  function rig(label, u, v0, v1, speed, col, shape, riderText) {
    const pts = [P(X(u), Y4(v0), zf(v0) - 150), P(X(u), Y4(v1), zf(v1) - 150), P(X(u), Y4(v0), zf(v0) - 150)];
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    person(dp[0], 0, 'walking', riderText, {type: 'path', speed, pts: dp}, {driving: id});
  }
  const dz = [[-1500, -2500, 0], [1500, -2500, 0], [1500, 1700, 0], [-1500, 1700, 0], [-1500, -2500, 0], [-1500, -2500, 2400], [1500, -2500, 2400], [1500, 1700, 1600], [-1500, 1700, 1600], [-1500, -2500, 2400], [-1900, 2400, 0], [1900, 2400, 0], [1900, 2400, 1300], [-1900, 2400, 1300], [-1900, 2400, 0]];
  const cp = [[-1300, -3200, 0], [1300, -3200, 0], [1300, 3200, 0], [-1300, 3200, 0], [-1300, -3200, 0], [-1300, -3200, 3000], [1300, -3200, 3000], [1300, 0, 3000], [-1300, 0, 3000], [-1300, 1800, 1500], [-1600, 1800, 0], [1600, 1800, 0], [1600, 3400, 0], [-1600, 3400, 0], [-1600, 1800, 0]];
  rig('track dozer pushing refuse up the working face', 34500, 17500, 28000, 900, C.yellow, dz, 'pushing the first load up the face with the dozer');
  rig('landfill compactor with spiked steel wheels', 41500, 18500, 29500, 1100, C.yellow, cp, 'walking the compactor up and down the face');
  personNear(X(46500), Y4(12600), 'standing', 'waving a garbage truck back to the toe', 2500);
  person(P(X(31000), Y4(30200), zf(30200)), 0, 'walking', 'picking blown paper off the litter fence', {type: 'path', speed: 500, pts: [P(X(31000), Y4(30200), zf(30200)), P(X(46000), Y4(30200), zf(30200)), P(X(31000), Y4(30200), zf(30200))]});
  person(P(X(40800), Y4(44000), hgt(X(40800), Y4(44000))), 1.6, 'standing', 'checking a methane vent with a gas meter');

  // ---------------------------------------------------------------- the first trash piling up across town, and the new carts
  WHO = {wokenBy: 'the first garbage truck', how: "woke to the city's first garbage"};
  // 0,0 bungalows, the oldest houses
  const cb = curbSet(54081, 5036, 'x', 3, 1); if (cb) personNear(cb[0] + 1800, 6800, 'standing', 'squeezing one more bag into the old drum', 3000);
  curbSet(5036, 52000, 'y', 2, 2);
  // 1,0 court houses
  const sb = curbSet(84284, 50000, 'y', 2, 3); if (sb) personNear(sb[0] + 1700, sb[1], 'standing', 'reading the sticker on a brand new trash cart', 3000);
  curbSet(122849, 74212, 'x', 3, 4);
  // 1,3 apartments and cottages
  [93449, 100764, 108079, 115394].forEach((x, i) => curbSet(x, 242780, 'x', i % 2, 5 + i));
  personNear(101500, 244900, 'standing', 'peeling the delivery sticker off a new cart', 3000);
  [92349, 121949, 136749].forEach((x, i) => curbSet(x, 311956, 'x', 0, 9 + i));
  { const t = findAlong(128000, 312573, 'x', 2800, 900, 26000); if (!t) nope('parked rear loader'); else { sym('vehicle', FLEET, 'truck', P(t[0], t[1]), -Math.PI / 2, {part: 'rear loader stopped at the curb for carts'}); take(t[0], t[1], 2800, 900); personNear(t[0] - 4200, 312300, 'standing', 'hopping off the rear loader for the next cart', 2500); } }
  say(108400, 306300, 'walking', 'rolling a new cart down to the curb', 0, {type: 'path', speed: 700, pts: [P(108400, 306300), P(108400, 311100), P(108400, 306300)]});
  newCart(108400, 311956 - 0, 0, 'new 96 gallon cart rolled out to the curb'); take(108400, 311956, 300, 350);
  // dumpsters behind the shops
  const DS = [[644500, 258500, Math.PI / 2, 'stacking flattened boxes by the dumpster'], [668000, 306400, 0], [666000, 248400, 0], [665700, 352800, 0, 'dragging a bag of tortilla trash to the dumpster'], [682500, 352800, 0], [736500, 383500, 0, 'closing the lid on a full dumpster'], [753000, 383500, 0], [780000, 346000, Math.PI / 2], [112500, 26500, Math.PI / 2, 'hauling kitchen trash out the back door'], [35000, 31000, Math.PI / 2]];
  DS.forEach(([x, y, a, t], i) => { const c = dumpster(x, y, a, 20 + i * 3); if (c && t) personNear(c[0] + 2000, c[1], 'standing', t, 3500); });
  { const b = findNear(110600, 27900, 300, 300, 2500); if (b) { bag(b[0], b[1], 300, 'bags piled by the diner back door', 51); take(b[0], b[1], 300, 300); } }
  { const b = findNear(33000, 28400, 300, 300, 2500); if (b) { bag(b[0], b[1], 300, 'bags piled by the market service door', 52); take(b[0], b[1], 300, 300); } }

  // ---------------------------------------------------------------- Zion's calendar board and the farm season
  {
    const now = new Date(), ms = now.getTime(), day = Math.floor(ms / 86400000), tick = Math.floor((ms % 86400000) / 1000);
    const y = now.getUTCFullYear(), orbit = y - 1970, doy = Math.round((Date.UTC(y, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y, 0, 1)) / 86400000);
    const olen = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
    const hect = Math.floor(doy / 100) + 1, hday = doy % 100, hlen = hect < 4 ? 100 : olen - 300;
    const md = doy < 360 ? 'month ' + (Math.floor(doy / 30) + 1) + ', decaday ' + (Math.floor((doy % 30) / 10) + 1) + ', day ' + (doy % 10 + 1) : 'the short decaday, day ' + (doy - 359);
    const blk = Math.floor(tick / 10000), mi = Math.floor((tick % 10000) / 100);
    const time = tick >= 80000 ? 'the short hour, tick ' + (tick - 80000) : 'block ' + blk + ', minute ' + mi;
    const fr = hday / hlen, stage = fr < 0.25 ? 'planting' : fr < 0.6 ? 'growing' : fr < 0.85 ? 'harvest' : 'fallow';
    k.zion = {day, orbit, doy, hect, md, time, stage};
    const text = 'Zion calendar. Day ' + day + ' since the epoch. Orbit ' + orbit + ', hectoday ' + hect + ', ' + md + '. Posted at ' + time + '. Farm season: ' + stage + '.';
    console.log('ZION ' + text);
    sym('structure', C.sign, 'sign', P(610736, 171496), 0, {text, part: 'Zion town clock and calendar board'});
    sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '.', part: 'Pecan Hollow season board'});
    WHO = {wokenBy: "the children's game", how: 'woke when the whole city woke at once'};
    personNear(250744, 90248, 'standing', 'reading the season board before irrigating', 1500);
  }
  console.log('NAMED ' + named.length);
  console.log('MISSING ' + (missing + missing2));
}
