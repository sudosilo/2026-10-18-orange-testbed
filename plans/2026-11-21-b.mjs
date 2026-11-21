// Agent Orange 2026-11-21 b: asked by Orange. A sauce packet factory on two new blocks at the east edge of the farm belt:
// the plant, docks, tank farm and boiler house on 12,2, and the truck staging yard and employee lot on 12,1.
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
  let seed = 2112; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  function frame(x0, y0, x1, y1, face) {
    const W = face === 's' || face === 'n' ? x1 - x0 : y1 - y0, Dp = face === 's' || face === 'n' ? y1 - y0 : x1 - x0;
    const m = (u, v) => face === 's' ? [x0 + u, y0 + v] : face === 'n' ? [x1 - u, y1 - v] : face === 'e' ? [x1 - v, y0 + u] : [x0 + v, y1 - u];
    const R = (N, label, col, u0, v0, u1, v1, z, o) => { const p = m(u0, v0), q = m(u1, v1); I(N, label, col, p[0], p[1], q[0], q[1], z, o); };
    const Cc = (N, label, col, u, v, r, z, o) => { const p = m(u, v); IC(N, label, col, p[0], p[1], r, z, o); };
    const V = (N, label, col, u0, v0, u1, v1, z0, z1, o) => { const p = m(u0, v0), q = m(u1, v1); VB(N, label, col, p[0], p[1], q[0], q[1], z0, z1, o); };
    const along = face === 's' || face === 'n' ? 'x' : 'y', across = along === 'x' ? 'y' : 'x';
    return {W, Dp, m, R, Cc, V, along, across, face};
  }
  const dr = (f, N, u, v, dir, w, label, ks = -1) => { const p0 = f.m(u, v), p1 = dir === 'along' ? f.m(u + w, v) : f.m(u, v + w); door(N, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), dir === 'along' ? f.along : f.across, w, label, ks); };
  const nearOn = (paths, x, y) => { let best = null, bd = 1e18; for (const pth of paths) for (let i = 0; i + 1 < pth.length; i++) { const A = pth[i], B = pth[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy || 1; let t = ((x - A[0]) * dx + (y - A[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); const q = [A[0] + dx * t, A[1] + dy * t, A[2] + (B[2] - A[2]) * t], d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = q; } } return best; };
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];
  const roofOf = (N, x0, y0, x1, y1, z, kind, rc, rc2) => {
    if (kind === 'flat') { plane(N, rc, rc2, rect(x0 + 300, y0 + 300, x1 - 300, y1 - 300, z - 250), 'dots', 1500, 0, 'flat roof, white membrane'); const sx = (x1 - x0) / 4, sy = (y1 - y0) / 3; for (let i = 1; i < 4; i += 2) line('structure', C.car2, rect(x0 + sx * i - 600, y0 + sy - 1200, x0 + sx * i + 600, y0 + sy + 1200, z - 200), {building: N, part: 'roof skylight'}, closed); }
    else if (kind === 'gravel') gravel(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'barrel') barrel(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'gableX') gableX(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'gableY') gableY(N, x0, y0, x1, y1, z, rc, rc2);
    else if (kind === 'shedN') shed(N, x0, y0, x1, y1, z, rc, rc2, true);
    else if (kind === 'shedS') shed(N, x0, y0, x1, y1, z, rc, rc2, false);
    else if (kind === 'hip') hip(N, x0, y0, x1, y1, z, rc, rc2);
  };

  // A block: claim, street edges, industrial lot, pole line, private mains, hydrants at proper spacing, traffic.
  function block(cx, cy, edges, name, poleList, drives) {
    claim(cx, cy);
    streets(cx, cy, edges);
    const ox = cx * S, oy = cy * S, a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
    lot('industrial', a, ys, b, yn, name);
    const poles = poleList.map(([u, v]) => [a + u, ys + v]);
    for (const [px, py] of poles) sym('electrical', C.struct, 'pole', P(px, py), 0, {part: name + ' pole line'});
    line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 8230)), {part: name + ' primary'});
    line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 6400)), {part: name + ' secondary'});
    const WM = [[ox + 2400, ys + 700, -1219], [b - 500, ys + 700, -1219]], WB = [[a + 600, ys + 700, -1219], [a + 600, yn - 700, -1219], [b - 500, yn - 700, -1219]];
    const SM = [[ox + 3600, ys + 1700, -2134], [b - 500, ys + 1700, -1700]], SB = [[a + 1900, yn - 1900, -1700], [a + 1900, ys + 1700, -2000]];
    line('plumbing', C.plumb, WM.map(p => P(...p)), {part: name + ' water main tied to the street main'});
    line('plumbing', C.plumb, WB.map(p => P(...p)), {part: name + ' water loop'});
    line('plumbing', C.sewer, SM.map(p => P(...p)), {part: name + ' sewer to the street main'});
    line('plumbing', C.sewer, SB.map(p => P(...p)), {part: name + ' sewer west leg'});
    // hydrants: one near each corner and one at mid block on the three faces the street kit does not cover
    const inDrive = (x, y) => drives.some(d => x > d[0] - 2500 && x < d[2] + 2500 && y > d[1] - 2500 && y < d[3] + 2500);
    const hy = [[ox + CURB + 600, oy + CURB + 6400], [ox + S - CURB - 6400, oy + CURB + 600], [ox + S - CURB - 600, oy + S - CURB - 6400], [ox + CURB + 6400, oy + S - CURB - 600], [ox + S / 2 + 1500, oy + CURB + 600], [ox + S - CURB - 600, oy + S / 2 - 1500], [ox + S / 2 - 1500, oy + S - CURB - 600]];
    for (const [hx, hy2] of hy) { if (inDrive(hx, hy2)) continue; sym('street', C.brick, 'hydrant', P(hx, hy2), 0, {part: 'fire hydrant, 6 inch steamer port'}); }
    for (const d of drives) { hatch('paving', C.curb, rect(d[0], d[1], d[2], d[3]), 'dots', 1000, 0, {part: 'truck driveway'}, C.struct); }
    trafficLoop(cx, cy, true, CARCOL[(cx * 3 + cy) % 10], 'truck', 7600 + cx * 100);
    trafficLoop(cx, cy, false, CARCOL[(cx + cy * 5) % 10], 'car', 9000);
    return {ox, oy, a, b, ys, yn, X: (u) => a + u, Y: (v) => ys + v, poles, WM, WB, SM, SB,
      nearPole: (x, y) => poles.reduce((p, c) => Math.hypot(c[0] - x, c[1] - y) < Math.hypot(p[0] - x, p[1] - y) ? c : p)};
  }
  function services(B, N, f, pu, pv, wu, wv, su, sv) {
    const p = f.m(pu, pv), pole = B.nearPole(p[0], p[1]), out = f.m(pu, pv < f.Dp / 2 ? -400 : f.Dp + 400);
    run('electrical', C.elec, [P(pole[0], pole[1], 6400), P(out[0], out[1], 4200), P(out[0], out[1], 1676), P(p[0], p[1], 1676)], {building: N, part: 'service drop and meter'});
    if (wu !== undefined) { const w = f.m(wu, wv), wm = nearOn([B.WM, B.WB], w[0], w[1]); run('plumbing', C.plumb, [P(wm[0], wm[1], -1219), P(w[0], w[1], -900), P(w[0], w[1], 300)], {building: N, part: 'domestic water service'}); }
    if (su !== undefined) { const s = f.m(su, sv), sm = nearOn([B.SM, B.SB], s[0], s[1]); run('plumbing', C.sewer, [P(s[0], s[1], -300), P(sm[0], sm[1], sm[2] + 300)], {building: N, part: 'building sewer'}); }
  }

  // A warehouse. Front (v = 0) is the dock or door side. Office in the front left corner.
  function wh(B, N, x0, y0, x1, y1, face, o) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R, Cc, V} = f, H = o.H || 9144;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const fa = m(0, 0), fb = m(W, 0), ba = m(0, Dp), bb = m(W, Dp);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 0, H), o.facade || 'lines', o.facade === 'cross' ? 1200 : 3048, o.facade === 'cross' ? 0 : 90, {building: N, part: o.facadePart || 'tilt up concrete panels, front'}, C.struct);
    hatch('structure', C.struct, vface(ba[0], ba[1], bb[0], bb[1], 0, 1200), 'gradient', 300, 0, {building: N, part: 'back wall base shadow'}, C.int);
    const sg = m(o.signU || 3000, -1600); sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    roofOf(N, x0, y0, x1, y1, H + 100, o.roof || 'flat', o.rc, o.rc2);
    const oW = o.office === false ? 0 : (o.oW || 9144), oD = 7315;
    if (oW) {
      wall(N, [m(oW, 0), m(oW, oD), m(0, oD)], 3048, 0, false, C.int);
      wall(N, [m(oW - 2438, oD), m(oW - 2438, oD - 2438), m(oW, oD - 2438)], 3048, 0, false, C.int);
      const c0 = m(150, 150), c1 = m(oW - 150, oD - 150);
      hatch('structure', 7, rect(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), 2743), 'cross', 1219, 0, {building: N, part: 'office ceiling grid', checks: [['ceiling_height', 2743]]});
      dr(f, N, 1500, 0, 'along', 914, 'office front door');
      dr(f, N, oW, 3000, 'across', 914, 'door to the warehouse floor', 1);
      dr(f, N, oW - 2438, oD - 2100, 'across', 864, 'office restroom door');
      R(N, o.counter || 'will call counter', C.brick, 600, 2400, 4200, 2900, 1067, {check: ['counter_height', 1067]});
      R(N, 'pos terminal at the counter', C.int, 1400, 2500, 1700, 2800, 1350);
      R(N, 'receipt printer', C.int, 2100, 2550, 2400, 2800, 1100);
      R(N, 'card reader on a swivel', C.int, 3000, 2420, 3200, 2620, 1150);
      R(N, 'shipping label printer', C.int, 3500, 3100, 3850, 3450, 1100);
      R(N, 'office desk', C.int, 4600, 4700, 6200, 5500, 760);
      R(N, 'filing cabinet', C.struct, 4600, 6700, 5200, 7165, 1320);
      V(N, o.wallItem || 'wall map of delivery routes', C.sign, 150, 4000, 150, 6000, 1000, 2000);
      f.Cc(N, 'water closet', C.int, oW - 600, oD - 500, 260, 432, {n: 8});
      R(N, 'wall hung lavatory', C.int, oW - 2200, oD - 600, oW - 1600, oD - 150, 864, {check: ['counter_height', 864]});
      R(N, 'main switchboard', C.elec, 200, oD - 1600, 600, oD - 400, 1830, {disc: 'electrical'});
      for (const [u, v] of [[150, 3200], [oW - 2600, 150]]) { const p = m(u, v); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {building: N, part: 'office outlet', checks: [['outlet_height', 457]]}); }
      for (const [u, v] of [[2300, 4500], [6000, 2500]]) { const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], 2743), 0, {building: N, part: 'office troffer light'}); }
      services(B, N, f, 400, oD - 1000, oW - 1000, oD - 600, oW - 600, oD - 900);
    } else services(B, N, f, 400, Dp - 1000);
    // dock doors
    const docks = o.docks || 0, du0 = oW + 3000, trucks = [];
    for (let i = 0; i < docks; i++) {
      const u = du0 + i * 4267; if (u + 2743 > W - 1500) break;
      const p = m(u, 0), q = m(u + 2743, 0);
      line('structure', C.struct, [P(p[0], p[1], 1219), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1], 1219)], {building: N, part: 'dock door ' + (i + 1)});
      R(N, 'dock leveler ' + (i + 1), C.yellow, u + 300, 150, u + 2443, 2438, 1219);
      if (i % 3 !== 1) trucks.push(u + 1371);
    }
    hatch('paving', C.curb, (() => { const p = m(du0 - 1000, 0), q = m(Math.min(W - 1000, du0 + docks * 4267), -4500); return rect(Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1]), -1219); })(), 'lines', 600, 0, {building: N, part: 'depressed dock apron'}, C.struct);
    for (const u of trucks.slice(0, o.maxTrucks === undefined ? 4 : o.maxTrucks)) {
      const t0 = m(u - 1295, -400), t1 = m(u + 1295, -15000);
      line('vehicle', CARCOL[Math.floor(r2() * 10)], rect(Math.min(t0[0], t1[0]), Math.min(t0[1], t1[1]), Math.max(t0[0], t1[0]), Math.max(t0[1], t1[1]), 4100), {part: o.trailer || 'van trailer backed to the dock'}, closed);
      const c = m(u, -17500); const ang = {s: 0, n: Math.PI, e: -Math.PI / 2, w: Math.PI / 2}[face];
      sym('vehicle', CARCOL[Math.floor(r2() * 10)], 'truck', P(c[0], c[1]), ang, {part: 'tractor hooked to the trailer'});
    }
    // big drive in doors
    (o.rollups || []).forEach((u, i) => { const p = m(u, 0), q = m(u + 3658, 0); line('structure', C.struct, [P(p[0], p[1]), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1])], {building: N, part: 'drive in roll up door ' + (i + 1)}); });
    // storage
    const uS = oW ? oW + 2500 : 2000, vS = o.stage || 11000, goods = o.goods || ['boxed goods'];
    let gi = 0;
    if (o.racks === 'selective') {
      for (let u = uS; u + 2438 < W - 1800; u += 5800) { R(N, 'pallet rack row of ' + goods[gi % goods.length], C.yellow, u, vS, u + 2438, Dp - 1800, o.rackH || 6096); line('interior', C.struct, [P(...m(u + 1219, vS), 1829), P(...m(u + 1219, Dp - 1800), 1829)], {building: N, part: 'first rack beam level, row ' + (gi + 1)}); gi++; }
    } else if (o.racks === 'bulk') {
      for (let v = vS; v + 4000 < Dp - 1500; v += 5600) for (let u = uS; u + 4000 < W - 1500; u += 5600) { R(N, 'stack of ' + goods[gi % goods.length], C.veg2, u, v, u + 4000, v + 4000, o.stackH || 3658); gi++; }
    } else if (o.racks === 'cantilever') {
      for (let v = vS; v + 1500 < Dp - 1500; v += 4800) { R(N, 'cantilever rack of ' + goods[gi % goods.length], C.brick, uS, v, W - 2000, v + 1500, 4267); gi++; }
    }
    (o.items || []).forEach(it => { if (it[0] === 'c') Cc(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7]); else if (it[0] === 'v') V(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9]); else R(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8]); });
    // fire sprinklers, lights, fans, charging
    const sm0 = m(oW + 1000, Dp / 2), sm1 = m(W - 1000, Dp / 2);
    line('plumbing', C.brick, [P(sm0[0], sm0[1], H - 600), P(sm1[0], sm1[1], H - 600)], {building: N, part: 'fire sprinkler cross main'});
    for (let u = oW + 4000; u < W - 2000; u += Math.max(6000, (W - oW) / 4)) line('plumbing', C.brick, [P(...m(u, 1500), H - 700), P(...m(u, Dp - 1500), H - 700)], {building: N, part: 'fire sprinkler branch line'});
    const rz = m(W - 900, Dp - 900); IC(N, 'fire sprinkler riser with check valve', C.brick, rz[0], rz[1], 160, 1500, {disc: 'plumbing'});
    const fd = m(W - 900, Dp + 300), wm = nearOn([B.WM, B.WB], fd[0], fd[1]);
    run('plumbing', C.brick, [P(wm[0], wm[1], -1219), P(fd[0], fd[1], -1100), P(rz[0], rz[1], -1100), P(rz[0], rz[1], 300)], {building: N, part: 'fire line to the sprinkler riser'});
    line('plumbing', C.brick, [P(fd[0], fd[1], 900), P(fd[0], fd[1], 600)], {part: 'fire department connection'});
    for (let v = 4000; v < Dp - 2000; v += 9000) for (let u = oW + 4000; u < W - 2000; u += 9000) { const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], H - 1000), 0, {part: 'high bay light'}); }
    if (!o.noFan) Cc(N, 'big slow ceiling fan', C.int, (oW + W) / 2, Dp / 2, 2400, H - 1400, {n: 12, anim: {type: 'spin', rpm: 18}});
    if (o.charger !== false) R(N, 'forklift battery charging station', C.elec, W - 4200, Dp - 700, W - 2200, Dp - 150, 1500, {disc: 'electrical'});
    { const p = m(W - 150, Dp - 2500); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 1067), 0, {building: N, part: 'outlet by the back wall', checks: [['outlet_height', 1067]]}); }
    // forklift loop in the staging lane
    if (o.forklift !== false) { const v1 = Math.min(4200, vS - 2500), v2 = Math.min(vS - 1200, v1 + 2800), u0 = uS, u1 = W - 2500; const pts = [m(u0, v1), m(u1, v1), m(u1, v2), m(u0, v2), m(u0, v1)].map(p => P(p[0], p[1])); sym('vehicle', C.yellow, 'cart', pts[0], 0, {part: 'propane forklift', anim: {type: 'path', speed: 2200, pts}}); }
    // people: will call customer, clerk, dock, aisles
    const slots = [];
    if (oW) slots.push([2400, 1500], [2400, 3800]);
    slots.push([du0 + 1371, 3400], [uS + 2438 + 1680, vS + 3000], [uS + 2438 + 5800 + 1680, vS + 6000], [W - 3200, Dp - 2600]);
    (o.people || []).forEach((t, i) => { if (!slots[i]) return; const s = t[2] ? [t[2], t[3]] : slots[i]; const p = m(s[0], s[1]); say(p[0], p[1], t[0], t[1], Math.round(r2() * 628) / 100); });
    return f;
  }

  // A small building with a hand written item list.
  function small(B, N, x0, y0, x1, y1, face, o) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R, Cc, V} = f, H = o.H || 3658;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    const fa = m(0, 0), fb = m(W, 0);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 0, H), o.facade || 'lines', 300, o.facade === 'lines' || !o.facade ? 90 : 0, {building: N, part: o.facadePart || 'metal siding, front'}, C.struct);
    roofOf(N, x0, y0, x1, y1, H + 100, o.roof || 'shedN', o.rc, o.rc2);
    dr(f, N, o.doorU || 1000, 0, 'along', 914, 'front door', 1);
    const sg = m((o.doorU || 1000) + 1600, -1200); sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    const cz = o.ceil || 2743;
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, cz), 'lines', 600, 0, {building: N, part: 'ceiling', checks: [['ceiling_height', cz]]});
    const lp = m(W / 2, Dp / 2); sym('electrical', C.elec, 'light', P(lp[0], lp[1], cz), 0, {building: N, part: 'ceiling light'});
    { const p = m(W - 150, Dp / 2); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {building: N, part: 'wall outlet', checks: [['outlet_height', 457]]}); }
    R(N, 'electrical panel', C.elec, 150, Dp - 1300, 400, Dp - 500, 1500, {disc: 'electrical'});
    services(B, N, f, 300, Dp - 900, o.water ? W - 900 : undefined, o.water ? Dp - 600 : undefined, o.water ? W - 600 : undefined, o.water ? Dp - 900 : undefined);
    (o.items || []).forEach(it => { if (it[0] === 'c') Cc(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7]); else if (it[0] === 'v') V(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], it[9]); else R(N, it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8]); });
    (o.people || []).forEach(t => { const p = m(t[2], t[3]); say(p[0], p[1], t[0], t[1], Math.round(r2() * 628) / 100); });
    return f;
  }
  const stallRow = (x0, y0, n, dir, label, first) => { // stalls along x starting at x0, opening north (dir 1) or south (-1)
    const out = [];
    for (let i = 0; i < n; i++) { const sx = x0 + i * 2743, y1 = y0 + 5486; line('paving', C.white, dir > 0 ? [P(sx, y1), P(sx, y0), P(sx + 2743, y0), P(sx + 2743, y1)] : [P(sx, y0), P(sx, y1), P(sx + 2743, y1), P(sx + 2743, y0)], Object.assign({part: label + ' stall ' + (i + 1)}, first && i < 8 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {})); out.push([sx + 1371, y0 + 2743, dir]); }
    for (const [cx, cy, d] of out) { if (r2() > 0.6) continue; const tr = r2() < 0.45; sym('vehicle', CARCOL[Math.floor(r2() * 10)], tr ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 250), cy + Math.round((r2() - 0.5) * 400)), (d > 0 ? Math.PI : 0) + (r2() < 0.3 ? Math.PI : 0) + (r2() - 0.5) * 0.06, {part: tr ? 'work pickup' : 'employee car'}); }
  };
  const court = (x0, y0, x1, y1, label) => hatch('paving', C.curb, rect(x0, y0, x1, y1), 'dots', 1200, 0, {part: label || 'truck court, concrete'}, C.struct);
  const fence = (pts, label) => line('structure', C.struct, pts.map(p => P(p[0], p[1], 1829)), {part: label || 'chain link fence with barbed wire'});
  const trailerAt = (x, y, ang, label) => { const c = Math.cos(ang), s = Math.sin(ang), L = 14630, Wd = 2591; const pts = [[-Wd / 2, 0], [Wd / 2, 0], [Wd / 2, L], [-Wd / 2, L]].map(([px, py]) => P(x + px * c - py * s, y + px * s + py * c, 4100)); line('vehicle', CARCOL[Math.floor(r2() * 10)], pts, {part: label || 'trailer parked in the drop lot'}, closed); };
  let s2 = 113131; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };

  // ---------------------------------------------------------------- movers with a seated driver
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const WHO = {wokenBy: 'the first shift at the sauce works', how: 'woke to the hiss of the packet sealers'};
  function mover(type, col, label, pts, speed, riderText) {
    const id = nextIdNow();
    sym('vehicle', col, type, pts[0], 0, {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid), ck0 = k.ck(dp[0][0], dp[0][1]);
    const name = pool[ni++]; named.push(name + ': ' + riderText); usedIn(ck0).add(riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
  }

  k.VSTREET[13] = 'Pickleweed Avenue';
  const PN = 'Dropseed Sauce Packet Works';

  // clear the old alfalfa crew off 12,2; it becomes the plant site
  for (const r of recsIn('12:2')) if (r.agent === 'agent-orange') push('remove', {id: r.id});

  // ================================================================= 12,2 the plant block
  const B = block(12, 2, {s: true, e: true, n: true, w: true}, PN + ' grounds',
    [[600, 3000], [600, 18000], [600, 33000], [600, 48000], [600, 60360], [15000, 60360], [30000, 60360]],
    [[12 * S + PL + 42000, 2 * S + CURB, 12 * S + PL + 52000, 2 * S + PL + 600], [12 * S + PL + 24000, 3 * S - PL - 600, 12 * S + PL + 31000, 3 * S - CURB]]);
  const {X, Y} = B, rc = 7, rc2 = 10;
  // three phase tap across Dropseed Avenue from the avenue pole line
  line('electrical', C.elec, [P(X(600), Y(33000), 8230), P(944590, 196920, 8230)], {part: 'three phase primary tap across Dropseed Avenue'});
  line('electrical', C.elec, rect(X(1200), Y(36000), X(2600), Y(37400), 1500), {part: 'pad mount transformer for the sauce works'}, closed);
  court(X(38000), Y(1000), X(60360), Y(51000), 'truck court, concrete');
  sym('structure', C.sign, 'sign', P(X(1500), Y(11000)), 0, {text: PN + ', every sauce in a packet, shipped everywhere'});

  // the plant: docks face east onto the truck court. u runs south to north, v runs west from the dock wall.
  const f = wh(B, PN, X(10000), Y(3000), X(38000), Y(51000), 'e', {H: 9144, fc: C.yellow, rc, rc2, roof: 'flat', docks: 10, racks: 'none', office: false, maxTrucks: 4,
    facadePart: 'tilt up concrete panels painted mustard yellow, dock side', trailer: 'refrigerated van trailer backed to the dock',
    items: [
      // shipping staging, south end
      ['r', 'shipping lane floor stripes', C.yellow, 2000, 7600, 24000, 7700, 5],
      ['r', 'stretch wrapped pallet of ketchup packet cases', C.brick, 2500, 7900, 4000, 9100, 1500],
      ['r', 'stretch wrapped pallet of mustard packet cases', C.yellow, 5000, 7900, 6500, 9100, 1500],
      ['r', 'stretch wrapped pallet of mayonnaise packet cases', C.int, 7500, 7900, 9000, 9100, 1500],
      ['r', 'stretch wrapped pallet of hot sauce and soy packet cases', C.brick, 10000, 7900, 11500, 9100, 1400],
      ['r', 'mixed pallet of every kind of sauce for a diner route', C.car2, 12500, 7900, 14000, 9100, 1600],
      ['c', 'stretch wrap machine turntable', C.struct, 17500, 9000, 1100, 300, {n: 12}],
      ['r', 'bill of lading printer on a stand', C.int, 20500, 8200, 21000, 8600, 1100],
      // receiving staging, north end
      ['r', 'receiving lane floor stripes', C.yellow, 27000, 7600, 46000, 7700, 5],
      ['r', 'pallet of 55 gallon drums of white vinegar', C.plumb, 27500, 7900, 28700, 9100, 960],
      ['r', 'tote of tomato paste on a pallet', C.brick, 30000, 7900, 31200, 9100, 1200],
      ['r', 'pallet of sugar sacks', C.int, 32500, 7900, 33700, 9100, 1300],
      ['r', 'pallet of mustard seed flour bags', C.yellow, 35000, 7900, 36200, 9100, 1200],
      ['r', 'tote of soybean oil', C.veg2, 37500, 7900, 38700, 9100, 1200],
      ['r', 'pallet of dried chile bales from the farms east of town', C.brick, 40000, 7900, 41200, 9100, 1300],
      ['r', 'pallet jack parked by door eight', C.struct, 43500, 9000, 44200, 10300, 300],
      // raw storage racks
      ['r', 'pallet rack of tomato paste totes and vinegar drums', C.yellow, 27000, 11500, 46000, 12700, 6096],
      ['r', 'pallet rack of sugar, salt, spice drums and packet film rolls', C.yellow, 27000, 15500, 46000, 16700, 6096],
      // kettle room
      ['c', 'steam jacketed kettle of ketchup', C.brick, 28000, 21500, 800, 1100, {n: 12}],
      ['c', 'steam jacketed kettle of barbecue sauce', C.brick, 31000, 21500, 800, 1100, {n: 12}],
      ['c', 'steam jacketed kettle of sweet and sour sauce', C.yellow, 34000, 21500, 800, 1100, {n: 12}],
      ['c', 'steam jacketed kettle of taco sauce', C.brick, 28000, 25000, 800, 1100, {n: 12}],
      ['c', 'steam jacketed kettle of honey mustard', C.yellow, 31000, 25000, 800, 1100, {n: 12}],
      ['c', 'steam jacketed kettle of hot sauce', C.brick, 34000, 25000, 800, 1100, {n: 12}],
      ['c', 'kettle agitator, ketchup', C.struct, 28000, 21500, 350, 1500, {n: 6, anim: {type: 'spin', rpm: 20}}],
      ['c', 'kettle agitator, barbecue', C.struct, 31000, 21500, 350, 1500, {n: 6, anim: {type: 'spin', rpm: 18}}],
      ['c', 'kettle agitator, sweet and sour', C.struct, 34000, 21500, 350, 1500, {n: 6, anim: {type: 'spin', rpm: 22}}],
      ['c', 'kettle agitator, honey mustard', C.struct, 31000, 25000, 350, 1500, {n: 6, anim: {type: 'spin', rpm: 16}}],
      ['c', 'high shear mixing tank for mayonnaise and ranch', C.int, 37500, 21500, 900, 2200, {n: 12}],
      ['r', 'colloid mill for stone ground mustard', C.struct, 37000, 24600, 38200, 25600, 1300],
      ['r', 'soy sauce blend tank on a platform', C.int, 36800, 26200, 38600, 27500, 2400],
      ['r', 'kettle room trench drain grate', C.plumb, 27000, 27200, 38500, 27500, 5],
      ['r', 'walk in cooler for liquid egg yolk and buttermilk', C.car2, 40000, 19000, 46500, 27000, 3658],
      ['v', 'board of today sauce schedule, every kind every day', C.sign, 26500, 27850, 29500, 27850, 1300, 2200],
      // packet lines, south half
      ...[['ketchup', C.brick], ['yellow mustard', C.yellow], ['mayonnaise', C.int], ['hot sauce and soy sauce', C.brick], ['ranch and honey mustard', C.veg2], ['barbecue, sweet and sour, taco and duck sauce', C.car2]].flatMap(([s, col], i) => { const u = 3500 + i * 3500; return [
        ['r', 'vertical form fill seal packet machine, line ' + (i + 1) + ', ' + s, col, u, 21000, u + 1400, 22800, 2800],
        ['c', 'sauce hopper over line ' + (i + 1), C.struct, u + 700, 21900, 400, 3300, {n: 10}],
        ['c', 'roll of printed packet film on line ' + (i + 1), C.int, u + 700, 23400, 350, 2600, {n: 10}],
        ['r', 'sealing jaw heater light, line ' + (i + 1), C.elec, u + 500, 20900, u + 900, 21000, 1500, {anim: {type: 'blink', period: 0.8, duty: 0.5}}],
        ['r', 'discharge conveyor from line ' + (i + 1), C.struct, u + 500, 15000, u + 900, 20900, 900],
        ['r', 'checkweigher on line ' + (i + 1), C.int, u + 300, 17200, u + 1100, 17900, 950],
        ['r', 'case packer on line ' + (i + 1), C.struct, u, 13500, u + 1400, 15000, 1500]]; }),
      ['r', 'collector conveyor to the palletizer', C.struct, 3000, 12500, 24000, 13000, 800],
      ['c', 'robotic case palletizer arm', C.elec, 25500, 12000, 1200, 2600, {n: 10, anim: {type: 'spin', rpm: 6}}],
      ['r', 'pallet on the palletizer pad', C.brick, 24900, 10000, 26100, 11200, 900],
      ['r', 'motor control center for the packet lines', C.elec, 1500, 27300, 6000, 27800, 2286, {disc: 'electrical'}],
      ['r', 'hand wash sink at the production entry', C.plumb, 23500, 27300, 24300, 27800, 864, {disc: 'plumbing', check: ['counter_height', 864]}],
      ['v', 'hairnet, beard net and glove station', C.sign, 24600, 27850, 25800, 27850, 1100, 1800],
      ['r', 'qa retain shelf of packets by lot', C.int, 1500, 18500, 2500, 20500, 1829, {check: ['shelf_height', 1829]}]],
    people: [
      ['standing', 'tasting a spoon of ketchup off the kettle paddle', 29500, 23200],
      ['standing', 'loading a new roll of packet film on line two', 7700, 24400],
      ['standing', 'pulling mustard packets for a seal burst test', 9800, 18500],
      ['standing', 'folding a case blank into the packer on line five', 19800, 14300],
      ['standing', 'counting vinegar drums against the receiving slip', 36000, 10800],
      ['standing', 'hosing the trench drain in the kettle room', 32500, 26600]]});
  // more people in the plant, in the frame's u and v
  const at = (u, v) => f.m(u, v);
  { let p = at(8600, 3200); say(p[0], p[1], 'standing', 'checking a bill of lading at door two', Math.PI / 2);
    p = at(14000, 11200); say(p[0], p[1], 'standing', 'labeling a mixed pallet of every kind of sauce', 0);
    p = at(38800, 23400); say(p[0], p[1], 'standing', 'pouring liquid egg yolk into the mayonnaise mixer', 0); }
  // sanitary product line from the kettles to the packet hoppers, and steam
  line('plumbing', C.plumb, [P(...at(37500, 21900), 3600), P(...at(4200, 21900), 3600)], {building: PN, part: 'sanitary product line, kettles to the packet hoppers'});
  line('plumbing', C.brick, [P(...at(27000, 23300), 4200), P(...at(38000, 23300), 4200)], {building: PN, part: 'steam header over the kettles'});
  // forklifts unloading the backed in trailers at docks one, four and seven, each with a driver
  for (const [i, s] of [[0, 'backing a pallet of mustard cases into the trailer at door one'], [3, 'pulling ketchup cases out to the staging lane at door four'], [6, 'unloading tomato paste totes at door seven']]) {
    const u = 3000 + i * 4267 + 1371, pts = [at(u - 500, 6500), at(u - 500, -9000), at(u + 500, -9000), at(u + 500, 6500), at(u - 500, 6500)].map(p => P(p[0], p[1]));
    mover('cart', C.yellow, 'electric forklift working door ' + (i + 1), pts, 1500, s);
  }
  // two rigs lined up in the court waiting for a door
  trailerAt(X(58500), Y(8000), 0, 'loaded trailer of chile bales waiting for a door');
  sym('vehicle', C.brick, 'truck', P(X(58500), Y(25030)), 0, {part: 'tractor idling in the dock queue'});
  trailerAt(X(58500), Y(28000), 0, 'empty reefer trailer waiting for an outbound load');
  sym('vehicle', C.car2, 'truck', P(X(58500), Y(45030)), 0, {part: 'tractor idling in the dock queue'});
  say(X(56300), Y(46500), 'standing', 'waiting by the cab for a dock door call', 4.7);

  // office, lab and test kitchen on the Dropseed Avenue side, where the employees come in
  const ON = 'Dropseed Sauce Office and Test Kitchen';
  const of = small(B, ON, X(2000), Y(14000), X(9000), Y(30000), 's', {fc: C.brick, rc: C.brick, rc2: C.roof, roof: 'hip', water: true, ceil: 2743, doorU: 1000,
    facadePart: 'red brick veneer, south front',
    items: [
      ['r', 'sample counter in the lobby', C.brick, 1000, 2800, 5000, 3300, 1067, {check: ['counter_height', 1067]}],
      ['r', 'pos terminal on the sample counter', C.int, 1500, 2900, 1800, 3200, 1350],
      ['r', 'receipt printer', C.int, 2200, 2900, 2500, 3200, 1100],
      ['r', 'card reader on a swivel', C.int, 3000, 2850, 3200, 3050, 1150],
      ['r', 'cash drawer under the counter', C.struct, 3600, 2900, 4100, 3200, 900],
      ['r', 'case of every packet the works makes, one of each', C.car2, 5600, 500, 6700, 2500, 1600],
      ['v', 'employee time clock', C.int, 6880, 3500, 6880, 3900, 1200, 1600],
      ['r', 'quality lab bench', C.struct, 400, 5400, 6600, 6100, 914, {check: ['counter_height', 914]}],
      ['r', 'bostwick consistometer for ketchup flow', C.int, 800, 5500, 1400, 5800, 1000],
      ['r', 'ph meter', C.int, 1800, 5500, 2100, 5800, 1050],
      ['r', 'refractometer for sugar', C.int, 2500, 5500, 2800, 5750, 1000],
      ['r', 'water activity meter', C.int, 3200, 5500, 3600, 5800, 1050],
      ['r', 'salt titration stand', C.int, 4000, 5500, 4300, 5800, 1300],
      ['r', 'lab sink', C.plumb, 5900, 7500, 6600, 8500, 914],
      ['r', 'retain sample shelf, one packet of every lot', C.int, 400, 9900, 6600, 10300, 1829, {check: ['shelf_height', 1829]}],
      ['r', 'four burner test range', C.struct, 400, 15300, 1600, 15900, 914],
      ['r', 'sample refrigerator', C.int, 2000, 15300, 2800, 15900, 1830],
      ['r', 'break table', C.struct, 3200, 12000, 5200, 13200, 760],
      ['r', 'lockers along the east wall', C.int, 6500, 11000, 6900, 15500, 1830],
      ['v', 'smock and hairnet dispenser', C.sign, 6880, 10800, 6880, 10600, 1200, 1700]],
    people: [['standing', 'ringing up a box of sample packets for a buyer', 3000, 1800], ['standing', 'measuring ketchup flow on the consistometer', 1100, 6900], ['standing', 'cooking a test batch of salsa verde', 1000, 14400], ['sitting', 'eating breakfast before the shift', 4200, 11400]]});
  wall(ON, [[X(2000), Y(19000)], [X(7500), Y(19000)]], 3048, 0, false, C.int);
  wall(ON, [[X(8500), Y(19000)], [X(9000), Y(19000)]], 3048, 0, false, C.int);
  wall(ON, [[X(2000), Y(24500)], [X(2500), Y(24500)]], 3048, 0, false, C.int);
  wall(ON, [[X(3500), Y(24500)], [X(9000), Y(24500)]], 3048, 0, false, C.int);

  // boiler house, tank farm and wastewater shed on the north strip
  const BN = 'Dropseed Sauce Boiler House';
  small(B, BN, X(11000), Y(52500), X(19000), Y(59000), 's', {H: 4877, ceil: 3658, fc: C.struct, rc, rc2, roof: 'shedN', water: true, doorU: 6000,
    items: [['r', 'firetube steam boiler', C.brick, 1000, 2000, 5500, 4000, 2400], ['r', 'burner and blower on the boiler front', C.struct, 5500, 2400, 6300, 3600, 1600],
      ['c', 'boiler stack through the roof', C.struct, 1500, 3000, 300, 6100, {n: 10}], ['c', 'water softener tank', C.plumb, 7000, 5500, 300, 1600, {n: 10}],
      ['r', 'condensate return tank', C.plumb, 6500, 800, 7600, 1800, 1200], ['r', 'boiler chemical feed pump', C.int, 400, 5200, 900, 5700, 600]],
    people: [['standing', 'logging boiler pressure at the start of the shift', 4000, 1200]]});
  run('plumbing', C.brick, [P(X(15000), Y(55000), 2600), P(X(15000), Y(55000), 4200), P(X(15000), Y(40500), 4200), P(X(16000), Y(40500), 4200)], {part: 'steam main from the boiler house to the kettle room'});
  hatch('paving', C.curb, rect(X(21000), Y(52500), X(34000), Y(59500), 0), 'cross', 900, 0, {part: 'concrete tank farm containment pad'}, C.struct);
  line('structure', C.curb, rect(X(21000), Y(52500), X(34000), Y(59500), 600), {part: 'tank farm containment curb'}, closed);
  [['white vinegar', C.plumb], ['corn syrup', C.yellow], ['soybean oil', C.veg2], ['tomato paste', C.brick]].forEach(([s, col], i) => {
    const cx = X(23000 + i * 3000), cy = Y(56000);
    line('structure', col, circ(cx, cy, 1200, 7300, 14), {part: 'bulk tank of ' + s + ', top'}, closed);
    line('structure', col, circ(cx, cy, 1200, 300, 14), {part: 'bulk tank of ' + s + ', base'}, closed);
    line('structure', col, [P(cx - 1200, cy, 300), P(cx - 1200, cy, 7300)], {part: 'bulk tank of ' + s + ', shell'});
    line('structure', col, [P(cx + 1200, cy, 300), P(cx + 1200, cy, 7300)], {part: 'bulk tank of ' + s + ', shell'});
  });
  run('plumbing', C.plumb, [P(X(24000), Y(54700), 3500), P(X(24000), Y(46000), 3500), P(X(17000), Y(46000), 3500), P(X(17000), Y(44000), 3500)], {part: 'bulk transfer line from the tank farm to the kettle room'});
  line('vehicle', C.curb, rect(X(35000), Y(51600), X(37600), Y(59200), 3200), {part: 'tanker trailer of corn syrup at the unloading spot'}, closed);
  line('vehicle', C.curb, circ(X(36300), Y(55400), 1100, 2600, 12).map(q => [X(36300), q[1] + (q[1] > Y(55400) ? 2400 : -2400), q[2] + (q[0] - X(36300))]), {part: 'tanker barrel end'});
  say(X(34600), Y(50600), 'standing', 'hooking the corn syrup hose to the tanker', 1.57);
  const WN = 'Dropseed Sauce Wastewater Shed';
  small(B, WN, X(40000), Y(53500), X(46000), Y(58500), 's', {fc: C.veg2, rc, rc2, roof: 'gableX', doorU: 1000,
    items: [['r', 'grease and solids interceptor lid', C.plumb, 1500, 1500, 3500, 3000, 20, {disc: 'plumbing'}], ['c', 'ph adjustment tank', C.plumb, 4800, 3300, 600, 1500, {n: 12, disc: 'plumbing'}],
      ['r', 'caustic dosing pump', C.int, 4300, 1000, 4800, 1400, 700], ['v', 'discharge permit and sample log', C.sign, 300, 4880, 1500, 4880, 1300, 1800]],
    people: [['standing', 'drawing a wastewater sample for the city', 2500, 3800]]});
  run('plumbing', C.sewer, [P(X(20000), Y(44000), -300), P(X(20000), Y(44000), -1500), P(X(42500), Y(52000), -1500), P(X(42500), Y(55500), -1500)], {part: 'process drain from the kettle room to the interceptor'});
  run('plumbing', C.sewer, [P(X(41500), Y(55500), -1600), P(X(41500), Y(59700), -1600), P(X(1900), Y(59700), -1700)], {part: 'pretreated waste to the block sewer'});
  // gate house at the truck gate
  small(B, 'Dropseed Sauce Gate House', X(53000), Y(1500), X(56658), Y(4548), 'w', {fc: C.yellow, rc, rc2, roof: 'shedS', doorU: 1000,
    items: [['r', 'guard desk with the truck sign in book', C.struct, 300, 1500, 1300, 2900, 760], ['r', 'gate camera monitor', C.int, 400, 2000, 800, 2500, 1100], ['v', 'list of today inbound loads', C.sign, 2948, 600, 2948, 1800, 1300, 1900]],
    people: [['standing', 'checking a trailer seal number on the clipboard', 2300, 2400]]});
  // the walk from the crosswalk to the office door, and a few trees
  { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(P(X(4500 - 1000 * t + Math.round(600 * Math.sin(t * Math.PI))), Y(500 + 13000 * t), 20)); }
    line('paving', C.curb, pts, {part: 'curving walk from the Cholla Street crosswalk to the office door'}); }
  tree(X(7000), Y(6000)); tree(X(2500), Y(9000)); tree(X(7500), Y(11000), 2, 6);

  // ================================================================= 12,1 truck staging and employee lot
  const B1 = block(12, 1, {s: true, e: true, n: true, w: true}, 'Dropseed Sauce truck staging and employee lot',
    [[600, 3000], [600, 20000], [600, 40000], [600, 60360], [30500, 60360], [46000, 60360]],
    [[12 * S + PL + 42000, 2 * S - PL - 600, 12 * S + PL + 52000, 2 * S - CURB], [12 * S + CURB, 1 * S + PL + 30000, 12 * S + PL + 600, 1 * S + PL + 36000], [12 * S + CURB, 1 * S + PL + 48500, 12 * S + PL + 600, 1 * S + PL + 54500], [13 * S - PL - 600, 1 * S + PL + 20000, 13 * S - CURB, 1 * S + PL + 30000]]);
  const X1 = B1.X, Y1 = B1.Y;
  for (const [x, z, col, nm] of [[12 * S + 2400, -1219, C.plumb, 'water main in Dropseed Avenue'], [12 * S + 3600, -2134, C.sewer, 'sewer main in Dropseed Avenue']]) line('plumbing', col, [P(x, 1 * S, z), P(x, 2 * S, z)], {part: nm + ', extended south to the truck yard'});
  line('electrical', C.elec, [P(X1(600), Y1(60360), 8230), P(X(600), Y(3000), 8230)], {part: 'primary across Cholla Street to the plant pole line'});
  hatch('paving', C.street, rect(X1(800), Y1(23000), X1(25000), Y1(60500), 0), 'dots', 1500, 0, {part: 'employee lot, asphalt'}, C.curb);
  stallRow(X1(1500), Y1(24000), 8, 1, 'employee', true);
  stallRow(X1(1500), Y1(36486), 8, -1, 'employee');
  stallRow(X1(1500), Y1(42500), 8, 1, 'employee');
  stallRow(X1(1500), Y1(54986), 8, -1, 'employee');
  // accessible stall with its access aisle next to the walk
  line('paving', C.car2, rect(X1(23000), Y1(54986), X1(26658), Y1(60472)), {part: 'accessible stall', checks: [['stall_width', 3658], ['stall_depth', 5486]]}, closed);
  hatch('paving', C.white, rect(X1(26658), Y1(54986), X1(29096), Y1(60472)), 'lines', 300, 45, {part: 'accessible stall access aisle'});
  sym('street', C.sign, 'sign', P(X1(24800), Y1(60200)), 0, {text: 'Accessible parking, van'});
  sym('vehicle', C.car, 'car', P(X1(24830), Y1(57800)), Math.PI, {part: 'employee car in the accessible stall'});
  // crosswalk on Cholla Street between the lot and the plant walk
  for (let i = 0; i < 6; i++) { const x = X1(3000 + i * 600); line('street', C.white, [P(x, 2 * S - CURB), P(x, 2 * S - 150)], {street: 'Cholla Street', part: 'crosswalk stripe, south half'}); line('street', C.white, [P(x, 2 * S + 150), P(x, 2 * S + CURB)], {street: 'Cholla Street', part: 'crosswalk stripe, north half'}); }
  hatch('paving', C.curb, rect(X1(1000), Y1(60500), X1(2500), Y1(60960)), 'lines', 300, 0, {part: 'walk from the employee lot to the crosswalk'});
  // an employee walking from her car to the office door and back
  { const out = [P(X1(12000), Y1(48500)), P(X1(2200), Y1(48500)), P(X1(2200), Y1(60700)), P(X1(4500), Y1(60700)), P(X(4500), Y(500)), P(X(3800), Y(7000)), P(X(3500), Y(13300))];
    const pts = out.concat(out.slice(0, -1).reverse()); const name = pool[ni++], txt = 'walking in from the employee lot for the first shift'; named.push(name + ': ' + txt); usedIn('12:1').add(txt);
    sym('activity', C.person, 'person', pts[0], 0, {pose: 'walking', activity: txt, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, anim: {type: 'path', speed: 1300, pts}}); }
  say(X1(9500), Y1(30500), 'standing', 'locking the car and pulling on a hairnet', 0);
  say(X1(27500), Y1(44000), 'standing', 'carpooling in with two packers from the line', 0);
  // truck staging: a drop row of trailers, a queue of rigs lined up for the gate, a yard tractor
  hatch('paving', C.curb, rect(X1(30000), Y1(1000), X1(60360), Y1(60500), 0), 'dots', 1200, 0, {part: 'truck staging yard, concrete'}, C.struct);
  const drops = ['empty trailer for a fast food route', 'trailer loaded with ketchup cases for the coast', 'empty reefer trailer', 'trailer of packet film rolls', 'trailer loaded with hot sauce cases', 'empty trailer from the mustard seed farm'];
  drops.forEach((t, i) => trailerAt(X1(33000 + i * 3500), Y1(3000), 0, t));
  for (const [ty, col, t] of [[1000, C.yellow, 'trailer of tomatoes from the farms east of town in the gate queue'], [20500, C.brick, 'trailer of chile bales in the gate queue'], [40000, C.car2, 'empty reefer in the gate queue']]) { trailerAt(X1(57500), Y1(ty), 0, t); sym('vehicle', col, 'truck', P(X1(57500), Y1(ty + 17030)), 0, {part: 'tractor lined up for the plant gate'}); }
  say(X1(55400), Y1(19500), 'standing', 'waiting by the cab for a call from the gate', 1.57);
  mover('truck', C.yellow, 'yard tractor shuttling trailers', [P(X1(34000), Y1(22000)), P(X1(34000), Y1(38000)), P(X1(52000), Y1(38000)), P(X1(52000), Y1(22000)), P(X1(34000), Y1(22000))], 3000, 'shuttling a trailer to the drop row');
  small(B1, 'Dropseed Sauce Driver Check In', X1(30000), Y1(46000), X1(36096), Y1(51000), 'e', {fc: C.brick, rc: C.brick, rc2, roof: 'gableY', water: true, doorU: 1000,
    items: [['r', 'driver check in window shelf', C.brick, 2500, 300, 4500, 700, 1067, {check: ['counter_height', 1067]}], ['r', 'pos terminal for lumper fees', C.int, 2800, 900, 3100, 1200, 1300], ['r', 'receipt printer', C.int, 3400, 900, 3700, 1200, 1100], ['r', 'card reader for driver fees', C.int, 3900, 350, 4100, 550, 1150], ['r', 'cash drawer under the window', C.struct, 2900, 1300, 3400, 1600, 900], ['r', 'bill of lading printer', C.int, 1000, 2500, 1400, 2900, 1100], ['v', 'load board of every sauce going out today', C.sign, 1000, 5946, 3600, 5946, 1300, 2100], ['r', 'coffee maker for drivers', C.int, 300, 4800, 700, 5200, 1000], ['r', 'snack vending machine', C.yellow, 4500, 5000, 4900, 5900, 1830]],
    people: [['standing', 'signing in a load of tomatoes at the window', 3500, -800], ['sitting', 'assigning a dock door to the next rig', 3000, 2400]]});
  sym('structure', C.sign, 'sign', P(X1(59000), Y1(32000)), 0, {text: 'Dropseed Sauce trucks enter here, check in at the window'});

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
