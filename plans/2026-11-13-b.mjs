// Agent Orange 2026-11-13 b: eight warehouse blocks on the east and northeast edge (8,2 7,1 9,3 9,2 10,3 10,4 9,5 8,5),
// asked by Orange, with hydrants at proper spacing on every block.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611132; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 8,2 Saltgrass Freight Terminal, a cross dock with courts north and south
  {
    const B = block(8, 2, {s: true, e: true}, 'Saltgrass Freight Terminal', [[600, 3000], [600, 16000], [600, 29000], [600, 42000], [600, 55000], [14000, 60360], [27000, 60360]], [[8 * S + PL + 30000, 2 * S + CURB, 8 * S + PL + 41000, 2 * S + PL + 600], [8 * S + PL + 30000, 3 * S - PL - 600, 8 * S + PL + 41000, 3 * S - CURB]]);
    const {X, Y} = B, rc = 11, rc2 = 9;
    court(X(1000), Y(5500), X(50000), Y(21336), 'south truck court');
    court(X(1000), Y(39624), X(50000), Y(60360), 'north truck court');
    wh(B, 'Saltgrass Freight Cross Dock', X(3000), Y(21336), X(48720), Y(39624), 's', {H: 7315, fc: C.car2, rc, rc2, roof: 'flat', docks: 9, racks: 'none', maxTrucks: 4,
      items: [['r', 'floor staging lane stripes for outbound loads', C.yellow, 12000, 5500, 44000, 5600, 5], ['r', 'staged pallets of irrigation fittings', C.veg2, 13000, 6500, 15500, 8500, 1400], ['r', 'staged pallets of bottled water', C.car2, 19000, 6500, 21500, 8500, 1300], ['r', 'staged pallets of drip tape', C.veg2, 25000, 6500, 27500, 8500, 1200], ['r', 'staged crates of tractor parts', C.brick, 31000, 9000, 33500, 11000, 1500], ['r', 'pallet jack parked by door four', C.struct, 26000, 3200, 26700, 4600, 300], ['r', 'stretch wrap machine turntable', C.struct, 38000, 9000, 40000, 11000, 400], ['r', 'bill of lading printer on a stand', C.int, 36000, 4800, 36500, 5200, 1100]],
      people: [['standing', 'printing a bill of lading for a driver'], ['standing', 'stamping a freight bill at will call'], ['standing', 'checking a seal number on door four'], ['standing', 'wrapping a mixed pallet in stretch film', 37000, 12000], ['standing', 'counting cartons against the manifest', 22000, 11000], ['standing', 'sweeping the dock plate at door nine', 45000, 3400]]});
    // north docks on the cross dock
    for (let i = 0; i < 8; i++) { const x = X(15000 + i * 4267); line('structure', C.struct, [P(x, Y(39624), 1219), P(x, Y(39624), 4267), P(x + 2743, Y(39624), 4267), P(x + 2743, Y(39624), 1219)], {building: 'Saltgrass Freight Cross Dock', part: 'north dock door ' + (i + 1)}); I('Saltgrass Freight Cross Dock', 'north dock leveler ' + (i + 1), C.yellow, x + 300, Y(39624) - 2438, x + 2443, Y(39624) - 150, 1219); if (i % 2 === 0) trailerAt(x + 1371, Y(39624) + 400, 0, 'inbound trailer at a north door'); }
    small(B, 'Saltgrass Freight Dispatch Office', X(52000), Y(24000), X(58096), Y(30096), 'w', {fc: C.car2, rc, rc2, roof: 'shedN', water: true,
      items: [['r', 'dispatch desk with two monitors', C.int, 1000, 3200, 3600, 4000, 760], ['r', 'load board on a big screen', C.sign, 1200, 5800, 4400, 5946, 1900], ['r', 'receipt printer for lumper fees', C.int, 4400, 1500, 4700, 1800, 1100], ['r', 'card reader for driver fees', C.int, 4300, 2100, 4500, 2300, 1150], ['r', 'driver check in window shelf', C.brick, 3800, 300, 5800, 700, 1067, {check: ['counter_height', 1067]}], ['r', 'coffee maker', C.int, 300, 300, 650, 650, 1000]],
      people: [['sitting', 'assigning a door to an inbound load', 2300, 4400], ['standing', 'signing in at the driver window', 4800, -700]]});
    small(B, 'Saltgrass Freight Driver Lounge', X(52000), Y(32000), X(58096), Y(37000), 'w', {fc: C.yellow, rc, rc2, roof: 'gableY', water: true,
      items: [['r', 'couch facing the tv', C.car, 1500, 2600, 3500, 3400, 450], ['v', 'tv on the wall', C.int, 1800, 4850, 3400, 4850, 1300, 2100], ['r', 'snack vending machine', C.yellow, 4400, 4200, 5300, 4850, 1830], ['r', 'card reader on the vending machine', C.int, 4600, 4150, 4800, 4200, 1200], ['r', 'shower stall', C.plumb, 300, 3300, 1200, 4700, 2100, {disc: 'plumbing'}], ['r', 'coin washer for drivers', C.int, 300, 1500, 1000, 2200, 950]],
      people: [['sitting', 'napping on the couch between loads', 2500, 2100], ['standing', 'picking chips from the vending machine', 3900, 3600]]});
    small(B, 'Saltgrass Freight Trailer Tire Shop', X(52000), Y(43000), X(58704), Y(50000), 'w', {H: 4877, ceil: 3658, fc: C.struct, rc, rc2, roof: 'shedS', doorU: 5400,
      items: [['r', 'truck tire changer', C.struct, 1500, 2000, 2700, 3200, 1200], ['r', 'rack of 22.5 inch trailer tires', C.struct, 300, 5000, 4000, 5700, 1829, {check: ['shelf_height', 1829]}], ['c', 'tire inflation cage', C.yellow, 4800, 3200, 700, 1500, {n: 8}], ['c', 'air compressor tank', C.plumb, 6300, 5200, 350, 1500, {n: 10}], ['r', 'bead breaker on a bench', C.struct, 2700, 4100, 3600, 4700, 1000]],
      people: [['standing', 'airing up a tire inside the cage', 4800, 1800], ['standing', 'breaking a bead on a trailer tire', 3100, 3500]]});
    line('structure', C.struct, rect(X(50500), Y(53000), X(53500), Y(55000), 1800), {part: 'diesel tank on a containment skid'}, closed);
    line('structure', C.struct, rect(X(51000), Y(56000), X(51800), Y(57000), 1400), {part: 'diesel pump for yard tractors'}, closed);
    sym('vehicle', C.yellow, 'truck', P(X(8000), Y(58200)), 0, {part: 'yard tractor', anim: {type: 'path', speed: 4000, pts: [P(X(8000), Y(58200)), P(X(44000), Y(58200)), P(X(44000), Y(59700)), P(X(8000), Y(59700)), P(X(8000), Y(58200))]}});
    for (let i = 0; i < 3; i++) trailerAt(X(4000 + i * 3000), Y(42500), 0, 'empty trailer in the drop row');
    say(X(30000), Y(16000), 'standing', 'waving a tractor back to door three');
  }

  // ================================================================= 7,1 Sweetwater Cold Storage
  {
    const B = block(7, 1, {s: true, w: true, e: true}, 'Sweetwater Cold Storage', [[600, 15000], [600, 28000], [600, 41000], [600, 58000], [15000, 60360], [30000, 60360], [45000, 60360], [60360, 58000], [60360, 40000]], [[7 * S + S - PL - 600, 1 * S + PL + 20000, 7 * S + S - CURB, 1 * S + PL + 31000], [7 * S + CURB, 1 * S + PL + 1000, 7 * S + PL + 600, 1 * S + PL + 5800]]);
    const {X, Y} = B, rc = 5, rc2 = 10;
    hatch('paving', C.curb, rect(X(39576), Y(20000), X(60960), Y(31000)), 'dots', 1000, 0, {part: 'east drive from Pinacate Avenue'}, C.struct);
    court(X(39576), Y(8000), X(60360), Y(46000), 'reefer truck court');
    hatch('paving', C.curb, rect(X(600), Y(1000), X(38000), Y(11486)), 'dots', 1100, 0, {part: 'employee lot, chip seal'}, C.struct);
    stallRow(X(3000), Y(6000), 12, -1, 'employee', true);
    wh(B, 'Sweetwater Cold Storage', X(3000), Y(12000), X(39576), Y(48576), 'e', {H: 10668, fc: C.car2, facade: 'cross', facadePart: 'insulated metal panels, front', rc, rc2, roof: 'flat', docks: 6, racks: 'selective', rackH: 9144, stage: 12000, goods: ['frozen tortillas', 'frozen green chile', 'ice cream tubs', 'frozen burritos', 'bagged ice'], trailer: 'reefer trailer backed to the dock', counter: 'shipping counter', wallItem: 'freezer temperature log board',
      items: [['r', 'blast freezer room', C.plumb, 22000, 2800, 34000, 9000, 4267], ['v', 'insulated strip curtain at the freezer door', C.int, 26000, 2800, 28400, 2800, 0, 2700], ['c', 'evaporator coil fan 1', C.plumb, 15000, 20000, 450, 9300, {n: 8, anim: {type: 'spin', rpm: 40}}], ['c', 'evaporator coil fan 2', C.plumb, 28000, 26000, 450, 9300, {n: 8, anim: {type: 'spin', rpm: 40}}], ['r', 'freezer suit rack by the door', C.car2, 9600, 3500, 10400, 6000, 1830]],
      people: [['standing', 'printing a pick ticket for frozen tortillas'], ['standing', 'buying a case of green chile at the counter'], ['standing', 'checking the reefer temp on door two'], ['standing', 'pulling ice cream tubs in a freezer suit'], ['standing', 'scanning bagged ice into the system'], ['standing', 'reading the freezer thermometer']], noFan: true});
    small(B, 'Sweetwater Ammonia Engine Room', X(3000), Y(51500), X(12144), Y(57596), 's', {H: 5486, ceil: 3658, fc: C.struct, rc, rc2, roof: 'gableX', water: true,
      items: [['r', 'screw compressor 1', C.struct, 1000, 1500, 3200, 2600, 1500], ['r', 'screw compressor 2', C.struct, 1000, 3300, 3200, 4400, 1500], ['r', 'horizontal ammonia receiver', C.plumb, 4500, 3500, 8500, 4500, 1800, {disc: 'plumbing'}], ['r', 'ammonia detector panel with a strobe', C.brick, 8800, 1000, 9000, 1600, 1800, {disc: 'electrical', anim: {type: 'blink', period: 3, duty: 0.9}}], ['r', 'emergency shutoff station', C.brick, 7800, 150, 8400, 350, 1500], ['r', 'plant control panel', C.elec, 4500, 5600, 6500, 5946, 1830, {disc: 'electrical'}]],
      people: [['standing', 'logging suction pressure on compressor two', 3800, 3000]]});
    line('structure', C.struct, rect(X(3500), Y(58200), X(11500), Y(60200), 3600), {part: 'evaporative condenser'}, closed);
    line('structure', C.int, circ(X(7500), Y(59200), 700, 3800, 10), {part: 'condenser fan', anim: {type: 'spin', rpm: 60}}, closed);
    small(B, 'Sweetwater Pallet Repair Shed', X(16000), Y(51000), X(25144), Y(57096), 's', {H: 4267, ceil: 3353, fc: C.brick, rc, rc2, roof: 'shedN',
      items: [['r', 'pallet nailing jig', C.struct, 1500, 2000, 3000, 3500, 800], ['r', 'stack of broken pallets', C.brick, 5000, 1500, 6500, 3000, 1400], ['r', 'stack of repaired pallets', C.veg2, 6800, 3500, 8300, 5000, 1700], ['r', 'chop saw on a bench', C.struct, 300, 4600, 1800, 5600, 914, {check: ['counter_height', 914]}], ['r', 'bin of pallet nails', C.struct, 3500, 4800, 4100, 5400, 600]],
      people: [['standing', 'nailing a new deck board on a pallet', 2300, 1300], ['standing', 'cutting stringers on the chop saw', 1000, 3800]]});
    small(B, 'Sweetwater Reefer Washout Bay', X(44000), Y(48500), X(57000), Y(56500), 'w', {H: 5486, ceil: 3658, fc: C.struct, rc, rc2, roof: 'barrel', water: true,
      items: [['r', 'reefer trailer in the washout bay', C.car2, 1500, 2000, 4100, 12000, 4100], ['r', 'trench drain under the trailer', C.plumb, 2600, 1000, 3000, 12500, -150, {disc: 'plumbing'}], ['r', 'hot water pressure washer', C.brick, 6500, 10500, 7700, 12000, 1100], ['c', 'sanitizer foam tank', C.plumb, 7000, 8500, 400, 1300, {n: 10}]],
      people: [['standing', 'foaming the inside of a reefer trailer', 5000, 6000]]});
    say(X(50000), Y(30000), 'standing', 'plugging a reefer trailer into shore power');
  }

  // ================================================================= 9,3 Cardon Wash Distribution, two warehouses on one south court
  {
    const B = block(9, 3, {s: true, e: true}, 'Cardon Wash Distribution', [[600, 30000], [600, 45000], [600, 60360], [20000, 60360], [40000, 60360], [60360, 60360], [60360, 45000], [60360, 30000]], [[9 * S + PL + 8000, 3 * S + CURB, 9 * S + PL + 19000, 3 * S + PL + 600], [9 * S + PL + 42000, 3 * S + CURB, 9 * S + PL + 53000, 3 * S + PL + 600]]);
    const {X, Y} = B, rc = 7, rc2 = 4;
    court(X(1000), Y(600), X(60000), Y(26000), 'shared south truck court');
    wh(B, 'Cardon Wash Distribution West', X(2000), Y(26000), X(28000), Y(57960), 's', {H: 9144, fc: C.brick, rc, rc2, roof: 'flat', docks: 3, racks: 'selective', goods: ['evaporative cooler pads', 'ceiling fans', 'stucco mix', 'boxed tile', 'water heaters'],
      people: [['standing', 'picking up a cooler motor at will call'], ['standing', 'ringing up stucco mix for a contractor'], ['standing', 'chocking the wheels of a trailer'], ['standing', 'picking boxed tile off the second level'], ['standing', 'counting water heaters for a cycle count']]});
    wh(B, 'Cardon Wash Distribution East', X(32000), Y(30000), X(58960), Y(57960), 's', {H: 9144, fc: C.yellow, rc, rc2, roof: 'gravel', docks: 4, office: false, racks: 'bulk', goods: ['bagged lawn fertilizer', 'bottled drinking water', 'feed store chicken scratch', 'canned tomatoes'],
      people: [['standing', 'breaking down an inbound load of fertilizer'], ['standing', 'stacking water pallets three high', 4500, 15000], ['standing', 'wrapping a mixed load for a feed store', 10000, 20500], ['standing', 'checking a pallet tag against the screen', 22000, 25000]]});
    small(B, 'Cardon Wash Gate House', X(28700), Y(12000), X(31748), Y(15048), 's', {H: 3048, ceil: 2438, fc: C.brick, rc, rc2, roof: 'hip', doorU: 600,
      items: [['r', 'gate desk with a sign in sheet', C.int, 300, 2000, 2700, 2700, 760], ['r', 'gate arm controller', C.elec, 2600, 300, 2850, 700, 1300, {disc: 'electrical'}], ['r', 'mini fridge', C.car2, 300, 300, 800, 800, 850]],
      people: [['standing', 'checking a driver bill at the gate', 1600, 1200]]});
    for (let i = 0; i < 2; i++) trailerAt(X(26500), Y(2500 + i * 3000), -Math.PI / 2, 'trailer waiting in the drop row');
    line('structure', C.yellow, [P(X(30200), Y(10500), 1100), P(X(36000), Y(10500), 1100)], {part: 'gate arm', anim: {type: 'sway', deg: 30, period: 12, pivot: [X(30200), Y(10500), 1100]}});
  }

  // ================================================================= 9,2 Lizard Tail Business Park, six flex suites facing a shared drive
  {
    const B = block(9, 2, {n: true, s: true, e: true, w: true}, 'Lizard Tail Business Park', [[20000, 60360], [600, 60360], [600, 40000], [600, 20000], [600, 600], [20000, 600], [40000, 600], [60360, 600], [60360, 20000], [60360, 40000], [60360, 60360], [40000, 60360]], [[9 * S + CURB, 2 * S + PL + 24000, 9 * S + PL + 600, 2 * S + PL + 36000], [10 * S - PL - 600, 2 * S + PL + 24000, 10 * S - CURB, 2 * S + PL + 36000]]);
    const {X, Y} = B, rc = 3, rc2 = 11;
    court(X(600), Y(22000), X(60360), Y(38000), 'shared drive between the flex rows');
    const tenants = [
      ['Sotol Ridge Sign Shop', 's', 0, {roof: 'gableX', fc: C.brick, goods: ['sign blanks'], items: [['r', 'large format vinyl printer', C.int, 7000, 3000, 10500, 4000, 1200], ['r', 'vinyl cutting plotter', C.int, 11000, 3000, 13000, 3700, 1100], ['r', 'layout table with a cutting mat', C.struct, 7500, 6000, 11500, 7500, 914, {check: ['counter_height', 914]}], ['r', 'stack of aluminum sign blanks', C.struct, 13000, 7000, 15000, 8500, 800]], people: [['standing', 'picking up a for sale sign for a ranch'], ['standing', 'running a card for a banner order'], ['standing', 'weeding vinyl letters on the layout table', 9500, 9000], ['standing', 'loading a roll into the big printer', 8700, 5200]]}],
      ['Dry Creek Cabinet Shop', 's', 18500, {roof: 'shedN', fc: C.car, items: [['r', 'table saw with an outfeed table', C.struct, 7000, 4000, 9500, 6500, 864], ['r', 'edge bander', C.struct, 10500, 3200, 13500, 4000, 1000], ['r', 'spray booth with filters', C.car2, 11500, 7000, 15500, 11000, 2600], ['r', 'stack of maple plywood', C.yellow, 6500, 8000, 9000, 9500, 900], ['c', 'dust collector cyclone', C.struct, 15600, 3000, 500, 3000, {n: 10}]], people: [['standing', 'paying a deposit on kitchen cabinets'], ['standing', 'printing an invoice for a vanity'], ['standing', 'ripping plywood on the table saw', 8300, 7200], ['standing', 'banding the edge of a door panel', 12000, 5000]]}],
      ['Jumping Cholla Powder Coating', 's', 37000, {roof: 'flat', fc: C.yellow, items: [['r', 'batch curing oven', C.brick, 9000, 5000, 15000, 9500, 3000, {anim: {type: 'blink', period: 5, duty: 0.9}}], ['r', 'powder spray booth', C.car2, 4500, 7500, 8500, 10500, 2700], ['r', 'sandblast cabinet', C.struct, 4000, 3500, 5600, 4800, 1500], ['r', 'overhead conveyor of gate panels', C.struct, 4000, 6000, 15000, 6200, 2900]], people: [['standing', 'dropping off rusty wheels for coating'], ['standing', 'writing up a color code ticket'], ['standing', 'blasting rust off a gate hinge', 4800, 2600], ['standing', 'spraying a gate panel in the booth', 6500, 11300]]}],
      ['Dust Storm HVAC Supply', 'n', 0, {roof: 'flat', fc: C.struct, racks: 'selective', goods: ['condenser units', 'flex duct', 'refrigerant jugs'], people: [['standing', 'buying a capacitor for a stuck condenser'], ['standing', 'looking up a blower motor part number'], ['standing', 'loading flex duct into a van', 8000, 3400], ['standing', 'pulling a condenser off the rack']]}],
      ['Sand Lily Party Rentals', 'n', 18500, {roof: 'gableX', fc: C.car2, items: [['r', 'stack of folding tables', C.int, 7000, 3500, 9000, 6000, 1200], ['r', 'rack of folding chairs', C.int, 10000, 3500, 12000, 6000, 1700], ['r', 'rolled shade canopies', C.yellow, 13000, 3500, 15500, 5000, 900], ['r', 'bounce house in its bag', C.car, 7000, 8000, 9500, 10500, 1200], ['r', 'washing table for linens', C.plumb, 11000, 9000, 14000, 10200, 914, {check: ['counter_height', 914]}]], people: [['standing', 'booking chairs for a quinceanera'], ['standing', 'taking a deposit for a canopy'], ['standing', 'counting folding chairs onto a cart', 9500, 7000], ['standing', 'folding a stack of tablecloths', 12500, 11400]]}],
      ['Spadefoot Soda Distributors', 'n', 37000, {roof: 'gravel', fc: C.brick, racks: 'bulk', goods: ['cola cases', 'orange soda cases', 'mineral water cases'], people: [['standing', 'settling a route ticket at the counter'], ['standing', 'printing tomorrow route sheets'], ['standing', 'loading soda cases onto a side load truck', 8000, 3400], ['standing', 'rotating mineral water by date']]}],
    ];
    for (const [N, face, u0, o] of tenants) {
      const y0 = face === 's' ? Y(38000) : Y(9000), y1 = face === 's' ? Y(51000) : Y(22000);
      wh(B, N, X(1500 + u0), y0, X(1500 + u0 + 16500), y1, face, Object.assign({H: 6096, rc, rc2, oW: 6096, docks: 0, rollups: [8000, 12200], racks: o.racks || 'none', stage: 6500, noFan: true, charger: false, forklift: false}, o));
    }
    stallRow(X(2000), Y(52500), 20, 1, 'tenant', true);
  }

  // ================================================================= 10,3 Wolfberry Hay and Cotton Warehouses
  {
    const B = block(10, 3, {n: true, s: true, e: true, w: true}, 'Wolfberry Hay and Cotton Warehouses', [[600, 3000], [600, 22000], [600, 40000], [600, 58000], [20000, 60360], [40000, 60360], [60360, 50000], [60360, 10000]], [[11 * S - PL - 600, 3 * S + PL + 24000, 11 * S - CURB, 3 * S + PL + 35000]]);
    const {X, Y} = B, rc = 8, rc2 = 2;
    court(X(3000), Y(21500), X(60360), Y(29500), 'caliche yard between the barns');
    wh(B, 'Wolfberry Hay Barn', X(3000), Y(30000), X(39576), Y(54384), 's', {H: 9144, fc: C.veg2, facade: 'lines', facadePart: 'corrugated steel siding, front', rc, rc2, roof: 'barrel', office: false, docks: 0, rollups: [3000, 12000, 21000, 30000], racks: 'bulk', stage: 6000, stackH: 4877, goods: ['alfalfa bales', 'bermuda grass bales', 'oat hay bales', 'straw bales'], noFan: true, charger: false,
      people: [['standing', 'tarping the end of a bale stack', 3500, 3000], ['standing', 'counting bales for a dairy order', 15000, 2500], ['standing', 'testing a bale with a moisture probe'], ['standing', 'stacking bales with the squeeze', 34000, 2800]]});
    wh(B, 'Wolfberry Cotton Bale Warehouse', X(3000), Y(2000), X(39576), Y(21000), 'n', {H: 7315, fc: C.struct, facade: 'lines', facadePart: 'corrugated steel siding, front', rc, rc2, roof: 'gableX', office: false, docks: 0, rollups: [5000, 16000, 27000], racks: 'bulk', stage: 5000, stackH: 3048, goods: ['ginned cotton bales', 'cotton bales tagged for the mill'], noFan: true, charger: false,
      people: [['standing', 'reading a bale tag with a scanner', 9000, 3000], ['standing', 'pulling a cotton sample from a bale', 21000, 3200]]});
    small(B, 'Wolfberry Scale House', X(46000), Y(36000), X(49658), Y(39658), 'w', {H: 3048, ceil: 2438, fc: C.brick, rc, rc2, roof: 'hip', doorU: 600,
      items: [['r', 'scale indicator and ticket printer', C.int, 300, 1500, 1300, 2200, 1000], ['r', 'card reader at the scale window', C.int, 300, 2400, 500, 2600, 1150], ['r', 'scale ticket book', C.int, 1500, 1500, 1900, 1800, 800]],
      people: [['sitting', 'printing a scale ticket for a hay truck', 2000, 2500]]});
    hatch('paving', C.struct, rect(X(50500), Y(26000), X(53548), Y(47336), 200), 'cross', 600, 0, {part: 'truck scale deck, 70 feet'}, C.curb);
    sym('vehicle', C.brick, 'truck', P(X(52024), Y(41000)), 0, {part: 'hay truck on the scale'});
    small(B, 'Wolfberry Bale Squeeze Shop', X(44000), Y(49500), X(58000), Y(57000), 'w', {H: 5486, ceil: 3658, fc: C.struct, rc, rc2, roof: 'shedS', doorU: 1000,
      items: [['r', 'bale squeeze attachment on stands', C.yellow, 1500, 4000, 4000, 9000, 1500], ['r', 'hydraulic hose crimper', C.struct, 300, 11000, 1200, 12000, 1100], ['r', 'welding table', C.struct, 5000, 10500, 6800, 12000, 914, {check: ['counter_height', 914]}], ['r', 'telehandler parked for service', C.yellow, 1500, 10000, 4000, 13500, 2400]],
      people: [['standing', 'replacing a cylinder on the bale squeeze', 4400, 6000], ['standing', 'crimping a new hydraulic hose', 1600, 12600]]});
    say(X(42000), Y(25500), 'walking', 'leading a hay buyer through the yard', 0, {type: 'path', speed: 900, pts: [P(X(42000), Y(25500)), P(X(42000), Y(27500)), P(X(9000), Y(27500)), P(X(9000), Y(25500)), P(X(42000), Y(25500))]});
  }

  // ================================================================= 10,4 Condalia Lumber and Pipe Yard
  {
    const B = block(10, 4, {n: true, s: true, e: true}, 'Condalia Lumber and Pipe Yard', [[600, 2000], [600, 20000], [600, 40000], [600, 60360], [20000, 60360], [40000, 60360], [60360, 60360], [60360, 40000]], [[10 * S + PL + 20000, 4 * S + CURB, 10 * S + PL + 31000, 4 * S + PL + 600]]);
    const {X, Y} = B, rc = 9, rc2 = 7;
    court(X(1000), Y(600), X(38000), Y(37000), 'gravel lumber and pipe yard');
    wh(B, 'Condalia Lumber Shed', X(3000), Y(38000), X(33480), Y(56288), 's', {H: 7315, fc: C.brick, facade: 'lines', facadePart: 'board and batten, front', rc, rc2, roof: 'shedN', office: false, docks: 0, rollups: [2000, 9000, 16000, 23000], racks: 'cantilever', stage: 5500, goods: ['2 by 4 studs', '2 by 6 lumber', 'treated fence posts', 'plywood sheets'], noFan: true,
      people: [['standing', 'pulling studs off the cantilever rack', 6000, 4200], ['standing', 'sighting down a 2 by 6 for bow', 14000, 4200], ['standing', 'loading fence posts onto a flatbed', 22000, 4000], ['standing', 'tallying a lumber order on a clipboard', 28000, 13500]]});
    for (let i = 0; i < 4; i++) { const y = Y(6000 + i * 5000); line('structure', C.struct, [P(X(4000), y, 0), P(X(4000), y, 2400), P(X(30000), y, 2400), P(X(30000), y, 0)], {part: 'outdoor pipe rack ' + (i + 1)}); for (let j = 0; j < 3; j++) line('structure', [C.int, C.plumb, C.car2][j], [P(X(4200), y - 300 + j * 300, 900 + j * 600), P(X(29800), y - 300 + j * 300, 900 + j * 600)], {part: ['bundle of black steel pipe', 'bundle of pvc irrigation pipe', 'bundle of galvanized pipe'][j] + ' on rack ' + (i + 1)}); }
    small(B, 'Condalia Contractor Counter', X(40000), Y(40000), X(56000), Y(53000), 'w', {H: 4877, ceil: 3048, fc: C.car, rc, rc2, roof: 'gableY', water: true, doorU: 2000,
      items: [['r', 'contractor counter', C.brick, 1500, 2600, 7000, 3100, 1067, {check: ['counter_height', 1067]}], ['r', 'pos terminal at the contractor counter', C.int, 2500, 2700, 2800, 3000, 1350], ['r', 'receipt printer for yard tickets', C.int, 3600, 2750, 3900, 3000, 1100], ['r', 'card reader by the register', C.int, 4600, 2620, 4800, 2820, 1150], ['r', 'key cutting machine', C.struct, 6000, 2700, 6500, 3000, 1300], ['r', 'shelf of fasteners by the pound', C.yellow, 9000, 300, 12000, 700, 1829, {check: ['shelf_height', 1829]}], ['r', 'shelf of pipe fittings', C.plumb, 9000, 6000, 12000, 6400, 1829, {check: ['shelf_height', 1829]}], ['r', 'coffee pot for contractors', C.int, 300, 300, 700, 700, 1000]],
      people: [['standing', 'paying for a load of studs on account', 4000, 1600], ['standing', 'printing a yard ticket for the loader', 4000, 3900], ['standing', 'weighing out a pound of deck screws', 10500, 1500], ['standing', 'cutting a spare key for a gate lock', 6300, 3800]]});
    small(B, 'Condalia Millwork Shop', X(40000), Y(8000), X(56000), Y(20000), 'w', {H: 5486, ceil: 3658, fc: C.struct, rc, rc2, roof: 'barrel', doorU: 1000,
      items: [['r', 'moulding machine', C.struct, 2000, 3000, 4500, 9000, 1200], ['r', 'radial arm saw station', C.struct, 6000, 300, 9500, 1200, 914, {check: ['counter_height', 914]}], ['r', 'stack of door jamb blanks', C.yellow, 6000, 7000, 8500, 10500, 1000], ['c', 'shop dust collector', C.struct, 10500, 9000, 600, 3000, {n: 10}]],
      people: [['standing', 'running door casing through the moulder', 4500, 2000], ['standing', 'measuring a jamb blank', 7300, 6200]]});
    small(B, 'Condalia Yard Office', X(41000), Y(26000), X(45267), Y(29658), 's', {H: 3048, ceil: 2438, fc: C.yellow, rc, rc2, roof: 'shedN', doorU: 600,
      items: [['r', 'yard foreman desk', C.int, 1800, 2400, 3900, 3200, 760], ['r', 'radio charger for the loaders', C.elec, 300, 2800, 1200, 3200, 1000, {disc: 'electrical'}]],
      people: [['standing', 'radioing a loader to the pipe rack', 2600, 1500]]});
    sym('vehicle', C.yellow, 'cart', P(X(32000), Y(30000)), 0, {part: 'lumber forklift', anim: {type: 'path', speed: 2500, pts: [P(X(32000), Y(30000)), P(X(32000), Y(4000)), P(X(34500), Y(4000)), P(X(34500), Y(30000)), P(X(32000), Y(30000))]}});
    fence([[X(1600), Y(1600)], [X(1600), Y(37000)]], 'chain link fence along Sand Wasp Avenue');
  }

  // ================================================================= 9,5 Pipevine Self Storage and Pipevine Moving and Storage
  {
    const B = block(9, 5, {n: true, e: true, w: true}, 'Pipevine Storage', [[600, 2000], [600, 20000], [600, 40000], [600, 60360], [20000, 60360], [40000, 60360], [60360, 60360], [60360, 40000], [60360, 20000]], [[9 * S + CURB, 5 * S + PL + 3000, 9 * S + PL + 600, 5 * S + PL + 10000]]);
    const {X, Y} = B, rc = 1, rc2 = 9;
    court(X(600), Y(600), X(60360), Y(39500), 'paved storage drives');
    fence([[X(8300), Y(1500)], [X(59500), Y(1500)], [X(59500), Y(38800)], [X(8300), Y(38800)], [X(8300), Y(11500)]], 'security fence around the storage rows');
    line('structure', C.yellow, [P(X(8300), Y(10000), 1500), P(X(8300), Y(5000), 1500)], {part: 'rolling security gate', anim: {type: 'sway', deg: 20, period: 20, pivot: [X(8300), Y(10000), 1500]}});
    sym('electrical', C.elec, 'outlet', P(X(6500), Y(7500), 1219), 0, {part: 'gate keypad on a gooseneck post'});
    const rows = [['Pipevine Self Storage Row A', 3000], ['Pipevine Self Storage Row B', 16400], ['Pipevine Self Storage Row C', 29800]];
    rows.forEach(([N, v], ri) => {
      const x0 = X(10000), x1 = X(58000), y0 = Y(v), y1 = Y(v + 6096);
      wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3353, -610, true);
      hatch('structure', [C.car, C.yellow, C.car2][ri], vface(x0, y0, x1, y0, 2438, 3353), 'lines', 300, 0, {building: N, part: 'painted fascia over the unit doors'}, C.struct);
      roofOf(N, x0, y0, x1, y1, 3453, 'gableX', rc, rc2);
      line('interior', C.int, [P(x0 + 150, (y0 + y1) / 2, 2743), P(x1 - 150, (y0 + y1) / 2, 2743)], {building: N, part: 'center demising wall top'});
      let n = 0;
      for (let x = x0 + 300; x + 2743 < x1 - 300; x += 3048) {
        for (const [y, side] of [[y0, 'south'], [y1, 'north']]) {
          n++;
          line('structure', C.struct, [P(x, y, 0), P(x, y, 2438), P(x + 2743, y, 2438), P(x + 2743, y, 0)], Object.assign({building: N, part: 'roll up unit door ' + n}, n <= 4 ? {checks: [['door_height', 2438], ['door_width', 1219]]} : {}));
        }
        line('interior', C.int, [P(x + 2895, y0 + 150, 2438), P(x + 2895, y1 - 150, 2438)], {building: N, part: 'unit partition'});
      }
      const open = [[3, 'unit with a stack of moving boxes'], [7, 'unit with a boat on a trailer'], [11, 'unit with a dusty piano under a blanket']];
      for (const [i, lab] of open) { const x = x0 + 300 + i * 3048; I(N, lab + ', row ' + 'ABC'[ri], C.brick, x + 300, y0 + 300, x + 2400, y0 + 2700, 1300); }
      sym('electrical', C.elec, 'light', P(x0 + 6000, y0 - 200, 2900), 0, {part: 'wall pack light, row ' + 'ABC'[ri]});
      sym('electrical', C.elec, 'light', P(x1 - 6000, y0 - 200, 2900), 0, {part: 'wall pack light, row ' + 'ABC'[ri]});
      run('electrical', C.elec, [P(B.poles[0][0], B.poles[0][1], 6400), P(x0 - 400, y0 + 3000, 3000), P(x0 + 300, y0 + 3000, 3000)], {building: N, part: 'lighting circuit for the row'});
      I(N, 'row lighting panel', C.elec, x0 + 150, y0 + 2600, x0 + 400, y0 + 3400, 1500, {disc: 'electrical'});
      const sx = x0 + 300 + [3, 7, 11][ri] * 3048 + 1400;
      say(sx, y0 - 900, 'standing', ['carrying a box of tax records into a unit', 'backing a boat trailer into its unit', 'sweeping out an empty unit'][ri]);
      sym('vehicle', CARCOL[ri + 3], ri === 1 ? 'truck' : 'car', P(sx + 3000, ri < 2 ? y1 + 3000 : y0 - 3600), Math.PI / 2, {part: 'parked in the storage drive'});
    });
    small(B, 'Pipevine Self Storage Office', X(1500), Y(13000), X(6372), Y(19096), 'e', {H: 3658, ceil: 2743, fc: C.yellow, rc, rc2, roof: 'hip', water: true, doorU: 1000,
      items: [['r', 'rental counter', C.brick, 600, 2400, 3800, 2900, 1067, {check: ['counter_height', 1067]}], ['r', 'pos terminal at the rental counter', C.int, 1400, 2500, 1700, 2800, 1350], ['r', 'receipt printer for rent payments', C.int, 2200, 2550, 2500, 2800, 1100], ['r', 'card reader for rent payments', C.int, 3000, 2420, 3200, 2620, 1150], ['v', 'shelf of moving boxes and tape', C.yellow, 300, 4722, 3800, 4722, 0, 1829, {check: ['shelf_height', 1829]}], ['v', 'display of disc locks', C.struct, 4500, 300, 5800, 300, 1000, 1700], ['r', 'gate camera monitor', C.int, 600, 3600, 1300, 4000, 1100]],
      people: [['standing', 'renting a ten by ten unit', 2200, 1500], ['standing', 'selling a disc lock and a roll of tape', 2200, 3800]]});
    wh(B, 'Pipevine Moving and Storage', X(8000), Y(42000), X(58000), Y(57960), 's', {H: 7315, fc: C.brick, rc, rc2, roof: 'flat', docks: 0, rollups: [16000, 26000, 36000], racks: 'bulk', stackH: 2438, goods: ['wooden storage vaults', 'crated furniture', 'household vaults'], counter: 'moving estimate counter', wallItem: 'calendar of booked moves',
      people: [['standing', 'booking a move for next saturday'], ['standing', 'printing an inventory sticker sheet'], ['standing', 'wrapping a dresser in moving pads'], ['standing', 'forklifting a vault into the stack'], ['standing', 'tagging a crate with a lot number']]});
  }

  // ================================================================= 8,5 Desert Chicory Produce Warehouse
  {
    const B = block(8, 5, {n: true, e: true, w: true}, 'Desert Chicory Produce', [[600, 2000], [600, 20000], [600, 40000], [600, 60360], [20000, 60360], [40000, 60360], [60360, 60360], [60360, 40000], [60360, 20000], [60360, 2000]], [[8 * S + CURB, 5 * S + PL + 14000, 8 * S + PL + 600, 5 * S + PL + 25000]]);
    const {X, Y} = B, rc = 2, rc2 = 8;
    court(X(600), Y(600), X(22000), Y(60360), 'west truck court, from Pinacate Avenue');
    wh(B, 'Desert Chicory Carton Warehouse', X(22000), Y(43500), X(58000), Y(57960), 'w', {H: 7315, fc: C.struct, rc, rc2, roof: 'shedN', docks: 2, office: false, racks: 'bulk', stackH: 3048, goods: ['flat melon cartons', 'onion mesh sacks', 'printed chile boxes'], maxTrucks: 1, noFan: true,
      people: [['standing', 'counting bundles of flat cartons'], ['standing', 'stacking chile boxes on a pallet', 3500, 22000]]});
    wh(B, 'Desert Chicory Produce Warehouse', X(22000), Y(3000), X(58000), Y(40576), 'w', {H: 9144, fc: C.veg2, rc, rc2, roof: 'gableY', docks: 7, racks: 'selective', rackH: 6096, goods: ['cantaloupe bins', 'yellow onion sacks', 'green chile cases', 'watermelon bins', 'lettuce cartons'], counter: 'buyer counter', wallItem: 'whiteboard of market prices', trailer: 'reefer trailer backed to the dock',
      items: [['r', 'ripening room for honeydew', C.yellow, 16000, 26000, 26000, 34000, 4267], ['r', 'grading line conveyor', C.struct, 12000, 9000, 26000, 10000, 914], ['r', 'carton stapler', C.struct, 27000, 9000, 28000, 10000, 1100]],
      people: [['standing', 'haggling over the price of chile'], ['standing', 'printing a grower settlement'], ['standing', 'checking pulp temps on a melon load'], ['standing', 'pulling a case of romaine for an order'], ['standing', 'restacking onion sacks that slid'], ['standing', 'cutting open a melon to check sugar']]});
    small(B, 'Desert Chicory Forklift Shop', X(3000), Y(46000), X(12144), Y(52096), 's', {H: 4877, ceil: 3658, fc: C.brick, rc, rc2, roof: 'gableX', doorU: 1200,
      items: [['r', 'forklift up on the service stands', C.yellow, 4000, 2000, 6000, 4600, 2100], ['r', 'propane cylinder cage', C.struct, 300, 4500, 2000, 5800, 1500], ['r', 'parts bench with a vise', C.struct, 6500, 4800, 8800, 5800, 914, {check: ['counter_height', 914]}], ['c', 'waste oil drum', C.struct, 8400, 2400, 290, 900, {n: 10}]],
      people: [['standing', 'swapping a propane tank on a forklift', 3200, 1300], ['standing', 'changing forklift tires on the stands', 7200, 3500]]});
    for (let i = 0; i < 5; i++) line('structure', C.brick, rect(X(3000 + i * 3500), Y(55000), X(5400 + i * 3500), Y(57500), 1800), {part: 'stack of empty field bins'}, closed);
    sym('vehicle', C.brick, 'truck', P(X(11000), Y(30000)), Math.PI / 2, {part: 'produce truck waiting for a door'});
    say(X(15000), Y(42500), 'standing', 'hosing out an empty field bin');
  }

  if (missing) console.log('MISSING ' + missing);
}
