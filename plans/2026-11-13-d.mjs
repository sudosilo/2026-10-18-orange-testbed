// Agent Orange 2026-11-13 d: Chinchweed Ridge, a sky island range with contours, a fire road, a summit lookout and a lightning fire
// on 2..7,5 and 2..7,6, woodland on the empty blocks around town and groves on open ground in Orange blocks. Asked by Orange.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611134; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
    person(P(c[0], c[1]), Math.round(rnd() * 628) / 100, pose, text);
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
  // ---------------------------------------------------------------- shared helpers for the warehouse district
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
  k.HSTREET[6] = 'Tobosa Street'; k.VSTREET[11] = 'Galleta Avenue';

  s2 = 71331;
  // ---------------------------------------------------------------- fire and smoke helpers (from 2026-11-13-c)
  function flame(x, y, z, r, h, seed, label) {
    for (const [dx, dy, col, sc, an] of [[1, 0, C.brick, 1, {type: 'sway', deg: 9, period: 0.7 + (seed % 5) * 0.08, pivot: [Math.round(x), Math.round(y), Math.round(z)]}], [0, 1, C.elec, 0.85, {type: 'sway', deg: 11, period: 0.55 + (seed % 3) * 0.07, pivot: [Math.round(x), Math.round(y), Math.round(z)]}], [0.7, 0.7, C.yellow, 0.5, {type: 'bob', mm: Math.round(h * 0.18), period: 0.45 + (seed % 4) * 0.05}]]) {
      const pts = [], n = 8, H = h * sc, R = r * sc;
      for (let i = 0; i <= n; i++) { const t = i / n, w = R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - 0.55 * t) * (1 + 0.15 * Math.sin(seed + i * 2.1)); pts.push(P(x - dx * w, y - dy * w, z + H * t)); }
      for (let i = n - 1; i > 0; i--) { const t = i / n, w = R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - 0.55 * t) * (1 + 0.15 * Math.cos(seed + i * 1.7)); pts.push(P(x + dx * w, y + dy * w, z + H * t)); }
      line('activity', col, pts, {part: label || 'fire', anim: an}, closed);
    }
  }
  function smoke(x, y, z, r, n, seed, label) {
    for (let i = 0; i < n; i++) {
      const zz = z + i * r * 1.3, rr = r * (1 + i * 0.35), cx = x + i * r * 0.5, cy = y + i * r * 0.3;
      line('activity', i % 2 ? 7 : 0, circ(cx, cy, rr, zz, 10).map((p, j) => P(p[0], p[1], p[2] + Math.round(Math.sin(j + seed) * rr * 0.25))), {part: (label || 'smoke') + ' puff ' + (i + 1), anim: {type: 'bob', mm: Math.round(rr * 0.8), period: 3 + ((seed + i) % 4) * 0.9}}, closed);
    }
  }
  const noise = (x, y, s) => Math.sin(x / 23000 + s) * Math.cos(y / 19000 - s * 1.3) + 0.5 * Math.sin((x + y) / 9000 + s * 2.1);
  const ckOf = (x, y) => Math.floor(x / S) + ',' + Math.floor(y / S);
  const animCount = {};
  const canAnim = (x, y, max) => { const c = ckOf(x, y); animCount[c] = animCount[c] || 0; if (animCount[c] >= max) return false; animCount[c]++; return true; };
  // A planted tree or shrub with its species, a few of them swaying.
  const plant = (type, x, y, z, species, swayMax = 14) => sym('vegetation', type === 'shrub' ? C.veg2 : C.veg, type, P(x, y, z), Math.round(r2() * 628) / 100, Object.assign({part: species}, type === 'tree' && canAnim(x, y, swayMax) ? {anim: {type: 'sway', deg: 2 + Math.round(r2() * 3), period: 5 + Math.round(r2() * 30) / 10}} : {}));
  // A drawn ponderosa: a trunk and three crossed cone tiers.
  function pine(x, y, z, h, label) {
    line('vegetation', C.struct, [P(x, y, z), P(x, y, z + h)], {part: label + ' trunk'});
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const pts = [];
      for (let t = 0; t < 3; t++) { const zb = z + h * (0.3 + t * 0.22), zt = zb + h * 0.32, w = h * (0.22 - t * 0.05); pts.push(P(x - dx * w, y - dy * w, zb), P(x, y, zt), P(x + dx * w, y + dy * w, zb)); }
      line('vegetation', C.veg, pts, {part: label + ' crown'}, closed);
    }
  }

  // ================================================================= Chinchweed Ridge, a sky island range north of Desert Holly Street
  const RX0 = 2 * S, RX1 = 8 * S, RY0 = 5 * S, RY1 = 7 * S;
  for (let cx = 2; cx <= 7; cx++) claim(cx, 5);
  for (let cx = 2; cx <= 7; cx++) claim(cx, 6);
  for (let cx = 2; cx <= 7; cx++) for (let cy = 5; cy <= 6; cy++) lot('park', cx * S + 300, cy * S + (cy === 5 ? PL : 300), (cx + 1) * S - 300, (cy + 1) * S - 300, 'Chinchweed Ridge Forest Preserve');
  const peaks = [[3.1 * S, 6.25 * S, 105000, 95000, 1], [4.4 * S, 6.45 * S, 150000, 120000, 2], [5.7 * S, 6.2 * S, 95000, 90000, 3], [6.9 * S, 6.4 * S, 120000, 100000, 4], [2.35 * S, 6.6 * S, 70000, 60000, 5], [7.6 * S, 6.75 * S, 80000, 60000, 6]].map(([a1, b1, c1, d1, e1]) => [Math.round(a1), Math.round(b1), c1, d1, e1]);
  const sm = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  function hgt(x, y) {
    let h = 0;
    for (const [px, py, H, R, s] of peaks) {
      const dx = x - px, dy = y - py, th = Math.atan2(dy, dx), r = R * (1 + 0.22 * Math.sin(th * 3 + s) + 0.1 * Math.sin(th * 5 + s * 2)), d = Math.hypot(dx, dy) / r;
      if (d < 1) h = Math.max(h, H * Math.pow(1 - d, 1.6) * (1 + 0.04 * Math.sin(x / 3000 + s) * Math.sin(y / 3500)));
    }
    const edge = Math.min(sm((y - RY0 - 14000) / 26000), sm((RY1 - 3000 - y) / 22000), sm((x - RX0 - 3000) / 20000), sm((RX1 - 3000 - x) / 20000));
    return Math.max(0, Math.round(h * edge));
  }
  // contours by marching squares
  {
    const g = 2500, nx = Math.floor((RX1 - RX0) / g), ny = Math.floor((RY1 - RY0) / g), V = [];
    for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= nx; i++) V[j].push(hgt(RX0 + i * g, RY0 + j * g)); }
    let idx = 0;
    for (let L = 8000; L < 150000; L += 8000, idx++) {
      const segs = [], ptOf = {};
      const ep = (key, i0, j0, i1, j1) => { if (!ptOf[key]) { const a = V[j0][i0], b = V[j1][i1], t = (L - a) / (b - a); ptOf[key] = [RX0 + (i0 + (i1 - i0) * t) * g, RY0 + (j0 + (j1 - j0) * t) * g]; } return key; };
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const c = (V[j][i] >= L ? 1 : 0) | (V[j][i + 1] >= L ? 2 : 0) | (V[j + 1][i + 1] >= L ? 4 : 0) | (V[j + 1][i] >= L ? 8 : 0);
        if (c === 0 || c === 15) continue;
        const B = () => ep('h' + i + ',' + j, i, j, i + 1, j), Rr = () => ep('v' + (i + 1) + ',' + j, i + 1, j, i + 1, j + 1), T = () => ep('h' + i + ',' + (j + 1), i, j + 1, i + 1, j + 1), Lf = () => ep('v' + i + ',' + j, i, j, i, j + 1);
        const tab = {1: [[Lf, B]], 2: [[B, Rr]], 3: [[Lf, Rr]], 4: [[Rr, T]], 5: [[Lf, T], [B, Rr]], 6: [[B, T]], 7: [[Lf, T]], 8: [[T, Lf]], 9: [[T, B]], 10: [[T, Rr], [Lf, B]], 11: [[T, Rr]], 12: [[Rr, Lf]], 13: [[Rr, B]], 14: [[B, Lf]]}[c];
        for (const [p, q] of tab) segs.push([p(), q()]);
      }
      const adj = {}; segs.forEach((s, n) => { for (const k2 of s) (adj[k2] = adj[k2] || []).push(n); });
      const used = new Set();
      for (let n = 0; n < segs.length; n++) {
        if (used.has(n)) continue;
        used.add(n); const chain = [segs[n][0], segs[n][1]];
        for (let dir = 0; dir < 2; dir++) {
          for (;;) { const end = chain[chain.length - 1], nxt = (adj[end] || []).find(m => !used.has(m)); if (nxt === undefined) break; used.add(nxt); const s = segs[nxt]; chain.push(s[0] === end ? s[1] : s[0]); }
          chain.reverse();
        }
        let pts = chain.map(key => ptOf[key]); const isClosed = chain[0] === chain[chain.length - 1]; if (isClosed) pts.pop();
        if (pts.length < 6) continue;
        while (pts.length > 250) pts = pts.filter((_, m) => m % 2 === 0);
        // start each loop at its southernmost point so it sits in a block this plan owns
        if (isClosed) { let mi = 0; pts.forEach((p, m) => { if (p[1] < pts[mi][1]) mi = m; }); pts = pts.slice(mi).concat(pts.slice(0, mi)); }
        const major = (L / 8000) % 5 === 0;
        line('lot', major ? C.struct : 9, pts.map(p => P(p[0], p[1], L)), {part: (major ? 'index contour, ' : 'terrain contour, ') + Math.round(L / 1000) + ' m above town'}, Object.assign({closed: isClosed}, major ? {} : {color2: 8}));
      }
    }
  }
  // Desert Holly Street, north half along the preserve, with a curb and a trailhead sidewalk
  for (let cx = 2; cx <= 7; cx++) {
    const x0 = cx * S, y = 5 * S;
    line('street', C.yellow, [P(x0 + 300, y + 100), P(x0 + S - 300, y + 100)], {street: 'Desert Holly Street', part: 'double yellow', checks: [['lane_width', 3353]]});
    line('street', C.white, [P(x0 + 300, y + 3353), P(x0 + S - 300, y + 3353)], {street: 'Desert Holly Street', part: 'parking lane edge'});
    line('street', C.curb, [P(x0 + 300, y + CURB, 152), P(x0 + S - 300, y + CURB, 152)], {street: 'Desert Holly Street', part: 'curb top, 152 mm reveal'});
    hatch('paving', C.curb, rect(x0 + 300, y + CURB, x0 + S - 300, y + PL, 152), 'lines', 1524, 0, {sidewalk: 'Desert Holly Street', checks: [['sidewalk_width', PL - CURB]]});
    sym('street', C.brick, 'hydrant', P(x0 + S / 2 + 2000, y + CURB + 600), 0, {part: 'fire hydrant at the forest edge'});
  }
  // fire road switchbacking from the trailhead to the lookout on Chinchweed Peak
  const [SPX, SPY] = peaks[1];
  const road = [];
  {
    let y = 5 * S + PL + 600, leg = 0;
    road.push([SPX - 4000, 5 * S + CURB]);
    while (y < SPY - 14000) { const xa = SPX - 24000 + (leg % 2) * 48000 * 0, xs = leg % 2 ? [SPX + 24000, SPX - 24000] : [SPX - 24000, SPX + 24000]; for (let t = 0; t <= 12; t++) road.push([xs[0] + (xs[1] - xs[0]) * t / 12, y + 9000 * t / 12]); y += 9000; leg++; }
    const last = road[road.length - 1]; for (let t = 1; t <= 8; t++) road.push([last[0] + (SPX - 3000 - last[0]) * t / 8, last[1] + (SPY - 4000 - last[1]) * t / 8]);
  }
  const roadP = road.map(([x, y]) => P(x, y, hgt(x, y) + 30));
  line('paving', C.brick, roadP, {part: 'Chinchweed Ridge fire road, graded dirt'});
  sym('street', C.sign, 'sign', P(SPX - 6500, 5 * S + PL + 1200), 0, {text: 'Chinchweed Ridge Trailhead and Fire Road'});
  sym('street', C.yellow, 'sign', P(SPX - 1500, 5 * S + PL + 1200), 0, {text: 'Fire Danger Today: High'});
  line('structure', C.yellow, [P(SPX - 6000, 5 * S + PL + 2500, 1000), P(SPX - 2000, 5 * S + PL + 2500, 1000)], {part: 'forest gate on the fire road', anim: {type: 'sway', deg: 25, period: 20, pivot: [SPX - 6000, 5 * S + PL + 2500, 1000]}});
  const nearRoad = (x, y, m) => road.some(([rx, ry]) => Math.hypot(rx - x, ry - y) < m);
  { const seg = roadP.slice(5, 40); const pts = seg.concat(seg.slice(0, -1).reverse()); sym('activity', C.person, 'person', pts[0], 0, {pose: 'walking', activity: 'hiking the fire road with a day pack', anim: {type: 'path', speed: 1200, pts}}); }
  { const seg = roadP.slice(30, 70); const pts = seg.concat(seg.slice(0, -1).reverse()); sym('activity', C.person, 'dog', pts[0], 0, {activity: 'trotting ahead on the switchbacks', anim: {type: 'path', speed: 1400, pts}}); }

  // ---- Chinchweed Ridge Fire Lookout on the summit, a glass cab on a steel tower
  {
    const N = 'Chinchweed Ridge Fire Lookout', x0 = SPX - 2134, x1 = SPX + 2133, y0 = SPY - 2134, y1 = SPY + 2133, zg = hgt(SPX, SPY), zf = zg + 9144;
    line('structure', C.struct, [P(x0, y0, zg), P(x1, y0, zg), P(x1, y1, zg), P(x0, y1, zg)], {wall: true, h: zf + 2438, zmin: zg - 610, building: N}, closed);
    for (const [lx, ly] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) line('structure', C.struct, [P(lx, ly, zg), P(lx, ly, zf)], {building: N, part: 'steel tower leg'});
    for (let t = 0; t < 3; t++) { const za = zg + t * 3048, zb = za + 3048; line('structure', C.struct, [P(x0, y0, za), P(x1, y0, zb), P(x1, y1, za), P(x0, y1, zb), P(x0, y0, za)], {building: N, part: 'tower cross bracing, bay ' + (t + 1)}); }
    for (let t = 0; t < 6; t++) line('structure', C.yellow, [P(x0 + 300 + (t % 2) * 3500, y0 - 600, zg + t * 1524), P(x0 + 300 + ((t + 1) % 2) * 3500, y0 - 600, zg + (t + 1) * 1524)], {building: N, part: 'stair flight ' + (t + 1)});
    hatch('structure', 7, rect(x0 - 600, y0 - 600, x1 + 600, y1 + 600, zf), 'lines', 300, 0, {building: N, part: 'catwalk deck'});
    line('structure', C.struct, rect(x0 - 600, y0 - 600, x1 + 600, y1 + 600, zf + 1067), {building: N, part: 'catwalk railing'}, closed);
    for (const [ax, ay, bx, by] of [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]]) hatch('structure', C.car2, [P(ax, ay, zf + 900), P(bx, by, zf + 900), P(bx, by, zf + 2300), P(ax, ay, zf + 2300)], 'lines', 400, 90, {building: N, part: 'cab windows'}, C.int);
    hip(N, x0 - 300, y0 - 300, x1 + 300, y1 + 300, zf + 2438, C.brick, C.roof);
    line('structure', C.yellow, [P(SPX, SPY, zf + 3200), P(SPX, SPY, zf + 4400)], {building: N, part: 'lightning rod'});
    line('structure', C.int, [P(x0 + 300, y0 + 300, zf), P(x0 + 300, y0 + 300, zf + 2134), P(x0 + 1214, y0 + 300, zf + 2134), P(x0 + 1214, y0 + 300, zf)], {building: N, part: 'cab door', checks: [['door_height', 2134], ['door_width', 914]]});
    line('interior', C.brick, circ(SPX, SPY, 450, zf + 1100, 16), {building: N, part: 'firefinder azimuth ring on its stand'}, closed);
    line('interior', C.int, [P(SPX, SPY, zf), P(SPX, SPY, zf + 1100)], {building: N, part: 'firefinder stand'});
    line('interior', C.yellow, [P(SPX - 400, SPY, zf + 1150), P(SPX + 400, SPY, zf + 1150)], {building: N, part: 'firefinder sighting bar', anim: {type: 'spin', rpm: 1, pivot: [SPX, SPY, zf + 1150]}});
    line('interior', C.int, rect(x1 - 900, y0 + 300, x1 - 300, y0 + 2100, zf + 450), {building: N, part: 'cot with a wool blanket'}, closed);
    line('interior', C.int, rect(x0 + 300, y1 - 900, x0 + 1500, y1 - 300, zf + 760), {building: N, part: 'map table with the township map'}, closed);
    line('electrical', C.elec, rect(x0 + 1700, y1 - 600, x0 + 2200, y1 - 300, zf + 900), {building: N, part: 'two way radio on a solar battery'}, closed);
    line('interior', C.int, circ(SPX + 900, SPY - 900, 200, zf + 600, 8), {building: N, part: 'stool with glass insulator feet'}, closed);
    line('interior', C.plumb, rect(x1 - 700, y1 - 700, x1 - 300, y1 - 300, zf + 900), {building: N, part: 'water jugs hauled up the fire road'}, closed);
    hatch('structure', C.car2, [P(x0 - 300, SPY, zf + 2600), P(SPX, SPY, zf + 3300), P(SPX, y1 + 300, zf + 2600)], 'cross', 300, 0, {building: N, part: 'solar panel on the roof'});
    sym('electrical', C.elec, 'light', P(SPX, SPY, zf + 2438), 0, {building: N, part: 'cab light'});
    sym('activity', C.person, 'person', P(SPX - 900, SPY + 400, zf), 0, {pose: 'standing', activity: 'scanning the ridges for smoke with binoculars'});
    sym('activity', C.person, 'person', P(SPX + 600, SPY + 1500, zf), Math.PI, {pose: 'standing', activity: 'radioing a smoke report to dispatch'});
    sym('street', C.sign, 'sign', P(SPX + 4000, SPY - 4500, zg), 0, {text: 'Chinchweed Peak, 150 m above town'});
  }
  // ---- a lightning start on the east peak, spotted from the lookout, with a hand crew cutting line
  {
    const [px, py] = peaks[3], fx = px + 26000, fy = py - 22000, fz = hgt(fx, fy);
    flame(fx, fy, fz, 700, 1500, 3, 'lightning fire in the pinyon duff');
    flame(fx + 1800, fy + 900, hgt(fx + 1800, fy + 900), 500, 1100, 8, 'fire creeping through grass and needles');
    smoke(fx + 800, fy + 400, fz + 2200, 900, 6, 21, 'smoke column from the lightning fire');
    const lineP = []; for (let t = 0; t <= 10; t++) { const x = fx - 6000 + t * 1300, y = fy - 4000 + Math.sin(t * 0.8) * 900; lineP.push(P(x, y, hgt(x, y) + 20)); }
    line('vegetation', C.struct, lineP, {part: 'hand line scraped to mineral soil'});
    [['cutting fireline with a pulaski', -5000], ['scraping the line with a mcleod', -3400], ['swinging a chainsaw through manzanita', -1800], ['spotting for rolling embers above the line', 600]].forEach(([t, dx]) => { const x = fx + dx, y = fy - 5200; sym('activity', C.person, 'person', P(x, y, hgt(x, y)), Math.PI / 2, {pose: 'standing', activity: t}); });
  }
  // ---- trees by elevation: Joshua trees and creosote on the bajada, pinyon and juniper on the slopes,
  //      ponderosa and Gambel oak on the high ground, with meadows left open
  {
    const g = 8200;
    for (let y = RY0 + 11000; y < RY1 - 2000; y += g) for (let x = RX0 + 2500; x < RX1 - 2500; x += g) {
      const jx = x + (r2() - 0.5) * 5000, jy = y + (r2() - 0.5) * 5000, h = hgt(jx, jy), n = noise(jx, jy, 2.2);
      if (n < -0.35) continue;                  // a meadow or burn scar
      if (nearRoad(jx, jy, 4000)) continue;
      if (Math.hypot(jx - peaks[1][0], jy - peaks[1][1]) < 9000) continue;
      let sp;
      if (h < 12000) sp = r2() < 0.45 ? ['tree', 'Joshua tree'] : r2() < 0.5 ? ['shrub', 'creosote bush'] : ['shrub', 'blackbrush'];
      else if (h < 45000) sp = r2() < 0.5 ? ['tree', 'single leaf pinyon'] : r2() < 0.7 ? ['tree', 'Utah juniper'] : ['shrub', 'cliffrose'];
      else if (h < 90000) sp = r2() < 0.55 ? ['tree', 'ponderosa pine'] : r2() < 0.6 ? ['tree', 'single leaf pinyon'] : ['shrub', 'manzanita'];
      else sp = r2() < 0.7 ? ['tree', 'ponderosa pine'] : ['tree', 'Gambel oak'];
      plant(sp[0], jx, jy, h, sp[1], 12);
      if (sp[1] === 'ponderosa pine' && r2() < 0.18) pine(jx + 1500, jy + 1200, hgt(jx + 1500, jy + 1200), 14000 + Math.round(r2() * 8000), 'old growth ponderosa');
    }
  }
  // rock outcrops on the steep faces
  for (const [px, py, , R, s] of peaks) for (let t = 0; t < 4; t++) {
    const a = s * 1.7 + t * 1.57, d = R * (0.35 + 0.1 * t), x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (x < RX0 + 4000 || x > RX1 - 4000 || y < RY0 + 15000 || y > RY1 - 4000) continue;
    const q = [[x, y], [x + 4500, y + 900], [x + 1500, y + 4000]].map(([qx, qy]) => P(qx, qy, hgt(qx, qy) + 300));
    hatch('lot', C.struct, q, 'cross', 500, 20, {part: 'granite outcrop'}, 7);
  }

  // ================================================================= woodland on the empty blocks around the city, kept inside the property lines
  const wood = [[6, 0], [7, 0], [8, 1], [9, 1], [10, 2], [11, 3], [11, 4], [10, 5], [8, 6], [9, 6], [1, 5], [0, 4], [1, 4]];
  for (const [cx, cy] of wood) {
    const ox = cx * S, oy = cy * S, sd = cx * 7 + cy * 13;
    for (let y = oy + PL + 2000; y < oy + S - PL - 1000; y += 7600) for (let x = ox + PL + 2000; x < ox + S - PL - 1000; x += 7600) {
      const jx = x + (r2() - 0.5) * 4000, jy = y + (r2() - 0.5) * 4000, n = noise(jx, jy, sd);
      if (n < -0.2) continue;
      const north = cy >= 5, pick = r2();
      const sp = north ? (pick < 0.45 ? ['tree', 'single leaf pinyon'] : pick < 0.75 ? ['tree', 'Utah juniper'] : ['shrub', 'cliffrose']) : (pick < 0.35 ? ['tree', 'Joshua tree'] : pick < 0.6 ? ['tree', 'blue palo verde'] : pick < 0.75 ? ['tree', 'velvet mesquite'] : ['shrub', 'creosote bush']);
      plant(sp[0], jx, jy, 0, sp[1], 8);
    }
    line('vegetation', C.veg2, wavy(ox + PL + 3000, oy + PL + 6000 + (sd % 5) * 6000, ox + S - PL - 3000, oy + S - PL - 6000 - (sd % 3) * 5000, 2500, 18, sd), {part: 'sandy wash through the woodland'});
  }
  sym('activity', C.person, 'person', P(9 * S + 20000, 6 * S + 20000), 0, {pose: 'walking', activity: 'birding along the juniper wash', anim: {type: 'path', speed: 900, pts: [P(9 * S + 20000, 6 * S + 20000), P(9 * S + 50000, 6 * S + 26000), P(9 * S + 50000, 6 * S + 28000), P(9 * S + 20000, 6 * S + 22000), P(9 * S + 20000, 6 * S + 20000)]}});

  // ================================================================= groves on open ground inside Agent Orange blocks
  {
    const segPts = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) { const a = s[i], b = s[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 600) + 1; for (let j = 0; j <= n; j++) o.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); } return o; };
    const inPg = (x, y, pg) => { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const a = pg[i], b = pg[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    let grove = 0;
    for (const c of W.chunks.values()) {
      if (c.owner !== 'agent-orange') continue;
      const [cx, cy] = c.k.split(':').map(Number), ox = cx * S, oy = cy * S, pts = [], pgs = [];
      for (const r of c.records) {
        if (r.hidden || r.discipline === 'street') continue;
        if (r.kind === 'symbol') { pts.push([r.at[0], r.at[1]]); continue; }
        for (const p of segPts(r)) pts.push(p);
        if ((r.kind === 'hatch' || r.closed) && r.discipline !== 'lot' && r.pts.length >= 3) pgs.push(r.pts);
      }
      const cell = {}; for (const [x, y] of pts) { const k2 = Math.floor(x / 4000) + ':' + Math.floor(y / 4000); (cell[k2] = cell[k2] || []).push([x, y]); }
      const clear = (x, y, m) => { const gx = Math.floor(x / 4000), gy = Math.floor(y / 4000); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of cell[(gx + i) + ':' + (gy + j)] || []) if (Math.hypot(p[0] - x, p[1] - y) < m) return false; return true; };
      let n = 0;
      for (let y = oy + PL + 2500; y < oy + S - PL - 2500 && n < 10; y += 5200) for (let x = ox + PL + 2500; x < ox + S - PL - 2500 && n < 10; x += 5200) {
        if (noise(x, y, cx + cy) < 0.1) continue;
        if (!clear(x, y, 3200)) continue;
        if (pgs.some(pg => inPg(x, y, pg))) continue;
        const pick = r2();
        plant('tree', x, y, 0, pick < 0.4 ? 'Afghan pine windbreak' : pick < 0.7 ? 'blue palo verde' : 'velvet mesquite', 6);
        n++; grove++;
      }
    }
    console.log('GROVE TREES ' + grove);
  }

  if (missing) console.log('MISSING ' + missing);
}
