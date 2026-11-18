// Agent Orange 2026-11-18 a: growing stage on the pistachio and cotton yard 5,2, deeper interiors on 5,2, the landfill 11,3 and the Siloam Lake Boathouse 1,5,
// and new calendar boards.
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
  let seed = 1118; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover cut low between the rows, nuts filling. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);

  // ================================================================= farm stage on the pistachio and cotton yard 5,2: growing
  // The huller and the module barn are between seasons: bins stacked, tarps patched, the line down for service until harvest.
  const FS = {farmStage: stage};
  const pp = (t) => ['p', 'standing', t];
  {
    const st = site('5:2');
    const A = [434240, 221496, 442240, 226496], B = [452240, 221496, 460240, 226496];
    hatch('lot', C.lot, rect(A[0] + 300, A[1] + 300, A[2] - 300, A[3] - 300, 0), 'lines', 900, 0, Object.assign({part: 'empty module pad, swept and waiting for the harvest'}, FS), C.yellow);
    line('lot', C.yellow, rect(A[0] + 800, A[1] + 800, A[0] + 2600, A[1] + 2000, 1100), Object.assign({part: 'pallet of folded module tarps, patched for next harvest'}, FS), closed);
    line('lot', C.curb, rect(A[0] + 3400, A[1] + 800, A[0] + 4200, A[1] + 1600, 900), Object.assign({part: 'drum of tarp patch adhesive'}, FS), closed);
    st.block(A[0] + 600, A[1] + 600, A[0] + 4400, A[1] + 2200);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = B[0] + 900 + i * 1700, y = B[1] + 900 + j * 1500;
      line('lot', C.brick, rect(x, y, x + 1200, y + 1200, 2200), Object.assign({part: 'empty pistachio field bins stacked three high, stack ' + (i * 2 + j + 1)}, FS), closed);
    }
    st.block(B[0] + 700, B[1] + 700, B[0] + 6200, B[1] + 3800);
    sym('structure', C.sign, 'sign', P(B[0] + 7200, B[1] + 600), 0, Object.assign({text: 'Tortoise Shell and Datura Wash yard. Hectoday ' + hect + ': ' + stage + '. Bins stacked, tarps patched, huller down for service until harvest.', part: 'Datura Wash yard season board'}, FS));
    const yard = [A[0], A[1], B[2], B[3]];
    const PY = (text) => { const c = st.floor(yard, 0, 0, true); if (!c) return miss(text); say(c[0], c[1], 'standing', text, Math.round(rnd() * 628) / 100); };
    PY('hosing dust off the stacked field bins');
    PY('counting empty bins for the coming harvest');
    PY('brushing glue on a torn module tarp');
    PY('hoeing puncture vine along the yard fence');
  }

  // ================================================================= deepen 5,2 interiors for the off season
  const rooms = (ox, oy) => ({
    sw: [ox, oy, ox + 15240, oy + 14000 - 2438], sm: [ox + 16764, oy, ox + 35052, oy + 14000 - 2438], se: [ox + 36576, oy, ox + 48768, oy + 14000 - 2438],
    bw: [ox, oy + 22500 + 2438, ox + 24384, oy + 34692], be: [ox + 27852, oy + 22500 + 2438, ox + 43092, oy + 34692]});
  { const R = rooms(408432, 184496), ck = '5:2', shopCeil = 3353;
    D(ck, 'Dusty Spur Menudo Kitchen', R.sw, shopCeil, [
      ['f', 'hominy soaking tub on a dolly', C.plumb, 0, 0, 700, {r: 330, n: 12}],
      ['f', 'reach in cooler of tripe and pozole base', C.int, 900, 750, 1900],
      ['w', 'chalkboard of the cold morning specials', C.sign, 1500, 1400, 2200],
      ['w', 'shelf of dried guajillo chile bags', C.brick, 1200, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['w', 'paper towel and glove dispenser by the sink', C.int, 600, 1100, 1500],
      ['o', 'outlet for the cooler', 457],
      ['c', 'pendant light over the hominy tub', C.elec, 140],
      pp('rinsing hominy in the soaking tub'),
      pp('wiping down the counter before opening')]);
    D(ck, 'Turkey Vulture Ag Sprayer Service', R.sm, shopCeil, [
      ['f', 'off season boom rebuild cart', C.int, 1800, 800, 1000],
      ['f', 'pallet of pump diaphragm kits', C.plumb, 1100, 1000, 800],
      ['f', 'crate of check valves for the winter rebuilds', C.int, 900, 700, 700],
      ['w', 'board of sprayers waiting for rebuild', C.sign, 1500, 1200, 2000],
      ['w', 'card reader and receipt printer shelf', C.elec, 800, 900, 1200],
      ['o', 'outlet for the rebuild cart lamp', 1067],
      ['c', 'LED panel over the rebuild cart', C.elec, 140],
      pp('pressure testing a rebuilt diaphragm pump'),
      pp('writing a rebuild ticket for a boom sprayer')]);
    D(ck, 'Horsetail Flats Swamp Cooler Repair', R.se, shopCeil, [
      ['f', 'stack of winter cooler covers', C.yellow, 1000, 800, 900],
      ['f', 'cart of drained cooler pans', C.int, 900, 700, 800],
      ['w', 'route board of cooler shutdown calls', C.sign, 1200, 1300, 2000],
      ['w', 'hook rail of cooler cover straps', C.struct, 900, 1400, 1800],
      ['o', 'outlet by the cover table', 1067],
      ['c', 'shop light over the cover stack', C.elec, 140],
      pp('folding a canvas cooler cover for winter'),
      pp('marking a shutdown call done on the route board')]);
    D(ck, 'Datura Wash Cotton Module Barn', R.bw, 6700, [
      ['f', 'module handler hydraulic pump on a stand for service', C.int, 1000, 800, 1100],
      ['f', 'pallet of new module tag rolls', C.yellow, 1100, 1000, 900],
      ['f', 'shop vac for the cotton lint', C.int, 0, 0, 800, {r: 300, n: 10}],
      ['w', 'gin season calendar on a pin board', C.sign, 1500, 1300, 2100],
      ['w', 'shelf of handler hydraulic filters', C.plumb, 1200, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet for the shop vac', 457],
      ['c', 'high bay light over the handler stand', C.elec, 160, 0],
      pp('vacuuming lint out of the empty bay'),
      pp('changing a filter on the handler pump')]);
    D(ck, 'Tortoise Shell Pistachio Huller', R.be, 4800, [
      ['f', 'spare huller drum shell on cribbing', C.int, 0, 0, 1200, {r: 700, n: 14}],
      ['f', 'roll of new sorting belt', C.int, 1400, 600, 700],
      ['f', 'pallet of dryer burner parts', C.brick, 1100, 1000, 800],
      ['w', 'lockout tag board for the off season service', C.sign, 1200, 1300, 2000],
      ['w', 'grease gun rack', C.struct, 900, 1200, 1700],
      ['o', 'outlet for the belt splicer', 1067],
      ['c', 'high bay light over the spare drum', C.elec, 160, 0],
      pp('hanging a lockout tag on the huller switch'),
      pp('splicing a new sorting belt')]);
  }
  { const L = loc('Tortoise Shell Grading Lab', 453500, 208000);
    L.R('stack of last season grade certificates in a file box', C.int, 3300, 300, 4200, 900, 400);
    L.V('wall calendar marked for the next harvest', C.sign, 1200, 3540, 2000, 3540, 1400, 2000);
    { const c = site('5:2').floor([453500, 208000, 458072, 211658], 0, 0, true); if (c) say(c[0], c[1], 'standing', 'filing last season grade certificates', 1.57); else miss('lab person'); }
  }

  // ================================================================= deepen the landfill on 11,3
  { const ck = '11:3';
    D(ck, 'Tecolote Mesa Truck Shop', [924728, 279744, 940728, 295744], 6700, [
      ['f', 'spare rear loader packer cylinder on a cradle', C.int, 2400, 600, 900],
      ['f', 'cart of tipper arm parts for curbside carts', C.int, 1200, 800, 1000],
      ['f', 'pallet of spare cart lids from the depot', C.yellow, 1100, 1100, 900],
      ['f', 'drum of used oil for recycling', C.plumb, 0, 0, 900, {r: 300, n: 10}],
      ['f', 'pressure washer on a cart', C.plumb, 900, 600, 1000],
      ['w', 'route map of the first garbage routes in Zion', C.sign, 2400, 1300, 2300],
      ['w', 'shelf of hopper wear plates', C.struct, 1800, 1300, 1900, {check: ['shelf_height', 1900]}],
      ['w', 'board of truck inspection sheets', C.sign, 1200, 1300, 2000],
      ['w', 'shelf of hydraulic filters and belts', C.plumb, 1500, 1200, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet for the pressure washer', 1067],
      ['o', 'outlet by the inspection board', 457],
      ['c', 'high bay light over the cylinder cradle', C.elec, 160, 0],
      ['c', 'high bay light over the parts pallets', C.elec, 160, 0],
      pp('bleeding air from a packer cylinder'),
      pp('checking tipper arm pins for wear'),
      pp('pinning a new route to the map'),
      pp('signing a pre trip inspection sheet')]);
    D(ck, 'Tecolote Mesa Cart Depot', [889728, 268744, 901728, 276744], 3353, [
      ['f', 'cart with a cracked lid waiting for repair', C.veg, 700, 800, 1100],
      ['f', 'box of new cart serial labels', C.int, 600, 500, 500],
      ['w', 'board of cart orders by street', C.sign, 1500, 1300, 2000],
      ['w', 'shelf of lid hinges and wheel bolts', C.struct, 1200, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet by the order board', 457],
      ['c', 'shop light over the repair cart', C.elec, 140],
      pp('snapping a new lid on a cracked cart'),
      pp('reading a cart order off the street board')]);
  }
  { const L = loc('Tecolote Mesa Scale House', 917728, 259744);
    L.V('first month of scale tickets pinned in a row', C.sign, 300, 5300, 1500, 5300, 1300, 1900);
    L.R('coffee maker on a small shelf', C.int, 3500, 4600, 3950, 4950, 1100);
    L.Ot('outlet behind the coffee maker', 3700, 5350, 1067);
  }
  { const L = loc('Tecolote Mesa Recycling Kiosk', 884728, 263744);
    L.R('crate of flattened cardboard waiting for the baler', C.brick, 2500, 1800, 3400, 2700, 800);
    L.V('first drop off log on a clipboard hook', C.sign, 300, 2930, 900, 2930, 1300, 1700);
  }

  // ================================================================= Siloam Lake Boathouse on 1,5
  { const L = loc('Siloam Lake Boathouse', 149200, 473600);
    L.R('life jacket rack with orange vests', C.yellow, 300, 2600, 700, 4400, 1800, {check: ['shelf_height', 1800]});
    L.R('cooler of night crawlers and minnows', C.int, 4600, 300, 5400, 800, 600);
    L.R('minnow bucket by the cooler', C.plumb, 4700, 1000, 5100, 1400, 450);
    L.O('coil of mooring line on a peg', C.yellow, 5800, 4400, 220, 1500);
    L.V('board of lake depths and the no wake buoys', C.sign, 1500, 4777, 2900, 4777, 1300, 2100);
    L.V('rental log clipboard', C.sign, 3300, 4777, 3800, 4777, 1300, 1700);
    L.O('battery lantern hung from a rafter', C.elec, 4000, 2800, 120, 2600);
    L.Ot('outlet for the minnow cooler aerator', 5400, 150, 457);
    L.say(5200, 1800, 'standing', 'scooping minnows into a paper cup');
    L.say(1000, 1800, 'standing', 'checking life vest straps before a rental');
  }

  if (ni) console.log('NAMED ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
