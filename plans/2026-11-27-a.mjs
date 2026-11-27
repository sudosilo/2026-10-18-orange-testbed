// Agent Orange 2026-11-27 a: Frostline Reefer Unit Repair on 7,1, Dogweed Tool Rental Counter on 10,4, Sweet Acacia Lock and Key on 9,2,
// small named shops on free ground of the oldest warehouse blocks, and new calendar and almanac boards.
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
  let seed = 1127; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= services for a small building on an old warehouse block
  // pole: [x, y] of the pole the drop comes from. water: [x, y, z] point on the water main. sewer: list of [x, y, z] from under the sink to the main.
  function svc(N, x0, y0, panel, sink, pole, waterY, sewer) {
    const [pu, pv] = panel, [su, sv] = sink, px = x0 + pu, py = y0 + pv, sx = x0 + su, sy = y0 + sv;
    run('electrical', C.elec, [P(pole[0], pole[1], 6400), P(pole[0], pole[1], -760), P(pole[0], py, -760), P(px, py, -760), P(px, py, 1100)], {building: N, part: 'underground service from the alley pole to the panel'});
    run('plumbing', C.plumb, [P(sx, sy, 800), P(sx, sy, -1067), P(sx, waterY, -1219)], {building: N, part: 'cold water from the main to the hand sink'});
    run('plumbing', C.sewer, [P(sx + 200, sy, -300)].concat(sewer.map(p => P(p[0], p[1], p[2]))), {building: N, part: 'sink drain to the sewer'});
  }

  // ================================================================= 7,1 Frostline Reefer Unit Repair, north of the cold storage, east of the pallet shed
  {
    const x0 = 592736, y0 = 139248, x1 = x0 + 7000, y1 = y0 + 5000, N = 'Frostline Reefer Unit Repair', H = 3962, CH = 3353;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.plumb, vface(x1, y0, x1, y1, 0, H), 'lines', 450, 0, {building: N, part: 'white insulated metal panels, east side'}, C.curb);
    hatch('structure', C.struct, vface(x0, y1, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'road dust at the base, alley side'}, C.curb);
    shed(N, x0, y0, x1, y1, H + 100, C.curb, C.roof, false);
    door(N, x1, y0 + 1300, 'y', 914, 'reefer shop front door', -1);
    door(N, x0, y0 + 1600, 'y', 1219, 'reefer unit receiving door', 1);
    sym('structure', C.sign, 'sign', P(x1 + 1000, y0 + 3200), 0, {text: N + '. Trailer and truck refrigeration units, recovery, recharge and fault codes'});
    sym('electrical', C.elec, 'light', P(x1 + 300, y0 + 2600, 2500), 0, Object.assign({building: N, part: 'light over the reefer shop door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 1219, 0, {building: N, part: 'white steel liner panel ceiling', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 450, 0, {building: N, part: 'sealed concrete floor with oil spots'});
    R('service counter', C.struct, 4400, 3800, 6400, 4300, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the service counter', C.int, 4500, 3900, 4800, 4150, 1150);
    R('receipt printer', C.curb, 4900, 3900, 5150, 4150, 1170);
    R('cash drawer under the counter, empty', C.struct, 5300, 3850, 5800, 4250, 1000);
    R('card reader', C.int, 5900, 3950, 6050, 4150, 1120);
    R('trailer reefer unit on a repair stand', C.plumb, 1500, 2700, 3300, 4300, 1800);
    O('reefer condenser fan, running on test', C.curb, 2400, 3500, 350, 1850, {n: 12, anim: {type: 'spin', rpm: 40}});
    R('refrigerant recovery machine', C.int, 3700, 3600, 4100, 4000, 600);
    O('refrigerant recovery cylinder, gray with a yellow top', C.curb, 3500, 1800, 150, 1000, {n: 10});
    R('vacuum pump and gauge manifold on a cart', C.struct, 3600, 2300, 4200, 2800, 900);
    R('workbench with a brazing torch', C.struct, 600, 250, 3000, 750, 914, {check: ['counter_height', 914]});
    O('nitrogen bottle chained to the bench end', C.plumb, 3200, 500, 120, 1500, {n: 8});
    V('shelf of compressor belts, filters and door seals', C.brick, 3400, 120, 4400, 120, 300, 1829, {check: ['shelf_height', 1829]});
    V('board of reefer fault codes by unit make', C.sign, 3300, 4880, 4200, 4880, 1200, 1900);
    R('hand sink', C.plumb, 6300, 250, 6800, 650, 900);
    V('100 A panel', C.elec, 300, 4880, 700, 4880, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the reefer stand', 2000, 2300, CH);
    Sy('light', 'light over the service counter', 5300, 3300, CH);
    Sy('light', 'light over the workbench', 1500, 1300, CH);
    Sy('switch', 'switch by the front door', 6880, 2400, 1219);
    Ot('outlet for the recovery machine', 3900, 4880, 457);
    Ot('outlet over the workbench', 120, 600, 1067);
    Ot('outlet behind the service counter', 6880, 3300, 1067);
    svc(N, x0, y0, [500, 4700], [6550, 450], [593880, 148752], 148652, [[x0 + 6750, y0 + 450, -600], [x0 + 6750, 147300, -900], [565780, 147300, -1700], [565780, 147452, -1700]]);
    line('vehicle', C.plumb, rect(x0 + 1000, y1 + 1300, x0 + 5600, y1 + 3000, 1300), {part: 'reefer trailer nose with its unit opened, waiting in the alley'}, closed);
    sy(2400, 2300, 'standing', 'reading suction pressure off the gauge manifold', 0);
    sy(1800, 1200, 'standing', 'brazing a cracked condenser line at the bench', 3.14);
    sy(5400, 4600, 'standing', 'printing a repair ticket for a reefer unit', 3.14);
    sy(5400, 3300, 'standing', 'asking when the trailer unit will hold zero degrees', 0);
    sy(-1500, 2200, 'standing', 'rolling a reefer compressor in on a pallet jack', 1.57);
  }

  // ================================================================= 10,4 Dogweed Tool Rental Counter, north of the contractor counter
  {
    const x0 = 842480, y0 = 380992, x1 = x0 + 8000, y1 = y0 + 3200, N = 'Dogweed Tool Rental Counter', H = 3658, CH = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x1, y0, x1, y1, 0, H), 'lines', 400, 0, {building: N, part: 'yellow painted metal siding, rental yard side'}, C.curb);
    hatch('structure', C.struct, vface(x0, y1, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'dust at the base, alley side'}, C.curb);
    gableX(N, x0, y0, x1, y1, H + 100, C.car2, C.roof);
    door(N, x1, y0 + 1000, 'y', 914, 'tool rental front door', -1);
    sym('structure', C.sign, 'sign', P(x1 + 1200, y0 + 2600), 0, {text: N + '. Compactors, mixers, breakers, augers and scaffold by the day'});
    sym('electrical', C.elec, 'light', P(x1 + 300, y0 + 2200, 2500), 0, Object.assign({building: N, part: 'light over the rental door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {building: N, part: 'concrete floor scuffed by equipment wheels'});
    R('rental counter', C.struct, 5600, 700, 6100, 2500, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the rental counter', C.int, 5700, 800, 5950, 1100, 1150);
    R('receipt printer', C.curb, 5700, 1250, 5950, 1500, 1170);
    R('cash drawer, empty under the counter', C.struct, 5650, 1600, 6050, 2050, 1000);
    R('card reader', C.int, 5750, 2150, 5950, 2300, 1120);
    V('rate board with blank spaces where the day rates go', C.sign, 6400, 3080, 7400, 3080, 1300, 2100);
    V('rack of rotary hammers and demolition breakers', C.brick, 600, 120, 2400, 120, 300, 1829, {check: ['shelf_height', 1829]});
    V('pegboard of trowels, floats and screeds', C.curb, 1200, 3080, 2600, 3080, 900, 2000);
    R('carpet cleaner and floor sander lined up', C.int, 2800, 500, 4200, 1100, 900);
    R('post hole auger, cleaned and tagged', C.lot, 2800, 2000, 3700, 2500, 400);
    R('return desk with tag printer and log book', C.struct, 4300, 2400, 5200, 2900, 762);
    R('hand sink', C.plumb, 300, 2550, 800, 2950, 900);
    V('100 A panel', C.elec, 120, 1200, 120, 1700, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the tool racks', 1500, 1600, CH);
    Sy('light', 'light over the returns', 3800, 1600, CH);
    Sy('light', 'light over the rental counter', 6800, 1600, CH);
    Sy('switch', 'switch by the front door', 7880, 2200, 1219);
    Ot('outlet by the panel', 120, 600, 457);
    Ot('outlet at the rental counter', 7880, 2700, 1067);
    Ot('outlet for the tag printer', 4800, 3080, 457);
    svc(N, x0, y0, [120, 1450], [550, 2750], [841624, 386496], 386396, [[x0 + 750, y0 + 2750, -600], [x0 + 750, 385196, -900], [803524, 385196, -1700]]);
    line('structure', C.yellow, rect(x1 + 800, y0 + 300, x1 + 1500, y0 + 900, 1000), {part: 'plate compactor on the ready line'}, closed);
    line('structure', C.brick, circ(x1 + 2400, y0 + 600, 400, 1100, 10), {part: 'towable concrete mixer drum'}, closed);
    line('structure', C.struct, rect(x1 + 3200, y0 + 200, x1 + 4700, y0 + 1000, 1500), {part: 'stack of scaffold frames on dunnage'}, closed);
    sym('vehicle', C.car2, 'truck', P(x1 + 3200, y0 + 2100), -1.57, {part: 'customer pickup backing up to the mixer'});
    sy(5100, 1600, 'standing', 'writing up a plate compactor for the day', -1.57);
    sy(6800, 1300, 'standing', 'renting a plate compactor for a patio base', 1.57);
    sy(3500, 1500, 'standing', 'checking a returned breaker for chipped bits', 0);
    sy(x1 - x0 + 1600, 1500, 'standing', 'hitching the towable mixer to a pickup', -1.57);
  }

  // ================================================================= 9,2 Sweet Acacia Lock and Key, behind the HVAC supply on the street side
  {
    const x0 = 728232, y0 = 171496, x1 = x0 + 8000, y1 = y0 + 3200, N = 'Sweet Acacia Lock and Key', H = 3353, CH = 2743;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, H), 'brick', 400, 0, {building: N, part: 'red painted block storefront, street side'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 800), 'gradient', 300, 0, {building: N, part: 'dust at the base, west wall'}, C.curb);
    hip(N, x0, y0, x1, y1, H + 100, C.brick, C.roof);
    door(N, x0 + 6400, y0, 'x', 914, 'lock shop front door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 3800, y0 - 1000), 0, {text: N + '. Keys cut, locks rekeyed, safes opened, lockouts'});
    sym('electrical', C.elec, 'light', P(x0 + 6800, y0 - 300, 2400), 0, Object.assign({building: N, part: 'light over the lock shop door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 610, 0, {building: N, part: 'pressed tin ceiling, painted white', checks: [['ceiling_height', CH]]});
    hatch('structure', C.lot, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 45, {building: N, part: 'checkered vinyl tile floor'});
    R('key counter', C.struct, 1800, 1200, 5200, 1700, 1067, {check: ['counter_height', 1067]});
    R('key duplicating machine on the counter', C.int, 2000, 1300, 2500, 1600, 1250);
    R('high security key machine', C.int, 2800, 1300, 3300, 1600, 1250);
    R('POS terminal on the key counter', C.int, 3700, 1300, 4000, 1550, 1150);
    R('receipt printer', C.curb, 4100, 1300, 4350, 1550, 1170);
    R('cash drawer, empty', C.struct, 4450, 1250, 4950, 1650, 1000);
    R('card reader', C.int, 5000, 1350, 5150, 1550, 1120);
    V('wall of key blanks on hooks', C.yellow, 1500, 3080, 3500, 3080, 1000, 2000);
    V('display of lock cylinders and deadbolts', C.curb, 120, 1900, 120, 2900, 900, 1800);
    R('floor safe waiting on a combination change', C.struct, 600, 2200, 1300, 2800, 1100);
    R('rekeying bench', C.struct, 4000, 2500, 6200, 2950, 914, {check: ['counter_height', 914]});
    R('pinning kit tray on the bench', C.brick, 4200, 2600, 4700, 2850, 960);
    R('hand sink', C.plumb, 7300, 2550, 7800, 2950, 900);
    V('60 A panel', C.elec, 7880, 1000, 7880, 1500, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the key counter', 3000, 2100, CH);
    Sy('light', 'light over the rekeying bench', 5600, 2200, CH);
    Sy('light', 'light over the shop door', 6600, 900, CH);
    Sy('switch', 'switch by the front door', 6100, 120, 1219);
    Ot('outlet for the key machines', 1500, 3080, 1067);
    Ot('outlet over the rekeying bench', 6400, 3080, 1067);
    Ot('outlet by the panel', 7880, 700, 457);
    sym('electrical', C.elec, 'pole', P(732232, 168240), 0, {building: N, part: 'new pole set in the street side span for the lock shop'});
    svc(N, x0, y0, [7700, 1250], [7550, 2750], [732232, 168240], 168340, [[x0 + 7750, y0 + 2750, -600], [x0 + 7750, 169340, -2040]]);
    sym('vehicle', C.car2, 'truck', P(x0 + 2500, y0 - 2200), 1.57, {part: 'locksmith service van at the curb'});
    sy(3000, 2050, 'standing', 'cutting a house key on the duplicator', 3.14);
    sy(5000, 2150, 'standing', 'pinning a rekeyed cylinder for a new tenant', 0);
    sy(3600, 700, 'standing', 'waiting on two copies of a gate key', 0);
    sy(1000, 600, 'standing', 'reading the deadbolt prices that are not there', 4.7);
  }
  for (const c of k.calls) { const a = c.args; if (!a || !a.meta || !a.meta.farmStage) continue; a.meta.almanac = A.key; }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
