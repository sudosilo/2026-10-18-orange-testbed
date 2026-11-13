// Agent Orange 2026-11-13 c: Chinchweed Fire Academy on 6,1 (classroom hall, apparatus barn, burn building, search maze, flashover container,
// prop yard with live fire props and demonstration bleachers), and a live drill at the 7,2 training tower. Asked by Orange.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611133; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  s2 = 61131;
  // ---------------------------------------------------------------- live fire, smoke and water helpers
  // A flame: two crossed vertical teardrops that flicker, with a hot yellow core that bobs.
  function flame(x, y, z, r, h, seed, label) {
    for (const [dx, dy, col, sc, an] of [[1, 0, C.brick, 1, {type: 'sway', deg: 9, period: 0.7 + (seed % 5) * 0.08, pivot: [x, y, z]}], [0, 1, C.elec, 0.85, {type: 'sway', deg: 11, period: 0.55 + (seed % 3) * 0.07, pivot: [x, y, z]}], [0.7, 0.7, C.yellow, 0.5, {type: 'bob', mm: Math.round(h * 0.18), period: 0.45 + (seed % 4) * 0.05}]]) {
      const pts = [], n = 8, H = h * sc, R = r * sc;
      for (let i = 0; i <= n; i++) { const t = i / n, w = R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - 0.55 * t) * (1 + 0.15 * Math.sin(seed + i * 2.1)); pts.push(P(x - dx * w, y - dy * w, z + H * t)); }
      for (let i = n - 1; i > 0; i--) { const t = i / n, w = R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - 0.55 * t) * (1 + 0.15 * Math.cos(seed + i * 1.7)); pts.push(P(x + dx * w, y + dy * w, z + H * t)); }
      line('activity', col, pts, {part: label || 'training fire', anim: an}, closed);
    }
  }
  // A smoke column: rings that rise and fall at different speeds, leaning downwind to the northeast.
  function smoke(x, y, z, r, n, seed, label) {
    for (let i = 0; i < n; i++) {
      const zz = z + i * r * 1.3, rr = r * (1 + i * 0.35), cx = x + i * r * 0.5, cy = y + i * r * 0.3;
      line('activity', i % 2 ? 7 : 0, circ(cx, cy, rr, zz, 10).map((p, j) => P(p[0], p[1], p[2] + Math.round(Math.sin(j + seed) * rr * 0.25))), {part: (label || 'training smoke') + ' puff ' + (i + 1), anim: {type: 'bob', mm: Math.round(rr * 0.8), period: 3 + ((seed + i) % 4) * 0.9}}, closed);
    }
  }
  // A hose stream: a parabola from the nozzle to the target that flickers like spray.
  function stream(ax, ay, az, bx, by, bz, rise, label) {
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(P(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t + rise * 4 * t * (1 - t))); }
    line('activity', C.car2, pts, {part: label || 'hose stream', anim: {type: 'blink', period: 0.35, duty: 0.8}});
  }
  const hose = (pts, label) => line('paving', C.yellow, pts.map(p => P(p[0], p[1], 40)), {part: label || 'charged attack line'});

  // ================================================================= 7,2 put the training tower to work
  {
    const x0 = 566880, x1 = 572976, y0 = 178000, y1 = 184096;
    smoke(x0 + 4100, y0 - 700, 7700, 700, 5, 3, 'drill smoke pouring from the second floor window');
    smoke(x0 + 2600, y0 - 700, 10700, 600, 4, 7, 'drill smoke rolling out the third floor window');
    line('interior', 7, blob(x0 + 3900, y0 + 3300, 1500, 12, 5, 4500), {building: 'Chinchweed Fire Training Tower', part: 'theatrical smoke haze on the second floor', anim: {type: 'bob', mm: 400, period: 5}}, closed);
    line('interior', C.brick, circ(x0 + 300, y0 + 300, 120, 2600, 6), {building: 'Chinchweed Fire Training Tower', part: 'red drill strobe', anim: {type: 'blink', period: 0.8, duty: 0.4}}, closed);
    sym('vehicle', C.brick, 'truck', P(568500, 172800), Math.PI / 2, {part: 'reserve engine pumping the tower drill'});
    hose([[567300, 172800], [567300, 175500], [568700, 176400], [x0 + 3450, y0 - 300]], 'charged line to the tower door');
    hose([[x1 + 1200, y1 + 1500], [x1 + 1200, 177000], [569800, 174000], [569500, 173200]], 'supply line from the training hydrant');
    stream(x1 + 2600, y0 - 1500, 1300, x0 + 4100, y0, 7000, 2500, 'hose stream into the second floor window');
    sym('activity', C.person, 'person', P(x1 + 2400, y0 + 2000, 0), 0, {pose: 'walking', activity: 'climbing the ground ladder to the second floor', anim: {type: 'path', speed: 600, pts: [P(x1 + 2400, y0 + 2000, 0), P(x1 + 400, y0 + 2000, 6400), P(x1 + 2400, y0 + 2000, 0)]}});
    say(x1 + 2600, y0 - 1900, 'standing', 'flowing water into the smoking window', Math.PI);
    say(x0 + 3400, y0 - 1500, 'standing', 'masking up at the tower door', 0);
    say(x0 + 2400, y0 - 2600, 'standing', 'feeding hose to the nozzle team', 0);
    say(566100, 174500, 'standing', 'calling a mayday drill on the radio', 0);
    say(570600, 172000, 'standing', 'running the pump panel on the reserve engine', Math.PI);
  }

  // ================================================================= 6,1 Chinchweed Fire Academy, the training campus across from the station
  {
    const B = block(6, 1, {s: true}, 'Chinchweed Fire Academy', [[600, 2000], [600, 14000], [600, 30000], [600, 44000], [600, 60360], [20000, 60360], [33000, 60360], [60360, 60360], [60360, 40000], [60360, 20000], [60360, 2000]], [[6 * S + CURB, 1 * S + PL + 6600, 6 * S + PL + 600, 1 * S + PL + 12800]]);
    const {X, Y} = B, rc = 1, rc2 = 7;
    const ACAD = 'Chinchweed Fire Academy';
    // ---- student lot off Chuckwalla Avenue
    hatch('paving', C.curb, rect(X(600), Y(600), X(31000), Y(13000)), 'dots', 1100, 0, {part: 'academy student lot, chip seal'}, C.struct);
    stallRow(X(3000), Y(800), 10, 1, 'student', true);

    // ---- Chinchweed Fire Academy Classroom Hall, three classrooms and a lobby
    {
      const N = 'Chinchweed Fire Academy Classroom Hall', x0 = X(3000), x1 = X(30432), y0 = Y(44000), y1 = Y(56192);
      const f = frame(x0, y0, x1, y1, 's'), {R, Cc, V, m} = f;
      wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 4877, -1219, true);
      hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 4877), 'brick', 300, 0, {building: N, part: 'red brick, front'}, C.struct);
      gableX(N, x0, y0, x1, y1, 4977, rc, rc2);
      sym('structure', C.sign, 'sign', P(x0 + 4000, y0 - 1600), 0, {text: N});
      for (const u of [6096, 13716, 20574]) wall(N, [m(u, 0), m(u, 12192)], 3048, 0, false, C.int);
      hatch('structure', 7, rect(x0 + 150, y0 + 150, x1 - 150, y1 - 150, 3048), 'cross', 1219, 0, {building: N, part: 'classroom ceiling grid', checks: [['ceiling_height', 3048]]});
      dr(f, N, 2400, 0, 'along', 914, 'lobby front door');
      [6096, 13716, 20574].forEach((u, i) => dr(f, N, u, 1600, 'across', 914, 'classroom ' + (i + 1) + ' door', 1));
      R(N, 'academy front desk', C.brick, 600, 3000, 4200, 3500, 1067, {check: ['counter_height', 1067]});
      R(N, 'pos terminal for course fees', C.int, 1400, 3100, 1700, 3400, 1350);
      R(N, 'receipt printer for course fees', C.int, 2200, 3150, 2500, 3400, 1100);
      R(N, 'card reader at the front desk', C.int, 3000, 3000, 3200, 3200, 1150);
      V(N, 'trophy case of old fire helmets', C.car2, 600, 12042, 4200, 12042, 900, 1900);
      V(N, 'board of graduating classes', C.sign, 150, 5000, 150, 9000, 1000, 2100);
      [[6096, 13716, 'hazmat placards and the ERG book'], [13716, 20574, 'building construction and collapse'], [20574, 27432, 'pump hydraulics and friction loss']].forEach(([u0, u1, topic], i) => {
        V(N, 'whiteboard on ' + topic, C.int, u0 + 1000, 12042, u1 - 1000, 12042, 900, 2100);
        R(N, 'ceiling projector, classroom ' + (i + 1), C.int, (u0 + u1) / 2 - 250, 7000, (u0 + u1) / 2 + 250, 7400, 2900);
        R(N, 'instructor podium, classroom ' + (i + 1), C.struct, u0 + 900, 10600, u0 + 1600, 11200, 1150);
        for (let rr = 0; rr < 3; rr++) R(N, 'student table row ' + (rr + 1) + ', classroom ' + (i + 1), C.int, u0 + 1300, 3500 + rr * 2200, u1 - 1300, 4100 + rr * 2200, 760);
        { const p = m(u0 + 300, 150); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {building: N, part: 'classroom outlet', checks: [['outlet_height', 457]]}); }
        { const p = m((u0 + u1) / 2, 6000); sym('electrical', C.elec, 'light', P(p[0], p[1], 3048), 0, {building: N, part: 'classroom light'}); }
      });
      R(N, 'cutaway pump on a stand', C.brick, 23500, 8800, 24800, 9800, 1100);
      R(N, 'main panel', C.elec, 200, 10400, 500, 11400, 1676, {disc: 'electrical'});
      services(B, N, f, 300, 10800, 4800, 11400, 5200, 11000);
      for (const [u, v, t] of [[2400, 1600, 'signing up for the spring recruit class'], [2400, 4100, 'printing a course certificate'], [10000, 2800, 'labeling hazmat placards on a quiz'], [17000, 9900, 'pointing at a truss failure photo'], [24000, 4900, 'working out friction loss on a calculator']]) { const p = m(u, v); say(p[0], p[1], u === 2400 ? 'standing' : (v < 5000 ? 'sitting' : 'standing'), t, Math.round(r2() * 628) / 100); }
    }

    // ---- Chinchweed Fire Academy Apparatus Barn, training engines behind roll up doors
    wh(B, 'Chinchweed Fire Academy Apparatus Barn', X(36000), Y(44000), X(57336), Y(57716), 's', {H: 6096, fc: C.brick, rc, rc2, roof: 'barrel', office: false, docks: 0, rollups: [2000, 7500, 13000], racks: 'none', stage: 6000, charger: false, forklift: false,
      items: [['r', 'training engine T1', C.brick, 2600, 1500, 5100, 11500, 3200], ['r', 'training ladder truck T2', C.brick, 8100, 1000, 10600, 12500, 3400], ['r', 'training brush engine T3', C.yellow, 13600, 2500, 16100, 9500, 2800], ['r', 'rack of practice turnout gear', C.yellow, 17500, 11800, 20800, 12900, 1830], ['r', 'hose washing tub', C.plumb, 17500, 5000, 20000, 6200, 800], ['r', 'hose drying rack', C.struct, 17500, 7500, 20500, 9000, 2400]],
      people: [['standing', 'restocking hose on training engine T1', 6000, 6000], ['standing', 'scrubbing soot off a practice helmet', 18700, 4000]]});

    // ---- Chinchweed Fire Academy Burn Building, two floors, lined burn room, live fire
    {
      const N = 'Chinchweed Fire Academy Burn Building', x0 = X(4000), x1 = X(16192), y0 = Y(18000), y1 = Y(27144);
      wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 7315, -610, true);
      hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 7315), 'brick', 400, 0, {building: N, part: 'scorched concrete, south face'}, 0);
      hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 7315), 'gradient', 500, 0, {building: N, part: 'soot over the east windows'}, 0);
      hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 3048), 'lines', 900, 0, {building: N, part: 'second floor slab'});
      line('structure', C.struct, rect(x0, y0, x1, y1, 8000), {building: N, part: 'roof parapet with a vent hole'}, closed);
      wall(N, [[x0 + 6096, y0], [x0 + 6096, y1]], 3048, 0, false, C.int);
      door(N, x0 + 2000, y0, 'x', 914, 'burn building door', 1);
      door(N, x0 + 6096, y0 + 3000, 'y', 914, 'burn room door', 1);
      hatch('structure', 7, rect(x0 + 6200, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 450, 0, {building: N, part: 'thermal tile ceiling of the burn room', checks: [['ceiling_height', 2743]]});
      I(N, 'thermal lining on the burn room walls', C.brick, x0 + 6250, y0 + 150, x1 - 150, y1 - 150, 1200);
      I(N, 'steel burn pan of straw and pallets', C.struct, x0 + 8500, y0 + 5500, x0 + 10500, y0 + 7500, 450);
      I(N, 'thermocouple tree in the burn room', C.elec, x1 - 600, y0 + 600, x1 - 300, y0 + 900, 2400, {disc: 'electrical'});
      I(N, 'temperature monitor at the door', C.elec, x0 + 5700, y0 + 4500, x0 + 5946, y0 + 5100, 1500, {disc: 'electrical'});
      I(N, 'stair to the second floor', C.struct, x0 + 300, y1 - 4500, x0 + 1300, y1 - 300, 1500);
      for (let i = 0; i < 8; i++) line('interior', C.int, [P(x0 + 300, y1 - 4400 + i * 279, (i + 1) * 172), P(x0 + 1300, y1 - 4400 + i * 279, (i + 1) * 172)], {building: N, part: 'concrete stair tread ' + (i + 1), checks: [['stair_riser', 172], ['stair_tread', 279]]});
      I(N, 'rescue dummy by the stair', C.car, x0 + 2500, y1 - 2000, x0 + 4300, y1 - 1500, 300);
      sym('electrical', C.elec, 'light', P(x0 + 3000, y0 + 3000, 2743), 0, {building: N, part: 'vapor tight light'});
      sym('electrical', C.elec, 'outlet', P(x0 + 150, y0 + 2500, 457), 0, {building: N, part: 'outlet for the fans', checks: [['outlet_height', 457]]});
      flame(x0 + 9500, y0 + 6500, 450, 900, 1900, 2, 'live straw and pallet fire in the burn room');
      flame(x0 + 8700, y0 + 6900, 450, 600, 1300, 5, 'flames rolling off the burn pan');
      line('interior', C.brick, rect(x0 + 6400, y0 + 300, x1 - 300, y1 - 300, 2600), {building: N, part: 'flame rollover across the ceiling', anim: {type: 'blink', period: 1.1, duty: 0.6}}, closed);
      for (const [wx, wz] of [[x1, 1200], [x1, 4300]]) line('structure', C.struct, [P(wx, y0 + 3000, wz), P(wx, y0 + 4200, wz), P(wx, y0 + 4200, wz + 1400), P(wx, y0 + 3000, wz + 1400)], {building: N, part: 'steel window shutter'}, closed);
      smoke(x1 + 600, y0 + 3600, 2900, 750, 5, 11, 'black smoke from the burn room window');
      smoke(x0 + 6000, y0 + 4500, 8200, 650, 3, 13, 'smoke venting from the roof hole');
      hose([[X(20000), Y(16000)], [X(17500), Y(17000)], [x0 + 2450, y0 - 400]], 'attack line into the burn building');
      stream(x1 + 2200, y0 + 2600, 1200, x1, y0 + 3600, 2000, 600, 'straight stream into the burn room window');
      say(x0 + 2450, y0 - 1200, 'standing', 'advancing a line into the burn building', 0);
      say(x0 + 4200, y0 - 1400, 'standing', 'backing up the nozzle firefighter', 0);
      say(x1 + 2600, y0 + 1800, 'standing', 'cooling the window with a straight stream', Math.PI / 2);
      say(x0 + 5000, y0 - 3200, 'standing', 'watching the burn temps on a tablet', 0);
      run('electrical', C.elec, [P(B.poles[1][0], B.poles[1][1], 6400), P(x0 - 400, y0 + 4800, 3500), P(x0 - 400, y0 + 4800, 1500), P(x0 + 300, y0 + 4800, 1500)], {building: N, part: 'service drop to the burn building'});
      I(N, 'burn building panel', C.elec, x0 + 150, y0 + 4400, x0 + 400, y0 + 5200, 1500, {disc: 'electrical'});
    }

    // ---- Chinchweed Fire Academy Search Maze, crawl through panels in the dark
    small(B, 'Chinchweed Fire Academy Search Maze', X(20000), Y(18000), X(29144), Y(24096), 's', {H: 3658, ceil: 2438, fc: C.struct, rc, rc2, roof: 'shedN', doorU: 600,
      items: [['r', 'crawl tunnel with a low ceiling', C.struct, 1500, 1200, 6500, 2000, 900], ['r', 'entanglement wire prop', C.elec, 7000, 1500, 8800, 2800, 700], ['r', 'blacked out mask rack', C.int, 300, 5400, 2400, 5946, 1500], ['r', 'collapsed floor prop', C.struct, 3500, 3200, 6500, 4800, 600], ['r', 'instructor camera monitor', C.int, 7400, 4900, 8800, 5800, 1100]],
      people: [['standing', 'crawling through the maze on air', 2500, 1600], ['standing', 'watching recruits on the infrared monitor', 8500, 4300]]});
    for (let i = 0; i < 4; i++) line('interior', C.int, wavy(X(21000), Y(21200 + i * 800), X(28000), Y(21200 + i * 800), 300, 8, 17 + i, 1200), {building: 'Chinchweed Fire Academy Search Maze', part: 'maze panel ' + (i + 1)});

    // ---- Chinchweed Fire Academy Flashover Container, a steel box for watching fire roll over
    small(B, 'Chinchweed Fire Academy Flashover Container', X(20000), Y(30000), X(32192), Y(32438), 's', {H: 2591, ceil: 2438, fc: C.brick, rc, rc2, roof: 'shedN', doorU: 600, facadePart: 'corrugated container steel',
      items: [['r', 'burn chamber of particle board', C.struct, 8200, 300, 11900, 2138, 2200], ['r', 'observation bench for recruits', C.int, 1500, 300, 7000, 800, 450]],
      people: []});
    flame(X(30200), Y(31200), 300, 700, 1800, 7, 'fire in the flashover chamber');
    line('activity', C.brick, [P(X(29000), Y(30400), 2300), P(X(21500), Y(30600), 2350), P(X(21500), Y(32000), 2350), P(X(29000), Y(32100), 2300)], {part: 'rollover flames across the container ceiling', anim: {type: 'blink', period: 1.6, duty: 0.55}}, closed);
    smoke(X(31200), Y(31200), 2800, 500, 3, 19, 'smoke from the container vent');

    // ---- the prop yard: car fire, propane tree, dumpster fire, extrication, drafting pit, demonstration bleachers
    court(X(36000), Y(3000), X(59000), Y(38000), 'academy prop yard, concrete');
    {
      // car fire prop
      const cx = X(40000), cy = Y(30000);
      line('vehicle', 7, rect(cx - 900, cy - 2200, cx + 900, cy + 2200, 1400), {part: 'burned out sedan on the car fire prop'}, closed);
      flame(cx, cy + 900, 900, 900, 1700, 23, 'propane fed fire in the engine bay');
      flame(cx + 300, cy - 1200, 700, 600, 1200, 29, 'fire through the back seat');
      smoke(cx + 600, cy, 2800, 600, 3, 31, 'smoke over the car fire');
      stream(cx - 5200, cy - 3500, 1300, cx, cy + 300, 1200, 1400, 'fog stream on the car fire');
      say(cx - 5300, cy - 4100, 'standing', 'knocking down the car fire with a fog pattern', 0.6);
      say(cx - 6800, cy - 4600, 'standing', 'shutting the propane valve on cue', 0.6);
      // propane tree prop
      const px = X(51000), py = Y(30000);
      line('structure', C.struct, [P(px, py, 0), P(px, py, 2400)], {part: 'propane tree riser'});
      for (const [dx, dy] of [[700, 0], [-700, 0], [0, 700]]) { line('structure', C.struct, [P(px, py, 1800), P(px + dx, py + dy, 2300)], {part: 'propane tree branch'}); flame(px + dx, py + dy, 2300, 450, 1400, 37 + dx, 'flare off a propane tree branch'); }
      line('structure', C.plumb, [P(px - 6000, py - 2000, 50), P(px, py, 50)], {part: 'propane supply hose to the tree'});
      line('structure', C.struct, circ(px - 6600, py - 2000, 600, 1200, 10), {part: 'propane tank feeding the prop'}, closed);
      stream(px - 3500, py - 4500, 1300, px, py, 2400, 1000, 'water curtain advancing on the propane tree');
      say(px - 3700, py - 5100, 'standing', 'walking a water curtain up to the valve', 0.5);
      say(px - 2400, py - 5600, 'standing', 'holding the hose line steady behind the nozzle', 0.5);
      // dumpster fire prop
      const dx0 = X(45000), dy0 = Y(21000);
      line('structure', C.struct, rect(dx0, dy0, dx0 + 3000, dy0 + 1800, 1700), {part: 'steel dumpster on the burn pad'}, closed);
      flame(dx0 + 1500, dy0 + 900, 1700, 800, 1500, 41, 'trash fire in the dumpster');
      smoke(dx0 + 1800, dy0 + 900, 3400, 550, 3, 43, 'gray smoke off the dumpster');
      say(dx0 + 1500, dy0 - 3200, 'standing', 'getting ready to hit the dumpster fire', 0);
      // extrication pit
      for (const [ex, ang] of [[X(40000), 0.3], [X(46000), -0.2]]) { const c = Math.cos(ang), s = Math.sin(ang); line('vehicle', CARCOL[Math.floor(r2() * 10)], [[-900, -2200], [900, -2200], [900, 2200], [-900, 2200]].map(([qx, qy]) => P(ex + qx * c - qy * s, Y(11000) + qx * s + qy * c, 1000)), {part: 'junk car with the roof cut off'}, closed); }
      line('structure', C.yellow, [P(X(41200), Y(11500), 900), P(X(41900), Y(11500), 900)], {part: 'hydraulic spreader in the door seam', anim: {type: 'sway', deg: 12, period: 2.5, pivot: [X(41200), Y(11500), 900]}});
      say(X(42400), Y(13600), 'standing', 'popping a door with the spreader', Math.PI);
      say(X(47800), Y(13600), 'standing', 'stabilizing the car with step chocks', Math.PI);
      say(X(44000), Y(8000), 'standing', 'pulling a dummy onto a backboard', 0);
      // drafting pit with an engine drafting from it
      const wx = X(55000), wy = Y(12000);
      line('lot', C.struct, circ(wx, wy, 2400, 300, 16), {part: 'drafting pit wall'}, closed);
      line('plumbing', C.plumb, circ(wx, wy, 2250, 100, 16), {part: 'drafting pit water', anim: {type: 'bob', mm: 30, period: 2.5}}, closed);
      sym('vehicle', C.brick, 'truck', P(wx, wy + 6000), Math.PI, {part: 'training engine drafting from the pit'});
      line('structure', C.struct, [P(wx, wy + 3600, 900), P(wx, wy + 1000, -500)], {part: 'hard suction hose into the pit'});
      stream(wx - 1500, wy + 4500, 2000, wx - 9000, wy + 9000, 0, 3000, 'pump test stream arcing over the yard');
      say(wx + 1700, wy + 5000, 'standing', 'priming the pump off the drafting pit', 0);
      // bleachers for public demonstrations
      for (let t = 0; t < 3; t++) line('structure', C.struct, [P(X(52000), Y(36200) + t * 900, 450 + t * 450), P(X(59000), Y(36200) + t * 900, 450 + t * 450)], {part: 'demonstration bleacher bench ' + (t + 1)});
      sym('street', C.sign, 'sign', P(X(51000), Y(35500)), 0, {text: 'Saturday Public Fire Demonstration'});
      say(X(53500), Y(36650), 'sitting', 'watching the car fire demo with the kids', Math.PI);
      say(X(55500), Y(37550), 'sitting', 'covering an ear when the propane flares', Math.PI);
      say(X(57500), Y(36650), 'sitting', 'filming the propane tree on a phone', Math.PI);
    }
    // ---- hose drill field and a training engine circling the drill course
    line('vegetation', C.veg2, rounded(X(3000), Y(29500), X(17000), Y(41500), 2500, 0, 4), {part: 'hose drill lawn'}, closed);
    hatch('vegetation', C.veg2, rounded(X(3200), Y(29700), X(16800), Y(41300), 2300, 0, 4), 'lines', 900, 30, {part: 'bermuda grass drill field'}, C.veg);
    hose([[X(4500), Y(31000)], [X(8000), Y(33500)], [X(6000), Y(36500)], [X(10000), Y(39000)], [X(15000), Y(37500)]], 'serpentine hose lay on the drill lawn');
    line('structure', C.struct, [P(X(15000), Y(31500), 0), P(X(15000), Y(31500), 2400), P(X(15500), Y(31500), 2400), P(X(15500), Y(31500), 0)], {part: 'hose target sign frame'});
    say(X(7000), Y(31000), 'standing', 'timing a hose lay with a stopwatch', 0);
    say(X(11500), Y(36200), 'standing', 'rolling a donut roll of hose', 0);
    sym('vehicle', C.brick, 'truck', P(X(34000), Y(5000)), 0, {part: 'training engine on the driving course', anim: {type: 'path', speed: 3500, pts: [P(X(34000), Y(5000)), P(X(34000), Y(40500)), P(X(59500), Y(40500)), P(X(59500), Y(42000)), P(X(32800), Y(42000)), P(X(32800), Y(5000)), P(X(34000), Y(5000))]}});
    for (const [tx, ty] of [[X(2000), Y(43000)], [X(31500), Y(43000)], [X(18000), Y(28500)]]) tree(tx, ty, 3, 6.4);
  }

  if (missing) console.log('MISSING ' + missing);
}
