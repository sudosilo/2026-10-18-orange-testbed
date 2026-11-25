// Agent Orange 2026-11-25 a: Catclaw Bend Bearing and Belt Counter on 6,2, Nopal Flat Aguas Frescas Stand on 5,3, Mesa Verbena Frost Fan Service Shop on 7,4,
// all on the shared template pad east of the north row building, and new calendar and almanac boards.
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
  let seed = 1125; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 6,2 Catclaw Bend Bearing and Belt Counter, beside the baler repair shop
  {
    const p = pad(6, 2), {x0, y0, x1, y1} = p, N = 'Catclaw Bend Bearing and Belt Counter', H = 3658, CH = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.curb, vface(x0, y0, x1, y0, 0, H), 'brick', 400, 0, {building: N, part: 'painted concrete block, alley side'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'grease and dust at the base, west wall'}, C.curb);
    gableY(N, x0, y0, x1, y1, H + 100, C.brick, C.roof);
    door(N, x0 + 2700, y0, 'x', 914, 'parts counter front door', 1);
    door(N, x1, y0 + 1000, 'y', 1219, 'parts receiving door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 4200, y0 - 1000), 0, {text: N + '. Bearings, V belts, roller chain, sprockets and PTO shafts for balers and swathers'});
    sym('electrical', C.elec, 'light', P(x0 + 3200, y0 - 300, 2500), 0, Object.assign({building: N, part: 'light over the parts counter door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {building: N, part: 'sealed concrete floor with drip pans under the shelves'});
    R('parts counter', C.struct, 400, 1400, 2400, 1900, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the parts counter', C.int, 500, 1500, 800, 1750, 1150);
    R('receipt printer', C.curb, 950, 1500, 1200, 1750, 1170);
    R('cash drawer under the counter, empty', C.struct, 1350, 1450, 1850, 1850, 1000);
    R('card reader on the counter', C.int, 2050, 1550, 2200, 1750, 1120);
    R('bearing cross reference binder on the counter', C.sign, 2230, 1450, 2380, 1700, 1100);
    V('pegboard of V belts hung by length', C.brick, 120, 2400, 120, 3800, 600, 2000);
    V('bin shelf of sealed ball bearings by bore', C.curb, 5880, 2500, 5880, 3400, 300, 1829, {check: ['shelf_height', 1829]});
    R('spool rack of roller chain', C.struct, 3900, 3600, 5200, 4300, 1200);
    O('spool of number 60 roller chain', C.curb, 4200, 3950, 300, 1250, {n: 10});
    O('spool of number 80 roller chain', C.curb, 4900, 3950, 300, 1250, {n: 10});
    R('chain breaking bench', C.struct, 600, 4300, 2800, 4750, 914, {check: ['counter_height', 914]});
    R('chain breaker on the bench', C.int, 900, 4400, 1300, 4700, 1050);
    R('bearing press on the bench', C.int, 2000, 4400, 2400, 4700, 1300);
    R('PTO shaft halves laid on the floor', C.lot, 3000, 2600, 3500, 3200, 150);
    V('board of baler knotter parts on hooks', C.sign, 2900, 4880, 3700, 4880, 1200, 1900);
    R('hand sink', C.plumb, 5300, 250, 5800, 650, 900);
    V('100 A panel', C.elec, 5300, 4880, 5700, 4880, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the chain rack', 4500, 3000, CH);
    Sy('light', 'light over the chain bench', 1700, 3300, CH);
    Sy('light', 'light over the parts counter', 1400, 2300, CH);
    Sy('switch', 'switch by the front door', 3900, 120, 1219);
    Ot('outlet for the bearing press', 120, 4500, 1067);
    Ot('outlet at the parts counter', 120, 1700, 1067);
    Ot('outlet by the sink', 4900, 120, 457);
    services(N, p, 5500, 4700, 5550, 450);
    hatch('paving', C.curb, rect(x0 + 2400, y0 - 1600, x0 + 3900, y0, 0), 'dots', 600, 0, {part: 'concrete step at the parts counter door'});
    sym('vehicle', C.car2, 'truck', P(x0 + 8400, y0 + 1600), 0, {part: 'parts delivery van backed to the receiving door'});
    sy(3300, 3900, 'standing', 'measuring a worn V belt against the pegboard', 1.57);
    sy(1700, 3700, 'standing', 'breaking roller chain to length for a baler', 0);
    sy(1400, 2400, 'standing', 'looking up a bearing number in the binder', 3.14);
    sy(1200, 800, 'standing', 'holding out a seized pickup bearing', 0);
    sy(7200, 2400, 'standing', 'carrying a carton of bearings off the van', 4.7);
  }

  // ================================================================= 5,3 Nopal Flat Aguas Frescas Stand, beside the tamale house
  {
    const p = pad(5, 3), {x0, y0, x1, y1} = p, N = 'Nopal Flat Aguas Frescas Stand', H = 3353, CH = 2743;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, H), 'lines', 300, 90, {building: N, part: 'painted stucco with a hand lettered menu band, alley side'}, C.brick);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 800), 'gradient', 300, 0, {building: N, part: 'splash stain at the base, east wall'}, C.curb);
    gravel(N, x0, y0, x1, y1, H + 300, C.curb, C.struct);
    door(N, x0 + 2200, y0, 'x', 914, 'stand front door', 1);
    door(N, x1, y0 + 3200, 'y', 914, 'stand back door to the ice chest', -1);
    sym('structure', C.sign, 'sign', P(x0 + 4200, y0 - 1000), 0, {text: N + '. Horchata, jamaica, tamarindo and watermelon by the cup or the jug'});
    sym('electrical', C.elec, 'light', P(x0 + 2600, y0 - 300, 2400), 0, Object.assign({building: N, part: 'light over the stand window'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 600, 90, {building: N, part: 'white beadboard ceiling', checks: [['ceiling_height', CH]]});
    hatch('structure', C.brick, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'red quarry tile floor'});
    R('service counter at the window', C.struct, 3200, 1200, 5600, 1700, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the service counter', C.int, 3300, 1300, 3600, 1550, 1150);
    R('receipt printer', C.curb, 3750, 1300, 4000, 1550, 1170);
    R('cash drawer, empty, cups stacked on it out of habit', C.struct, 4150, 1250, 4650, 1650, 1000);
    R('card reader', C.int, 4800, 1350, 4950, 1550, 1120);
    R('stack of lidded cups and straws', C.curb, 5100, 1300, 5450, 1600, 1300);
    O('glass vitrolero of horchata', C.curb, 600, 1500, 220, 1500, {n: 12});
    O('glass vitrolero of jamaica', C.brick, 1150, 1500, 220, 1500, {n: 12});
    O('glass vitrolero of tamarindo', C.struct, 1700, 1500, 220, 1500, {n: 12});
    O('glass vitrolero of watermelon', C.car2, 2250, 1500, 220, 1500, {n: 12});
    R('back bar under the vitroleros', C.struct, 350, 1250, 2550, 1750, 1067, {check: ['counter_height', 1067]});
    R('fruit cutting table', C.struct, 600, 2600, 2400, 3400, 914, {check: ['counter_height', 914]});
    R('cutting board with half a watermelon', C.car2, 900, 2800, 1500, 3200, 960);
    R('blender on the cutting table', C.int, 1900, 2800, 2200, 3100, 1300);
    R('ice chest by the back door', C.plumb, 4300, 3800, 5600, 4600, 900);
    R('sacks of rice and dried jamaica flowers', C.brick, 600, 4100, 1800, 4700, 600);
    R('three compartment sink', C.plumb, 2600, 4200, 4000, 4750, 900);
    V('menu board with blank spaces where the prices go', C.sign, 5880, 1900, 5880, 2900, 1300, 2100);
    R('hand sink', C.plumb, 5300, 250, 5800, 650, 900);
    V('60 A panel', C.elec, 120, 3000, 120, 3500, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'light over the cutting table', 1500, 3000, CH);
    Sy('light', 'light over the window counter', 4400, 2300, CH);
    Sy('switch', 'switch by the front door', 3400, 120, 1219);
    Ot('outlet for the blender', 120, 2800, 1067);
    Ot('outlet behind the service counter', 5880, 1400, 1067);
    Ot('outlet for the ice chest', 5880, 4400, 457);
    services(N, p, 300, 3250, 5550, 450);
    hatch('paving', C.curb, rect(x0 + 1900, y0 - 1600, x0 + 3400, y0, 0), 'dots', 600, 0, {part: 'concrete step at the stand door'});
    sym('structure', C.curb, 'bench', P(x0 + 4600, y0 - 1400), 0, {part: 'bench under the stand window'});
    sy(4400, 2400, 'standing', 'ladling jamaica into a cup', 3.14);
    sy(1500, 2150, 'standing', 'cubing watermelon for the next jug', 0);
    sy(3300, 3500, 'standing', 'straining soaked rice for horchata', 0);
    sy(4300, 600, 'standing', 'ordering a large horchata for a field crew', 0);
    sy(1200, 800, 'standing', 'waiting with two empty gallon jugs', 0);
  }

  // ================================================================= 7,4 Mesa Verbena Frost Fan Service Shop, beside the citrus packing house
  {
    const p = pad(7, 4), {x0, y0, x1, y1} = p, N = 'Mesa Verbena Frost Fan Service Shop', H = 3962, CH = 3353;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.lot, vface(x0, y0, x1, y0, 0, H), 'lines', 450, 0, {building: N, part: 'tan ribbed metal siding, alley side'}, C.curb);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'oil and dust at the base, west wall'}, C.curb);
    shed(N, x0, y0, x1, y1, H + 100, C.car2, C.roof, true);
    door(N, x0 + 2700, y0, 'x', 914, 'frost fan shop front door', -1);
    door(N, x1, y0 + 1000, 'y', 1219, 'frost fan shop roll in door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 4400, y0 - 1000), 0, {text: N + '. Wind machine gearboxes, fan blades and orchard heaters, ready before the first freeze'});
    sym('electrical', C.elec, 'light', P(x0 + 3200, y0 - 300, 2600), 0, Object.assign({building: N, part: 'light over the frost fan shop door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, CH), 'lines', 1219, 90, {building: N, part: 'white steel liner panel ceiling', checks: [['ceiling_height', CH]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 450, 0, {building: N, part: 'concrete floor with oil dry on the stains'});
    R('wind machine gearbox on a repair stand', C.lot, 3900, 3600, 5200, 4600, 1100);
    O('gearbox output shaft, turning on the test motor', C.curb, 4550, 4100, 200, 1200, {n: 10, anim: {type: 'spin', rpm: 30}});
    R('two blade frost fan prop laid on sawhorses', C.struct, 400, 2600, 3400, 3000, 800);
    R('blade balancing stand', C.int, 3500, 2500, 3800, 3100, 900);
    R('shop counter', C.struct, 400, 1200, 1800, 1700, 1067, {check: ['counter_height', 1067]});
    R('POS terminal at the shop counter', C.int, 500, 1300, 800, 1550, 1150);
    R('receipt printer', C.curb, 900, 1300, 1150, 1550, 1170);
    R('cash drawer, empty', C.struct, 1250, 1250, 1650, 1650, 1000);
    R('card reader', C.int, 1680, 1300, 1780, 1500, 1120);
    R('workbench with gear oil and seal kits', C.struct, 600, 4300, 2800, 4750, 914, {check: ['counter_height', 914]});
    R('drums of gear oil', C.plumb, 3000, 4300, 3600, 4750, 900);
    for (let i = 0; i < 3; i++) O('return stack orchard heater, cleaned, ' + (i + 1), C.curb, 4400 + 450 * i, 1800, 180, 900, {n: 8});
    V('board of orchards and their frost fans by tower number', C.sign, 120, 1900, 120, 2400, 1200, 1900);
    V('thermometer and freeze alarm on the wall', C.elec, 4200, 4880, 4500, 4880, 1500, 1800, {disc: 'electrical'});
    R('hand sink', C.plumb, 5300, 250, 5800, 650, 900);
    V('100 A panel', C.elec, 5880, 3400, 5880, 3900, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'high bay light over the gearbox stand', 4300, 3300, CH);
    Sy('light', 'light over the fan blades', 1800, 3500, CH);
    Sy('switch', 'switch by the front door', 2400, 120, 1219);
    Ot('outlet for the test motor', 5880, 4400, 1067);
    Ot('outlet at the counter', 120, 1500, 1067);
    Ot('outlet over the workbench', 120, 4500, 1067);
    services(N, p, 5700, 3650, 5550, 450);
    line('vehicle', C.lot, rect(x0 + 7000, y0 + 500, x0 + 8800, y0 + 6000, 900), {part: 'flatbed trailer with a frost fan tower head chained down'}, closed);
    sy(3600, 3350, 'standing', 'listening to a gearbox run on the test stand', 1.57);
    sy(2100, 2300, 'standing', 'filing a nick out of a fan blade', 0);
    sy(1100, 600, 'standing', 'signing out a gearbox for the north grove', 0);
    sy(4900, 2400, 'standing', 'wiping soot from an orchard heater stack', 3.14);
  }
  for (const c of k.calls) { const a = c.args; if (!a || !a.meta || !a.meta.farmStage) continue; a.meta.almanac = A.key; }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
