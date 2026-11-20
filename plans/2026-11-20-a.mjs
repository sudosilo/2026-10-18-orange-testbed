// Agent Orange 2026-11-20 a: a new ice and vending shed at the Pump Jack Motor Court (2,0), a fence supply shed at Hard Pan Feed (1,1),
// deeper nature hut, wash bay and laundry interiors on 0,1, 1,1 and 2,0, a dormant season orchard crew on open land 11,1, and new calendar boards.
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
  let seed = 1120; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover up between the rows under a gray sky, the shaker parked for winter. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);
  const pp = (t) => ['p', 'standing', t];

  // ================================================================= 2,0 Pump Jack Ice and Vending Shed, east end of the motor court lot
  {
    const N = 'Pump Jack Ice and Vending Shed', x0 = 219000, x1 = 223877, y0 = 23000, y1 = 26658, H = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y1, x1, y1, 0, H), 'brick', 400, 0, {building: N, part: 'painted block, north front'}, C.brick);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 900), 'gradient', 300, 0, {building: N, part: 'caliche dust at the base, south wall'}, C.yellow);
    hip(N, x0, y0, x1, y1, H + 100, C.brick, C.roof);
    door(N, x0 + 2000, y1, 'x', 914, 'ice shed front door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 3600, y1 + 900), 0, {text: N + ', ice for guests, snacks and cold drinks'});
    sym('electrical', C.elec, 'light', P(x0 + 1500, y1 + 300, 2400), 0, {building: N, part: 'porch light over the ice shed door', when: 'night', lit: true});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'painted drywall ceiling', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'quarry tile floor, damp by the ice bin'});
    // ice
    R('ice storage bin', C.int, 300, 2300, 1500, 3400, 1000);
    R('ice maker head on the bin', C.struct, 350, 2400, 1450, 3350, 1900);
    R('ice scoop in a holder on the bin', C.curb, 1550, 2700, 1700, 2900, 1100);
    R('bagged ice merchandiser freezer', C.car2, 300, 300, 1900, 1100, 1300);
    R('card reader on the freezer lid', C.int, 1950, 500, 2100, 700, 1100);
    V('guest ice rules card', C.sign, 120, 1300, 120, 2000, 1400, 1900);
    // vending
    R('soda vending machine', C.brick, 2600, 2650, 3500, 3450, 1830);
    R('lit front panel of the soda machine', C.yellow, 2600, 2620, 3500, 2650, 1700, {anim: {type: 'blink', period: 6, duty: 0.9}});
    R('card reader on the soda machine', C.int, 3400, 2580, 3480, 2620, 1150);
    R('snack vending machine with spiral rows', C.car2, 3650, 2650, 4600, 3450, 1830);
    R('coin return cup on the snack machine', C.curb, 3700, 2600, 3900, 2650, 600);
    R('bill and coin changer', C.struct, 4560, 1100, 4757, 1700, 1500);
    O('trash can by the machines', C.curb, 4300, 400, 250, 900);
    // plumbing for the ice machine
    R('floor drain under the ice bin', C.plumb, 800, 2000, 1000, 2200, 5, {disc: 'plumbing'});
    V('water filter cartridge on the wall', C.plumb, 120, 2500, 120, 2750, 1200, 1700, {disc: 'plumbing'});
    // power and light
    V('60 A subpanel', C.elec, 4757, 200, 4757, 700, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the ice bin', 900, 1800, 2743);
    Sy('light', 'ceiling light over the vending machines', 3600, 1800, 2743);
    Sy('switch', 'switch by the door', 1700, 3538, 1219);
    Ot('outlet for the ice maker', 1700, 3538, 457);
    Ot('outlet behind the soda machine', 3000, 3538, 457);
    Ot('outlet behind the snack machine', 4100, 3538, 457);
    Ot('outlet for the freezer', 120, 700, 457);
    // services: underground from the Yucca Avenue pole, water and drain from the mains
    run('electrical', C.elec, [P(231358, 11500, 6400), P(231358, 11500, 0), P(231358, 11500, -760), P(224500, 11500, -760), P(224500, 23450, -760), P(223700, 23450, -760), P(223700, 23450, 1100)], {part: 'underground service from the Yucca Avenue pole to the ice shed'});
    run('plumbing', C.plumb, [P(235344, 25800, -1219), P(220700, 25800, -900), P(220700, 25800, 300)], {part: 'water line from the Yucca Avenue main to the ice maker'});
    run('plumbing', C.sewer, [P(219900, 25100, -300), P(234144, 25100, -1500)], {part: 'ice bin drain to the Yucca Avenue sewer'});
    hatch('paving', C.curb, rect(x0 + 1800, y1, x0 + 3100, y1 + 1800, 0), 'dots', 600, 0, {part: 'concrete stoop at the ice shed door'});
    sy(900, 1700, 'standing', 'filling an ice bucket for room twelve', 0);
    sy(4100, 2150, 'standing', 'restocking chips in the snack machine', 0);
    say(x0 + 4400, y1 + 1500, 'standing', 'carrying a bag of ice out to a pickup cooler', Math.PI);
  }

  // ================================================================= 1,1 Hard Pan Fence Supply Shed, north end of the equipment yard
  {
    const N = 'Hard Pan Fence Supply Shed', x0 = 135000, x1 = 141096, y0 = 134000, y1 = 138877, H = 3658;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, H), 'lines', 350, 90, {building: N, part: 'galvanized corrugated siding, south face'}, C.curb);
    hatch('structure', C.brick, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'rust at the base, east wall'}, C.struct);
    gableY(N, x0, y0, x1, y1, H + 100, C.roof, C.struct);
    line('structure', C.int, [P(x0 + 2600, y0), P(x0 + 2600, y0, 3048), P(x0 + 5400, y0, 3048), P(x0 + 5400, y0)], {building: N, door: 'roll up door to the yard, rolled open'});
    door(N, x0, y0 + 3200, 'y', 914, 'fence shed man door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 1200, y0 - 900), 0, {text: N + ', wire, posts, gates and chargers'});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 3353), 'lines', 900, 90, {building: N, part: 'metal liner panel ceiling', checks: [['ceiling_height', 3353]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {part: 'concrete slab, swept', building: N});
    R('rack of barbed wire spools, four point', C.brick, 300, 300, 2300, 1000, 900);
    for (let i = 0; i < 4; i++) O('barbed wire spool ' + (i + 1), C.struct, 550 + i * 480, 650, 200, 1000, {n: 8});
    R('wire cutting table with a length gauge', C.int, 300, 1900, 1500, 2500, 965, {check: ['counter_height', 965]});
    R('pos terminal on the cutting table', C.int, 350, 2000, 650, 2250, 1250);
    R('receipt printer', C.int, 700, 2000, 950, 2250, 1100);
    R('cash drawer under the table', C.struct, 350, 2300, 750, 2480, 800);
    R('card reader on a cord', C.int, 1050, 2050, 1200, 2200, 1100);
    V('board of fence charger models and prices', C.sign, 120, 1900, 120, 2700, 1500, 2100);
    R('bundle of steel t posts on a pallet', C.struct, 1800, 3900, 3800, 4600, 600);
    R('stack of treated wood corner posts', C.brick, 1800, 3400, 3800, 3800, 450);
    R('rolls of woven field fence stood on end', C.veg2, 2900, 2200, 4400, 2900, 1300);
    R('pipe gates leaned on a rack, twelve and sixteen foot', C.car2, 5600, 600, 5900, 3800, 1500);
    R('shelf of fence chargers and insulators', C.int, 3900, 4350, 5300, 4700, 1830, {check: ['shelf_height', 1830]});
    V('hook rack of post drivers and wire stretchers', C.struct, 1600, 4757, 3800, 4757, 1000, 1900);
    V('100 A subpanel', C.elec, 5976, 4100, 5976, 4550, 1200, 1900, {disc: 'electrical'});
    Sy('light', 'high bay light over the wire rack', 1300, 1400, 3353);
    Sy('light', 'high bay light over the post stacks', 3000, 3500, 3353);
    Sy('light', 'high bay light by the gates', 4900, 2000, 3353);
    Sy('switch', 'switch by the man door', 120, 4300, 1219);
    Ot('outlet for the pos terminal', 120, 2900, 457);
    Ot('outlet on the north wall', 4400, 4757, 457);
    Ot('outlet for the charger tester', 5976, 3950, 1067);
    run('electrical', C.elec, [P(152110, 146996, 6400), P(152110, 146996, 0), P(152110, 146996, -760), P(142000, 146996, -760), P(142000, 138500, -760), P(140950, 138500, -760), P(140950, 138500, 1200)], {part: 'underground service from the Saguaro Avenue pole to the fence shed'});
    sy(1300, 1450, 'standing', 'cutting barbed wire off the spool for a rancher', Math.PI);
    sy(900, 2950, 'standing', 'ringing up a roll of field fence', Math.PI);
    sy(4700, 3700, 'standing', 'testing a fence charger on the shelf', 0);
    sym('activity', C.car2, 'cart', P(x0 + 4000, y0 - 2200), 0, {part: 'flatbed cart loaded with t posts'});
    say(x0 + 2600, y0 - 2400, 'standing', 'counting t posts onto a flatbed cart', 0);
  }

  // ---- D() items in the older buildings of 0,1 and 1,1 and 2,0
  D('0:1', 'Quail Run Wash Nature Hut', [36500, 117748, 42596, 121406], 2743, [
    ['f', 'basket of loaner field guides', C.brick, 500, 400, 450],
    ['w', 'map of the quail coveys along the wash', C.sign, 1200, 1300, 1900],
    ['o', 'outlet by the touch table', 457],
    pp('pinning a drawing of a gambel quail to the board'),
    pp('marking a covey sighting on the wash map')]);
  D('1:1', 'Hard Pan Tractor Wash Bay', [131500, 98500, 138815, 103986], 5000, [
    ['f', 'squeegee and bucket cart', C.plumb, 700, 500, 900],
    ['w', 'board of wash prices for tractors and trailers', C.sign, 1300, 1300, 2000],
    ['o', 'outlet for the shop vac', 457],
    pp('squeegeeing water toward the trench drain')]);
  D('2:0', 'Pump Jack Guest Laundry', [193800, 50300, 200506, 55177], 2743, [
    ['w', 'shelf of dryer sheets for sale', C.int, 900, 1300, 1700, {check: ['shelf_height', 1700]}],
    pp('sorting a guest load of whites and darks')]);

  // ================================================================= dormant season on the orchard at 11,1
  // Unclaimed orchard land east of town. Open layers only (vegetation, vehicle, activity), every record farm: true.
  const ox = 11 * S, oy = 1 * S, X = (u) => ox + u, Y = (v) => oy + v;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const WHO = {wokenBy: 'the dormant spray on the orchard', how: 'woke to the smell of spray oil in the cold air'};
  const riders = [];
  function rig(label, col, pts, speed, shape, riderText) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    const name = pool[ni++]; named.push(name + ': ' + riderText); usedIn('11:1').add(riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
    riders.push([id, rid]);
  }
  const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];
  // an airblast sprayer laying dormant oil up and down the west alleys, back along the south headland
  { const p = [], us = [12000, 18000, 24000, 30000];
    us.forEach((u, i) => { const a = i % 2 ? 68000 : 10000, b = i % 2 ? 10000 : 68000; p.push(P(X(u), Y(a)), P(X(u), Y(b))); });
    p.push(P(X(30000), Y(7500)), P(X(12000), Y(7500)), P(X(12000), Y(10000)));
    const sprayer = tractor.concat([[0, -1700, 500], [0, -2500, 500], [-1000, -2500, 600], [1000, -2500, 600], [1000, -5800, 600], [-1000, -5800, 600], [-1000, -2500, 600], [-1000, -2500, 1500], [1000, -2500, 1500], [1000, -5800, 1500], [-1000, -5800, 1500], [-1000, -2500, 1500], [-1100, -6100, 900], [1100, -6100, 900], [1100, -6100, 1900], [-1100, -6100, 1900], [-1100, -6100, 900]]);
    rig('orchard tractor pulling an airblast sprayer with dormant oil', C.car2, p, 2400, sprayer, 'spraying dormant oil down the west alleys'); }
  // a flail mower shredding the winter prunings in the east alleys
  { const p = [], us = [48000, 54000, 60000, 66000];
    us.forEach((u, i) => { const a = i % 2 ? 66000 : 12000, b = i % 2 ? 12000 : 66000; p.push(P(X(u), Y(a)), P(X(u), Y(b))); });
    p.push(P(X(68500), Y(12000)), P(X(68500), Y(9000)), P(X(48000), Y(9000)), P(X(48000), Y(12000)));
    const flail = tractor.concat([[0, -1700, 400], [0, -2300, 400], [-1600, -2300, 200], [1600, -2300, 200], [1600, -3500, 200], [-1600, -3500, 200], [-1600, -2300, 200], [-1600, -2300, 800], [1600, -2300, 800], [1600, -3500, 800], [-1600, -3500, 800], [-1600, -2300, 800]]);
    rig('utility tractor pulling a flail mower over the prunings', C.brick, p, 1800, flail, 'shredding prunings with the flail mower'); }
  // windrows of prunings raked into the east alleys, waiting for the flail
  [51000, 57000, 63000].forEach((u, i) => line('vegetation', C.veg2, wavy(X(u), Y(16000), X(u), Y(62000), 300, 20, i * 2.1), {part: 'windrow of pecan prunings raked into the alley, ' + (i + 1), species: 'pecan'}));
  // a pruning crew in the middle rows with a hydraulic pruning tower and orchard ladders
  line('vehicle', C.yellow, rect(X(39200), Y(38000), X(40800), Y(41600), 900), {part: 'self propelled pruning tower, parked in the alley'}, closed);
  line('vehicle', C.yellow, rect(X(39500), Y(39200), X(40500), Y(40200), 4200), {part: 'pruning tower basket raised into the canopy'}, closed);
  line('vehicle', C.curb, [P(X(40000), Y(39700), 900), P(X(40000), Y(39700), 4200)], {part: 'pruning tower boom'});
  say(X(40000), Y(39700), 'standing', 'lopping a water sprout from the tower basket', 0);
  for (const [u, v, r] of [[36200, 33000, 0.3], [43600, 46000, 2.8]]) {
    line('activity', C.struct, [P(X(u), Y(v)), P(X(u), Y(v + 300), 2900), P(X(u + 600), Y(v), 0)], {part: 'three legged orchard ladder'});
  }
  say(X(36700), Y(32200), 'standing', 'steadying the ladder for a pruner', 0.3);
  say(X(43300), Y(45200), 'standing', 'sharpening loppers on a whetstone', 2.8);
  say(X(38200), Y(43500), 'standing', 'tallying pruned trees on a row card', 4.2);
  // the nurse rig on the south headland: pickup, water tank trailer and oil drums
  sym('vehicle', C.car2, 'truck', P(X(38000), Y(4800)), 1.57, {part: 'farm pickup parked on the south headland'});
  line('vehicle', C.plumb, circ(X(33400), Y(4800), 1100, 1300, 14), {part: 'nurse tank of water on a trailer behind the pickup'}, closed);
  line('vehicle', C.curb, rect(X(32000), Y(4000), X(35000), Y(5600), 700), {part: 'nurse tank trailer frame'}, closed);
  for (let i = 0; i < 3; i++) line('vehicle', C.yellow, circ(X(41800 + i * 750), Y(4400), 290, 900, 10), {part: 'drum of dormant spray oil ' + (i + 1)}, closed);
  say(X(36000), Y(3300), 'standing', 'mixing dormant oil into the nurse tank', 1.57);
  say(X(40500), Y(5600), 'standing', 'watching the overcast for rain before spraying', 4.7);
  // one portable toilet and a hand wash stand at the west edge
  line('vehicle', C.plumb, rect(X(4200), Y(40000), X(5350), Y(41150), 2290), {part: 'portable toilet at the orchard edge'}, closed);
  line('vehicle', C.yellow, [P(X(4200), Y(40200), 1900), P(X(4200), Y(40950), 1900)], {part: 'portable toilet door vent'});
  line('vehicle', C.curb, rect(X(4300), Y(42000), X(5100), Y(42500), 1000), {part: 'hand wash stand with foot pump'}, closed);
  // idle irrigation pipe: reels of old drip hose and a rack of PVC lateral pipe at the north headland
  for (let i = 0; i < 3; i++) line('vehicle', C.struct, circ(X(20000 + i * 1600), Y(73800), 650, 1300, 12).map(q => [q[0], Y(73800), 1300 + (q[1] - Y(73800))]), {part: 'reel of used drip hose waiting for the recycler, ' + (i + 1)});
  line('vehicle', C.int, rect(X(28000), Y(73000), X(34500), Y(74400), 500), {part: 'rack of idle PVC lateral pipe'}, closed);
  for (let i = 0; i < 4; i++) line('vehicle', C.curb, [P(X(28100), Y(73200 + i * 330), 620 + (i % 2) * 110), P(X(34400), Y(73200 + i * 330), 620 + (i % 2) * 110)], {part: 'idle PVC lateral pipe on the rack, ' + (i + 1)});
  say(X(36000), Y(73600), 'standing', 'counting idle pipe on the rack', 3.1);

  // every record on 11,1 carries farm: true so the orchard keeps showing
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === '11:1') a.meta = Object.assign(a.meta || {}, {farm: true}); }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
