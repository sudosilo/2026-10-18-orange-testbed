// Agent Orange 2026-11-24 a: Whetstone Wash Blade Grinding Shop on 3,4, Hoofprint Draw Farrier Shop on 2,4, Spinystar Pecan Buying Station on 5,4,
// an alfalfa last cutting crew on open land 3,-4, and new calendar and almanac boards.
import {zionWeather, almanac} from '../lib/kit.mjs';
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
  let seed = 1124; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= the almanac, the calendar and the boards
  const now = new Date(), ms = now.getTime(), day = Math.floor(ms / 86400000), tick = Math.floor((ms % 86400000) / 1000);
  const yy = now.getUTCFullYear(), orbit = yy - 1970, doy = Math.round((Date.UTC(yy, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(yy, 0, 1)) / 86400000);
  const hect = Math.floor(doy / 100) + 1;
  const md = doy < 360 ? 'month ' + (Math.floor(doy / 30) + 1) + ', decaday ' + (Math.floor((doy % 30) / 10) + 1) + ', day ' + (doy % 10 + 1) : 'the short decaday, day ' + (doy - 359);
  const time = tick >= 80000 ? 'the short hour, tick ' + (tick - 80000) : 'block ' + Math.floor(tick / 10000) + ', minute ' + Math.floor((tick % 10000) / 100);
  const A = almanac(now), AC = A.crops, tag = (crop) => ({farmStage: crop + ':' + AC[crop].stage});
  const wx = zionWeather(now), sky = wx.rain ? 'Rain falling' : wx.kind === 'clouds' && wx.cover >= 7 ? 'Sky overcast, Zion\'s sun behind the clouds' : wx.kind === 'clouds' ? 'Broken clouds' : 'Sky clear';
  const date = 'Day ' + day + '. Orbit ' + orbit + ', hectoday ' + hect + ', ' + md;
  const boardPart = /Zion town clock and calendar board|Pecan Hollow season board|Zion almanac board/;
  for (const c of W.chunks.values()) for (const r of c.records) if (!r.hidden && r.agent === 'agent-orange' && r.meta && boardPart.test(r.meta.part || '')) push('remove', {id: r.id});
  sym('structure', C.sign, 'sign', P(610736, 171496), 0, {text: 'Zion calendar, kept by Marisol at the lookout. ' + date + '. Posted at ' + time + '. ' + sky + '.', part: 'Zion town clock and calendar board'});
  sym('structure', C.sign, 'sign', P(613736, 171496), 0, {text: 'Zion almanac. ' + A.line, part: 'Zion almanac board'});
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, Object.assign({text: 'Pecan Hollow season board. Pecans: ' + AC.pecan.stage + '. ' + AC.pecan.look + '. Water ' + AC.pecan.irrigation + '. Days kept by Marisol.', part: 'Pecan Hollow season board'}, tag('pecan')));
  console.log('ZION ' + date + ', ' + time + ' / ' + A.line);
  // retire every farm stage record whose tag no longer matches the almanac
  let stale = 0;
  for (const c of W.chunks.values()) for (const r of c.records) {
    if (r.hidden || r.agent !== 'agent-orange' || !r.meta || !r.meta.farmStage || boardPart.test(r.meta.part || '')) continue;
    const [crop, st] = String(r.meta.farmStage).split(':');
    if (crop === 'yard') continue;
    if (!st || !AC[crop] || AC[crop].stage !== st) { push('remove', {id: r.id}); stale++; }
  }
  console.log('RETIRED ' + stale);
  const night = {when: 'night', lit: true};

  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }

  // ================================================================= the three template blocks share one layout: a free pad east of the north row
  // building, just north of the rear alley. Local frame from the chunk's southwest corner.
  const L = {alleyPoleU: 67508, poleV: 44500, waterV: 43048, sewerV: 43948};
  function pad(cx, cy) { const ox = cx * S, oy = cy * S; return {ox, oy, x0: ox + 57500, y0: oy + 49500, x1: ox + 63500, y1: oy + 54500}; }
  function services(N, p, panelU, panelV, sinkU, sinkV) {
    const {ox, oy, x0, y0} = p;
    run('electrical', C.elec, [P(ox + L.alleyPoleU, oy + L.poleV, 6400), P(ox + L.alleyPoleU, oy + L.poleV, -760), P(ox + L.alleyPoleU, y0 + panelV, -760), P(x0 + panelU, y0 + panelV, -760), P(x0 + panelU, y0 + panelV, 1100)], {building: N, part: 'underground service from the east alley pole to the panel'});
    run('plumbing', C.plumb, [P(x0 + sinkU, y0 + sinkV, 800), P(x0 + sinkU, y0 + sinkV, -1067), P(x0 + sinkU, oy + L.waterV, -1219)], {building: N, part: 'cold water from the alley main to the hand sink'});
    run('plumbing', C.sewer, [P(x0 + sinkU + 200, y0 + sinkV, -300), P(x0 + sinkU + 200, oy + L.sewerV, -2134)], {building: N, part: 'sink drain to the alley sewer'});
  }

  // ================================================================= 3,4 Whetstone Wash Blade Grinding Shop
  {
    const p = pad(3, 4), {x0, y0, x1, y1} = p, N = 'Whetstone Wash Blade Grinding Shop', H = 3658, CH = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.lot, vface(x0, y0, x1, y0, 0, H), 'lines', 450, 0, {building: N, part: 'galvanized corrugated siding, alley side'}, C.curb);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'grinding dust at the base, east wall'}, C.curb);
    shed(N, x0, y0, x1, y1, H + 100, C.int, C.roof, false);
    door(N, x0 + 2700, y0, 'x', 914, 'grinding shop front door', 1);
    door(N, x1, y0 + 1000, 'y', 1219, 'grinding shop loading door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 4200, y0 - 1000), 0, {text: N + '. Disc blades, sickle sections, mower blades and saw chain, sharpened while you wait'});
    sym('electrical', C.elec, 'light', P(x0 + 3200, y0 - 300, 2500), 0, Object.assign({building: N, part: 'light over the grinding shop door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 1219, 90, {building: N, part: 'white steel liner panel ceiling', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {building: N, part: 'concrete floor, sparks burned into it by the grinders'});
    R('front counter', C.struct, 400, 1400, 2400, 1900, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the grinding shop counter', C.int, 500, 1500, 800, 1750, 1150);
    R('receipt printer', C.curb, 950, 1500, 1200, 1750, 1170);
    R('cash drawer under the counter, empty', C.struct, 1350, 1450, 1850, 1850, 1000);
    R('card reader on the counter', C.int, 2050, 1550, 2200, 1750, 1120);
    R('claim tag spike and a roll of wire tags', C.sign, 2250, 1500, 2350, 1600, 1150);
    R('disc blade grinder with its swing arm', C.lot, 3900, 3600, 5200, 4750, 1100);
    O('grinding wheel, spinning', C.curb, 4550, 4200, 450, 1150, {n: 12, anim: {type: 'spin', rpm: 60}});
    R('coulter disc clamped on the grinder table', C.struct, 4100, 3700, 4500, 4100, 1180);
    R('sickle grinding bench', C.struct, 600, 4300, 2800, 4750, 914, {check: ['counter_height', 914]});
    R('sickle section grinder on the bench', C.int, 900, 4400, 1300, 4700, 1100);
    R('saw chain grinder on the bench', C.int, 2000, 4400, 2300, 4700, 1100);
    R('quench tank of cutting oil', C.plumb, 3000, 2600, 3500, 3000, 700);
    V('rack of dull disc blades tagged by farm', C.brick, 120, 2400, 120, 3800, 600, 1600);
    V('rack of sharpened mower blades ready to go', C.curb, 5880, 2500, 5880, 3400, 900, 1800);
    V('board of claim tags by pickup day', C.sign, 2900, 4880, 3700, 4880, 1200, 1900);
    R('hand sink', C.plumb, 5300, 250, 5800, 650, 900);
    V('100 A panel', C.elec, 5300, 4880, 5700, 4880, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'high bay light over the disc grinder', 4500, 3000, CH);
    Sy('light', 'high bay light over the sickle bench', 1700, 3300, CH);
    Sy('light', 'light over the front counter', 1400, 2300, CH);
    Sy('switch', 'switch by the front door', 3900, 120, 1219);
    Ot('outlet for the disc grinder', 5880, 4200, 1067);
    Ot('outlet over the sickle bench', 120, 4500, 1067);
    Ot('outlet at the counter', 120, 1700, 1067);
    Ot('outlet by the sink', 4900, 120, 457);
    services(N, p, 5500, 4700, 5550, 450);
    hatch('paving', C.curb, rect(x0 + 2400, y0 - 1600, x0 + 3900, y0, 0), 'dots', 600, 0, {part: 'concrete step at the grinding shop door'});
    sym('vehicle', C.car, 'truck', P(x0 + 9600, y0 + 1600), 0, {part: 'farm pickup backed to the loading door, bed full of disc blades'});
    sy(3300, 3900, 'standing', 'grinding the edge back onto a coulter disc', 1.57);
    sy(1700, 3700, 'standing', 'filing a sickle section on the bench', 0);
    sy(1400, 2400, 'standing', 'writing a claim tag for six disc blades', 3.14);
    sy(1200, 800, 'standing', 'dropping off a box of dull sickle sections', 0);
    sy(7400, 2400, 'standing', 'sliding disc blades off the pickup tailgate', 4.7);
  }

  // ================================================================= 2,4 Hoofprint Draw Farrier Shop, beside the large animal clinic
  {
    const p = pad(2, 4), {x0, y0, x1, y1} = p, N = 'Hoofprint Draw Farrier Shop', H = 3962, CH = 3353;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, H), 'brick', 300, 0, {building: N, part: 'adobe block, alley side'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 800), 'gradient', 300, 0, {building: N, part: 'dust at the base, west wall'}, C.curb);
    gableX(N, x0, y0, x1, y1, H + 100, C.struct, C.roof);
    door(N, x0 + 2700, y0, 'x', 914, 'farrier shop front door', -1);
    door(N, x1, y0 + 1000, 'y', 1219, 'horse door to the shoeing bay', 1);
    sym('structure', C.sign, 'sign', P(x0 + 4400, y0 - 1000), 0, {text: N + '. Trims, resets and hot shoeing. Bring them in by the side door'});
    sym('electrical', C.elec, 'light', P(x1 + 300, y0 + 2600, 2600), 0, Object.assign({building: N, part: 'light over the horse door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 900, 0, {building: N, part: 'open plank ceiling over the forge'}, C.struct);
    hatch('structure', C.curb, rect(x0 + 3200, y0 + 900, x1 - 200, y0 + 2600, 10), 'dots', 250, 0, {building: N, part: 'rubber mat in the shoeing bay'});
    R('gas forge', C.lot, 400, 3800, 1200, 4600, 1000);
    O('forge fire, glowing', C.brick, 800, 4200, 150, 1050, Object.assign({n: 8}, glow(1.2)));
    V('forge hood', C.curb, 300, 4880, 1300, 4880, 1700, 2700);
    O('stump under the anvil', C.struct, 2100, 3700, 300, 500, {n: 10});
    R('anvil on its stump', C.curb, 1850, 3600, 2350, 3800, 860);
    O('quench bucket', C.plumb, 1300, 3000, 200, 450, {n: 8});
    V('rack of keg shoes by size', C.curb, 120, 2000, 120, 3200, 900, 1900);
    R('farrier tool box with nippers and rasps', C.struct, 2300, 1000, 2800, 1300, 450);
    O('hoof stand', C.curb, 3000, 2000, 150, 500, {n: 8});
    R('belt grinder bench for rasps and knives', C.struct, 3000, 4300, 4800, 4750, 914, {check: ['counter_height', 914]});
    R('bay mare standing in the cross ties', C.struct, 3400, 1400, 5200, 2000, 1400);
    R('the mare\'s head toward the horse door', C.struct, 5200, 1500, 5650, 1900, 1700);
    V('cross tie ring and safety string, north side', C.curb, 4200, 2560, 4500, 2560, 1500, 1600);
    R('shop counter', C.struct, 400, 1200, 1800, 1700, 1067, {check: ['counter_height', 1067]});
    R('POS terminal at the farrier counter', C.int, 500, 1300, 800, 1550, 1150);
    R('receipt printer', C.curb, 900, 1300, 1150, 1550, 1170);
    R('cash drawer, empty', C.struct, 1250, 1250, 1650, 1650, 1000);
    R('card reader', C.int, 1680, 1300, 1780, 1500, 1120);
    R('hand sink', C.plumb, 5300, 4300, 5800, 4750, 900);
    V('board of horses due for a reset', C.sign, 2600, 4880, 2900, 4880, 1200, 1900);
    V('100 A panel', C.elec, 5880, 3400, 5880, 3900, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the shoeing bay', 4300, 2300, CH);
    Sy('light', 'light over the forge and anvil', 1600, 3400, CH);
    Sy('switch', 'switch by the front door', 2400, 120, 1219);
    Ot('outlet for the belt grinder', 4000, 4880, 1067);
    Ot('outlet at the counter', 120, 1500, 1067);
    Ot('outlet by the horse door', 5880, 2700, 457);
    services(N, p, 5700, 3650, 5550, 4500);
    line('vehicle', C.lot, rect(x0 + 7600, y0 + 500, x0 + 10000, y0 + 6500, 2100), {part: 'stock trailer, a gelding waiting inside'}, closed);
    sym('vehicle', C.car2, 'truck', P(x0 + 8800, y0 + 9000), Math.PI, {part: 'pickup that pulled the stock trailer'});
    sy(3000, 2600, 'standing', 'rasping a front hoof level on the hoof stand', 3.14);
    sy(2100, 3100, 'standing', 'shaping a keg shoe on the anvil', 0);
    sy(5300, 2600, 'standing', 'holding the bay mare\'s lead rope', 4.7);
    sy(1100, 600, 'standing', 'paying for a reset on two geldings', 0);
    sy(7000, 3500, 'standing', 'backing a gelding out of the stock trailer', 1.57);
  }

  // ================================================================= 5,4 Spinystar Pecan Buying Station, beside the pecan hulling shed
  {
    const p = pad(5, 4), {x0, y0, x1, y1} = p, N = 'Spinystar Pecan Buying Station', H = 3658, CH = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    const T = tag('pecan');
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, H), 'lines', 300, 0, {building: N, part: 'painted board and batten, alley side'}, C.struct);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'hull dust at the base, east wall'}, C.curb);
    hip(N, x0, y0, x1, y1, H + 100, C.lot, C.roof);
    door(N, x0 + 2200, y0, 'x', 914, 'buying station front door', 1);
    door(N, x1, y0 + 3200, 'y', 1219, 'buying station sack door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 4200, y0 - 1000), 0, Object.assign({text: N + '. Buying in-shell pecans during harvest. Bring a sample from every lot'}, T));
    sym('electrical', C.elec, 'light', P(x0 + 2600, y0 - 300, 2500), 0, Object.assign({building: N, part: 'light over the buying station door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 450, 0, {building: N, part: 'sealed concrete floor, swept of hulls'});
    R('buyer counter', C.struct, 3200, 1200, 5600, 1700, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the buyer counter', C.int, 3300, 1300, 3600, 1550, 1150);
    R('weigh ticket printer', C.curb, 3750, 1300, 4000, 1550, 1170);
    R('cash drawer, empty as every drawer in town', C.struct, 4150, 1250, 4650, 1650, 1000);
    R('card reader', C.int, 4800, 1350, 4950, 1550, 1120);
    R('moisture tester on the counter', C.lot, 5100, 1300, 5450, 1600, 1250);
    R('platform floor scale', C.curb, 600, 2600, 2400, 4400, 60);
    R('sack of in-shell pecans on the scale', C.brick, 1200, 3200, 1800, 3700, 700, T);
    R('stack of weighed sacks by the door', C.brick, 400, 300, 1700, 1100, 900, T);
    R('sample cracking bench', C.struct, 3400, 4300, 5600, 4750, 914, {check: ['counter_height', 914]});
    R('hand sample cracker', C.curb, 3600, 4400, 3900, 4650, 1050);
    R('kernel grading tray', C.yellow, 4200, 4400, 4800, 4650, 950);
    R('gram scale for the kernel sample', C.int, 5000, 4400, 5300, 4650, 1000);
    V('sample bags hung by grower lot', C.brick, 120, 1600, 120, 2400, 1100, 1900);
    V('price board with blank spaces where the price goes', C.sign, 5880, 1900, 5880, 2900, 1300, 2100);
    R('hand sink', C.plumb, 5300, 250, 5800, 650, 900);
    V('100 A panel', C.elec, 2600, 4880, 3000, 4880, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the floor scale', 1500, 2200, CH);
    Sy('light', 'light over the cracking bench', 4500, 3600, CH);
    Sy('light', 'light over the buyer counter', 4400, 2400, CH);
    Sy('switch', 'switch by the front door', 3400, 120, 1219);
    Ot('outlet for the moisture tester', 5880, 1400, 1067);
    Ot('outlet over the cracking bench', 5880, 4400, 1067);
    Ot('outlet for the floor scale readout', 120, 2800, 457);
    services(N, p, 2800, 4700, 5550, 450);
    line('vehicle', C.struct, rect(x0 + 7600, y0 + 1200, x0 + 10000, y0 + 6000, 900), Object.assign({part: 'grower nut trailer waiting to be weighed'}, T), closed);
    line('vehicle', C.brick, rect(x0 + 7750, y0 + 1350, x0 + 9850, y0 + 5850, 1500), Object.assign({part: 'field run pecans heaped in the trailer'}, T), closed);
    sym('vehicle', C.car, 'truck', P(x0 + 8800, y0 + 8800), Math.PI, {part: 'grower pickup that towed the nut trailer'});
    sy(4400, 2400, 'standing', 'running a pecan sample through the moisture tester', 3.14);
    sy(4300, 600, 'standing', 'handing over a sample sack from the hollow', 0);
    sy(4500, 3700, 'standing', 'cracking a sample and grading the kernels', 0);
    sy(1500, 1900, 'standing', 'tying off a weighed sack of pecans', 1.57);
    sy(6900, 4000, 'standing', 'shoveling a sample from the grower trailer', 1.57);
  }

  // ================================================================= alfalfa last cutting on open land 3,-4
  // Unclaimed alfalfa land. Open layers only (vegetation, vehicle, activity), every record farm: true, tagged with the almanac stage.
  const FK = '3:-4', ox = 3 * S, oy = -4 * S, X = (u) => ox + u, Y = (v) => oy + v;
  if (AC.alfalfa.stage === 'last cutting') {
    const WHO = {wokenBy: 'the last cutting alfalfa crew', how: 'woke to the clack of the bale wagon picking up the last of the year'};
    const T = tag('alfalfa');
    function rig(label, col, pts, speed, shape, text) {
      const id = nextIdNow(), [x, y, z] = pts[0];
      line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), Object.assign({part: label, anim: {type: 'path', speed, pts}}, T));
      const rid = nextIdNow(), dp = driverPath(id, pts, rid);
      if (usedIn(FK).has(text)) console.log('DUP ACTIVITY ' + text); usedIn(FK).add(text);
      const name = pool[ni++]; named.push(name + ': ' + text);
      sym('activity', C.person, 'person', dp[0], 0, Object.assign({pose: 'walking', activity: text, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}}, T));
    }
    const sayP = (u, v, text, rot = 0) => { const x = X(u), y = Y(v), set = usedIn(FK); if (set.has(text)) { console.log('DUP ACTIVITY ' + text); return; } set.add(text);
      const name = pool[ni++]; named.push(name + ': ' + text);
      sym('activity', C.person, 'person', P(x, y), rot, Object.assign({pose: 'standing', activity: text, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1}, T)); };
    const loop = (u0, u1, v0, v1) => [P(X(u0), Y(v0)), P(X(u0), Y(v1)), P(X(u1), Y(v1)), P(X(u1), Y(v0)), P(X(u0), Y(v0))];
    // border levees every 14 m, running north from the south track
    for (let i = 0; i < 5; i++) { const u = 8000 + 14000 * i; line('vegetation', C.veg2, wavy(X(u), Y(5000), X(u), Y(74000), 120, 12, i + 11, 80), Object.assign({part: 'border levee between alfalfa checks, ' + (i + 1), species: 'alfalfa'}, T)); }
    hatch('vegetation', C.yellow, rect(X(36000), Y(6000), X(63000), Y(72000), 20), 'lines', 700, 0, Object.assign({part: 'alfalfa stubble after the last cutting, bales lifted', species: 'alfalfa'}, T), C.veg2);
    hatch('vegetation', C.veg2, rect(X(8500), Y(6000), X(35500), Y(72000), 20), 'lines', 900, 90, Object.assign({part: 'slow regrowth in the planed checks', species: 'alfalfa'}, T), C.veg);
    hatch('vegetation', C.car2, rect(X(64500), Y(48000), X(77000), Y(74000), 40), 'lines', 500, 0, Object.assign({part: 'light irrigation water spreading down the last check', species: 'alfalfa'}, T), C.plumb);
    line('vegetation', C.plumb, wavy(X(4000), Y(76000), X(77500), Y(76000), 200, 16, 31, 60), Object.assign({part: 'head ditch along the north edge, running light', species: 'alfalfa'}, T));
    for (let i = 0; i < 5; i++) { const u = 66000 + 2400 * i; line('vegetation', C.curb, arc(X(u), Y(75600), 500, 0, 180, 6, 250), Object.assign({part: 'siphon tube over the ditch bank, ' + (i + 1), species: 'alfalfa'}, T)); }
    // the last small bales, still in the field in the east checks
    for (let i = 0; i < 16; i++) { const u = 49000 + (i % 2) * 3000 + (Math.floor(i / 2) % 2) * 600, v = 14000 + 6000 * Math.floor(i / 2);
      line('vegetation', C.veg2, rect(X(u - 450), Y(v - 230), X(u + 450), Y(v + 230), 400), Object.assign({part: 'small alfalfa bale waiting for the wagon', species: 'alfalfa'}, T), closed); }
    // the stackyard at the southeast corner
    line('vegetation', C.veg2, rect(X(62000), Y(5000), X(72000), Y(8000), 2700), Object.assign({part: 'stack of small alfalfa bales at the stackyard, top tier', species: 'alfalfa'}, T), closed);
    line('vegetation', C.veg2, rect(X(62000), Y(5000), X(72000), Y(8000), 0), Object.assign({part: 'stack of small alfalfa bales at the stackyard, ground tier', species: 'alfalfa'}, T), closed);
    for (const [u, v] of [[62000, 5000], [72000, 5000], [72000, 8000], [62000, 8000]]) line('vegetation', C.veg2, [P(X(u), Y(v), 0), P(X(u), Y(v), 2700)], Object.assign({part: 'stackyard bale stack corner', species: 'alfalfa'}, T));
    // the machines
    const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];
    const lplane = tractor.concat([[0, -1700, 500], [0, -3000, 500], [-1800, -3000, 400], [1800, -3000, 400], [1800, -15000, 400], [-1800, -15000, 400], [-1800, -3000, 400], [-1800, -9000, 300], [1800, -9000, 300]]);
    rig('tractor pulling a land plane down a cut check', C.car2, loop(15000, 22000, 9000, 66000), 1400, lplane, 'planing a check flat for spring');
    const wagon = [[-1300, -5500, 0], [1300, -5500, 0], [1300, 2800, 0], [-1300, 2800, 0], [-1300, -5500, 0], [-1300, 1000, 0], [-1300, 1000, 2900], [1300, 1000, 2900], [1300, 2800, 2900], [-1300, 2800, 2900], [-1300, 1000, 2900], [-1300, -5500, 900], [1300, -5500, 900], [1300, 1000, 900], [-1300, -5500, 2200], [1300, -5500, 2200], [1300, -5500, 900], [1600, 3000, 600], [1600, 1600, 600]];
    rig('self propelled bale wagon picking up the last small bales', C.yellow, loop(46000, 55000, 10000, 60000), 1600, wagon, 'picking up the last bales of the season');
    // a pickup parked out in the stubble, the pipe trailer and a toilet on the south track
    sym('vehicle', C.car, 'truck', P(X(40000), Y(42000)), 0.4, Object.assign({part: 'pickup parked out in the stubble'}, T));
    sym('vehicle', C.curb, 'dog', P(X(41600), Y(41000)), 1.2, Object.assign({part: 'ranch dog nosing the stubble beside the pickup'}, T));
    line('vehicle', C.struct, rect(X(28000), Y(800), X(40000), Y(2600), 700), Object.assign({part: 'pipe trailer on the south track'}, T), closed);
    for (let i = 0; i < 8; i++) line('vehicle', C.curb, [P(X(28200), Y(1000 + (i % 4) * 400), 900 + Math.floor(i / 4) * 260), P(X(39800), Y(1000 + (i % 4) * 400), 900 + Math.floor(i / 4) * 260)], Object.assign({part: 'idle gated pipe loaded for the winter, ' + (i + 1)}, T));
    line('vehicle', C.plumb, rect(X(73500), Y(800), X(74700), Y(2000), 2290), Object.assign({part: 'portable toilet on the south track by the stackyard'}, T), closed);
    line('vehicle', C.plumb, rect(X(43000), Y(800), X(47000), Y(2600), 1800), Object.assign({part: 'water tank trailer for the crew'}, T), closed);
    sayP(52000, 64000, 'flagging the last bales left in the corner', 3.14);
    sayP(70000, 47000, 'checking how far the water has run down the check', 1.57);
    sayP(68400, 77200, 'starting another siphon tube in the head ditch', 4.7);
    sayP(67000, 9500, 'tallying bales at the stackyard', 3.14);
    sayP(34000, 3300, 'tying the gated pipe down on the trailer', 0);
    sayP(39000, 43500, 'reading the hay scale tickets in the pickup cab', 0.4);
    sayP(45000, 3300, 'filling a water jug at the tank trailer', 0);
  }
  // every record on 3,-4 carries farm: true so the alfalfa keeps showing
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === FK) a.meta = Object.assign(a.meta || {}, {farm: true}); }
  for (const c of k.calls) { const a = c.args; if (!a || !a.meta || !a.meta.farmStage) continue; a.meta.almanac = A.key; }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
