// Agent Orange 2026-11-22 b: the Zion almanac goes live. Farm stage records now follow almanac(date) from lib/kit.mjs:
// pecan harvest on Pecan Hollow 3,1, the late Medjool pick on the date grove 4,3, cotton modules on the 5,2 pad, relabeled yards on 6,3 6,4 7,3, new boards.
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
  let seed = 11222; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ---- retire every farm stage record whose tag no longer matches the almanac. Old untagged stages ('growing') all go.
  const stale = [];
  for (const c of W.chunks.values()) for (const r of c.records) {
    if (r.hidden || r.agent !== 'agent-orange' || !r.meta || !r.meta.farmStage) continue;
    const [crop, st] = String(r.meta.farmStage).split(':');
    if (!st || !AC[crop] || AC[crop].stage !== st) { push('remove', {id: r.id}); stale.push(r); }
  }
  console.log('RETIRED ' + stale.length);
  // a record whose look still fits the almanac comes back with its crop stage tag
  const again = (r, crop, part) => {
    const meta = Object.assign({}, r.meta, tag(crop), part ? {part} : {});
    if (r.kind === 'symbol') sym(r.discipline, r.color, r.type, r.at, r.rot || 0, meta);
    else if (r.kind === 'hatch') hatch(r.discipline, r.color, r.pts, r.pattern, r.spacing, r.angle || 0, meta, r.color2);
    else line(r.discipline, r.color, r.pts, meta, Object.assign({closed: !!r.closed}, r.color2 !== undefined ? {color2: r.color2} : {}));
  };
  const byId = Object.fromEntries(stale.map(r => [r.id, r]));
  const board = (id, text) => { const r = byId[id]; if (r) sym('structure', C.sign, 'sign', r.at, 0, Object.assign({}, r.meta, {text, farmStage: 'yard:' + A.key})); };

  // ---- relabel the yards whose look already fits today
  for (const r of stale) {
    const p = r.meta.part || '';
    if (r.kind === 'symbol') continue;
    if (/onion/.test(p) || /shade cloth from the curing/.test(p)) again(r, 'onion');
    else if (/pomegranate/.test(p)) again(r, 'pomegranate');
    else if (/garlic/.test(p)) again(r, 'garlic');
    else if (/fig drying/.test(p)) again(r, 'fig');
    else if (/bean/.test(p)) again(r, 'bean');
    else if (/pistachio field bins/.test(p)) again(r, 'pistachio', p.replace('empty pistachio field bins stacked three high', 'pistachio field bins washed and stacked after the September harvest'));
  }
  board(37195, 'Kangaroo Rat and Blackbrush yard. Onions ' + AC.onion.stage + ': ' + AC.onion.look + '.');
  board(37204, 'Desert Lavender and Snakeweed yard. Pomegranates ' + AC.pomegranate.stage + ', garlic ' + AC.garlic.stage + ': ' + AC.garlic.look + '.');
  board(37212, 'Indigo Bush and Cheesebush yard. Figs ' + AC.fig.stage + ', tepary beans ' + AC.bean.stage + '.');
  board(36827, 'Datura Wash yard. Cotton ' + AC.cotton.stage + ': ' + AC.cotton.look + '. Pistachios ' + AC.pistachio.stage + '.');

  // ---- moving rigs with drivers, from the 2026-11-18-b plan
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  function rig(ck, crop, label, col, pts, speed, shape, riders, WHO) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), Object.assign({part: label, anim: {type: 'path', speed, pts}}, tag(crop)));
    for (const [text, dz] of riders) {
      const rp = pts.map(p => [p[0], p[1], p[2] + (dz || 0)]);
      const rid = nextIdNow(), dp = driverPath(id, rp, rid);
      if (usedIn(ck).has(text)) console.log('DUP ACTIVITY ' + text); usedIn(ck).add(text);
      const name = pool[ni++]; named.push(name + ': ' + text);
      sym('activity', C.person, 'person', dp[0], 0, Object.assign({pose: 'walking', activity: text, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}}, tag(crop)));
    }
  }
  const sayT = (crop, x, y, text, rot = 0) => { const set = usedIn(k.ck(x, y)); if (set.has(text)) { console.log('DUP ACTIVITY ' + text); return; } set.add(text);
    const name = pool[ni++]; named.push(name + ': ' + text);
    sym('activity', C.person, 'person', P(x, y), rot, Object.assign({pose: 'standing', activity: text, name, awake: true, wokenBy: "the children's game", how: 'woke when the whole city woke at once', layer: 1}, tag(crop))); };
  const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];

  // ================================================================= 3,1 Pecan Hollow: harvest
  if (AC.pecan.stage === 'harvest') {
    const WHO = {wokenBy: 'the pecan harvest crew', how: 'woke to the shudder of the trunk shaker'};
    const alleys = [36639, 36640, 36641, 36642].map(id => byId[id]).filter(Boolean);
    const center = alleys.map(r => { const p = r.pts, o = []; for (let i = 0; i < 8; i++) o.push([p[i][0], Math.round((p[i][1] + p[17 - i][1]) / 2)]); return o; });
    // the orchard floor mowed short and rolled smooth so the nuts can be swept
    alleys.forEach((r, i) => hatch('lot', C.yellow, r.pts, 'lines', 900, 0, Object.assign({part: 'orchard floor mowed and rolled smooth for the harvest, alley ' + (i + 1)}, tag('pecan')), C.brick));
    // windrows the sweeper already made down the first two alleys
    [0, 1].forEach(i => line('vegetation', C.brick, center[i].map(([x, y]) => P(x, y + 150, 120)), Object.assign({part: 'windrow of shaken pecans swept to the alley center, alley ' + (i + 1), species: 'pecan'}, tag('pecan'))));
    // shaken nuts lying under the trees the sweeper has not reached, in the third and fourth alleys
    for (let i = 0; i < 10; i++) { const a = center[2 + (i % 2)], q = a[1 + Math.floor(i / 2)];
      line('vegetation', C.brick, blob(q[0] + 1800, q[1] - 300, 1100, 60, 9, i), Object.assign({part: 'pecans shaken onto the floor around a trunk', species: 'pecan'}, tag('pecan')), closed); }
    const loop = (a, b, zE, zW) => { const p = a.map(([x, y]) => P(x, y)); p.push(P(306600, a[7][1]), P(306600, b[7][1])); b.slice().reverse().forEach(([x, y]) => p.push(P(x, y))); p.push(P(247800, b[0][1]), P(247800, a[0][1]), P(a[0][0], a[0][1])); return p; };
    const shaker = [[-1200, -2200, 0], [1200, -2200, 0], [1200, 2200, 0], [-1200, 2200, 0], [-1200, -2200, 0], [-1200, -2200, 1800], [1200, -2200, 1800], [1200, 0, 1800], [-1200, 0, 1800], [-1200, -2200, 1800], [1200, 1200, 900], [3400, 1200, 900], [3400, 300, 900], [3400, 2100, 900], [1200, 1200, 900]];
    rig('3:1', 'pecan', 'self propelled trunk shaker with its boom out', C.yellow, loop(center[2], center[3]), 900, shaker, [['clamping the shaker boom on a pecan trunk']], WHO);
    const sweeper = [[-1100, -1500, 0], [1100, -1500, 0], [1100, 1800, 0], [-1100, 1800, 0], [-1100, -1500, 0], [-1100, -1500, 1600], [1100, -1500, 1600], [1100, 1800, 1600], [-1100, 1800, 1600], [-1100, -1500, 1600], [-2600, 2000, 300], [2600, 2000, 300], [2600, 2600, 300], [-2600, 2600, 300], [-2600, 2000, 300]];
    rig('3:1', 'pecan', 'pecan sweeper with its front broom down', C.brick, loop(center[1], center[2]), 1300, sweeper, [['sweeping nuts into a windrow']], WHO);
    const harvester = tractor.concat([[0, -1700, 500], [0, -2600, 500], [-1300, -2600, 400], [1300, -2600, 400], [1300, -7200, 400], [-1300, -7200, 400], [-1300, -2600, 400], [-1300, -7200, 2400], [1300, -7200, 2400], [1300, -5200, 2400], [-1300, -5200, 2400], [-1300, -7200, 2400], [1300, -4000, 2400], [2600, -4000, 3000]]);
    rig('3:1', 'pecan', 'tractor pulling a pecan harvester up the windrow', C.car2, loop(center[0], center[1]), 1100, harvester, [['picking up a windrow of pecans with the harvester']], WHO);
    // the nut cart shuttles the harvester's loads along the north headland to the trailers beside the cracking shed
    const cart = tractor.concat([[0, -1700, 500], [0, -2600, 500], [-1200, -2600, 600], [1200, -2600, 600], [1200, -5600, 600], [-1200, -5600, 600], [-1200, -2600, 600], [-1200, -2600, 1900], [1200, -2600, 1900], [1200, -5600, 1900], [-1200, -5600, 1900], [-1200, -2600, 1900]]);
    rig('3:1', 'pecan', 'tractor with a nut cart, half full', C.struct, [P(292000, 120200), P(300400, 120200), P(300400, 121400), P(292000, 121400), P(292000, 120200)], 2000, cart, [['hauling a nut cart to the trailers']], WHO);
    [[301500, 120800], [304400, 120800]].forEach(([x, y], i) => { line('vehicle', C.struct, rect(x, y, x + 2400, y + 5000, 900), Object.assign({part: 'nut trailer parked by the cracking shed, ' + (i ? 'empty' : 'heaped with pecans')}, tag('pecan')), closed);
      line('vehicle', C.brick, rect(x + 150, y + 150, x + 2250, y + 4850, i ? 1000 : 2300), Object.assign({part: i ? 'nut trailer bed, swept out' : 'heap of field run pecans in the trailer'}, tag('pecan')), closed); });
    sayT('pecan', 300200, 123400, 'tarping the full nut trailer under the gray sky', 0);
    sayT('pecan', center[3][4][0] + 3000, center[3][4][1], 'flagging the next tree for the shaker', 1.57);
    sayT('pecan', center[2][6][0] - 2500, center[2][6][1], 'raking nuts out from around a trunk', 4.7);
    sayT('pecan', center[0][2][0] + 2000, center[0][2][1] - 500, 'cracking a nut open to check the fill', 0);
  }

  // ================================================================= 4,3 Cottonwood Wash date grove: the late Medjool pick
  if (AC.date.stage === 'harvest') {
    const WHO = {wokenBy: 'the date picking crew', how: 'woke high in a picking tower above the fronds'};
    [36652, 36653, 36654].map(id => byId[id]).filter(Boolean).forEach((r, i) => hatch('lot', C.yellow, r.pts, 'dots', 600, 0, Object.assign({part: 'sand alley swept for the late Medjool pick, alley ' + (i + 1)}, tag('date')), C.curb));
    const yA = 286750, yB = 291250;
    const tower = [[-1200, -2000, 0], [1200, -2000, 0], [1200, 2000, 0], [-1200, 2000, 0], [-1200, -2000, 0], [-1200, -2000, 1200], [1200, -2000, 1200], [1200, 2000, 1200], [-1200, 2000, 1200], [-1200, -2000, 1200], [0, 0, 1200], [0, 0, 4600], [-900, -900, 4600], [900, -900, 4600], [900, 900, 4600], [-900, 900, 4600], [-900, -900, 4600], [-900, -900, 5600], [900, -900, 5600], [900, 900, 5600], [-900, 900, 5600], [-900, -900, 5600]];
    const tp = [P(359500, yA), P(384500, yA), P(386300, yA), P(386300, yB), P(384500, yB), P(359500, yB), P(359300, yB), P(359300, yA), P(359500, yA)];
    rig('4:3', 'date', 'date picking tower creeping down the row', C.yellow, tp, 500, tower, [['driving the picking tower to the next palm'], ['cutting a bunch of Medjools into the tower basket', 4600]], WHO);
    const bt = tractor.concat([[0, -1700, 500], [0, -2600, 500], [-1200, -2600, 500], [1200, -2600, 500], [1200, -8000, 500], [-1200, -8000, 500], [-1200, -2600, 500], [-1000, -2800, 1250], [1000, -2800, 1250], [1000, -4000, 1250], [-1000, -4000, 1250], [-1000, -2800, 1250], [-1000, -5000, 1250], [1000, -5000, 1250], [1000, -6200, 1250], [-1000, -6200, 1250], [-1000, -5000, 1250]]);
    rig('4:3', 'date', 'tractor with a trailer of field bins', C.car2, [P(360000, 281300), P(385000, 281300), P(385000, 282300), P(360000, 282300), P(360000, 281300)], 1500, bt, [['towing full bins to the packing shed']], WHO);
    for (let i = 0; i < 4; i++) { const y = 282700 + i * 1300;
      line('lot', C.struct, rect(356800, y, 358000, y + 1200, 750), Object.assign({part: 'field bin of cut Medjool bunches, ' + (i + 1)}, tag('date')), closed);
      line('lot', C.brick, rect(356950, y + 150, 357850, y + 1050, 900), Object.assign({part: 'cut Medjool bunches heaped in the bin'}, tag('date')), closed); }
    const bag = byId[36660];
    if (bag) [[383850, 289000], [383850, 293500], [383000, 303000]].forEach(([x, y], i) => line('lot', C.yellow, bag.pts.map(p => P(p[0] - 361850 + x + 300, p[1] - 284500 + y + 200, p[2])), Object.assign({part: 'paper bag still on an unpicked bunch, east end, ' + (i + 1)}, tag('date')), closed));
    sayT('date', 359000, 284600, 'tallying full bins on the headland', 1.57);
    sayT('date', 372000, 289200, 'catching a dropped strand of dates', 0);
  }

  // ================================================================= 5,2 Datura Wash yard: round cotton modules on the pad
  if (AC.cotton.stage === 'harvest') {
    const pad = byId[36818];
    if (pad) hatch('lot', C.lot, pad.pts, 'dots', 700, 0, Object.assign({part: 'module pad filling with round modules from the picker'}, tag('cotton')), 11);
    [[435900, 223000], [438200, 223000], [440500, 223000], [435900, 225100], [438200, 225100]].forEach(([x, y], i) => {
      line('lot', C.yellow, circ(x, y, 1050, 2300, 12), Object.assign({part: 'round cotton module in yellow wrap, just set on the pad, ' + (i + 1)}, tag('cotton')), closed);
      line('lot', C.yellow, circ(x, y, 1050, 100, 12), Object.assign({part: 'module base on the pad, ' + (i + 1)}, tag('cotton')), closed); });
    sym('vehicle', C.car2, 'truck', P(440800, 227400), Math.PI / 2, Object.assign({part: 'module truck with its chain bed tipped, unloading'}, tag('cotton')));
    sayT('cotton', 440600, 225300, 'writing the field number on a new module', 3.14);
  }

  for (const c of k.calls) { const a = c.args; if (!a || !a.meta || !a.meta.farmStage) continue; a.meta.almanac = A.key; }
  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
