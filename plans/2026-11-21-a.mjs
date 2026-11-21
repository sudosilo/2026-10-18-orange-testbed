// Agent Orange 2026-11-21 a: a kiln shed at Desert Willow Elementary (0,2), a breathing air shed at the Tamarisk Flat training hall (1,2),
// a few new items in the Sidewinder Wash camp store (2,1) and Horned Toad tire bay (3,0), a winter wheat crew on open land 0,5, and new calendar boards.
import {zionWeather} from '../lib/kit.mjs';
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
  let seed = 1121; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= calendar boards, posted fresh by Marisol
  const now = new Date(), ms = now.getTime(), day = Math.floor(ms / 86400000), tick = Math.floor((ms % 86400000) / 1000);
  const yy = now.getUTCFullYear(), orbit = yy - 1970, doy = Math.round((Date.UTC(yy, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(yy, 0, 1)) / 86400000);
  const olen = ((yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0) ? 366 : 365, hect = Math.floor(doy / 100) + 1, hday = doy % 100, hlen = hect < 4 ? 100 : olen - 300;
  const md = doy < 360 ? 'month ' + (Math.floor(doy / 30) + 1) + ', decaday ' + (Math.floor((doy % 30) / 10) + 1) + ', day ' + (doy % 10 + 1) : 'the short decaday, day ' + (doy - 359);
  const time = tick >= 80000 ? 'the short hour, tick ' + (tick - 80000) : 'block ' + Math.floor(tick / 10000) + ', minute ' + Math.floor((tick % 10000) / 100);
  const fr = hday / hlen, stage = fr < 0.25 ? 'planting' : fr < 0.6 ? 'growing' : fr < 0.85 ? 'harvest' : 'fallow';
  const wx = zionWeather(now), sky = wx.rain ? 'Rain falling' : wx.kind === 'clouds' && wx.cover >= 7 ? 'Sky overcast, Zion\'s sun behind the clouds' : wx.kind === 'clouds' ? 'Broken clouds' : 'Sky clear';
  const date = 'Day ' + day + '. Orbit ' + orbit + ', hectoday ' + hect + ', ' + md;
  for (const c of W.chunks.values()) for (const r of c.records) if (!r.hidden && r.agent === 'agent-orange' && r.meta && /Zion town clock and calendar board|Pecan Hollow season board/.test(r.meta.part || '')) push('remove', {id: r.id});
  sym('structure', C.sign, 'sign', P(610736, 171496), 0, {text: 'Zion calendar, kept by Marisol at the lookout. ' + date + '. Posted at ' + time + '. Farm season: ' + stage + '. ' + sky + '.', part: 'Zion town clock and calendar board'});
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover knee high in the alleys, another gray morning, the shaker still parked for winter. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);
  const pp = (t) => ['p', 'standing', t];

  // ================================================================= 0,2 Desert Willow Art Kiln Shed, south of the school by the drop off loop
  {
    const N = 'Desert Willow Art Kiln Shed', x0 = 61000, x1 = 66486, y0 = 173800, y1 = 178067, H = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y1, x1, y1, 0, H), 'dots', 350, 0, {building: N, part: 'sand finish stucco, north front'}, C.curb);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 900), 'gradient', 300, 0, {building: N, part: 'clay dust and splash at the base, south wall'}, C.yellow);
    gableX(N, x0, y0, x1, y1, H + 100, C.veg2, C.roof);
    door(N, x0 + 2400, y1, 'x', 914, 'kiln shed door to the schoolyard', -1);
    sym('structure', C.sign, 'sign', P(x0 + 3900, y1 + 900), 0, {text: N + ', clay and glaze for every grade'});
    sym('electrical', C.elec, 'light', P(x0 + 2000, y1 + 300, 2400), 0, {building: N, part: 'light over the kiln shed door', when: 'night', lit: true});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'painted plywood ceiling', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 450, 0, {building: N, part: 'sealed concrete floor, mopped of clay dust'});
    // the kiln corner, kept clear of the walls
    O('electric top loading kiln, lid closed', C.brick, 900, 900, 420, 760, {n: 8});
    O('kiln stand on firebrick', C.struct, 900, 900, 420, 150, {n: 8});
    R('downdraft kiln vent motor', C.struct, 1450, 250, 1700, 450, 400);
    V('digital kiln controller', C.int, 120, 1500, 120, 1800, 1300, 1600);
    V('50 A kiln disconnect', C.elec, 120, 2000, 120, 2300, 1300, 1800, {disc: 'electrical'});
    V('kiln firing log on a clipboard', C.sign, 120, 2450, 120, 2700, 1400, 1700);
    // clay work
    R('canvas wedging table', C.struct, 2000, 300, 3200, 1000, 900, {check: ['counter_height', 900]});
    R('wire clay cutter on the wedging table', C.curb, 2900, 400, 3100, 500, 920);
    O('bin of recycled clay slop', C.plumb, 3700, 600, 300, 750);
    O('bin of fresh stoneware clay', C.brick, 4400, 600, 300, 750);
    R('pottery wheel by the sink', C.car2, 3650, 2150, 4150, 2650, 450);
    O('wheel head with a ball of clay', C.curb, 3900, 2400, 230, 600, {anim: {type: 'spin', rpm: 90}});
    R('pottery wheel by the kiln', C.car2, 2350, 2150, 2850, 2650, 450);
    O('wheel head, cleaned off', C.curb, 2600, 2400, 230, 600);
    R('clay trap sink', C.plumb, 4850, 1500, 5366, 2300, 900);
    R('clay trap bucket under the sink', C.plumb, 4950, 1700, 5250, 2000, 400, {disc: 'plumbing'});
    R('damp cabinet of wet greenware', C.int, 300, 2900, 900, 3500, 1400);
    R('shelf of bone dry greenware for the next firing', C.struct, 300, 3850, 2200, 4150, 1829, {check: ['shelf_height', 1829]});
    R('shelf of glaze buckets', C.yellow, 3500, 3850, 5100, 4150, 1524, {check: ['shelf_height', 1524]});
    V('board of glaze test tiles', C.sign, 2000, 120, 3000, 120, 1300, 1800);
    V('fire extinguisher by the kiln', C.brick, 1900, 4147, 2100, 4147, 900, 1400);
    // power and light
    V('60 A subpanel', C.elec, 120, 3550, 120, 3800, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the wheels', 3200, 2400, 2743);
    Sy('light', 'ceiling light over the kiln corner', 1300, 1700, 2743);
    Sy('switch', 'switch by the door', 2200, 4147, 1219);
    Ot('outlet for the wheel by the kiln', 120, 3200, 457);
    Ot('outlet for the wheel by the sink', 5366, 3000, 457);
    Ot('outlet by the clay bins', 4000, 120, 457);
    // services: conduit from the school corridor feeder, water from the school service, drain to the sewer lateral
    run('electrical', C.elec, [P(60200, 200496, 2900), P(60200, 200496, -600), P(60200, 177500, -600), P(61200, 177500, -600), P(61200, 177500, 1300)], {part: 'conduit from the school feeder to the kiln shed'});
    run('plumbing', C.plumb, [P(57864, 175700, -1067), P(66000, 175700, -1067), P(66000, 175700, 800)], {part: 'cold water tapped off the school service to the clay trap sink'});
    run('plumbing', C.sewer, [P(65900, 175400, -300), P(58464, 175400, -1413)], {part: 'clay trap sink drain to the school sewer lateral'});
    hatch('paving', C.curb, rect(x0 + 2200, y1, x0 + 3500, y1 + 1800, 0), 'dots', 600, 0, {part: 'concrete stoop at the kiln shed door'});
    sy(1500, 1550, 'standing', 'unloading the overnight glaze firing', 0);
    sy(2600, 1350, 'standing', 'wedging clay for the saturday clay club', 0);
    sy(3900, 1750, 'sitting', 'centering clay on the wheel', 0);
  }

  // ================================================================= 1,2 Tamarisk Flat Breathing Air Shed, north of the training hall
  {
    const N = 'Tamarisk Flat Breathing Air Shed', x0 = 139600, x1 = 145696, y0 = 197700, y1 = 202272, H = 3353;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, H), 'brick', 400, 0, {building: N, part: 'red split face block, south face'}, C.yellow);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'dust at the base, east wall'}, C.brick);
    shed(N, x0, y0, x1, y1, H + 100, C.roof, C.struct, true);
    line('structure', C.int, [P(x1, y0 + 900), P(x1, y0 + 900, 3048), P(x1, y0 + 3400, 3048), P(x1, y0 + 3400)], {building: N, door: 'roll up door to the apron, half open'});
    door(N, x0 + 3800, y0, 'x', 914, 'breathing air shed man door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 1500, y0 - 900), 0, {text: N + ', SCBA cylinders filled and tested'});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 3048), 'lines', 900, 90, {building: N, part: 'metal liner panel ceiling', checks: [['ceiling_height', 3048]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {building: N, part: 'epoxy coated slab'});
    // compressor and storage
    R('breathing air compressor skid', C.brick, 300, 300, 2100, 1200, 1300);
    R('compressor motor and belt guard', C.struct, 400, 400, 1100, 1100, 1500);
    R('air purification tower', C.int, 2250, 300, 2650, 700, 1600);
    V('compressor hour meter and gauge panel', C.int, 120, 1300, 120, 1700, 1300, 1700);
    for (let i = 0; i < 4; i++) O('cascade storage bottle ' + (i + 1), C.yellow, 3050 + i * 520, 550, 220, 1700, {n: 10});
    R('cascade bottle rack frame', C.struct, 2780, 280, 4900, 820, 900);
    R('fragment containment fill station', C.car2, 5000, 300, 5900, 1100, 1700);
    V('fill station pressure panel', C.int, 5000, 1100, 5900, 1100, 1200, 1600);
    // cylinders and testing
    R('rack of filled SCBA cylinders', C.int, 300, 3900, 2600, 4400, 1524, {check: ['shelf_height', 1524]});
    R('rack of empty cylinders tagged for fill', C.brick, 3000, 3900, 4400, 4400, 1219, {check: ['shelf_height', 1219]});
    R('mask flow test bench', C.struct, 5000, 2400, 5900, 3600, 914, {check: ['counter_height', 914]});
    R('flow test head with a facepiece on it', C.curb, 5200, 2700, 5600, 3100, 1150);
    R('air quality sample kit in a case', C.sign, 5100, 3300, 5500, 3550, 1000);
    V('fill log and hydrostatic test dates', C.sign, 5976, 3700, 5976, 4200, 1300, 1800);
    V('100 A panel', C.elec, 5976, 2100, 5976, 2600, 1100, 1900, {disc: 'electrical'});
    Sy('light', 'ceiling light over the compressor', 1300, 1900, 3048);
    Sy('light', 'ceiling light over the cylinder racks', 2800, 3300, 3048);
    Sy('light', 'ceiling light over the fill station', 4800, 1900, 3048);
    Sy('switch', 'switch by the man door', 3500, 120, 1219);
    Ot('outlet for the compressor controls', 120, 2300, 457);
    Ot('outlet by the test bench', 5976, 2900, 1067);
    Ot('outlet under the cylinder rack', 2800, 4452, 457);
    run('electrical', C.elec, [P(152110, 198120, 6400), P(152110, 198120, 0), P(152110, 198120, -760), P(146200, 198120, -760), P(146200, 199950, -760), P(145500, 199950, -760), P(145500, 199950, 1200)], {part: 'underground service from the Saguaro Avenue pole to the breathing air shed'});
    hatch('paving', C.curb, rect(x1, y0 + 700, x1 + 3000, y0 + 3600, 0), 'dots', 600, 0, {part: 'concrete apron at the breathing air shed roll up'});
    sy(5450, 1700, 'standing', 'filling a cylinder in the containment station', Math.PI);
    sy(1200, 1850, 'standing', 'logging compressor hours before the class', Math.PI);
    sy(1500, 3300, 'standing', 'racking filled cylinders by date', 0);
    say(x1 + 1500, y0 + 2100, 'standing', 'carrying two filled bottles to the training engine', 1.57);
  }

  // ---- D() items in small buildings on 2,1 and 3,0
  D('2:1', 'Sidewinder Wash Camp Store', [183000, 114748, 188486, 119320], 2743, [
    ['f', 'stack of firewood bundles', C.brick, 600, 500, 600],
    ['w', 'board of quiet hours and checkout time', C.sign, 900, 1300, 1800],
    ['o', 'outlet by the firewood', 457],
    pp('stamping a site pass for a late arrival')]);
  D('3:0', 'Horned Toad Tire Bay', [249244, 23500, 255340, 28072], 3353, [
    ['f', 'bead seater air tank', C.struct, 400, 400, 900, {r: 200}],
    ['w', 'chart of trailer tire load ranges', C.sign, 1000, 1300, 2000],
    ['o', 'outlet by the bead seater', 457],
    pp('dunking a trailer tire to find a slow leak')]);

  // ================================================================= winter wheat on open land 0,5, west of Siloam Lake
  // Unclaimed wheat land. Open layers only (vegetation, vehicle, activity), every record farm: true.
  const ox = 0 * S, oy = 5 * S, X = (u) => ox + u, Y = (v) => oy + v;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const WHO = {wokenBy: 'the winter wheat crew', how: 'woke to the drone of the spreader under a low gray sky'};
  function rig(label, col, pts, speed, shape, riderText) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    const name = pool[ni++]; named.push(name + ': ' + riderText); usedIn('0:5').add(riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
  }
  const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];
  // a tractor with a twin disc fertilizer spreader topdressing the young wheat, east west passes in the north half
  { const p = [], vs = [44000, 52000, 60000, 68000];
    vs.forEach((v, i) => { const a = i % 2 ? 70000 : 12000, b = i % 2 ? 12000 : 70000; p.push(P(X(a), Y(v)), P(X(b), Y(v))); });
    p.push(P(X(9500), Y(68000)), P(X(9500), Y(44000)), P(X(12000), Y(44000)));
    const spreader = tractor.concat([[0, -1700, 500], [0, -2400, 500], [-1200, -2400, 700], [1200, -2400, 700], [700, -4200, 900], [-700, -4200, 900], [-1200, -2400, 700], [-1200, -2400, 2000], [1200, -2400, 2000], [1200, -4200, 2000], [-1200, -4200, 2000], [-1200, -2400, 2000], [-600, -4400, 600], [600, -4400, 600]]);
    rig('row crop tractor with a twin disc spreader topdressing urea', C.car2, p, 2600, spreader, 'topdressing the young wheat with urea'); }
  // a tractor with a border disc throwing up flood borders in the south half, north south passes
  { const p = [], us = [16000, 30000, 44000, 58000];
    us.forEach((u, i) => { const a = i % 2 ? 36000 : 10000, b = i % 2 ? 10000 : 36000; p.push(P(X(u), Y(a)), P(X(u), Y(b))); });
    p.push(P(X(58000), Y(7600)), P(X(16000), Y(7600)), P(X(16000), Y(10000)));
    const border = tractor.concat([[0, -1700, 400], [0, -2500, 400], [-1800, -2500, 300], [1800, -2500, 300], [1800, -3400, 300], [-1800, -3400, 300], [-1800, -2500, 300], [-1300, -3000, 0], [-1300, -3000, 700], [1300, -3000, 0], [1300, -3000, 700]]);
    rig('utility tractor pulling a border disc', C.brick, p, 1700, border, 'throwing up a flood border with the disc'); }
  // the new borders it has already thrown, low earth levees along the wheat
  [23000, 37000, 51000].forEach((u, i) => line('vegetation', C.brick, wavy(X(u), Y(10500), X(u), Y(36000), 180, 16, i * 1.7), {part: 'fresh flood border levee, ' + (i + 1), species: 'wheat'}));
  // the irrigator on the north headland opening alfalfa valves on the buried pipeline
  for (let i = 0; i < 5; i++) line('vegetation', C.curb, circ(X(14000 + i * 12000), Y(73500), 300, 450, 10), {part: 'alfalfa valve on the buried irrigation pipeline, ' + (i + 1), irrigation: 'pipeline'}, closed);
  line('vegetation', C.plumb, wavy(X(38000), Y(73000), X(38000), Y(70500), 400, 8, 0.6), {part: 'sheet of water spreading from the open valve into the wheat', irrigation: 'flood'});
  say(X(38800), Y(74300), 'standing', 'cranking open an alfalfa valve with a valve key', 4.7);
  line('vehicle', C.yellow, rect(X(41500), Y(74600), X(42700), Y(76600), 1000), {part: 'irrigator four wheeler parked on the headland'}, closed);
  line('vehicle', C.struct, [P(X(41600), Y(76400), 1050), P(X(42600), Y(76400), 1050)], {part: 'shovel strapped across the four wheeler rack'});
  // a pickup with a fertilizer tender trailer parked out in the wheat
  sym('vehicle', C.car2, 'truck', P(X(30000), Y(40000)), 0, {part: 'farm pickup parked out in the wheat'});
  line('vehicle', C.curb, rect(X(29000), Y(33000), X(31000), Y(38000), 900), {part: 'fertilizer tender trailer behind the pickup'}, closed);
  line('vehicle', C.yellow, rect(X(29200), Y(33400), X(30800), Y(37600), 2400), {part: 'urea hopper on the tender'}, closed);
  line('vehicle', C.struct, [P(X(30800), Y(36500), 1500), P(X(33500), Y(36500), 3200)], {part: 'tender conveyor swung out for the spreader'});
  say(X(32200), Y(39400), 'standing', 'reading the spreader rate chart on the tailgate', 3.14);
  say(X(27800), Y(36000), 'standing', 'slitting a tote of urea into the tender', 1.57);
  // two portable toilets on a skid trailer at the east edge
  line('vehicle', C.curb, rect(X(73000), Y(30000), X(75600), Y(32800), 600), {part: 'toilet skid trailer at the field edge'}, closed);
  line('vehicle', C.plumb, rect(X(73100), Y(30100), X(74250), Y(31250), 2890), {part: 'portable toilet on the skid, north'}, closed);
  line('vehicle', C.plumb, rect(X(73100), Y(31500), X(74250), Y(32650), 2890), {part: 'portable toilet on the skid, south'}, closed);
  // idle aluminum mainline pipe stacked on the northeast headland
  for (let i = 0; i < 6; i++) line('vehicle', C.curb, [P(X(56000), Y(76000 + (i % 3) * 230), 120 + Math.floor(i / 3) * 210), P(X(65000), Y(76000 + (i % 3) * 230), 120 + Math.floor(i / 3) * 210)], {part: 'idle 8 inch aluminum mainline pipe, ' + (i + 1)});
  line('vehicle', C.int, rect(X(65300), Y(75800), X(66300), Y(76700), 500), {part: 'crate of mainline couplers and gaskets'}, closed);
  say(X(60000), Y(74900), 'standing', 'counting cracked gaskets in the coupler crate', 1.57);
  say(X(9000), Y(56000), 'standing', 'eyeing the low clouds for a winter storm', 0);

  // every record on 0,5 carries farm: true so the wheat keeps showing
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === '0:5') a.meta = Object.assign(a.meta || {}, {farm: true}); }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
