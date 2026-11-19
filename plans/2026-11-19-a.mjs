// Agent Orange 2026-11-19 a: growing stage yards and deeper interiors on 6,3, 6,4 and 7,3, an alfalfa field crew on open farmland 12,2,
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
  let seed = 1119; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover mowed between the rows, the last nuts shaking loose. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);

  const FS = {farmStage: stage};
  const pp = (t) => ['p', 'standing', t];
  const shopCeil = 3353, barnCeil = 6700;
  const rooms = (ox, oy) => ({
    sw: [ox, oy, ox + 15240, oy + 14000 - 2438], sm: [ox + 16764, oy, ox + 35052, oy + 14000 - 2438], se: [ox + 36576, oy, ox + 48768, oy + 14000 - 2438],
    bw: [ox, oy + 22500 + 2438, ox + 24384, oy + 34692], be: [ox + 27852, oy + 22500 + 2438, ox + 43092, oy + 34692]});

  // ================================================================= growing stage yards behind the packing barns
  function yard(ck, box, items, board, people) {
    const st = site(ck);
    for (const [label, col, w, d, h, n] of items) for (let i = 0; i < (n || 1); i++) {
      const c = st.floor(box, w / 2, d / 2); if (!c) { miss(label); continue; }
      line('lot', col, rect(c[0] - w / 2, c[1] - d / 2, c[0] + w / 2, c[1] + d / 2, h), Object.assign({part: label + (n > 1 ? ', stack ' + (i + 1) : '')}, FS), closed);
    }
    const b = st.floor(box, 300, 300); if (b) sym('structure', C.sign, 'sign', P(b[0], b[1]), 0, Object.assign({text: board, part: board.split('.')[0] + ' season board'}, FS)); else miss('board');
    for (const t of people) { const c = st.floor(box, 0, 0, true); if (!c) { miss(t); continue; } say(c[0], c[1], 'standing', t, Math.round(rnd() * 628) / 100); }
  }
  yard('6:3', [532300, 286500, 538700, 298200], [
    ['empty onion bulk bins stacked four high, waiting for the spring pull', C.brick, 1200, 1200, 2400, 3],
    ['pallet of onion transplant bundles going out to the fields', C.veg2, 1100, 1100, 700],
    ['folded shade cloth from the curing racks', C.yellow, 1400, 900, 500]],
    'Kangaroo Rat and Blackbrush yard. Hectoday ' + hect + ': ' + stage + '. Onion sets in the ground, bins stacked until the spring pull.',
    ['counting onion transplant bundles onto a truck', 'folding curing shade cloth for storage', 'hosing onion skins out of an empty bin']);
  yard('6:4', [532300, 365800, 538700, 377500], [
    ['empty pomegranate field bins stacked after the last pick', C.brick, 1200, 1200, 2200, 3],
    ['garlic drying racks folded flat for the season', C.struct, 1800, 800, 600],
    ['pallet of straw mulch bales for the new garlic beds', C.yellow, 1100, 1100, 1000]],
    'Desert Lavender and Snakeweed yard. Hectoday ' + hect + ': ' + stage + '. Garlic cloves planted and mulched, last pomegranates packed.',
    ['loading straw bales for the garlic beds', 'scrubbing a pomegranate field bin', 'tying folded drying racks with wire']);
  yard('7:3', [611500, 286500, 617900, 298200], [
    ['scrubbed fig drying trays stacked for next summer', C.struct, 1000, 1400, 1600, 2],
    ['empty bean totes folded on a pallet', C.veg2, 1100, 1100, 600],
    ['bean cleaner screens leaned on a rack for repair', C.int, 1600, 700, 1500]],
    'Indigo Bush and Cheesebush yard. Hectoday ' + hect + ': ' + stage + '. Beans cleaned and sold, fig trees going dormant, trays stacked.',
    ['stacking scrubbed fig trays', 'patching a torn bean cleaner screen', 'counting folded bean totes']);

  // ================================================================= deepen the 6,3 shops and barns
  { const R = rooms(487680, 263744), ck = '6:3';
    D(ck, 'Tufa Spring Chile Verde Diner', R.sw, shopCeil, [
      ['f', 'bus tub cart by the dish station', C.int, 700, 500, 900],
      ['f', 'pie case with a cherry and an apple pie', C.int, 800, 600, 1300],
      ['w', 'menu board of the morning plates', C.sign, 1600, 1500, 2200],
      ['w', 'shelf of hot sauce bottles and coffee mugs', C.brick, 1100, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet for the pie case', 457],
      ['c', 'pendant light over the pie case', C.elec, 140],
      pp('slicing a cherry pie at the case'),
      pp('stacking clean mugs on the shelf')]);
    D(ck, 'Ghost Flower Drip Tape Supply', R.sm, shopCeil, [
      ['f', 'drip tape injector demo stand', C.plumb, 900, 700, 1100],
      ['f', 'pallet of filter screens for the winter flush', C.int, 1100, 1100, 800],
      ['w', 'board of onion field drip layouts', C.sign, 1500, 1300, 2100],
      ['w', 'peg rail of punch tools and goof plugs', C.struct, 900, 1300, 1800],
      ['o', 'outlet by the demo stand', 1067],
      ['c', 'LED panel over the demo stand', C.elec, 140],
      pp('showing a grower how the injector meters fertilizer'),
      pp('ringing up a box of filter screens')]);
    D(ck, 'Scorpion Wash Tractor Glass', R.se, shopCeil, [
      ['f', 'cart of broken glass for the dumpster', C.int, 900, 700, 900],
      ['w', 'board of glass sizes by tractor model', C.sign, 1200, 1300, 2000],
      ['w', 'roll of cab tint film on a wall bracket', C.int, 900, 1400, 1700],
      ['o', 'outlet for the heat gun', 1067],
      ['c', 'shop light over the tint bench', C.elec, 140],
      pp('heating tint film to shrink it on a door pane'),
      pp('sweeping glass chips into a dustpan')]);
    D(ck, 'Kangaroo Rat Onion Curing Shed', R.bw, barnCeil, [
      ['f', 'bin sanitizer sprayer cart', C.plumb, 900, 700, 1000],
      ['f', 'pallet of transplant trays, emptied', C.veg2, 1100, 1100, 700],
      ['f', 'forklift charger station', C.elec, 700, 500, 1400, {disc: 'electrical'}],
      ['w', 'shelf of sizer belts and sprockets', C.struct, 1500, 1300, 1900, {check: ['shelf_height', 1900]}],
      ['w', 'planting calendar for the onion fields', C.sign, 1300, 1400, 2100],
      ['o', 'outlet for the sanitizer pump', 457],
      ['c', 'high bay light over the empty bin floor', C.elec, 160, 0],
      pp('sanitizing an empty bin with the sprayer'),
      pp('replacing a worn belt on the onion sizer')]);
    D(ck, 'Blackbrush Jujube Packing House', R.be, barnCeil, [
      ['f', 'rack of dried jujube trays cooling', C.struct, 1400, 700, 1700],
      ['f', 'carton stack of dried jujubes for the market', C.brick, 900, 900, 1100],
      ['w', 'board of dried fruit orders', C.sign, 1200, 1300, 2000],
      ['w', 'shelf of zip bags and labels', C.int, 1100, 1300, 1700, {check: ['shelf_height', 1700]}],
      ['o', 'outlet for the bag sealer', 1067],
      ['c', 'high bay light over the tray rack', C.elec, 160, 0],
      pp('sealing a bag of dried jujubes'),
      pp('labeling cartons for the farmers market')]);
  }

  // ================================================================= deepen the 6,4 shops and barns
  { const R = rooms(487680, 342992), ck = '6:4';
    D(ck, 'Iodine Bush Pozole Cafe', R.sw, shopCeil, [
      ['f', 'tortilla warmer cart', C.int, 700, 500, 1000],
      ['f', 'mop bucket and wringer', C.plumb, 0, 0, 700, {r: 260, n: 10}],
      ['w', 'board of the soup of the day', C.sign, 1300, 1500, 2100],
      ['w', 'shelf of oregano and chile piquin jars', C.brick, 1000, 1300, 1700, {check: ['shelf_height', 1700]}],
      ['o', 'outlet for the tortilla warmer', 457],
      ['c', 'pendant light by the soup board', C.elec, 140],
      pp('writing the soup of the day on the board'),
      pp('wringing out the mop by the back door')]);
    D(ck, 'Woolly Daisy Sprinkler Parts', R.sm, shopCeil, [
      ['f', 'pallet of riser pipe in short lengths', C.int, 1400, 800, 700],
      ['f', 'bin of used heads traded in for rebuild', C.plumb, 900, 700, 800],
      ['w', 'board of winter wheel line service calls', C.sign, 1500, 1300, 2100],
      ['w', 'shelf of nozzle gauges and seal kits', C.struct, 1000, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet by the rebuild bin', 1067],
      ['c', 'LED panel over the rebuild bin', C.elec, 140],
      pp('sorting traded in sprinkler heads'),
      pp('booking a wheel line service call')]);
    D(ck, 'Gila Monster Hydraulic Cylinder Shop', R.se, shopCeil, [
      ['f', 'drain pan of used hydraulic oil', C.plumb, 900, 700, 300],
      ['w', 'board of cylinders waiting for parts', C.sign, 1200, 1300, 2000],
      ['w', 'rack of seal picks and drivers', C.struct, 800, 1300, 1700],
      ['o', 'outlet for the parts washer', 457],
      ['c', 'shop light over the drain pan', C.elec, 140],
      pp('draining a cylinder over the oil pan'),
      pp('pinning a parts order to the board')]);
    D(ck, 'Desert Lavender Garlic Drying Barn', R.bw, barnCeil, [
      ['f', 'clove popper machine for seed garlic', C.int, 1200, 900, 1200],
      ['f', 'tote of cracked seed cloves', C.yellow, 1100, 1100, 900],
      ['f', 'pallet of empty mesh garlic bags', C.veg2, 1100, 1100, 600],
      ['w', 'map of the planted garlic beds', C.sign, 1500, 1300, 2100],
      ['w', 'shelf of planter parts and seed plates', C.struct, 1500, 1300, 1900, {check: ['shelf_height', 1900]}],
      ['o', 'outlet for the clove popper', 457],
      ['c', 'high bay light over the clove popper', C.elec, 160, 0],
      pp('popping seed garlic heads into cloves'),
      pp('marking a planted bed on the map')]);
    D(ck, 'Snakeweed Pomegranate Packing House', R.be, barnCeil, [
      ['f', 'last pallet of export cartons, strapped', C.brick, 1100, 1100, 1600],
      ['f', 'pressure washer for the brush washer', C.plumb, 800, 600, 1000],
      ['w', 'board of the final pick weights', C.sign, 1200, 1300, 2000],
      ['w', 'shelf of spare washer brushes', C.struct, 1500, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet for the pressure washer', 1067],
      ['c', 'high bay light over the carton pallet', C.elec, 160, 0],
      pp('strapping the last pallet of the season'),
      pp('writing the final pick weight on the board')]);
  }

  // ================================================================= deepen the 7,3 shops and barns
  { const R = rooms(566928, 263744), ck = '7:3';
    D(ck, 'Fairy Duster Carne Asada Kitchen', R.sw, shopCeil, [
      ['f', 'sack of mesquite lump charcoal', C.brick, 600, 400, 700],
      ['f', 'salsa bar cart with three bowls', C.int, 900, 600, 1000],
      ['w', 'board of the plate specials', C.sign, 1500, 1500, 2200],
      ['w', 'shelf of paper boats and foil sheets', C.int, 1000, 1300, 1700, {check: ['shelf_height', 1700]}],
      ['o', 'outlet for the salsa bar cooler', 457],
      ['c', 'pendant light over the salsa bar', C.elec, 140],
      pp('refilling the salsa verde bowl'),
      pp('dragging a sack of charcoal to the grill')]);
    D(ck, 'Pupfish Spring Drip Emitter Supply', R.sm, shopCeil, [
      ['f', 'pallet of pressure regulators', C.plumb, 1100, 1000, 700],
      ['f', 'flush valve display stand', C.int, 800, 600, 1300],
      ['w', 'board of winter flushing tips', C.sign, 1400, 1300, 2100],
      ['w', 'shelf of filter cartridges by mesh size', C.struct, 1100, 1300, 1800, {check: ['shelf_height', 1800]}],
      ['o', 'outlet by the display stand', 1067],
      ['c', 'LED panel over the regulator pallet', C.elec, 140],
      pp('explaining a flush valve to a gardener'),
      pp('stocking filter cartridges by mesh size')]);
    D(ck, 'Vinegaroon PTO Shaft Repair', R.se, shopCeil, [
      ['f', 'parts washer tank', C.plumb, 900, 600, 900],
      ['w', 'board of shafts ready for pickup', C.sign, 1200, 1300, 2000],
      ['w', 'peg rail of snap ring pliers', C.struct, 800, 1300, 1700],
      ['o', 'outlet for the parts washer pump', 457],
      ['c', 'shop light over the parts washer', C.elec, 140],
      pp('scrubbing a yoke in the parts washer'),
      pp('calling a farmer to pick up his shaft')]);
    D(ck, 'Indigo Bush Pinto Bean Barn', R.bw, barnCeil, [
      ['f', 'pallet of bean sacks sold to the grocers', C.yellow, 1100, 1100, 1200],
      ['f', 'grain probe and moisture tester on a cart', C.int, 900, 600, 1000],
      ['f', 'shop broom and grain shovel stand', C.struct, 600, 400, 1500],
      ['w', 'board of bean buyers and sacks shipped', C.sign, 1500, 1300, 2100],
      ['w', 'shelf of gravity table screens', C.struct, 1500, 1300, 1900, {check: ['shelf_height', 1900]}],
      ['o', 'outlet for the moisture tester', 1067],
      ['c', 'high bay light over the sack pallet', C.elec, 160, 0],
      pp('checking the last bean lot for moisture'),
      pp('sweeping split beans off the barn floor')]);
    D(ck, 'Cheesebush Fig Packing House', R.be, barnCeil, [
      ['f', 'jam kettle for split figs', C.int, 0, 0, 1000, {r: 450, n: 12}],
      ['f', 'rack of fig jam jars cooling', C.struct, 1400, 600, 1600],
      ['w', 'board of jam orders', C.sign, 1200, 1300, 2000],
      ['w', 'shelf of jar lids and labels', C.int, 1100, 1300, 1700, {check: ['shelf_height', 1700]}],
      ['o', 'outlet for the jam kettle', 457],
      ['c', 'high bay light over the jam kettle', C.elec, 160, 0],
      pp('stirring split figs in the jam kettle'),
      pp('screwing lids onto warm jam jars')]);
  }

  // ================================================================= an alfalfa crew on open farmland 12,2
  // The chunk is unclaimed alfalfa east of Rimrock Bench Farm. Only open layers (vegetation, vehicle, activity), every record farm: true.
  const ox = 12 * S, oy = 2 * S, X = (u) => ox + u, Y = (v) => oy + v;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const WHO = {wokenBy: 'the first cutting of the winter alfalfa', how: 'woke to the smell of raked hay'};
  const riders = [];
  function rig(label, col, pts, speed, shape, riderText) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    const name = pool[ni++]; named.push(name + ': ' + riderText); usedIn('12:2').add(riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
    riders.push([id, rid]);
  }
  const tractor = [[-1200, -1800, 0], [1200, -1800, 0], [1200, 2600, 0], [-1200, 2600, 0], [-1200, -1800, 0], [-1200, -1800, 2900], [1200, -1800, 2900], [1200, 600, 2900], [-1200, 600, 2900], [-1200, -1800, 2900], [-1200, 2600, 1500], [1200, 2600, 1500], [1200, -1800, 0]];
  // windrows of cut alfalfa across the south field, drying in the sun
  const rowsV = [14000, 20000, 26000, 32000];
  rowsV.forEach((v, i) => line('vegetation', C.veg2, wavy(X(13000), Y(v), X(64000), Y(v), 350, 24, i * 1.7), {part: 'windrow of cut alfalfa drying, row ' + (i + 1), species: 'alfalfa'}));
  // small square bales left behind the baler on the first two rows
  for (let i = 0; i < 12; i++) { const u = 15000 + i * 4000 + Math.round(rnd() * 900), v = (i % 2 ? 14000 : 20000) + Math.round((rnd() - 0.5) * 600);
    line('vegetation', C.yellow, rect(X(u), Y(v - 230), X(u + 1000), Y(v + 230), 360), {part: 'small square bale of alfalfa ' + (i + 1), species: 'alfalfa'}, closed); }
  // a wheel rake turns the north windrows; passes east and west, back along the west headland
  { const p = []; const vs = [46000, 52000, 58000, 64000];
    vs.forEach((v, i) => { const a = i % 2 ? 64000 : 14000, b = i % 2 ? 14000 : 64000; p.push(P(X(a), Y(v)), P(X(b), Y(v))); });
    p.push(P(X(12000), Y(66000)), P(X(12000), Y(44000)), P(X(14000), Y(46000)));
    const rake = tractor.concat([[0, -1800, 500], [0, -2600, 500], [-3200, -2600, 700], [3200, -5200, 700], [-3200, -2600, 700], [-3200, -2600, 1300], [3200, -5200, 1300], [3200, -5200, 700]]);
    rig('utility tractor pulling a wheel rake, turning the alfalfa windrows', C.elec, p, 3200, rake, 'raking alfalfa into windrows in the north field'); }
  // a small square baler picks up the south windrows; passes along rows 3 and 4, back along the east headland
  { const p = [P(X(13000), Y(26000)), P(X(64000), Y(26000)), P(X(66000), Y(29000)), P(X(64000), Y(32000)), P(X(13000), Y(32000)), P(X(11000), Y(29000)), P(X(13000), Y(26000))];
    const baler = tractor.concat([[0, -1800, 500], [1500, -2400, 500], [1500, -2400, 1600], [2700, -2400, 1600], [2700, -7200, 1600], [1500, -7200, 1600], [1500, -2400, 1600], [1500, -2400, 0], [2700, -7200, 0], [2700, -7200, 1600]]);
    rig('row crop tractor pulling a small square baler', C.brick, p, 2200, baler, 'baling the drying alfalfa in the south field'); }
  // a pickup parked out in the field with a crew stacking bales on its flatbed trailer
  sym('vehicle', C.car2, 'truck', P(X(40000), Y(38000)), 1.57, {part: 'farm pickup parked in the cut alfalfa'});
  line('vehicle', C.yellow, rect(X(33500), Y(37100), X(37500), Y(38900), 700), {part: 'gooseneck bale trailer hitched to the pickup'}, closed);
  for (let i = 0; i < 3; i++) line('vehicle', C.yellow, rect(X(33800 + i * 1200), Y(37400), X(34800 + i * 1200), Y(37860), 1060), {part: 'bale stacked on the trailer, ' + (i + 1)}, closed);
  say(X(36000), Y(36000), 'standing', 'tossing a bale up onto the trailer', 1.57);
  say(X(42000), Y(39500), 'standing', 'grabbing a bale hook from the cab', 3.1);
  say(X(38500), Y(35600), 'standing', 'checking a bale for moisture with a probe', 0.4);
  // portable toilets on a trailer at the field edge, a hand wash tank beside them
  line('vehicle', C.curb, rect(X(68000), Y(40000), X(70400), Y(44000), 600), {part: 'portable toilet trailer, parked at the field edge'}, closed);
  for (const [i, v] of [[1, 40300], [2, 42100]]) {
    line('vehicle', C.veg, rect(X(68200), Y(v), X(69350), Y(v + 1150), 2890), {part: 'portable toilet ' + i + ' on the trailer'}, closed);
    line('vehicle', C.yellow, [P(X(68200), Y(v + 200), 2500), P(X(68200), Y(v + 950), 2500)], {part: 'portable toilet ' + i + ' door vent'});
  }
  line('vehicle', C.plumb, circ(X(69900), Y(44600), 350, 1100, 10), {part: 'hand wash water tank on the trailer tongue'}, closed);
  say(X(67000), Y(45500), 'standing', 'washing hands at the trailer tank', 4.7);
  // idle irrigation pipe: a side roll wheel line parked along the east edge, and a pipe trailer stacked with hand line
  line('vehicle', C.struct, [P(X(72000), Y(12000), 950), P(X(72000), Y(68000), 950)], {part: 'idle side roll wheel line, parked along the east edge for the cutting'});
  for (let v = 12000; v <= 68000; v += 8000) line('vehicle', C.struct, circ(X(72000), Y(v), 900, 0, 10).map(q => [q[0], Y(v), 950 + (q[1] - Y(v))]), {part: 'wheel line wheel'});
  line('vehicle', C.int, rect(X(16000), Y(70000), X(26000), Y(72000), 900), {part: 'pipe trailer parked at the north headland'}, closed);
  for (let i = 0; i < 4; i++) line('vehicle', C.struct, [P(X(16200), Y(70300 + i * 450), 1050 + (i % 2) * 150), P(X(25800), Y(70300 + i * 450), 1050 + (i % 2) * 150)], {part: 'idle aluminum hand line pipe on the trailer, ' + (i + 1)});
  say(X(27500), Y(71000), 'standing', 'counting idle pipe joints on the trailer', 3.1);

  // every record on 12,2 carries farm: true so the alfalfa keeps growing around it
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === '12:2') a.meta = Object.assign(a.meta || {}, {farm: true}); }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
