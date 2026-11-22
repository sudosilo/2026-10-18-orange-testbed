// Agent Orange 2026-11-22 a: Cinch Ring Boot and Shoe Repair on the 2,2 plaza, Bitterwater Ditch Rider Shed on 3,2, Sagebrush Hill Food Pantry on 0,3,
// a winter alfalfa crew with a sheep band on open land 0,6, and new calendar boards.
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
  let seed = 1122; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Clover low in the alleys, dark before sunrise under a lid of cloud, the shaker parked for winter. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage);
  const pp = (t) => ['p', 'standing', t];
  const night = {when: 'night', lit: true};

  // ================================================================= 2,2 Cinch Ring Boot and Shoe Repair, on the north plaza behind main street
  {
    const N = 'Cinch Ring Boot and Shoe Repair', x0 = 178000, x1 = 184400, y0 = 211500, y1 = 216100, H = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, H), 'lines', 300, 0, {building: N, part: 'board and batten front, plaza side'}, C.yellow);
    hatch('structure', C.brick, vface(x0, y1, x1, y1, 0, 800), 'gradient', 300, 0, {building: N, part: 'dust at the base, north wall'}, C.struct);
    hip(N, x0, y0, x1, y1, H + 100, C.brick, C.roof);
    door(N, x0 + 1200, y0, 'x', 914, 'shoe repair door to the plaza', 1);
    sym('structure', C.sign, 'sign', P(x0 + 3200, y0 - 900), 0, {text: N + ', resoles, heels, zippers and tack'});
    sym('electrical', C.elec, 'light', P(x0 + 800, y0 - 300, 2400), 0, Object.assign({building: N, part: 'gooseneck light over the shoe repair door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2896), 'lines', 600, 90, {building: N, part: 'beadboard ceiling', checks: [['ceiling_height', 2896]]});
    hatch('structure', C.brick, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'brick', 400, 0, {building: N, part: 'worn red quarry tile floor'});
    // front counter with the point of sale gear
    R('front counter', C.struct, 2400, 900, 4600, 1400, 1067, {check: ['counter_height', 1067]});
    R('POS terminal on the counter', C.int, 2600, 1000, 2900, 1250, 1150);
    R('receipt printer', C.curb, 3000, 1000, 3250, 1250, 1170);
    R('cash drawer under the counter top', C.struct, 3400, 1000, 3900, 1350, 1000);
    R('card reader on a swivel stand', C.int, 4050, 1100, 4200, 1300, 1120);
    R('book of claim stubs', C.sign, 4300, 1000, 4500, 1250, 1090);
    // machines along the north wall
    R('shoe finishing machine with brush and sanding wheels', C.int, 400, 3700, 3000, 4300, 1000);
    O('sanding wheel on the finisher, running', C.curb, 900, 4000, 180, 1060, {anim: {type: 'spin', rpm: 110}});
    O('horsehair brush wheel on the finisher', C.yellow, 2300, 4000, 200, 1060);
    R('dust collector bag for the finisher', C.curb, 3100, 3800, 3450, 4300, 1500);
    R('post bed patcher sewing machine', C.struct, 3700, 3700, 4400, 4300, 1000);
    O('patcher needle head', C.curb, 4050, 4000, 90, 1300);
    R('leather skiving machine', C.struct, 5000, 3800, 5800, 4300, 900);
    // the bench and the stock
    R('cobbler workbench with a last stand', C.struct, 5600, 1600, 6200, 3200, 914, {check: ['counter_height', 914]});
    O('iron shoe last on the stand', C.curb, 5900, 2400, 120, 1150);
    R('shelf of polish, laces and insoles', C.yellow, 4900, 200, 6200, 500, 1524, {check: ['shelf_height', 1524]});
    R('bin of rubber heels and vibram soles', C.brick, 2000, 2300, 2500, 2800, 600);
    O('boot stretcher in a ranch boot', C.struct, 1300, 2600, 160, 460);
    O('glue pot by the patcher', C.yellow, 4700, 3450, 100, 950);
    V('bundle of tanned hides hung on the wall', C.brick, 120, 300, 120, 1500, 600, 2000);
    V('rack of claim tickets and repaired shoes waiting', C.sign, 120, 1800, 120, 3200, 900, 1900);
    V('price list chalkboard', C.sign, 6280, 3400, 6280, 4000, 1300, 1900);
    V('100 A panel', C.elec, 6280, 600, 6280, 1100, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the counter', 3500, 1200, 2896);
    Sy('light', 'ceiling light over the finisher', 1700, 3300, 2896);
    Sy('light', 'ceiling light over the bench', 5000, 2500, 2896);
    Sy('switch', 'switch by the door', 2000, 120, 1219);
    Ot('outlet for the finisher', 120, 3500, 457);
    Ot('outlet for the patcher', 4200, 4480, 457);
    Ot('outlet at the counter', 4700, 120, 1067);
    run('electrical', C.elec, [P(184356, 192647, 6400), P(184356, 192647, -760), P(185000, 192647, -760), P(185000, 213800, -760), P(184000, 213800, -760), P(184000, 213800, 1200)], {part: 'underground service from the alley pole to the shoe repair panel'});
    hatch('paving', C.curb, rect(x0 + 700, y0 - 2200, x0 + 2200, y0, 0), 'dots', 600, 0, {part: 'concrete stoop at the shoe repair door'});
    sy(1800, 3200, 'standing', 'running a resoled boot across the finishing wheel', 0);
    sy(4500, 2600, 'standing', 'tacking a new heel on a pair of ranch boots', 0);
    sy(3300, 1900, 'standing', 'writing a claim stub for a split welt', Math.PI);
    sy(3500, 450, 'standing', 'dropping off work boots before the early shift', 0);
  }

  // ================================================================= 3,2 Bitterwater Ditch Rider Shed, between the post office dock and the district office
  {
    const N = 'Bitterwater Ditch Rider Shed', x0 = 268900, x1 = 273700, y0 = 218300, y1 = 222300, H = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.lot, vface(x0, y1, x1, y1, 0, H), 'lines', 450, 90, {building: N, part: 'corrugated steel siding, north face'}, C.curb);
    hatch('structure', C.brick, vface(x1, y0, x1, y1, 0, 700), 'gradient', 300, 0, {building: N, part: 'ditch mud splashed at the base, east wall'}, C.struct);
    shed(N, x0, y0, x1, y1, H + 100, C.lot, C.roof, false);
    door(N, x0 + 1200, y1, 'x', 914, 'ditch rider shed door', -1);
    sym('structure', C.sign, 'sign', P(x0 + 2800, y1 + 900), 0, {text: N + ', water orders taken here'});
    sym('electrical', C.elec, 'light', P(x0 + 600, y1 + 300, 2400), 0, Object.assign({building: N, part: 'porch light over the ditch rider door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 900, 0, {building: N, part: 'metal liner ceiling', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'dots', 500, 0, {building: N, part: 'bare slab, tracked with mud'});
    R('ditch rider desk', C.struct, 300, 300, 1800, 1000, 762);
    R('two way radio base on the desk', C.int, 400, 450, 750, 750, 900);
    R('water order book open to today', C.sign, 1000, 450, 1400, 750, 790);
    V('water order board for the morning run', C.sign, 120, 1300, 120, 2600, 1100, 1900);
    V('board of headgate keys and padlocks', C.curb, 2000, 120, 3000, 120, 1200, 1800);
    R('rack of long handled shovels and a weed hook', C.struct, 4000, 300, 4400, 2200, 1900);
    V('hip waders hung on pegs', C.lot, 4680, 2600, 4680, 3500, 700, 1700);
    R('wading rod and current meter case', C.yellow, 2400, 3200, 3600, 3600, 300);
    R('bench of trash rack rakes and staff gauges', C.struct, 300, 3200, 1800, 3700, 914, {check: ['counter_height', 914]});
    R('charging shelf for the radios', C.int, 2200, 1500, 3200, 1800, 1219, {check: ['shelf_height', 1219]});
    V('60 A panel', C.elec, 4680, 600, 4680, 1000, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the desk', 1200, 1600, 2743);
    Sy('light', 'ceiling light over the tool rack', 3400, 2400, 2743);
    Sy('switch', 'switch by the ditch rider door', 2400, 3880, 1219);
    Ot('outlet at the radio shelf', 2700, 120, 457);
    Ot('outlet by the desk', 120, 700, 457);
    run('electrical', C.elec, [P(283888, 231658, 6400), P(283888, 231658, -760), P(274400, 231658, -760), P(274400, 221000, -760), P(273300, 221000, -760), P(273300, 221000, 1200)], {part: 'underground service from the Agave Street pole to the ditch rider shed'});
    sym('vehicle', C.car2, 'truck', P(x0 + 3600, y1 + 3200), Math.PI / 2, {part: 'ditch rider pickup with a shovel in the bed'});
    hatch('paving', C.curb, rect(x0 + 600, y1, x0 + 2000, y1 + 1500, 0), 'dots', 600, 0, {part: 'gravel pad at the ditch rider door'});
    sy(1500, 2200, 'standing', 'reading the night water orders off the board', 4.7);
    sy(3200, 2600, 'standing', 'clipping the headgate keys to a belt ring', 0);
  }

  // ================================================================= 0,3 Sagebrush Hill Food Pantry, north of the fellowship hall
  {
    const N = 'Sagebrush Hill Food Pantry', x0 = 19300, x1 = 25700, y0 = 278100, y1 = 283100, H = 3048;
    const {R, O, V, S: Sy, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, H), 'dots', 350, 0, {building: N, part: 'adobe colored stucco, south front'}, C.brick);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 800), 'gradient', 300, 0, {building: N, part: 'dust at the base, west wall'}, C.curb);
    gableY(N, x0, y0, x1, y1, H + 100, C.veg2, C.roof);
    door(N, x0 + 1600, y0, 'x', 914, 'food pantry door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 3600, y0 - 900), 0, {text: N + ', open after the Sunday service'});
    sym('electrical', C.elec, 'light', P(x0 + 900, y0 - 300, 2400), 0, Object.assign({building: N, part: 'light over the pantry door'}, night));
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'cross', 1219, 0, {building: N, part: 'gray lay in ceiling grid', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'vinyl tile floor'});
    R('intake counter', C.struct, 2800, 700, 4600, 1300, 914, {check: ['counter_height', 914]});
    R('sign in tablet on the counter', C.int, 3000, 850, 3300, 1100, 940);
    R('floor scale for weighing donations', C.curb, 4800, 400, 5500, 1100, 150);
    R('shelf of canned beans, corn and tomatoes', C.yellow, 400, 4400, 2600, 4800, 1829, {check: ['shelf_height', 1829]});
    R('shelf of rice, pasta and oats', C.yellow, 3000, 4400, 5200, 4800, 1829, {check: ['shelf_height', 1829]});
    R('center shelf of cereal and peanut butter', C.struct, 1600, 2500, 3800, 3000, 1524, {check: ['shelf_height', 1524]});
    R('chest freezer of donated chicken', C.int, 400, 1600, 1300, 2800, 860);
    R('glass door cooler of milk and eggs', C.int, 400, 3000, 1100, 3900, 2032);
    R('bread rack with day old donuts from the Sun Dog Donut Counter', C.brick, 4400, 2300, 5000, 3200, 1700);
    R('pallet of donated pecans from Pecan Hollow', C.brick, 5300, 1500, 6200, 2700, 900);
    R('stack of empty produce boxes', C.struct, 5800, 4300, 6200, 4800, 1200);
    R('hand sink', C.plumb, 5750, 3450, 6250, 3950, 900);
    V('board of pantry hours and volunteer shifts', C.sign, 120, 600, 120, 1300, 1200, 1800);
    V('100 A panel', C.elec, 6280, 800, 6280, 1200, 1100, 1800, {disc: 'electrical'});
    Sy('light', 'ceiling light over the intake counter', 3700, 1600, 2743);
    Sy('light', 'ceiling light over the canned goods', 1600, 3700, 2743);
    Sy('light', 'ceiling light over the bread rack', 4700, 3700, 2743);
    Sy('switch', 'switch by the pantry door', 2400, 120, 1219);
    Ot('outlet for the chest freezer', 120, 1450, 457);
    Ot('outlet for the cooler', 120, 4150, 457);
    Ot('outlet at the intake counter', 4700, 120, 1067);
    run('electrical', C.elec, [P(6386, 279168, 6400), P(6386, 279168, -760), P(19800, 279168, -760), P(19800, 279168, 1200)], {part: 'underground service from the Ocotillo Avenue pole to the pantry panel'});
    run('plumbing', C.plumb, [P(2400, 281700, -1219), P(25200, 281700, -1067), P(25200, 281700, 800)], {part: 'cold water from the Ocotillo Avenue main to the pantry hand sink'});
    run('plumbing', C.sewer, [P(25300, 281900, -300), P(3600, 281900, -2134)], {part: 'pantry sink drain to the Ocotillo Avenue sewer'});
    hatch('paving', C.curb, rect(x0 + 1000, y0 - 1800, x0 + 2600, y0, 0), 'dots', 600, 0, {part: 'concrete step at the pantry door'});
    sy(2000, 1800, 'standing', 'packing a grocery box for a family of five', 0);
    sy(3500, 3700, 'standing', 'stocking canned beans on the pantry shelf', 1.57);
    sy(4600, 1800, 'standing', 'weighing a crate of donated pecans', 0);
    sy(1700, 3600, 'standing', 'checking the dates on the milk in the cooler', 3.14);
  }

  // ================================================================= winter alfalfa on open land 0,6, north of the wheat
  // Unclaimed alfalfa land going dormant. Open layers only (vegetation, vehicle, activity), every record farm: true.
  const ox = 0 * S, oy = 6 * S, X = (u) => ox + u, Y = (v) => oy + v;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  function driverPath(carId, pts, myId) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = d[d.length - 1]; if (!L) return null;
    const s = ((((carId % 97) / 97 - (myId % 97) / 97) % 1 + 1) % 1) * L;
    let j = 1; while (j < pts.length - 1 && d[j] < s) j++;
    const f = (s - d[j - 1]) / ((d[j] - d[j - 1]) || 1), q = [0, 1, 2].map(m => Math.round(pts[j - 1][m] + (pts[j][m] - pts[j - 1][m]) * f));
    const ring = pts.slice(0, -1); return [q].concat(ring.slice(j), ring.slice(0, j)).concat([q]);
  }
  const WHO = {wokenBy: 'the winter alfalfa crew', how: 'woke in the dark to the bleat of the ewes on the stubble'};
  function rig(label, col, pts, speed, shape, riderText) {
    const id = nextIdNow(), [x, y, z] = pts[0];
    line('vehicle', col, shape.map(([a, b, c]) => P(x + a, y + b, z + c)), {part: label, anim: {type: 'path', speed, pts}});
    const rid = nextIdNow(), dp = driverPath(id, pts, rid);
    const name = pool[ni++]; named.push(name + ': ' + riderText); usedIn('0:6').add(riderText);
    sym('activity', C.person, 'person', dp[0], 0, {pose: 'walking', activity: riderText, name, awake: true, wokenBy: WHO.wokenBy, how: WHO.how, layer: 1, driving: id, anim: {type: 'path', speed, pts: dp}});
  }
  const tractor = [[-1100, -1700, 0], [1100, -1700, 0], [1100, 2500, 0], [-1100, 2500, 0], [-1100, -1700, 0], [-1100, -1700, 2700], [1100, -1700, 2700], [1100, 500, 2700], [-1100, 500, 2700], [-1100, -1700, 2700], [-1100, 2500, 1400], [1100, 2500, 1400], [1100, -1700, 0]];
  // a tractor pulling a land plane, smoothing the north checks before the winter irrigation
  { const p = [], vs = [52000, 58000, 64000, 70000];
    vs.forEach((v, i) => { const a = i % 2 ? 70000 : 12000, b = i % 2 ? 12000 : 70000; p.push(P(X(a), Y(v)), P(X(b), Y(v))); });
    p.push(P(X(9500), Y(70000)), P(X(9500), Y(52000)), P(X(12000), Y(52000)));
    const plane = tractor.concat([[0, -1700, 500], [0, -3000, 500], [-2400, -3000, 400], [2400, -3000, 400], [2400, -12000, 400], [-2400, -12000, 400], [-2400, -3000, 400], [-2400, -7500, 0], [2400, -7500, 0], [2400, -7500, 900], [-2400, -7500, 900]]);
    rig('four wheel drive tractor pulling a land plane', C.yellow, p, 2200, plane, 'floating the north checks smooth with the land plane'); }
  // a self propelled bale wagon picking up the last small bales of the fall cutting, north south passes
  { const p = [], us = [16000, 24000, 32000, 40000];
    us.forEach((u, i) => { const a = i % 2 ? 34000 : 10000, b = i % 2 ? 10000 : 34000; p.push(P(X(u), Y(a)), P(X(u), Y(b))); });
    p.push(P(X(40000), Y(7600)), P(X(16000), Y(7600)), P(X(16000), Y(10000)));
    const wagon = [[-1300, -5000, 0], [1300, -5000, 0], [1300, 3000, 0], [-1300, 3000, 0], [-1300, -5000, 0], [-1300, -5000, 2900], [1300, -5000, 2900], [1300, -900, 2900], [-1300, -900, 2900], [-1300, -5000, 2900], [-1300, 1000, 0], [-1300, 1000, 2800], [1300, 1000, 2800], [1300, 3000, 2800], [-1300, 3000, 2800], [-1300, 1000, 2800], [-1900, 2600, 300], [-1900, 3000, 300]];
    rig('self propelled bale wagon with a half load', C.brick, p, 1800, wagon, 'picking up the last bales of the fall cutting'); }
  // the bales it has not reached yet, lying in the stubble along the east passes
  for (let i = 0; i < 18; i++) { const u = 24000 + (i % 3) * 8000 + 600, v = 12000 + Math.floor(i / 3) * 3900 + (i % 2) * 900;
    line('vegetation', C.veg2, rect(X(u - 450), Y(v - 230), X(u + 450), Y(v + 230), 400), {part: 'small square alfalfa bale left from the fall cutting', species: 'alfalfa'}, closed); }
  // a band of ewes grazing the dormant stubble inside a portable electric net fence
  const fx0 = 50000, fx1 = 68000, fy0 = 14000, fy1 = 32000;
  line('vegetation', C.curb, [P(X(fx0), Y(fy0), 900), P(X(fx1), Y(fy0), 900), P(X(fx1), Y(fy1), 900), P(X(fx0), Y(fy1), 900)], {part: 'portable electric net fence around the sheep band', species: 'alfalfa'}, closed);
  line('vegetation', C.elec, rect(X(fx1 + 300), Y(fy1 - 1200), X(fx1 + 900), Y(fy1 - 600), 600), {part: 'solar fence energizer on a stake'}, closed);
  for (let i = 0; i < 16; i++) { const u = fx0 + 2000 + rnd() * (fx1 - fx0 - 4000), v = fy0 + 2000 + rnd() * (fy1 - fy0 - 4000), a = rnd() * Math.PI;
    const c = Math.cos(a), s = Math.sin(a), pts = [[-550, -250], [550, -250], [550, 250], [-550, 250]].map(([q, r]) => P(Math.round(X(u) + q * c - r * s), Math.round(Y(v) + q * s + r * c), 700));
    line('vegetation', C.white, pts, {part: 'ewe grazing the alfalfa stubble', species: 'alfalfa'}, closed); }
  line('vegetation', C.plumb, rect(X(fx0 + 1200), Y(fy0 + 1200), X(fx0 + 3600), Y(fy0 + 1900), 600), {part: 'stock tank for the ewes'}, closed);
  say(X(fx0 - 1500), Y(fy1 - 3000), 'standing', 'walking the net fence to check the charge', 0);
  { const d = [P(X(fx0 + 1500), Y(fy0 + 1500)), P(X(fx1 - 1500), Y(fy0 + 1500)), P(X(fx1 - 1500), Y(fy1 - 1500)), P(X(fx0 + 1500), Y(fy1 - 1500)), P(X(fx0 + 1500), Y(fy0 + 1500))];
    sym('activity', C.brick, 'dog', d[0], 0, {activity: 'herding dog working the ewes along the fence', anim: {type: 'path', speed: 1500, pts: d}}); }
  // the herder's camp trailer and pickup parked out in the field
  sym('vehicle', C.car2, 'truck', P(X(44000), Y(38000)), 0, {part: 'herder pickup parked out in the alfalfa'});
  line('vehicle', C.white, rect(X(42000), Y(30500), X(44500), Y(35500), 2700), {part: 'sheep camp wagon with a stovepipe'}, closed);
  line('vehicle', C.struct, [P(X(43800), Y(34800), 2700), P(X(43800), Y(34800), 3500)], {part: 'camp wagon stovepipe'});
  say(X(46000), Y(36000), 'standing', 'pouring coffee from a thermos on the tailgate', 3.14);
  // one portable toilet with a hand wash stand at the east field edge
  line('vehicle', C.plumb, rect(X(75500), Y(45000), X(76650), Y(46150), 2290), {part: 'portable toilet at the field edge'}, closed);
  line('vehicle', C.curb, rect(X(75500), Y(46600), X(76200), Y(47100), 1000), {part: 'portable hand wash stand beside the toilet'}, closed);
  // idle gated pipe loaded on a pipe wagon at the north headland
  line('vehicle', C.struct, rect(X(30000), Y(75000), X(40000), Y(77000), 800), {part: 'pipe wagon parked on the north headland'}, closed);
  for (let i = 0; i < 8; i++) line('vehicle', C.yellow, [P(X(30300), Y(75300 + (i % 4) * 450), 1000 + Math.floor(i / 4) * 280), P(X(39700), Y(75300 + (i % 4) * 450), 1000 + Math.floor(i / 4) * 280)], {part: 'idle 10 inch PVC gated pipe, ' + (i + 1)});
  line('vehicle', C.int, rect(X(41000), Y(75400), X(42000), Y(76400), 500), {part: 'bucket of gate slides and pipe plugs'}, closed);
  say(X(35000), Y(73800), 'standing', 'chaining down the gated pipe for the winter', 1.57);
  say(X(9000), Y(30000), 'standing', 'watching for the first light under the clouds', 0);

  // every record on 0,6 carries farm: true so the alfalfa keeps showing
  for (const c of k.calls) { const a = c.args; if (!a || !['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)) continue;
    const p0 = a.at || a.pts[0]; if (k.ck(p0[0], p0[1]) === '0:6') a.meta = Object.assign(a.meta || {}, {farm: true}); }

  if (ni) console.log('NAMED ' + named.length + ' ' + named.join(' / '));
  if (missing) console.log('MISSING ' + missing);
}
