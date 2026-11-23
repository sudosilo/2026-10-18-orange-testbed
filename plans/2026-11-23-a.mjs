// Agent Orange 2026-11-23 a: Paperflower Branch Library north of the 2,3 alley, Mesquite Bloom Honey House on 3,3, Chukar Flats Farm Labor Office on 4,4,
// a pecan harvest crew on open orchard land 2,-4, and new calendar and almanac boards.
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
  let seed = 1123; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 2,3 Paperflower Branch Library, north of the shop row alley, facing the street
  {
    const N = 'Paperflower Branch Library', x0 = 186000, x1 = 198000, y0 = 289000, y1 = 298000, H = 4267, CH = 3353;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    push('define_lot', {color: C.lot, zone: 'civic, branch library', pts: rect(168500, 286500, 227700, 306900, 0)});
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    wall(N, [[x0, y0 + 6600], [x0 + 2600, y0 + 6600], [x0 + 2600, y1]], H, 0, false);
    hatch('structure', C.brick, vface(x0, y1, x1, y1, 0, H), 'brick', 300, 0, {building: N, part: 'slump block front, street side'}, C.struct);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, H), 'dots', 400, 0, {building: N, part: 'sand finish stucco, alley side'}, C.brick);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'dust at the base, east wall'}, C.curb);
    hip(N, x0, y0, x1, y1, H + 100, C.brick, C.yellow);
    door(N, x0 + 5500, y1, 'x', 1067, 'library front door', -1);
    door(N, x0 + 2600, y0 + 7300, 'y', 914, 'library restroom door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', CH]]});
    hatch('structure', C.int, rect(x0 + 2700, y0 + 100, x1 - 100, y1 - 100, 10), 'lines', 600, 0, {building: N, part: 'blue gray carpet tile'}, C.curb);
    hatch('structure', C.yellow, rect(x0 + 8200, y0 + 400, x0 + 11400, y0 + 2000, 20), 'dots', 300, 0, {building: N, part: 'round story time rug in the children\'s corner'}, C.brick);
    // circulation desk by the door, with the checkout gear
    R('circulation desk', C.struct, 3800, 6400, 7400, 7000, 1067, {check: ['counter_height', 1067]});
    R('checkout terminal with a barcode scanner', C.int, 4000, 6500, 4400, 6850, 1150);
    R('date due slip printer', C.curb, 4600, 6500, 4850, 6800, 1170);
    R('cash drawer for overdue fines, never opened', C.struct, 5100, 6500, 5600, 6900, 1000);
    R('card reader for copy cards', C.int, 5900, 6600, 6050, 6800, 1120);
    R('cart of returned books waiting to be checked in', C.brick, 6600, 5600, 7400, 6100, 1000);
    R('book drop bin under the wall slot', C.struct, 7800, 8200, 8700, 8800, 900);
    V('book return slot in the front wall', C.curb, 7900, 8880, 8600, 8880, 900, 1100);
    // stacks, west half, east west rows
    [1000, 2500, 4000, 5500].forEach((v, i) => R('double faced book stack, row ' + (i + 1), C.yellow, 600, v, 4600 + (i > 2 ? -1800 : 0), v + 500, 1829, i < 3 ? {check: ['shelf_height', 1829]} : {}));
    R('end panel sign, fiction A to L', C.sign, 4600, 1000, 4650, 1500, 1700);
    R('end panel sign, westerns and ranch history', C.sign, 4600, 2500, 4650, 3000, 1700);
    R('step stool in the stacks', C.curb, 2400, 3300, 2750, 3650, 380);
    // reading tables and chairs
    [[6000, 2200], [6000, 4200]].forEach(([u, v], i) => { R('oak reading table ' + (i + 1), C.struct, u, v, u + 2400, v + 1000, 762);
      [[u + 300, v - 500], [u + 1500, v - 500], [u + 300, v + 1100], [u + 1500, v + 1100]].forEach(([a, b], j) => R('reading chair ' + (i + 1) + '.' + (j + 1), C.brick, a, b, a + 450, b + 400, 450)); });
    R('green banker lamp on table 1', C.veg, 7100, 2550, 7300, 2750, 1150);
    // children's corner
    R('low picture book shelf', C.yellow, 8200, 2300, 11400, 2600, 1219, {check: ['shelf_height', 1219]});
    R('picture book bin on casters', C.brick, 11000, 1200, 11600, 1800, 600);
    R('child size table', C.struct, 9000, 900, 10200, 1500, 560);
    // public computers along the east wall
    R('public computer counter', C.struct, 11300, 3600, 11850, 6800, 762);
    [3900, 4900, 5900].forEach((v, i) => R('public computer monitor ' + (i + 1), C.int, 11500, v, 11700, v + 500, 1150));
    R('laser printer for the public computers', C.curb, 11300, 7100, 11850, 7700, 900);
    V('newspaper rack with the valley weekly', C.sign, 8900, 120, 10100, 120, 600, 1500);
    V('bulletin board of farm auctions and lost dogs', C.sign, 9000, 8880, 11200, 8880, 1100, 1900);
    V('rack of seed packets from the grange seed library', C.veg2, 11880, 7900, 11880, 8700, 900, 1700);
    // restroom
    R('toilet', C.plumb, 400, 8200, 900, 8800, 400);
    R('wall hung sink', C.plumb, 1600, 8500, 2200, 8880, 860);
    V('mirror over the sink', C.curb, 1600, 8880, 2200, 8880, 1100, 1800);
    V('grab bar beside the toilet', C.curb, 120, 7600, 120, 8500, 840, 880);
    V('hand dryer', C.int, 2480, 8200, 2480, 8500, 1000, 1300);
    V('200 A panel', C.elec, 10900, 120, 11600, 120, 1100, 1900, {disc: 'electrical'});
    O('restroom exhaust fan grille', C.curb, 1300, 7800, 140, CH - 40);
    for (const [u, v] of [[2200, 2400], [2200, 4800], [5000, 1500], [7200, 3200], [7200, 5200], [9800, 1800], [9800, 6200], [5600, 7800], [1300, 7800 - 600]]) Sy('light', 'LED troffer', u, v, CH);
    Sy('switch', 'switch bank by the front door', 5000, 8880, 1219);
    Sy('switch', 'restroom switch', 2720, 7000, 1219);
    Ot('outlet at the circulation desk', 3900, 6420, 1067);
    Ot('outlet under the computer counter, 1', 11880, 4300, 457);
    Ot('outlet under the computer counter, 2', 11880, 6100, 457);
    Ot('outlet for the printer', 11880, 7400, 457);
    Ot('outlet in the stacks for the vacuum', 120, 3300, 457);
    Ot('outlet by the newspaper rack', 10400, 120, 457);
    run('electrical', C.elec, [P(199072, 283484, 6400), P(199072, 283484, -760), P(197200, 283484, -760), P(197200, 289400, -760), P(197200, 289400, 1200)], {part: 'underground service from the alley pole to the library panel'});
    run('plumbing', C.plumb, [P(x0 + 1900, y0 + 8600, 800), P(x0 + 1900, y0 + 8600, -1067), P(x0 + 1900, 282032, -1219)], {part: 'cold water from the alley main to the library restroom'});
    run('plumbing', C.sewer, [P(x0 + 700, y0 + 8500, -300), P(x0 + 700, 282932, -2134)], {part: 'library restroom drain to the alley sewer'});
    // the front walk, the bike rack and the shade
    hatch('paving', C.curb, rect(x0 + 5000, y1, x0 + 6800, 307848, 0), 'lines', 600, 0, {part: 'broom finished walk to the library door', checks: [['sidewalk_width', 1800]]});
    sym('structure', C.sign, 'sign', P(x0 + 7600, y1 + 2400), 0, {text: N + '. Early hours for field crews, books, computers and the seed library'});
    sym('electrical', C.elec, 'light', P(x0 + 5200, y1 + 300, 2500), 0, Object.assign({building: N, part: 'light over the library door'}, night));
    line('paving', C.curb, [P(x0 + 8400, y1 + 3600, 0), P(x0 + 8400, y1 + 3600, 900), P(x0 + 10200, y1 + 3600, 900), P(x0 + 10200, y1 + 3600, 0)], {part: 'bike rack by the library walk'});
    sym('vehicle', C.car2, 'bike', P(x0 + 9000, y1 + 3900), 0, {part: 'bicycle locked at the rack'});
    sym('structure', C.struct, 'bench', P(x0 + 3600, y1 + 3000), 0, {part: 'bench under the mesquite'});
    line('vegetation', C.veg2, blob(x0 + 2400, y1 + 4200, 2600, 11, 3), {part: 'gravel planting bed with brittlebush and globe mallow'}, closed);
    line('vegetation', C.veg2, blob(x0 + 10800, y1 + 5600, 2200, 11, 7), {part: 'gravel planting bed with desert marigold'}, closed);
    sym('vegetation', C.veg, 'tree', P(x0 + 2400, y1 + 4200), 0, {species: 'velvet mesquite', anim: {type: 'sway', deg: 2, period: 6}});
    sym('vegetation', C.veg, 'tree', P(x0 + 10800, y1 + 5600), 0, {species: 'blue palo verde', anim: {type: 'sway', deg: 3, period: 5}});
    sy(7600, 8000, 'standing', 'emptying the overnight book drop into a cart', 3.14);
    sy(5000, 5900, 'standing', 'scanning in a stack of returned westerns', 0);
    sy(3400, 3300, 'standing', 'shelving returns in the ranch history stack', 1.57);
    sy(11000, 4400, 'sitting', 'printing a crew timesheet before the bus leaves', 0);
    sy(6500, 4000, 'sitting', 'reading the farm page of the valley weekly', 0);
    sy(1300, 7200, 'standing', 'mopping the restroom before the doors open', 0);
  }

  // ================================================================= 3,3 Mesquite Bloom Honey House, between the welding shop and the grange hall
  {
    const N = 'Mesquite Bloom Honey House', x0 = 261600, x1 = 268000, y0 = 270000, y1 = 275000, H = 3353, CH = 2896;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, H), 'lines', 300, 0, {building: N, part: 'painted plank siding, honey yellow'}, C.struct);
    hatch('structure', C.brick, vface(x0, y0, x0, y1, 0, 700), 'gradient', 300, 0, {building: N, part: 'dust at the base, west wall'}, C.struct);
    shed(N, x0, y0, x1, y1, H + 100, C.lot, C.roof, true);
    door(N, x0 + 900, y0, 'x', 914, 'honey house shop door', 1);
    door(N, x1, y0 + 2600, 'y', 1219, 'honey house loading door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 3000, y0 - 900), 0, {text: N + ', raw mesquite and catclaw honey, comb and wax'});
    sym('electrical', C.elec, 'light', P(x0 + 600, y0 - 300, 2400), 0, Object.assign({building: N, part: 'light over the honey house door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 900, 0, {building: N, part: 'white washable ceiling panels', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 400, 0, {building: N, part: 'sealed concrete floor sloped to the drain'});
    // the shop counter by the door
    R('honey shop counter', C.struct, 2200, 700, 4400, 1200, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the honey counter', C.int, 2350, 800, 2650, 1050, 1150);
    R('receipt printer', C.curb, 2800, 800, 3050, 1050, 1170);
    R('cash drawer under the counter top', C.struct, 3200, 800, 3700, 1150, 1000);
    R('card reader on the counter', C.int, 3850, 850, 4000, 1050, 1120);
    R('tray of pint jars of mesquite honey', C.yellow, 4100, 750, 4350, 1150, 1120);
    R('shelf of quart jars, comb honey and beeswax blocks', C.yellow, 300, 200, 1800, 500, 1524, {check: ['shelf_height', 1524]});
    // the extracting room
    R('stainless uncapping tank with a hot knife', C.curb, 400, 3600, 2000, 4500, 900);
    R('wax cappings basket in the tank', C.yellow, 600, 3750, 1800, 4350, 950);
    O('radial honey extractor drum', C.curb, 2900, 4000, 500, 1100, {n: 12});
    O('extractor reel, spinning', C.yellow, 2900, 4000, 400, 1150, {n: 8, anim: {type: 'spin', rpm: 90}});
    O('settling tank with a honey gate', C.curb, 4300, 4100, 450, 1300, {n: 12});
    R('honey sump strainer', C.yellow, 3500, 3500, 3800, 3800, 500);
    R('bottling bench with a jar filler', C.struct, 5200, 2600, 6100, 4100, 914, {check: ['counter_height', 914]});
    R('stack of honey supers full of capped frames', C.yellow, 4800, 300, 6100, 1500, 1200);
    R('hand truck for the supers', C.curb, 5600, 1700, 6000, 2200, 1100);
    R('hand sink', C.plumb, 300, 2400, 800, 2900, 900);
    R('floor drain', C.plumb, 3000, 2700, 3200, 2900, 15);
    V('veils, gloves and a smoker on pegs', C.curb, 120, 1200, 120, 2100, 1100, 1900);
    V('board of hive yards and pull dates', C.sign, 1400, 4880, 2800, 4880, 1100, 1800);
    V('100 A panel', C.elec, 6280, 4000, 6280, 4500, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'vapor tight light over the extractor', 2900, 3200, CH);
    Sy('light', 'vapor tight light over the bottling bench', 5000, 3300, CH);
    Sy('light', 'light over the shop counter', 3300, 1800, CH);
    Sy('switch', 'switch by the shop door', 1950, 120, 1219);
    Ot('outlet for the extractor', 2600, 4880, 457);
    Ot('outlet for the hot knife', 120, 3600, 1067);
    Ot('outlet at the honey counter', 4500, 120, 1067);
    Ot('outlet for the jar filler', 6280, 3600, 1067);
    run('electrical', C.elec, [P(246188, 266350, 6400), P(246188, 266350, -760), P(246188, 268600, -760), P(262200, 268600, -760), P(262200, 270400, -760), P(262200, 270400, 1200)], {part: 'underground service from the Yucca Avenue pole to the honey house panel'});
    run('plumbing', C.plumb, [P(x0 + 550, y0 + 2650, 800), P(x0 + 550, y0 + 2650, -1067), P(x0 + 550, 269200, -1067), P(235344, 269200, -1219)], {part: 'cold water from the Yucca Avenue main to the honey house sink'});
    run('plumbing', C.sewer, [P(x0 + 3100, y0 + 2800, -300), P(x0 + 3100, 269500, -500), P(234144, 269500, -2134)], {part: 'honey house floor drain to the Yucca Avenue sewer'});
    hatch('paving', C.curb, rect(x0 + 500, y0 - 1600, x0 + 2100, y0, 0), 'dots', 600, 0, {part: 'concrete step at the honey house door'});
    line('lot', C.struct, rect(x1 + 600, y0 + 1600, x1 + 1800, y0 + 2800, 140), {part: 'pallet of empty hive boxes by the loading door'}, closed);
    sy(2300, 3150, 'standing', 'loading capped frames into the extractor', 0);
    sy(1300, 3200, 'standing', 'slicing wax cappings off a frame with the hot knife', 1.57);
    sy(4750, 2950, 'standing', 'filling quart jars from the settling tank', 0);
    sy(3300, 300, 'standing', 'buying a pint of honey for the donut glaze', 0);
  }

  // ================================================================= 4,4 Chukar Flats Farm Labor Office, east of the melon packing shed
  {
    const N = 'Chukar Flats Farm Labor Office', x0 = 374500, x1 = 379500, y0 = 371500, y1 = 376500, H = 3048, CH = 2743;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.lot, vface(x1, y0, x1, y1, 0, H), 'lines', 450, 0, {building: N, part: 'corrugated steel siding, east face'}, C.curb);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 800), 'gradient', 300, 0, {building: N, part: 'dust at the base, south wall'}, C.curb);
    gableY(N, x0, y0, x1, y1, H + 100, C.int, C.roof);
    door(N, x1, y0 + 1200, 'y', 914, 'labor office door', -1);
    sym('structure', C.sign, 'sign', P(x1 + 2200, y0 + 400), 0, {text: N + '. Crews for the pecan sweep, onion transplant and wheat drilling. Buses leave at first light'});
    sym('electrical', C.elec, 'light', P(x1 + 300, y0 + 2400, 2400), 0, Object.assign({building: N, part: 'light over the labor office door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'vinyl tile floor, scuffed by work boots'});
    // the pay window counter
    R('pay window counter', C.struct, 600, 2600, 2600, 3100, 1067, {check: ['counter_height', 1067]});
    R('POS terminal for crew pay', C.int, 800, 2700, 1100, 2950, 1150);
    R('pay stub printer', C.curb, 1300, 2700, 1550, 2950, 1170);
    R('cash drawer, empty as always', C.struct, 1750, 2700, 2250, 3050, 1000);
    R('card reader for pay cards', C.int, 2350, 2750, 2500, 2950, 1120);
    R('contractor desk', C.struct, 400, 3800, 2000, 4500, 762);
    R('two way radio base on the desk', C.int, 500, 3900, 850, 4200, 900);
    R('filing cabinet of crew rosters', C.curb, 2400, 4300, 2900, 4800, 1321);
    R('sign up table with clipboards', C.struct, 2800, 700, 4200, 1300, 762);
    R('waiting bench along the south wall', C.struct, 400, 200, 2400, 600, 460);
    R('water cooler with a stack of paper cones', C.plumb, 4500, 3900, 4800, 4200, 1100);
    R('stack of empty crew water jugs', C.plumb, 4100, 4300, 4800, 4800, 500);
    V('time clock and card rack', C.int, 4880, 2400, 4880, 2900, 1100, 1700);
    V('crew board, today\'s fields and bus times', C.sign, 3200, 4880, 4600, 4880, 1100, 1900);
    V('heat safety and first aid poster', C.sign, 120, 1200, 120, 1900, 1200, 1800);
    V('first aid cabinet', C.brick, 120, 2200, 120, 2700, 1200, 1700);
    V('60 A panel', C.elec, 2000, 4880, 2400, 4880, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the pay window', 1600, 2000, CH);
    Sy('light', 'ceiling light over the crew board', 3700, 3700, CH);
    Sy('switch', 'switch by the labor office door', 4880, 800, 1219);
    Ot('outlet for the water cooler', 4880, 4100, 457);
    Ot('outlet at the pay window', 120, 3000, 1067);
    Ot('outlet by the desk', 120, 4300, 457);
    run('electrical', C.elec, [P(389854, 384740, 6400), P(389854, 384740, -760), P(376800, 384740, -760), P(376800, 376000, -760), P(376800, 376000, 1200)], {part: 'underground service from the Smoke Tree Avenue pole to the labor office panel'});
    hatch('paving', C.curb, rect(x1, y0 + 600, x1 + 1600, y0 + 2600, 0), 'dots', 600, 0, {part: 'gravel pad at the labor office door'});
    line('vehicle', C.white, rect(x1 + 3000, y0 - 1500, x1 + 5500, y0 + 8500, 2900), {part: 'white crew bus, engine idling, waiting for the pecan crew'}, closed);
    line('vehicle', C.plumb, rect(x1 + 3000, y0 + 9500, x1 + 5300, y0 + 13000, 2290), {part: 'toilet trailer hitched for the onion crew'}, closed);
    sy(1000, 1900, 'standing', 'handing out pay stubs at the window', 3.14);
    sy(4400, 2650, 'standing', 'punching in at the time clock', 0);
    sy(3500, 1700, 'standing', 'signing up for the onion transplant crew', 3.14);
    sy(3500, 3850, 'standing', 'reading the bus times on the crew board', 1.57);
    sy(1200, 400, 'sitting', 'waiting on the bench with a lunch cooler', 0);
    say(x1 + 2400, y0 + 6000, 'standing', 'counting heads at the bus door', 0);
  }

  // ================================================================= pecan harvest on open orchard land 2,-4
  // Unclaimed orchard land. Open layers only (vegetation, vehicle, activity), every record farm: true, tagged with the almanac stage.
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const FK = '2:-4', ox = 2 * S, oy = -4 * S, X = (u) => ox + u, Y = (v) => oy + v;
  if (AC.pecan.stage === 'harvest') {
    const WHO = {wokenBy: 'the open orchard pecan crew', how: 'woke to the rattle of nuts falling on a dry floor'};
    const T = tag('pecan');
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
    // tree rows sit every 7 m from 5.5 m in; the alleys run east west halfway between them
    const alley = (j) => 9000 + 7000 * j, W0 = 2000, E0 = 77700;
    const loop2 = (ja, jb) => [P(X(8000), Y(alley(ja))), P(X(E0), Y(alley(ja))), P(X(E0), Y(alley(jb))), P(X(W0), Y(alley(jb))), P(X(W0), Y(alley(ja))), P(X(8000), Y(alley(ja)))];
    const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];
    // the floor of the first six alleys mowed and rolled for the sweep
    for (let j = 0; j < 6; j++) line('vegetation', C.yellow, [P(X(5500), Y(alley(j) - 1600), 30), P(X(75500), Y(alley(j) - 1600), 30), P(X(75500), Y(alley(j) + 1600), 30), P(X(5500), Y(alley(j) + 1600), 30)], Object.assign({part: 'orchard floor mowed and rolled for the sweep, alley ' + (j + 1), species: 'pecan'}, T), closed);
    // windrows already swept in the first two alleys
    [0, 1].forEach(j => line('vegetation', C.brick, wavy(X(9000), Y(alley(j)), X(72000), Y(alley(j)), 180, 14, j + 2, 120), Object.assign({part: 'windrow of swept pecans, alley ' + (j + 1), species: 'pecan'}, T)));
    // nuts shaken onto the floor under the trees in rows five and six, not yet swept
    for (let i = 0; i < 10; i++) { const u = 5500 + 7000 * (2 + i % 5), v = 5500 + 7000 * (4 + Math.floor(i / 5));
      line('vegetation', C.brick, blob(X(u), Y(v), 1300, 9, i + 4, 40), Object.assign({part: 'pecans shaken onto the floor around a trunk', species: 'pecan'}, T), closed); }
    const shaker = [[-1200, -2200, 0], [1200, -2200, 0], [1200, 2200, 0], [-1200, 2200, 0], [-1200, -2200, 0], [-1200, -2200, 1800], [1200, -2200, 1800], [1200, 0, 1800], [-1200, 0, 1800], [-1200, -2200, 1800], [1200, 1200, 900], [3400, 1200, 900], [3400, 300, 900], [3400, 2100, 900], [1200, 1200, 900]];
    rig('self propelled trunk shaker working rows six and seven', C.yellow, loop2(5, 6), 800, shaker, 'shaking pecan trunks down row six');
    const sweeper = [[-1100, -1500, 0], [1100, -1500, 0], [1100, 1800, 0], [-1100, 1800, 0], [-1100, -1500, 0], [-1100, -1500, 1600], [1100, -1500, 1600], [1100, 1800, 1600], [-1100, 1800, 1600], [-1100, -1500, 1600], [-2600, 2000, 300], [2600, 2000, 300], [2600, 2600, 300], [-2600, 2600, 300], [-2600, 2000, 300]];
    rig('pecan sweeper blowing the floor into windrows', C.brick, loop2(3, 4), 1200, sweeper, 'sweeping the fourth alley into a windrow');
    const harvester = tractor.concat([[0, -1700, 500], [0, -2600, 500], [-1300, -2600, 400], [1300, -2600, 400], [1300, -7200, 400], [-1300, -7200, 400], [-1300, -2600, 400], [-1300, -7200, 2400], [1300, -7200, 2400], [1300, -5200, 2400], [-1300, -5200, 2400], [-1300, -7200, 2400], [1300, -4000, 2400], [2600, -4000, 3000]]);
    rig('tractor pulling a pecan harvester up the first windrows', C.car2, loop2(0, 1), 1000, harvester, 'running the harvester up the first windrow');
    // the nut cart shuttles along the south headland to the trailers on the farm track
    const cart = tractor.concat([[0, -1700, 500], [0, -2600, 500], [-1200, -2600, 600], [1200, -2600, 600], [1200, -5600, 600], [-1200, -5600, 600], [-1200, -2600, 600], [-1200, -2600, 1900], [1200, -2600, 1900], [1200, -5600, 1900], [-1200, -5600, 1900], [-1200, -2600, 1900]]);
    rig('tractor with a nut cart, heaped', C.struct, [P(X(20000), Y(2200)), P(X(46000), Y(2200)), P(X(46000), Y(4400)), P(X(20000), Y(4400)), P(X(20000), Y(2200))], 1800, cart.map(([a, b, c]) => [b, -a, c]), 'shuttling a nut cart to the trailers');
    [[48500, 1000], [54000, 1000], [59500, 1000]].forEach(([u, v], i) => {
      line('vehicle', C.struct, rect(X(u), Y(v), X(u + 4800), Y(v + 2400), 900), Object.assign({part: 'nut trailer on the farm track, ' + ['full and tarped', 'half full', 'empty, waiting'][i]}, T), closed);
      if (i < 2) line('vehicle', C.brick, rect(X(u + 150), Y(v + 150), X(u + 4650), Y(v + 2250), i ? 1500 : 2300), Object.assign({part: i ? 'field run pecans in the trailer bed' : 'tarp over a heaped nut trailer'}, T), closed); });
    sayP(57000, 4200, 'tying down the tarp on the full trailer', 0);
    sayP(52000, 4300, 'writing the orchard block on a trailer tag', 3.14);
    // a pickup parked out in the north alleys, two toilets on the west track, idle pipe at the north headland
    sym('vehicle', C.car, 'truck', P(X(33000), Y(alley(8))), Math.PI / 2, Object.assign({part: 'foreman pickup parked down the ninth alley'}, T));
    sayP(36000, alley(8) + 400, 'checking a sample of nuts for kernel color', 1.57);
    sayP(18500, 5500 + 7000 * 5 + 2200, 'tapping the next trunk with a flag for the shaker', 0);
    sayP(61000, alley(4) + 1700, 'raking nuts out from a low limb', 4.7);
    [[1500, 50000], [1500, 51600]].forEach(([u, v], i) => line('vehicle', C.plumb, rect(X(u - 575), Y(v - 575), X(u + 575), Y(v + 575), 2290), Object.assign({part: 'portable toilet on the west farm track, ' + (i + 1)}, T), closed));
    line('vehicle', C.curb, rect(X(1000), Y(52800), X(1700), Y(53300), 1000), Object.assign({part: 'hand wash station beside the toilets'}, T), closed);
    for (let i = 0; i < 9; i++) line('vehicle', C.curb, [P(X(20000), Y(76800 + (i % 3) * 260), 150 + Math.floor(i / 3) * 260), P(X(32000), Y(76800 + (i % 3) * 260), 150 + Math.floor(i / 3) * 260)], Object.assign({part: 'idle aluminum flood pipe stacked for the winter, ' + (i + 1)}, T));
    line('vehicle', C.struct, [P(X(19700), Y(76500), 0), P(X(19700), Y(76500), 1000), P(X(19700), Y(77600), 1000), P(X(19700), Y(77600), 0)], Object.assign({part: 'timber chock at the end of the pipe pile'}, T));
    sayP(26000, 75800, 'counting the pipe stacked on the north headland', 0);
  }
  // every record on 2,-4 carries farm: true so the orchard keeps showing
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === FK) a.meta = Object.assign(a.meta || {}, {farm: true}); }
  for (const c of k.calls) { const a = c.args; if (!a || !a.meta || !a.meta.farmStage) continue; a.meta.almanac = A.key; }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
