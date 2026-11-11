// Agent Orange 2026-11-11 a: claim 8,3 and build the Globemallow Mercado, a courtyard block (carniceria, feed mill, comedor,
// paleteria, disc harrow shop, courtyard well house) with an east side lot, then deepen 0,2 school, 2,1 clubhouse and 3,0 travel stop.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611111; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 8,3, a courtyard block
  claim(8, 3);
  streets(8, 3, {s: true, e: true});
  const ox = 8 * S, oy = 3 * S;
  const a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  let s2 = 83311; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  const [rc, rc2] = [9, 1];
  const LX0 = b - 19000;
  lot('commercial', a, ys, LX0, yn, 'Globemallow Mercado courtyard shops');
  lot('commercial', LX0, ys, b, yn, 'Globemallow Mercado east lot');

  // ---- east side lot, entered from Bladderpod Avenue, out to Agave Street
  hatch('paving', C.curb, rect(LX0, ys + 600, b, yn - 600), 'dots', 1100, 0, {part: 'east parking lot, chip seal'}, C.struct);
  const dy0 = oy + 44000, dy1 = dy0 + 7316;
  hatch('paving', C.curb, rect(b, dy0, ox + S - CURB, dy1), 'dots', 1000, 0, {part: 'driveway off Bladderpod Avenue'}, C.struct);
  line('paving', C.white, [P(b, dy0), P(ox + S - CURB, dy0)], {part: 'driveway edge, south'});
  line('paving', C.white, [P(b, dy1), P(ox + S - CURB, dy1)], {part: 'driveway edge, north'});
  const AX0 = LX0 + 300 + 5486, AX1 = b - 300 - 5486;
  hatch('paving', C.curb, rect(AX0 + 200, oy + CURB, AX1 - 200, ys + 600), 'dots', 1000, 0, {part: 'exit drive to Agave Street'}, C.struct);
  line('paving', C.yellow, [P((AX0 + AX1) / 2, ys + 2000), P((AX0 + AX1) / 2, ys + 9000)], {part: 'one way exit arrow stripe'});
  const stalls = [];
  let sn = 0;
  for (const [sx, side] of [[LX0 + 300, 1], [AX1, -1]]) for (let sy = ys + 2500; sy + 2743 <= yn - 1500; sy += 2743) {
    if (side < 0 && sy + 2743 > dy0 - 300 && sy < dy1 + 300) continue;
    sn++;
    if (sn === 1) { line('paving', C.car2, rect(sx, sy, sx + 5486, sy + 3658), {part: 'accessible stall and aisle', checks: [['stall_width', 3658], ['stall_depth', 5486]]}, closed); hatch('paving', C.car2, rect(sx, sy + 2438, sx + 5486, sy + 3658), 'lines', 300, 45, {part: 'accessible access aisle striping'}); sy += 915; continue; }
    line('paving', C.white, side > 0 ? [P(sx + 5486, sy), P(sx, sy), P(sx, sy + 2743), P(sx + 5486, sy + 2743)] : [P(sx, sy), P(sx + 5486, sy), P(sx + 5486, sy + 2743), P(sx, sy + 2743)], Object.assign({part: 'east lot stall ' + sn}, sn < 7 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {}));
    stalls.push([sx + 2743, sy + 1371, side]);
  }
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];
  for (const [cx, cy, side] of stalls) {
    if (r2() > 0.5) continue;
    const truck = r2() < 0.35, back = r2() < 0.3;
    const rot = (side > 0 ? Math.PI / 2 : -Math.PI / 2) + (back ? Math.PI : 0) + (r2() - 0.5) * 0.06;
    sym('vehicle', CARCOL[Math.floor(r2() * CARCOL.length)], truck ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 400), cy + Math.round((r2() - 0.5) * 250)), rot, {part: truck ? (back ? 'pickup backed into the stall' : 'ranch pickup') : (back ? 'car backed into the stall' : 'parked car')});
  }

  // ---- utilities: pole line in the west and north strips, private water and sewer mains
  const poleW = [251000, 264000, 277000, 290000, 303000].map(y => [a + 1200, y]);
  const poleN = [658000, 671000, 683500].map(x => [x, yn - 1200]);
  const poleS = [[660000, ys + 1000], [684300, ys + 1000], [684300, 264500]];
  for (const [px, py] of [...poleW, ...poleN, ...poleS]) sym('electrical', C.struct, 'pole', P(px, py), 0, {part: 'mercado pole line'});
  const pl = [...poleW, ...poleN];
  line('electrical', C.elec, pl.map(([x, y]) => P(x, y, 8230)), {part: 'mercado primary'});
  line('electrical', C.elec, pl.map(([x, y]) => P(x, y, 6400)), {part: 'mercado secondary'});
  line('electrical', C.elec, [P(poleW[0][0], poleW[0][1], 6400), ...poleS.map(([x, y]) => P(x, y, 6400))], {part: 'secondary span along the south strip'});
  const WMY = ys + 700, WMX = 659800, SMY = ys + 1700, SMX = 660600;
  line('plumbing', C.plumb, [P(636384, WMY, -1219), P(LX0 - 500, WMY, -1219)], {part: 'mercado water main off Pinacate Avenue'});
  line('plumbing', C.plumb, [P(WMX, WMY, -1219), P(WMX, yn - 3000, -1219)], {part: 'courtyard water branch'});
  line('plumbing', C.sewer, [P(SMX, yn - 3000, -1700), P(SMX, SMY, -2000), P(637584, SMY, -2134)], {part: 'mercado sewer to Pinacate Avenue'});
  line('plumbing', C.sewer, [P(LX0 - 500, SMY, -1700), P(SMX, SMY, -2000)], {part: 'mercado sewer east leg'});
  const nearW = (x, y) => (Math.abs(y - WMY) < Math.abs(x - WMX) && x < LX0) || y < 262000 ? [x, WMY] : [WMX, Math.min(Math.max(y, WMY), yn - 3000)];
  const nearS = (x, y) => (Math.abs(y - SMY) < Math.abs(x - SMX) && x < LX0) || y < 262000 ? [x, SMY] : [SMX, Math.min(Math.max(y, SMY), yn - 3000)];
  const nearPole = (x, y) => [...poleW, ...poleN, ...poleS].reduce((p, c) => Math.hypot(c[0] - x, c[1] - y) < Math.hypot(p[0] - x, p[1] - y) ? c : p);

  // ---- a shell that can face any side. u runs along the front, v runs from the front wall to the back.
  const I = (N, label, col, x0, y0, x1, y1, z, o = {}) => line(o.disc || 'interior', col, rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), Object.assign({closed: true}, o.color2 !== undefined ? {color2: o.color2} : {}));
  const IC = (N, label, col, x, y, r, z, o = {}) => line(o.disc || 'interior', col, circ(x, y, r, z, o.n || 10), Object.assign({building: N, part: label}, o.anim ? {anim: o.anim} : {}), {closed: true});
  function frame(x0, y0, x1, y1, face) {
    const W = face === 's' || face === 'n' ? x1 - x0 : y1 - y0, Dp = face === 's' || face === 'n' ? y1 - y0 : x1 - x0;
    const m = (u, v) => face === 's' ? [x0 + u, y0 + v] : face === 'n' ? [x1 - u, y1 - v] : face === 'e' ? [x1 - v, y0 + u] : [x0 + v, y1 - u];
    const R = (N, label, col, u0, v0, u1, v1, z, o) => { const p = m(u0, v0), q = m(u1, v1); I(N, label, col, p[0], p[1], q[0], q[1], z, o); };
    const Cc = (N, label, col, u, v, r, z, o) => { const p = m(u, v); IC(N, label, col, p[0], p[1], r, z, o); };
    const along = face === 's' || face === 'n' ? 'x' : 'y', across = along === 'x' ? 'y' : 'x';
    return {W, Dp, m, R, Cc, along, across};
  }
  function shell(N, x0, y0, x1, y1, H, face, o = {}) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R} = f;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const p1 = m(W - 2743, Dp), p2 = m(W - 2743, Dp - 2438), p3 = m(W, Dp - 2438);
    wall(N, [p1, p2, p3], 3048, 0, false, C.int);
    const fa = m(0, 0), fb = m(W, 0);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 2900, H), o.facade, o.facade === 'brick' ? 300 : 350, o.facade === 'lines' ? 90 : 0, {building: N, part: 'front facade'}, C.struct);
    const ba = m(0, Dp), bb = m(W, Dp);
    hatch('structure', C.struct, vface(ba[0], ba[1], bb[0], bb[1], 0, 900), 'gradient', 300, 0, {building: N, part: 'back wall base shadow'}, C.int);
    const sg = m(1500, -1300);
    sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    const cz = o.ceil || 3353;
    if (!o.noCeil) hatch('structure', 7, rect(x0 + 150, y0 + 150, x1 - 150, y1 - 150, cz), 'cross', 1219, 0, {building: N, part: 'ceiling grid, 2 by 4 lay in tile', checks: [['ceiling_height', cz]]});
    const bz = o.beam || 3962;
    for (let v = 4500; v < Dp - 1500; v += 4500) { const p = m(0, v), q = m(W, v); line('structure', C.struct, [P(p[0], p[1], bz), P(q[0], q[1], bz)], {building: N, part: 'steel beam', checks: [['beam_height', bz]]}); }
    const du = o.doorU || 2400, d0 = m(du, 0), d1 = m(du + 914, 0);
    door(N, Math.min(d0[0], d1[0]), Math.min(d0[1], d1[1]), f.along, 914, 'front door', -1);
    const r0 = m(W - 2743, Dp - 1900), r1 = m(W - 2743, Dp - 1036);
    door(N, Math.min(r0[0], r1[0]), Math.min(r0[1], r1[1]), f.across, 864, 'restroom door', -1);
    for (let v = 2500; v < Dp - 1800; v += 3600) for (let u = 2286; u < W - 3300; u += 4572) { const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], o.lightZ || cz), 0, {part: 'ceiling light'}); }
    const rl = m(W - 1370, Dp - 1200); sym('electrical', C.elec, 'light', P(rl[0], rl[1], 2743), 0, {part: 'restroom light'});
    for (let v = 2600; v < Dp - 3000; v += 3600) { const p = m(150, v), q = m(W - 150, v + 600); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {checks: [['outlet_height', 457]]}); sym('electrical', C.elec, 'outlet', P(q[0], q[1], 457), 0, {checks: [['outlet_height', 457]]}); }
    const sw = m(du + 1100, 150); sym('electrical', C.elec, 'switch', P(sw[0], sw[1], 1219), 0, {part: 'entry switch'});
    R(N, '200 A panel', C.elec, 200, Dp - 1600, 500, Dp - 800, 1676, {disc: 'electrical'});
    f.Cc(N, 'restroom exhaust fan', C.int, W - 1370, Dp - 1800, 150, 2743, {n: 6, anim: {type: 'spin', rpm: 30}});
    f.Cc(N, 'water closet', C.int, W - 700, Dp - 600, 260, 432, {n: 8});
    R(N, 'wall hung lavatory', C.int, W - 2400, Dp - 600, W - 1800, Dp - 150, 864, {check: ['counter_height', 864]});
    const mr0 = m(W - 2400, Dp - 120), mr1 = m(W - 1800, Dp - 120);
    line('interior', C.int, [P(mr0[0], mr0[1], 1000), P(mr1[0], mr1[1], 1000), P(mr1[0], mr1[1], 1700), P(mr0[0], mr0[1], 1700)], {building: N, part: 'restroom mirror'}, closed);
    const g0 = m(W - 120, Dp - 1500), g1 = m(W - 120, Dp - 400);
    line('interior', C.int, [P(g0[0], g0[1], 860), P(g1[0], g1[1], 860)], {building: N, part: 'grab bar'});
    if (o.pos) {
      const k0 = m(600, 2600), k1 = m(3600, 2600);
      line('interior', C.brick, [P(k0[0], k0[1], 1067), P(k1[0], k1[1], 1067)], {building: N, part: 'sales counter', checks: [['counter_height', 1067]]});
      const t0 = m(1500, 2600), t1 = m(1500, 2750);
      line('interior', C.int, [P(t0[0], t0[1], 1067), P(t1[0], t1[1], 1450)], {building: N, part: 'pos terminal'});
      R(N, 'receipt printer', C.int, 1850, 2680, 2150, 2930, 1100);
      R(N, 'cash drawer', C.int, 900, 2660, 1300, 3020, 1000);
      R(N, 'card reader on a swivel', C.int, 2800, 2420, 3100, 2600, 1200);
    }
    // services
    const mp = m(350, Dp - 300), pole = nearPole(mp[0], mp[1]), outp = m(350, Dp + 300), inp = m(350, Dp - 1200);
    run('electrical', C.elec, [P(pole[0], pole[1], 6400), P(outp[0], outp[1], 4000), P(outp[0], outp[1], 1676), P(inp[0], inp[1], 1676)], {building: N, part: 'service drop and meter'});
    const wp = m(W - 900, Dp - 600), wm = nearW(wp[0], wp[1]);
    run('plumbing', C.plumb, [P(wm[0], wm[1], -1219), P(wp[0], wp[1], -900), P(wp[0], wp[1], 300)], {building: N, part: 'water service'});
    const sp = m(W - 700, Dp - 1000), sm = nearS(sp[0], sp[1]);
    run('plumbing', C.sewer, [P(sp[0], sp[1], -300), P(sm[0], sm[1], -1700)], {building: N, part: 'building drain to the mercado sewer'});
    line('plumbing', C.plumb, [P(wp[0], wp[1], 300), P(wp[0], wp[1], 1500)], {building: N, part: '30 gallon water heater'});
    return f;
  }

  // ---- Verdin Carniceria, west row, faces the courtyard
  const WX0 = a + 3000, WX1 = WX0 + 12192;
  {
    const N = 'Verdin Carniceria', y0 = ys + 4000, y1 = y0 + 15240;
    const f = shell(N, WX0, y0, WX1, y1, 4267, 'e', {facade: 'brick', fc: C.brick, pos: true, ceil: 3048, beam: 3658});
    hip(N, WX0, y0, WX1, y1, 4367, rc, rc2);
    const {R, Cc, m} = f;
    R(N, 'glass meat case of arrachera and chorizo', C.car2, 5200, 3000, 11000, 3900, 1219, {anim: undefined});
    R(N, 'butcher block behind the meat case', C.struct, 6000, 5200, 8400, 6100, 914, {check: ['counter_height', 914]});
    R(N, 'band saw for bone in cuts', C.struct, 9600, 5300, 10500, 6200, 1700);
    R(N, 'hanging scale over the meat case', C.int, 7400, 3200, 7900, 3600, 1650);
    R(N, 'walk in cooler box', C.plumb, 4500, 9300, 9000, 12000, 2600);
    R(N, 'walk in cooler door strip curtain', C.int, 6000, 9150, 7500, 9250, 2100);
    R(N, 'shelf of dried chiles and spices', C.brick, 600, 6800, 900, 10000, 1600, {check: ['shelf_height', 1600]});
    R(N, 'tortilla cooler by the register', C.car2, 600, 4200, 1700, 4900, 1000);
    R(N, 'kitchen printer for phone orders', C.int, 3300, 2700, 3600, 2950, 1100);
    R(N, 'meat grinder on the back counter', C.struct, 9600, 6600, 10300, 7200, 1250);
    R(N, 'deli paper roll and tape dispenser', C.int, 6200, 5300, 6800, 5600, 960);
    R(N, 'charcoal bags stacked by the door', C.struct, 4200, 600, 5200, 1400, 600);
    R(N, 'aguas frescas dispensers on a stand', C.yellow, 11300, 600, 12000, 2200, 1350);
    Cc(N, 'menudo pot on a burner', C.struct, 11200, 6600, 350, 1100, {n: 10});
    sym('electrical', C.elec, 'outlet', P(...m(7200, 5100), 1067), 0, {building: N, part: 'counter outlet for the scale', checks: [['outlet_height', 1067]]});
    const ws = m(8000, 6800);
    line('interior', C.int, circ(ws[0], ws[1], 280, 2900, 8), {building: N, part: 'meat case ceiling fan', anim: {type: 'spin', rpm: 60}}, closed);
    act(...m(2200, 1600), 'standing', 'ordering two kilos of carne asada', Math.PI / 2);
    act(...m(2000, 3500), 'standing', 'weighing out chorizo for a customer', -Math.PI / 2);
    act(...m(7200, 4600), 'standing', 'trimming flap meat at the butcher block', -Math.PI / 2);
    act(...m(10100, 4600), 'standing', 'cutting short ribs on the band saw', -Math.PI / 2);
    act(...m(1500, 8000), 'standing', 'picking out guajillo chiles by the bag', Math.PI);
  }
  // ---- Elephant Tree Feed Mill, west row, tall with a gable running north south
  {
    const N = 'Elephant Tree Feed Mill', y0 = ys + 4000 + 15240 + 3048, y1 = y0 + 24384;
    const f = shell(N, WX0, y0, WX1, y1, 7315, 'e', {facade: 'lines', fc: C.struct, noCeil: true, beam: 5486, lightZ: 5200, doorU: 3000});
    gableY(N, WX0, y0, WX1, y1, 7415, rc, rc2);
    const {R, Cc, m} = f;
    const rd0 = m(9000, 0), rd1 = m(13300, 0);
    line('structure', C.struct, [P(rd0[0], rd0[1]), P(rd0[0], rd0[1], 4267), P(rd1[0], rd1[1], 4267), P(rd1[0], rd1[1])], {building: N, part: 'roll up door for feed trucks'});
    R(N, 'hammer mill on a concrete pad', C.struct, 14000, 6000, 16500, 8200, 1800);
    Cc(N, 'hammer mill motor housing', C.struct, 17400, 7100, 500, 1200, {n: 12, anim: {type: 'spin', rpm: 40}});
    R(N, 'vertical feed mixer', C.yellow, 14200, 9200, 16200, 11200, 3600);
    R(N, 'bagging scale for 50 pound sacks', C.int, 11000, 8000, 12200, 9000, 900, {check: ['counter_height', 900]});
    R(N, 'sewing head for feed sacks on a stand', C.struct, 11000, 9300, 11500, 9800, 1300);
    for (let t = 0; t < 6; t++) R(N, 'pallet of bagged sweet feed ' + (t + 1), C.veg2, 1200 + (t % 3) * 2200, 6000 + Math.floor(t / 3) * 2400, 2900 + (t % 3) * 2200, 7800 + Math.floor(t / 3) * 2400, 1400);
    R(N, 'pallet of rolled corn', C.yellow, 1200, 10800, 2900, 11900, 1200);
    R(N, 'mineral block stack', C.struct, 4000, 11200, 5200, 12000, 700);
    R(N, 'feed tag printer at the mill office desk', C.int, 3300, 2700, 3600, 2950, 1100);
    R(N, 'mill office desk', C.int, 600, 2200, 2800, 3000, 760);
    R(N, 'mill office pos terminal', C.int, 1400, 2400, 1700, 2700, 1050);
    R(N, 'cash drawer under the mill desk', C.int, 900, 2300, 1300, 2650, 650);
    R(N, 'grain auger hopper', C.struct, 17800, 3000, 19400, 4600, 900);
    line('interior', C.struct, [P(...m(18600, 3800), 900), P(...m(18600, 9000), 6500)], {building: N, part: 'bucket elevator leg to the mill'});
    sym('electrical', C.elec, 'outlet', P(...m(150, 3400), 1067), 0, {building: N, part: 'desk outlet', checks: [['outlet_height', 1067]]});
    act(...m(1800, 3700), 'standing', 'ringing up four sacks of goat feed', -Math.PI / 2);
    act(...m(12700, 8500), 'standing', 'sewing shut a sack of sweet feed', Math.PI);
    act(...m(15400, 5300), 'standing', 'checking the hammer mill screen size', 0);
    act(...m(11000, 1500), 'standing', 'backing a feed truck to the roll up door', Math.PI / 2);
    // grain bins north of the mill, outside
    for (let j = 0; j < 2; j++) {
      const bx = WX0 + 3000 + j * 6000, by = y1 + 3600, r = 2300;
      line('structure', C.struct, circ(bx, by, r, 0, 16), {part: 'corrugated grain bin base'}, closed);
      line('structure', C.struct, circ(bx, by, r, 6096, 16), {part: 'grain bin eave ring'}, closed);
      line('structure', C.roof, [P(bx - r, by, 6096), P(bx, by, 7600), P(bx + r, by, 6096)], {part: 'grain bin cone roof'});
      hatch('structure', C.struct, vface(bx - r, by - r, bx + r, by - r, 0, 6096), 'lines', 450, 0, {part: 'grain bin corrugation'}, C.curb);
    }
  }
  // ---- Phainopepla Comedor, north row, faces south onto the courtyard
  const NX0 = 661368, NY1 = yn - 3000;
  {
    const N = 'Phainopepla Comedor', x0 = NX0, x1 = x0 + 13716, y0 = NY1 - 12192;
    const f = shell(N, x0, y0, x1, NY1, 4572, 's', {facade: 'brick', fc: C.yellow, pos: true});
    gableX(N, x0, y0, x1, NY1, 4672, rc, rc2);
    const {R, Cc, m} = f;
    R(N, 'cook line with a six burner range', C.struct, 3600, 8800, 6800, 9700, 914, {check: ['counter_height', 914]});
    R(N, 'hood over the cook line', C.struct, 3400, 8700, 7000, 10000, 2100);
    R(N, 'comal for handmade tortillas', C.struct, 7100, 8900, 8100, 9600, 940);
    R(N, 'pass through window with heat lamps', C.int, 3600, 7300, 8200, 7600, 1219, {anim: {type: 'blink', period: 2.5, duty: 0.9}});
    R(N, 'kitchen printer at the pass', C.int, 3800, 7350, 4100, 7550, 1300);
    R(N, 'three compartment sink', C.plumb, 8500, 8600, 9600, 9800, 900);
    R(N, 'reach in cooler of salsas', C.car2, 3700, 10300, 4900, 11400, 1900);
    R(N, 'clay pot of frijoles de olla', C.brick, 5300, 10400, 5900, 11000, 1250);
    for (let t = 0; t < 4; t++) { const tx = 4800 + t * 2100; R(N, 'oilcloth covered table ' + (t + 1), C.int, tx, 4200, tx + 1000, 5000, 760); }
    R(N, 'glass case of pan dulce by the register', C.yellow, 600, 4200, 2200, 4800, 1100, {check: ['counter_height', 1100]});
    R(N, 'jukebox against the wall', C.car, 12500, 600, 13300, 1300, 1500);
    R(N, 'menu board of comida corrida', C.sign, 3600, 6600, 7800, 6750, 2300);
    sym('electrical', C.elec, 'outlet', P(...m(150, 9300), 1067), 0, {building: N, part: 'outlet for the blender by the cook line', checks: [['outlet_height', 1067]]});
    act(...m(2200, 1600), 'standing', 'paying for the comida corrida plate', 0);
    act(...m(2000, 3500), 'standing', 'printing a ticket for table three', Math.PI);
    act(...m(7600, 8200), 'standing', 'flipping tortillas on the comal', 0);
    act(...m(5300, 3700), 'sitting', 'spooning up caldo de res', 0);
    act(...m(7400, 3700), 'sitting', 'reading the paper over coffee', 0);
    act(...m(9050, 8000), 'standing', 'scrubbing a stockpot at the sink', 0);
  }
  // ---- Coachwhip Paleteria, south row, faces north onto the courtyard
  const SY0 = ys + 3000;
  {
    const N = 'Coachwhip Paleteria', x0 = 661368, x1 = x0 + 9144, y1 = SY0 + 9144;
    const f = shell(N, x0, SY0, x1, y1, 3962, 'n', {facade: 'lines', fc: C.car, pos: true, ceil: 2896, beam: 3353});
    shed(N, x0, SY0, x1, y1, 4062, rc, rc2, true);
    const {R, Cc, m} = f;
    R(N, 'dipping freezer of paletas', C.car2, 4600, 3200, 7600, 4000, 900);
    R(N, 'upright freezer of mangonada cups', C.car2, 600, 5200, 1500, 6200, 1900);
    R(N, 'popsicle mold rack on the prep table', C.struct, 4600, 5600, 7000, 6300, 914, {check: ['counter_height', 914]});
    R(N, 'fruit blender station', C.int, 7300, 5600, 8000, 6100, 1150);
    R(N, 'bin of fresh mango and cucumber', C.veg2, 4600, 6600, 5600, 7200, 800);
    R(N, 'chamoy and tajin topping bar', C.brick, 3600, 600, 5200, 1100, 1000);
    R(N, 'paleta flavor board', C.sign, 4600, 2900, 7600, 3000, 2100);
    sym('electrical', C.elec, 'outlet', P(...m(8994, 5800), 1067), 0, {building: N, part: 'outlet for the fruit blender', checks: [['outlet_height', 1067]]});
    act(...m(2200, 1600), 'standing', 'paying for a coconut paleta', Math.PI);
    act(...m(2000, 3500), 'standing', 'counting quarters into the cash drawer', 0);
    act(...m(5800, 4500), 'standing', 'pulling a tray of paletas from the mold', Math.PI);
  }
  // ---- Desert Iguana Disc Harrow Shop, south row, faces Agave Street
  {
    const N = 'Desert Iguana Disc Harrow Shop', x0 = 672036, x1 = x0 + 11582, y1 = SY0 + 13716;
    const f = shell(N, x0, SY0, x1, y1, 5486, 's', {facade: 'lines', fc: C.struct, noCeil: true, beam: 4572, lightZ: 4400, doorU: 1200});
    barrel(N, x0, SY0, x1, y1, 5586, rc, rc2);
    const {R, Cc, m} = f;
    const rd0 = m(4200, 0), rd1 = m(8800, 0);
    line('structure', C.struct, [P(rd0[0], rd0[1]), P(rd0[0], rd0[1], 4267), P(rd1[0], rd1[1], 4267), P(rd1[0], rd1[1])], {building: N, part: 'roll up door to Agave Street'});
    hatch('paving', C.curb, rect(x0 + 3800, oy + CURB, x0 + 9200, SY0), 'dots', 1000, 0, {part: 'shop apron to Agave Street'}, C.struct);
    R(N, 'tandem disc harrow on stands', C.yellow, 4200, 5200, 8800, 8600, 900);
    for (let t = 0; t < 5; t++) Cc(N, 'disc blade on the gang ' + (t + 1), C.struct, 4700 + t * 950, 6900, 330, 700, {n: 12});
    R(N, 'bearing press on a bench', C.struct, 600, 6000, 1600, 6800, 1000);
    R(N, 'welding table with a vise', C.struct, 600, 8200, 2400, 9300, 914, {check: ['counter_height', 914]});
    R(N, 'rack of new notched disc blades', C.struct, 10400, 4000, 11300, 9000, 1800, {check: ['shelf_height', 1800]});
    R(N, 'parts counter with a pos terminal', C.int, 600, 2200, 3200, 2900, 1067);
    R(N, 'chain hoist trolley on the beam', C.yellow, 5800, 6400, 6600, 7200, 4300);
    R(N, 'grease drum with a hand pump', C.struct, 9300, 10300, 9900, 10900, 900);
    act(...m(5200, 4700), 'standing', 'torquing a gang bolt on the harrow', 0);
    act(...m(1700, 7400), 'standing', 'pressing a new bearing into a spool', Math.PI);
    act(...m(1900, 1600), 'standing', 'asking about a used offset disc', 0);
  }
  // ---- Globemallow Courtyard Well House, in the middle of the courtyard
  const CX0 = WX1 + 1200, CX1 = LX0 - 1200, CY0 = SY0 + 13716 + 2000, CY1 = NY1 - 12192 - 2000;
  {
    const N = 'Globemallow Courtyard Well House', x0 = 668500, x1 = x0 + 3658, y0 = 276000, y1 = y0 + 3658;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 2743, -610, true);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 2743), 'brick', 300, 0, {building: N, part: 'adobe brick wall'}, C.struct);
    hip(N, x0, y0, x1, y1, 2843, rc, rc2);
    door(N, x0 + 1300, y0, 'x', 914, 'well house door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2438), 'lines', 600, 0, {building: N, part: 'plywood ceiling', checks: [['ceiling_height', 2438]]});
    IC(N, '6 inch well casing', C.struct, x0 + 2500, y0 + 2500, 90, 460, {disc: 'plumbing'});
    line('plumbing', C.plumb, [P(x0 + 2500, y0 + 2500, 460), P(x0 + 2500, y0 + 2500, -45720)], {building: N, part: 'drop pipe to the pump at 150 ft'});
    IC(N, 'bladder pressure tank', C.plumb, x0 + 900, y0 + 2600, 280, 1100, {disc: 'plumbing'});
    line('electrical', C.elec, rect(x1 - 250, y0 + 900, x1 - 120, y0 + 1500, 1500), {building: N, part: 'well pump control box'}, closed);
    sym('electrical', C.elec, 'outlet', P(x0 + 120, y0 + 1600, 457), 0, {building: N, part: 'well house outlet', checks: [['outlet_height', 457]]});
    I(N, 'pressure gauge on the tee', C.yellow, x0 + 2300, y0 + 2000, x0 + 2600, y0 + 2200, 1100);
    run('plumbing', C.plumb, [P(x0 + 2500, y0 + 2300, 300), P(x0 + 2500, y0 - 300, -600), P(x0 + 2500, y0 - 3200, -600)], {building: N, part: 'well line to the stock tank fountain'});
    run('electrical', C.elec, [P(poleS[0][0], poleS[0][1], 6400), P(poleS[0][0], poleS[0][1], -600), P(660200, ys + 2400, -600), P(660200, y0 + 1800, -600), P(x0 + 200, y0 + 1800, -600), P(x0 + 200, y0 + 1800, 1500), P(x1 - 180, y0 + 1200, 1500)], {building: N, part: 'underground well pump circuit from the south pole'});
  }
  // ---- courtyard: paths, stock tank fountain, ramada, trees and life
  {
    const fx = 670329, fy = 269400;
    line('lot', C.struct, circ(fx, fy, 1800, 600, 20), {part: 'stock tank fountain rim'}, closed);
    line('plumbing', C.plumb, circ(fx, fy, 1650, 450, 20), {part: 'stock tank water surface', anim: {type: 'bob', mm: 15, period: 3}}, closed);
    hatch('paving', C.curb, circ(fx, fy, 5200, 30, 24), 'dots', 600, 0, {part: 'round flagstone plaza around the fountain'}, C.brick);
    line('paving', C.brick, wavy(WX1 + 600, 260000, fx - 5200, fy, 600, 14, 11, 30), {part: 'flagstone path from the carniceria'});
    line('paving', C.brick, wavy(WX1 + 600, 283000, fx - 4000, fy + 3600, 700, 14, 17, 30), {part: 'flagstone path from the feed mill'});
    line('paving', C.brick, wavy(fx + 5200, fy, LX0 - 300, 272000, 600, 14, 23, 30), {part: 'flagstone path to the east lot'});
    line('paving', C.brick, wavy(fx, fy + 5200, NX0 + 2800, NY1 - 12192 - 300, 400, 12, 29, 30), {part: 'flagstone path to the comedor'});
    line('paving', C.brick, wavy(fx - 1000, fy - 5200, 661368 + 2800, SY0 + 9144 + 300, 400, 12, 31, 30), {part: 'flagstone path to the paleteria'});
    line('lot', C.struct, rounded(675500, 278500, 682000, 284500, 900, 3000, 4), {part: 'mesquite pole ramada'}, closed);
    hatch('structure', C.veg2, rounded(675600, 278600, 681900, 284400, 900, 3000, 4), 'lines', 250, 30, {part: 'ocotillo rib shade on the ramada'}, C.struct);
    for (const [tx, ty] of [[677000, 280200], [680400, 280200], [677000, 283000], [680400, 283000]]) sym('activity', C.int, 'table', P(tx, ty), 0, {part: 'picnic table under the ramada'});
    act(677000, 281200, 'sitting', 'eating a torta under the ramada', Math.PI);
    act(680400, 282000, 'sitting', 'sharing a mangonada with a friend', 0);
    act(fx + 2300, fy - 600, 'standing', 'tossing a penny into the stock tank', Math.PI);
    act(fx - 2500, fy + 1200, 'standing', 'filling a canteen at the fountain spigot', 0);
    sym('activity', C.int, 'bench', P(fx - 3800, fy - 3600), 0.5, {part: 'bench by the fountain'});
    act(fx - 3800, fy - 3000, 'sitting', 'feeding crumbs to a cactus wren', 0.5);
    for (const [bx, by, sd] of [[664500, 288000, 41], [664000, 263500, 43], [676800, 288200, 47], [681500, 266000, 53]]) line('vegetation', C.veg2, blob(bx, by, 1400, 14, sd), {part: ['globemallow bed', 'desert marigold bed', 'brittlebush bed', 'chuparosa bed'][[41, 43, 47, 53].indexOf(sd)]}, closed);
    for (const [tx, ty] of [[663200, 280500], [675200, 273600], [663000, 272500], [682200, 289000]]) tree(tx, ty, 3, 6.4 + (tx % 7) * 0.2);
    for (let j = 0; j < 4; j++) tree(a + 400, ys + 6000 + j * 14000, 4, 7 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(a + 6000 + j * 12000, yn + 1200, 3, 6.6 + j * 0.4);
    line('vegetation', C.veg2, wavy(a + 2200, ys + 1500, a + 2200, yn - 1800, 500, 16, 71), {part: 'gravel strip of bursage along Pinacate Avenue'});
    for (let i = 0; i < 3; i++) sym('street', C.struct, 'light', P(AX0 + 300, ys + 9000 + i * 14000, 4200), 0, {part: 'lot light', anim: i === 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    const wx = LX0 - 600;
    act(wx, 268000, 'walking', 'carrying feed sacks to the pickup', 0, {type: 'path', speed: 1100, pts: [P(wx, 268000), P(wx, 286000), P(wx - 600, 286000), P(wx - 600, 268000), P(wx, 268000)]});
    const lp = circ(fx, fy, 4300, 0, 16); lp.push(lp[0]);
    sym('activity', C.person, 'person', lp[0], 0, {pose: 'walking', activity: 'walking a lap of the plaza with a cone', anim: {type: 'path', speed: 900, pts: lp}});
    sym('activity', C.person, 'dog', lp[1], 0, {activity: 'trotting after the ice cream cone', anim: {type: 'path', speed: 900, pts: lp.slice(1).concat([lp[1]])}});
    sym('activity', C.person, 'cyclist', P(AX0 + 1500, ys + 4000), 0, {activity: 'riding in for a paleta after practice', anim: {type: 'path', speed: 3200, pts: [P(AX0 + 1500, ys + 4000), P(AX0 + 1500, yn - 3000), P(AX1 - 1500, yn - 3000), P(AX1 - 1500, ys + 4000), P(AX0 + 1500, ys + 4000)]}});
  }
  trafficLoop(8, 3, true, C.yellow, 'truck', 7800);
  trafficLoop(8, 3, false, C.car, 'car', 9200);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 0,2 Desert Willow Elementary deepen
  const SCH = (x0) => [x0, 198496, x0 + 9144, 207640];
  D('0:2', 'Desert Willow Elementary', SCH(15144), 2743, [
    ['w', 'felt board with flannel story pieces', C.car2, 1200, 900, 1600],
    ['w', 'cubby of spare clothes in zip bags', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the bubble machine', 457],
    ['p', 'standing', 'putting a flannel coyote on the felt board'],
    ['p', 'standing', 'changing into spare socks after a puddle'],
  ]);
  D('0:2', 'Desert Willow Elementary', SCH(24288), 2743, [
    ['w', 'hundreds chart poster', C.sign, 900, 1000, 1900],
    ['w', 'shelf of reading buddy stuffed animals', C.yellow, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['p', 'standing', 'tossing a bean bag at the number target'],
    ['p', 'standing', 'reading to a stuffed armadillo'],
  ]);
  D('0:2', 'Desert Willow Elementary', SCH(33432), 2743, [
    ['w', 'labeled rock collection shelf', C.struct, 900, 1300, 1350, {check: ['shelf_height', 1350]}],
    ['w', 'chart of saguaro growth by decade', C.veg2, 900, 1000, 1900],
    ['o', 'outlet for the grow light', 1067],
    ['p', 'standing', 'labeling a chunk of rose quartz'],
    ['p', 'standing', 'watering the sprouting tray'],
  ]);
  D('0:2', 'Desert Willow Elementary', SCH(42576), 2743, [
    ['w', 'rack of new paperback chapter books', C.brick, 900, 900, 1600, {check: ['shelf_height', 1600]}],
    ['w', 'book fair banner', C.yellow, 1500, 1900, 2400],
    ['c', 'reading lamp pendant', C.int, 150, 60, {disc: 'interior'}],
    ['p', 'standing', 'browsing the new chapter books'],
    ['p', 'standing', 'hanging the book fair banner'],
  ]);
  D('0:2', 'Desert Willow Elementary', SCH(51720), 2743, [
    ['w', 'rack of visitor lanyards', C.int, 600, 1200, 1600],
    ['w', 'framed school mission statement', C.struct, 600, 1400, 1900],
    ['f', 'box of donated school supplies', C.car2, 600, 400, 500],
    ['o', 'outlet for the label maker', 1067],
    ['p', 'standing', 'handing a visitor lanyard to a parent'],
    ['p', 'standing', 'sorting donated glue sticks'],
  ]);

  // ================================================================= 2,1 Sidewinder Wash Clubhouse deepen
  D('2:1', 'Sidewinder Wash Clubhouse', [192024, 115214, 196088, 122529], 2743, [
    ['w', 'hook bar for drip dry shirts', C.struct, 1200, 1600, 1700],
    ['w', 'out of order sign on washer two', C.sign, 400, 1400, 1700],
  ]);
  D('2:1', 'Sidewinder Wash Clubhouse', [196088, 115214, 199339, 118872], 2743, [
    ['w', 'towel shelf of clean white towels', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'shower token box', C.struct, 300, 1200, 1500],
  ]);
  D('2:1', 'Sidewinder Wash Clubhouse', [196088, 118872, 199339, 122529], 2743, [
    ['w', 'fold down baby changing table', C.int, 900, 800, 1000],
  ]);
  D('2:1', 'Sidewinder Wash Clubhouse', [199339, 115214, 204216, 122529], 2743, [
    ['w', 'shelf of rv repair manuals', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1350]}],
    ['w', 'cork board of rv for sale flyers', C.struct, 900, 1200, 1800],
    ['o', 'outlet for the popcorn machine', 1067],
  ]);

  // ================================================================= 3,0 Horned Toad Travel Stop deepen
  D('3:0', 'Horned Toad Travel Stop', [276888, 43144, 295176, 49850], 3048, [
    ['w', 'shelf of first aid kits and aspirin', C.car, 900, 1300, 1500, {check: ['shelf_height', 1500]}],
    ['w', 'peg rack of leather work gloves', C.struct, 900, 1000, 1700],
    ['w', 'shelf of tow straps and jumper cables', C.yellow, 900, 1300, 1600, {check: ['shelf_height', 1600]}],
    ['c', 'hanging cold beer banner', C.yellow, 150, 300, {disc: 'interior'}],
    ['o', 'outlet for the coffee grinder', 1067],
    ['p', 'standing', 'choosing a pair of leather work gloves'],
    ['p', 'standing', 'buying jumper cables for a dead battery'],
    ['p', 'standing', 'picking out a foam cooler'],
    ['p', 'standing', 'reading the label on an aspirin bottle'],
    ['p', 'standing', 'picking a watermelon for the ice chest'],
  ]);
  D('3:0', 'Horned Toad Travel Stop', [276888, 49850, 291518, 55336], 3048, [
    ['w', 'rack of kids coloring books', C.car2, 600, 900, 1400],
    ['w', 'cashier schedule board', C.sign, 900, 1200, 1900],
    ['f', 'case pack of paper towels', C.int, 600, 500, 500],
    ['p', 'standing', 'grabbing a coloring book for the back seat'],
    ['p', 'standing', 'checking the cashier schedule board'],
  ]);

  // ================================================================= three small new buildings for the oldest blocks
  // ---- Sidewinder Wash Camp Store on 2,1, beside the clubhouse, door on the loop lane side
  {
    const N = 'Sidewinder Wash Camp Store', x0 = 183000, x1 = 188486, y0 = 114748, y1 = 119320;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3353, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 3353), 'lines', 250, 0, {building: N, part: 'board and batten, west wall'}, C.brick);
    gableY(N, x0, y0, x1, y1, 3453, C.roof, C.struct);
    door(N, x0, y0 + 1600, 'y', 914, 'camp store door', 1);
    sym('structure', C.sign, 'sign', P(x0 - 800, y0 - 600), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'beadboard ceiling', checks: [['ceiling_height', 2743]]});
    I(N, 'checkout counter', C.brick, x0 + 2200, y0 + 300, x0 + 3200, y0 + 2400, 1016, {check: ['counter_height', 1016]});
    I(N, 'pos terminal on the counter', C.int, x0 + 2500, y0 + 1300, x0 + 2800, y0 + 1600, 1300);
    I(N, 'receipt printer', C.int, x0 + 2500, y0 + 1800, x0 + 2800, y0 + 2050, 1080);
    I(N, 'card reader by the register', C.int, x0 + 2250, y0 + 900, x0 + 2450, y0 + 1100, 1150);
    I(N, 'cash drawer under the counter', C.int, x0 + 2700, y0 + 600, x0 + 3100, y0 + 1000, 950);
    I(N, 'ice merchandiser freezer', C.car2, x1 - 1400, y0 + 300, x1 - 300, y0 + 1100, 1600);
    I(N, 'cold drink cooler', C.car2, x1 - 1100, y1 - 2400, x1 - 300, y1 - 300, 1900);
    I(N, 'shelf of rv toilet chemicals and hose', C.plumb, x0 + 300, y1 - 700, x0 + 2600, y1 - 300, 1524, {check: ['shelf_height', 1524]});
    I(N, 'rack of lantern mantles and fuses', C.yellow, x0 + 3000, y1 - 600, x0 + 4200, y1 - 300, 1600);
    I(N, 'coffee pot on a little table', C.int, x0 + 3600, y0 + 300, x0 + 4300, y0 + 800, 900);
    sym('electrical', C.elec, 'outlet', P(x1 - 150, y0 + 1700, 457), 0, {building: N, part: 'outlet for the ice freezer', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'outlet', P(x0 + 3700, y0 + 150, 1067), 0, {building: N, part: 'outlet for the coffee pot', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'light', P(x0 + 2700, y0 + 2300, 2743), 0, {building: N, part: 'store ceiling light'});
    line('electrical', C.elec, rect(x1 - 250, y0 + 2600, x1 - 120, y0 + 3200, 1500), {building: N, part: 'store subpanel'}, closed);
    run('electrical', C.elec, [P(192300, 116600, 1500), P(192300, 116600, -600), P(188200, 116600, -600), P(188200, 116600, 1500), P(x1 - 180, y0 + 2600, 1500)], {building: N, part: 'feeder from the clubhouse panel'});
    run('plumbing', C.plumb, [P(192300, 116300, 300), P(192300, 116300, -900), P(x1 - 900, 116300, -900), P(x1 - 900, y0 + 800, -900), P(x1 - 900, y0 + 800, 900)], {building: N, part: 'water line to the ice freezer'});
    line('structure', C.struct, [P(x0 - 2400, y1 - 2600), P(x0 - 900, y1 - 2600), P(x0 - 900, y1 - 900), P(x0 - 2400, y1 - 900)], {part: 'locked propane tank exchange cage'}, closed);
    line('structure', C.brick, rect(x0 - 2300, y0 + 2700, x0 - 1100, y0 + 3300, 600), {part: 'stack of firewood bundles'}, closed);
    person(P(x0 + 1400, y0 + 1200), Math.PI / 2, 'standing', 'buying a bag of ice for the cooler');
    person(P(x0 + 3800, y0 + 1600), -Math.PI / 2, 'standing', 'ringing up firewood and marshmallows');
    person(P(x0 - 1650, y1 - 3300), 0, 'standing', 'swapping an empty propane tank');
  }
  // ---- Horned Toad Tire Bay on 3,0, by the air machine
  {
    const N = 'Horned Toad Tire Bay', x0 = 249244, x1 = 255340, y0 = 23500, y1 = 28072;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 4267, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 4267), 'brick', 300, 0, {building: N, part: 'split face block, south wall'}, C.brick);
    shed(N, x0, y0, x1, y1, 4367, C.roof, C.struct, true);
    line('structure', C.struct, [P(x1, y0 + 600), P(x1, y0 + 600, 3658), P(x1, y0 + 3800, 3658), P(x1, y0 + 3800)], {building: N, part: 'roll up door to the fuel apron'});
    door(N, x0 + 900, y0, 'x', 914, 'tire bay man door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 2400, y0 - 1100), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 3353), 'lines', 900, 90, {building: N, part: 'open joist ceiling', checks: [['ceiling_height', 3353]]});
    I(N, 'tire changer machine', C.struct, x0 + 1600, y0 + 2600, x0 + 2500, y0 + 3500, 1000);
    I(N, 'wheel balancer', C.yellow, x0 + 3300, y0 + 3000, x0 + 4100, y0 + 3700, 1100);
    IC(N, '60 gallon air compressor tank', C.plumb, x0 + 700, y1 - 700, 300, 1500, {n: 10});
    I(N, 'rack of used trailer tires', C.struct, x0 + 1600, y1 - 500, x0 + 4000, y1 - 150, 1829, {check: ['shelf_height', 1829]});
    I(N, 'tire dunk tank for leaks', C.plumb, x0 + 300, y0 + 1500, x0 + 1500, y0 + 2100, 700);
    I(N, 'floor jack', C.car, x1 - 1000, y0 + 1600, x1 - 600, y0 + 2900, 200);
    I(N, 'work bench with the ticket printer', C.int, x1 - 1600, y1 - 700, x1 - 300, y1 - 200, 914, {check: ['counter_height', 914]});
    I(N, 'card reader on the bench', C.int, x1 - 1000, y1 - 600, x1 - 800, y1 - 400, 1000);
    I(N, 'hose reel for the impact gun', C.plumb, x0 + 150, y0 + 3000, x0 + 300, y0 + 3400, 2400);
    sym('electrical', C.elec, 'outlet', P(x0 + 150, y0 + 2500, 457), 0, {building: N, part: 'outlet for the balancer', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'outlet', P(x1 - 1200, y1 - 150, 1067), 0, {building: N, part: 'bench outlet', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'light', P(x0 + 3000, y0 + 2300, 3353), 0, {building: N, part: 'tire bay light'});
    line('electrical', C.elec, rect(x1 - 250, y1 - 1600, x1 - 120, y1 - 1000, 1500), {building: N, part: 'tire bay panel'}, closed);
    run('electrical', C.elec, [P(260888, 27000, -762), P(x1 - 300, 27000, -762), P(x1 - 300, 27000, 1500), P(x1 - 180, y1 - 1300, 1500)], {building: N, part: 'feeder tapped off the canopy conduit'});
    person(P(x0 + 2050, y0 + 1900), 0, 'standing', 'mounting a trailer tire on the changer');
    person(P(x0 + 4600, y0 + 3350), Math.PI / 2, 'standing', 'spinning a wheel on the balancer');
    person(P(x0 + 900, y0 + 2700), Math.PI, 'standing', 'dunking a tube to find the leak');
  }
  // ---- Desert Willow Schoolyard Garden Shed on 0,2, with two raised beds
  {
    const N = 'Desert Willow Schoolyard Garden Shed', x0 = 17500, x1 = 21158, y0 = 176000, y1 = 179048;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 2743, -610, true);
    hatch('structure', C.car2, vface(x0, y0, x1, y0, 0, 2743), 'lines', 250, 0, {building: N, part: 'painted plywood siding'}, C.yellow);
    gableX(N, x0, y0, x1, y1, 2843, C.brick, C.roof);
    door(N, x0 + 1300, y0, 'x', 914, 'garden shed door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2438), 'lines', 600, 0, {building: N, part: 'plywood ceiling', checks: [['ceiling_height', 2438]]});
    I(N, 'potting bench', C.struct, x0 + 300, y1 - 800, x0 + 2100, y1 - 200, 914, {check: ['counter_height', 914]});
    I(N, 'shelf of seed packets by month', C.veg2, x1 - 500, y0 + 800, x1 - 200, y1 - 400, 1219, {check: ['shelf_height', 1219]});
    I(N, 'rack of kid size shovels and rakes', C.struct, x0 + 150, y0 + 400, x0 + 300, y0 + 1600, 1300);
    I(N, 'stack of watering cans', C.plumb, x0 + 2400, y1 - 700, x0 + 2900, y1 - 300, 400);
    I(N, 'kid size wheelbarrow', C.car, x1 - 1600, y0 + 400, x1 - 900, y0 + 1300, 500);
    I(N, 'bag of compost on the floor', C.struct, x0 + 2300, y0 + 400, x0 + 2900, y0 + 800, 250);
    sym('electrical', C.elec, 'outlet', P(x0 + 150, y1 - 1200, 1067), 0, {building: N, part: 'outlet for the seedling heat mat', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'light', P(x0 + 1800, y0 + 1500, 2438), 0, {building: N, part: 'shed light'});
    line('interior', C.int, rect(x0 + 600, y1 - 700, x0 + 1300, y1 - 300, 960), {building: N, part: 'seedling heat mat with sunflower starts'}, closed);
    run('electrical', C.elec, [P(18000, 198800, 1500), P(18000, 198800, -600), P(18000, y1 - 400, -600), P(18000, y1 - 400, 1067), P(x0 + 150, y1 - 1200, 1067)], {building: N, part: 'conduit from the school to the shed'});
    line('structure', C.struct, circ(x1 + 500, y0 + 600, 350, 900, 10), {part: 'rain barrel off the shed gutter'}, closed);
    for (let j = 0; j < 2; j++) {
      const bx = x1 + 1300, by = y0 + j * 1900;
      line('lot', C.brick, rect(bx, by, bx + 1200, by + 1500, 450), {part: 'raised garden bed ' + (j + 1)}, closed);
      line('vegetation', C.veg2, blob(bx + 600, by + 750, 420, 10, 97 + j), {part: j ? 'carrot and radish rows' : 'sunflowers and squash'}, closed);
    }
    person(P(x0 + 1200, y1 - 1300), 0, 'standing', 'potting a sunflower seedling');
    person(P(x1 + 1900, y0 + 1700), 0, 'standing', 'pulling weeds from the carrot bed');
    person(P(x1 + 1300, y0 + 600), Math.PI, 'standing', 'filling a watering can at the rain barrel');
  }

  if (missing) console.log('MISSING ' + missing);
}
