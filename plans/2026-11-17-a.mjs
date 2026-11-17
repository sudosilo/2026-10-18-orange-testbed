// Agent Orange 2026-11-17 a: farm stage growing on Pecan Hollow 3,1 and the date grove 4,3, new calendar boards,
// and deeper interiors in all fifteen shops and barns on the shell blocks 5,3, 6,2 and 7,4.
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
  let seed = 1117; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  const date = 'Day ' + day + '. Orbit ' + orbit + ', hectoday ' + hect + ', ' + md;
  for (const c of W.chunks.values()) for (const r of c.records) if (!r.hidden && r.agent === 'agent-orange' && r.meta && /Zion town clock and calendar board|Pecan Hollow season board/.test(r.meta.part || '')) push('remove', {id: r.id});
  sym('structure', C.sign, 'sign', P(610736, 171496), 0, {text: 'Zion calendar, kept by Marisol at the lookout. ' + date + '. Posted at ' + time + '. Farm season: ' + stage + '.', part: 'Zion town clock and calendar board'});
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover up between the rows, nuts sizing. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);

  // ================================================================= farm stage: growing, on Pecan Hollow 3,1 and the date grove on 4,3
  const FS = {farmStage: stage};
  // pecan rows: group the live trees by row, then lay a clover strip midway between each pair of rows
  {
    const trees = recsIn('3:1').filter(r => r.kind === 'symbol' && r.type === 'tree' && r.meta && r.meta.part === 'pecan tree').map(r => r.at);
    const cols = {}; for (const t of trees) (cols[t[0]] = cols[t[0]] || []).push(t);
    const cx = Object.keys(cols).map(Number).sort((a, b) => a - b); cx.forEach(x => cols[x].sort((a, b) => a[1] - b[1]));
    const nr = Math.min(...cx.map(x => cols[x].length)), rows = [];
    for (let i = 0; i < nr; i++) rows.push(cx.map(x => cols[x][i]));
    console.log('PECAN ROWS ' + rows.length + ' x ' + cx.length);
    for (let i = 0; i + 1 < rows.length; i++) {
      const a = rows[i], b = rows[i + 1], top = [], bot = [];
      for (let j = 0; j < a.length; j++) { const x = a[j][0], ym = (a[j][1] + b[j][1]) / 2; bot.push(P(x - (j === 0 ? 1500 : 0), ym - 1100)); top.push(P(x - (j === 0 ? 1500 : 0), ym + 1100)); }
      const xl = a[a.length - 1][0] + 1500, yl = (a[a.length - 1][1] + b[b.length - 1][1]) / 2; bot.push(P(xl, yl - 1100)); top.push(P(xl, yl + 1100));
      hatch('lot', C.veg2, [...bot, ...top.reverse()], 'dots', 350, 0, Object.assign({part: 'clover cover crop up between pecan rows ' + (i + 1) + ' and ' + (i + 2)}, FS), C.veg);
    }
    // flood water standing in one basin, the irrigation turn today
    { const a = rows[1], b = rows[2]; const pts = [];
      for (let j = 2; j <= 5; j++) pts.push(P(a[j][0], (a[j][1] + b[j][1]) / 2 - 700));
      for (let j = 5; j >= 2; j--) pts.push(P(a[j][0], (a[j][1] + b[j][1]) / 2 + 700));
      hatch('lot', C.plumb, pts, 'lines', 400, 0, Object.assign({part: 'flood irrigation water spreading down the basin'}, FS), C.lot); }
    const orch = [249000, 90500, 306500, 121000], st = site('3:1');
    const P31 = (pose, text) => { const c = st.floor(orch, 0, 0, true); if (!c) return miss(text); say(c[0], c[1], pose, text, Math.round(rnd() * 628) / 100); return c; };
    P31('standing', 'measuring a green pecan with calipers');
    P31('standing', 'turning the flood valve for the next basin');
    P31('standing', 'checking clover height with a boot toe');
    P31('standing', 'tagging a tree with scale on the bark');
    P31('standing', 'looking for aphids under a pecan leaf');
    const mw = P31('standing', 'hitching the flail mower to the tractor');
    if (mw) { line('vehicle', C.car2, rect(mw[0] + 600, mw[1] - 700, mw[0] + 3600, mw[1] + 700, 1500), Object.assign({part: 'orchard tractor, low profile, waiting by the mower'}, FS), closed);
      line('vehicle', C.yellow, rect(mw[0] - 2400, mw[1] - 900, mw[0] - 600, mw[1] + 900, 700), Object.assign({part: 'flail mower for the cover crop'}, FS), closed); }
  }
  {
    const palms = recsIn('4:3').filter(r => r.kind === 'symbol' && r.meta && r.meta.part === 'medjool date palm').map(r => r.at);
    const ys = [...new Set(palms.map(p => p[1]))].sort((a, b) => a - b);
    const xs = palms.map(p => p[0]); const xmin = Math.min(...xs) - 1500, xmax = Math.max(...xs) + 1500;
    for (let i = 0; i + 1 < ys.length; i++) { const ym = Math.round((ys[i] + ys[i + 1]) / 2);
      hatch('lot', C.yellow, rect(xmin, ym - 900, xmax, ym + 900, 0), 'lines', 500, 90, Object.assign({part: 'raked sand alley between palm rows, weeded for the growing season'}, FS), C.brick); }
    const grove = [xmin - 500, ys[0] - 2500, xmax + 500, ys[ys.length - 1] + 2500], st = site('4:3');
    const P43 = (pose, text) => { const c = st.floor(grove, 0, 0, true); if (!c) return miss(text); say(c[0], c[1], pose, text, Math.round(rnd() * 628) / 100); return c; };
    P43('standing', 'pulling a paper bag over a date bunch');
    P43('standing', 'thinning strands from a green date bunch');
    P43('standing', 'tying a heavy bunch down to a frond');
    P43('standing', 'steadying the orchard ladder for a picker');
    P43('standing', 'flushing a clogged drip emitter');
    // bunch bags hung high in a few palms
    for (const p of palms.filter((_, i) => i % 3 === 0)) line('lot', C.yellow, circ(p[0] + 600, p[1], 250, 4800, 6), Object.assign({part: 'paper bag over a ripening date bunch'}, FS), closed);
  }

  // ================================================================= deepen the shell blocks 5,3, 6,2 and 7,4
  const shopCeil = 3353, barnCeil = 6700;
  const rooms = (ox, oy) => ({
    sw: [ox, oy, ox + 15240, oy + 14000 - 2438], sm: [ox + 16764, oy, ox + 35052, oy + 14000 - 2438], se: [ox + 36576, oy, ox + 48768, oy + 14000 - 2438],
    bw: [ox, oy + 22500 + 2438, ox + 24384, oy + 34692], be: [ox + 27852, oy + 22500 + 2438, ox + 43092, oy + 34692]});
  const pp = (t) => ['p', 'standing', t];

  { const R = rooms(408432, 263744), ck = '5:3';
    D(ck, 'Bursage Flat Tamale House', R.sw, shopCeil, [
      ['f', 'stainless tamale steamer pot on a burner ring', C.int, 0, 0, 1100, {r: 320, n: 12}],
      ['f', 'masa spreading table with husk tubs', C.int, 1800, 750, 900],
      ['f', 'soaking tub of corn husks', C.plumb, 900, 600, 700],
      ['w', 'POS terminal and receipt printer shelf', C.elec, 900, 900, 1300],
      ['w', 'chalkboard of tamale fillings and dozen prices', C.sign, 1500, 1400, 2200],
      ['w', 'wall rack of husk bundles', C.yellow, 1200, 1200, 2000],
      ['o', 'outlet for the steamer timer', 1067],
      ['o', 'outlet for the receipt printer', 1067],
      ['c', 'pendant light over the masa table', C.elec, 140],
      pp('lifting the lid on a pot of steaming tamales'),
      pp('ringing up two dozen to go on the terminal')]);
    D(ck, 'Rabbitbrush Drip Irrigation Supply', R.sm, shopCeil, [
      ['f', 'spool rack of half inch drip tubing', C.int, 1800, 900, 1500, {check: ['shelf_height', 1500]}],
      ['f', 'pallet of filter housings', C.plumb, 1200, 1000, 900],
      ['f', 'bin table of barbed fittings', C.int, 1800, 800, 900],
      ['w', 'pegboard of punch tools and goof plugs', C.struct, 1800, 900, 1900],
      ['w', 'pressure regulator display board', C.plumb, 1200, 1100, 1700],
      ['w', 'card reader and cash drawer shelf', C.elec, 800, 900, 1200],
      ['o', 'outlet for the demo controller', 1067],
      ['c', 'LED panel over the fittings bins', C.elec, 140],
      pp('cutting drip tubing to length off the spool'),
      pp('reading a filter mesh rating to a farmer')]);
    D(ck, 'Gravel Bar Tractor Tire', R.se, shopCeil, [
      ['f', 'tire balancer with a wheel on the shaft', C.int, 900, 700, 1100],
      ['f', 'stack of rear tractor tires', C.curb, 0, 0, 1600, {r: 800, n: 14}],
      ['f', 'calcium chloride fill tank', C.plumb, 0, 0, 1200, {r: 450, n: 10}],
      ['w', 'rack of valve stems and tube patches', C.struct, 1200, 1000, 1800],
      ['w', 'air hose reel on the wall', C.plumb, 600, 1200, 1800],
      ['o', 'outlet for the balancer', 1067],
      ['c', 'shop light over the balancer', C.elec, 140],
      pp('spinning a front tire on the balancer'),
      pp('pumping ballast fluid into a rear tire')]);
    D(ck, 'Lone Burro Pivot Service Barn', R.bw, barnCeil, [
      ['f', 'pivot tower gearbox on a work stand', C.int, 900, 700, 1000],
      ['f', 'crate of sprinkler drops and pads', C.yellow, 1400, 1000, 800],
      ['f', 'welding cart with a wire feeder', C.elec, 800, 600, 1100],
      ['w', 'parts board of collector rings and tower boxes', C.elec, 1800, 1200, 2100],
      ['w', 'tool chest along the wall', C.int, 1500, 0, 1100],
      ['o', 'outlet for the welder', 1219],
      ['c', 'high bay light over the gearbox stand', C.elec, 140, 0],
      pp('shimming a tower gearbox on the stand'),
      pp('sorting sprinkler pads by nozzle size')]);
    D(ck, 'Tin Cup Chile Roasting Shed', R.be, barnCeil, [
      ['f', 'propane tank cage', C.plumb, 1200, 800, 1800],
      ['f', 'stack of empty chile sacks', C.yellow, 1100, 700, 500],
      ['f', 'peeling table with a drain', C.int, 1800, 750, 900],
      ['w', 'board of chile varieties and heat levels', C.sign, 1500, 1200, 2000],
      ['w', 'scale and receipt printer shelf', C.elec, 900, 900, 1300],
      ['o', 'outlet for the scale', 1067],
      ['c', 'high bay light over the peeling table', C.elec, 140, 0],
      pp('weighing a sack of green chile on the scale'),
      pp('hosing chile skins down the table drain')]);
  }
  { const R = rooms(487680, 184496), ck = '6:2';
    D(ck, 'Hackberry Draw Birria Counter', R.sw, shopCeil, [
      ['f', 'birria braising pot on a stock burner', C.int, 0, 0, 900, {r: 380, n: 12}],
      ['f', 'flat top griddle for the tacos', C.int, 1500, 700, 900],
      ['f', 'prep table with onion and cilantro pans', C.int, 1800, 750, 900],
      ['w', 'kitchen printer by the pass', C.elec, 500, 1300, 1600],
      ['w', 'menu board with consome cups', C.sign, 1800, 1500, 2300],
      ['w', 'card reader stand on the counter shelf', C.elec, 600, 1000, 1200],
      ['o', 'outlet for the kitchen printer', 1219],
      ['c', 'hood light over the griddle', C.elec, 140],
      pp('ladling consome into a foam cup'),
      pp('flipping a quesabirria on the griddle')]);
    D(ck, 'Ringtail Flats Baler Repair', R.sm, shopCeil, [
      ['f', 'baler knotter assembly on a bench', C.int, 1800, 800, 900],
      ['f', 'pallet of twine boxes', C.yellow, 1200, 1000, 900],
      ['f', 'parts washer tub', C.plumb, 1000, 700, 900],
      ['w', 'rack of plunger knives and shear bolts', C.struct, 1500, 1000, 1900],
      ['w', 'exploded view poster of a knotter', C.sign, 1000, 1300, 2100],
      ['o', 'outlet for the parts washer', 1067],
      ['c', 'LED panel over the knotter bench', C.elec, 140],
      pp('threading twine through a knotter needle'),
      pp('scrubbing a bill hook in the parts washer')]);
    D(ck, 'Fishhook Wash Pump and Motor Rewind', R.se, shopCeil, [
      ['f', 'coil winding machine', C.int, 1000, 700, 1100],
      ['f', 'varnish dip tank', C.plumb, 900, 700, 900],
      ['f', 'submersible pump motor on a cradle', C.int, 1800, 400, 600],
      ['w', 'spools of magnet wire on a wall rack', C.brick, 1200, 1100, 1900],
      ['w', 'surge tester on a shelf', C.elec, 700, 1100, 1500],
      ['o', 'outlet for the winding machine', 1067],
      ['c', 'shop light over the winder', C.elec, 140],
      pp('counting turns on the coil winder'),
      pp('lowering a stator into the varnish tank')]);
    D(ck, 'Mud Dauber Alfalfa Cubing Barn', R.bw, barnCeil, [
      ['f', 'stack of filled cube sacks on a pallet', C.yellow, 1200, 1000, 1300],
      ['f', 'molasses binder tote', C.brick, 1100, 1100, 1300],
      ['f', 'sack scale with a printer', C.elec, 900, 700, 900],
      ['w', 'moisture tester and log board', C.sign, 1200, 1200, 1900],
      ['w', 'dust mask and ear muff hooks', C.struct, 900, 1400, 1800],
      ['o', 'outlet for the sack scale', 1067],
      ['c', 'high bay light over the sacking line', C.elec, 140, 0],
      pp('probing a cube sack for moisture'),
      pp('writing a lot number on a sack')]);
    D(ck, 'Desert Broom Olive Press House', R.be, barnCeil, [
      ['f', 'stainless settling tank', C.plumb, 0, 0, 1800, {r: 600, n: 14}],
      ['f', 'bottling table with a filler', C.int, 1800, 750, 900],
      ['f', 'pallet of olive bins', C.veg, 1200, 1100, 900],
      ['w', 'shelf of labeled oil tins', C.yellow, 1500, 1200, 1800, {check: ['shelf_height', 1800]}],
      ['w', 'POS terminal by the tasting shelf', C.elec, 700, 1000, 1300],
      ['o', 'outlet for the bottle filler', 1067],
      ['c', 'high bay light over the bottling table', C.elec, 140, 0],
      pp('filling oil tins at the bottling table'),
      pp('pouring a tasting cup of new oil')]);
  }
  { const R = rooms(566928, 342992), ck = '7:4';
    D(ck, 'Bur Sage Machaca Kitchen', R.sw, shopCeil, [
      ['f', 'six burner range with a machaca pan', C.int, 1500, 800, 900],
      ['f', 'tortilla warmer cart', C.int, 900, 600, 1000],
      ['f', 'tub of shredded dried beef', C.brick, 0, 0, 800, {r: 300, n: 10}],
      ['w', 'kitchen ticket rail over the pass', C.elec, 1500, 1500, 1600],
      ['w', 'cash drawer and receipt printer shelf', C.elec, 900, 900, 1200],
      ['o', 'outlet for the tortilla warmer', 1067],
      ['c', 'pendant light over the range', C.elec, 140],
      pp('folding eggs and machaca into a tortilla'),
      pp('reading a ticket off the kitchen rail')]);
    D(ck, 'Sacaton Well Pump Supply', R.sm, shopCeil, [
      ['f', 'rack of drop pipe lengths', C.plumb, 1800, 700, 1300, {check: ['shelf_height', 1300]}],
      ['f', 'pallet of pressure tanks', C.plumb, 1200, 1100, 1400],
      ['f', 'reel of submersible pump cable', C.elec, 0, 0, 900, {r: 500, n: 12}],
      ['w', 'board of pressure switches and gauges', C.elec, 1500, 1100, 1800],
      ['w', 'well depth chart for the valley', C.sign, 1200, 1300, 2100],
      ['o', 'outlet for the pump test stand', 1067],
      ['c', 'LED panel over the cable reel', C.elec, 140],
      pp('cutting pump cable off the reel'),
      pp('charging a pressure tank with air')]);
    D(ck, 'Horned Lizard Tractor Radiator Shop', R.se, shopCeil, [
      ['f', 'radiator boil out tank', C.plumb, 1400, 800, 900],
      ['f', 'radiator on a solder bench', C.int, 1500, 700, 900],
      ['f', 'stack of recored tractor radiators', C.brick, 900, 600, 1400],
      ['w', 'rack of fan shrouds and caps', C.struct, 1200, 1000, 1900],
      ['o', 'outlet for the boil out heater', 1219],
      ['c', 'shop light over the solder bench', C.elec, 140],
      pp('flushing a radiator in the boil out tank'),
      pp('pressure testing a cap on the gauge')]);
    D(ck, 'Arrowweed Chile Ristra Barn', R.bw, barnCeil, [
      ['f', 'drying rack of hung ristras', C.brick, 1800, 900, 2100],
      ['f', 'bin of red pods waiting to be strung', C.brick, 1200, 1100, 900],
      ['f', 'spool cart of cotton string', C.int, 700, 600, 1000],
      ['w', 'order board of ristra lengths', C.sign, 1200, 1200, 1900],
      ['w', 'box fan on a wall bracket', C.elec, 600, 2000, 2600],
      ['o', 'outlet for the box fan cord', 1219],
      ['c', 'high bay light over the drying racks', C.elec, 140, 0],
      pp('hanging a finished ristra on the rack'),
      pp('cutting string to length for ristras')]);
    D(ck, 'Burrobush Citrus Packing House', R.be, barnCeil, [
      ['f', 'roller sorting table', C.int, 1800, 800, 900],
      ['f', 'carton forming station', C.yellow, 1100, 900, 900],
      ['f', 'pallet of packed lemon cartons', C.yellow, 1200, 1000, 1500],
      ['w', 'grade chart of fruit sizes and counts', C.sign, 1200, 1200, 1900],
      ['w', 'label printer on a shelf', C.elec, 700, 1100, 1500],
      ['o', 'outlet for the label printer', 1067],
      ['c', 'high bay light over the sorting table', C.elec, 140, 0],
      pp('folding a carton at the forming station'),
      pp('sticking a grade label on a carton')]);
  }

  if (ni) console.log('NAMED ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
