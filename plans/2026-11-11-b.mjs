// Agent Orange 2026-11-11 b: claim 9,4 and build the Pebble Wash Shopping Center, an L shaped strip mall asked for by Orange:
// nail parlor, tanning salon, hair salon, tax office, pawn shop and jewelry shop around one front lot.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611112; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 9,4, an L shaped strip mall
  k.VSTREET[10] = k.VSTREET[10] || 'Sand Wasp Avenue';
  claim(9, 4);
  streets(9, 4, {s: true, n: true, e: true});
  const ox = 9 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  let s2 = 94411; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  lot('commercial', a, ys, b, yn, 'Pebble Wash Shopping Center');

  // north wing faces south, east wing faces west, both onto one front lot. Alleys run behind both wings.
  const NY0 = 362808, NY1 = 381096, NX0 = 725376, NX1 = 758808;
  const EX0 = 758808, EX1 = 777096, EY0 = 329136, EY1 = 362808;
  // ---- utilities in the north and east alleys
  const WNY = 382600, PNY = 384100, SNY = 385600, WEX = 778600, PEX = 780100, SEX = 781600;
  const poles = [];
  for (let x = a + 2000; x < PEX; x += 12000) poles.push([x, PNY]);
  poles.push([PEX, PNY]);
  for (let y = PNY - 12000; y > ys + 2000; y -= 12000) poles.push([PEX, y]);
  for (const [px, py] of poles) sym('electrical', C.struct, 'pole', P(px, py), 0, {part: 'alley pole line'});
  line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 8230)), {part: 'alley primary'});
  line('electrical', C.elec, poles.map(([x, y]) => P(x, y, 6400)), {part: 'alley secondary'});
  line('plumbing', C.plumb, [P(715632, WNY, -1219), P(WEX, WNY, -1219), P(WEX, ys + 2000, -1219)], {part: 'alley water main off Bladderpod Avenue'});
  line('plumbing', C.sewer, [P(SEX, ys + 2000, -1500), P(SEX, SNY, -1800), P(716832, SNY, -2134)], {part: 'alley sewer to Bladderpod Avenue'});
  hatch('paving', C.curb, rect(a, NY1 + 600, b, yn - 300), 'dots', 1000, 0, {part: 'north service alley'}, C.struct);
  hatch('paving', C.curb, rect(EX1 + 600, ys + 300, b, NY1 + 600), 'dots', 1000, 0, {part: 'east service alley'}, C.struct);
  const nearPole = (x, y) => poles.reduce((p, c) => Math.hypot(c[0] - x, c[1] - y) < Math.hypot(p[0] - x, p[1] - y) ? c : p);
  const nearW = (x, y) => x < EX0 - 100 ? [x, WNY] : [WEX, y];
  const nearS = (x, y) => x < EX0 - 100 ? [x, SNY] : [SEX, y];

  // ---- the front lot
  hatch('paving', C.curb, rect(a + 200, ys + 400, 755808, 359808), 'dots', 1100, 0, {part: 'front parking lot, fresh asphalt'}, C.struct);
  hatch('paving', C.curb, rect(735000, oy + CURB, 742315, ys + 400), 'dots', 1000, 0, {part: 'driveway off Chuparosa Street'}, C.struct);
  hatch('paving', C.curb, rect(ox + CURB, 351409, a + 200, 358724), 'dots', 1000, 0, {part: 'driveway off Bladderpod Avenue'}, C.struct);
  const rows = [[327636, 1], [340437, -1], [345923, 1]];
  const stalls = [];
  let sn = 0;
  for (const [ry, face] of rows) for (let i = 0; i < 8; i++) {
    const sx = 724376 + i * 2743;
    if (ry === 327636 && sx + 2743 > 734700 && sx < 742615) continue;
    sn++;
    const pts = face > 0 ? [P(sx, ry + 5486), P(sx, ry), P(sx + 2743, ry), P(sx + 2743, ry + 5486)] : [P(sx, ry), P(sx, ry + 5486), P(sx + 2743, ry + 5486), P(sx + 2743, ry)];
    if (ry === 345923 && i === 7) {
      line('paving', C.car2, pts, {part: 'accessible stall', checks: [['stall_width', 2743], ['stall_depth', 5486]]});
      hatch('paving', C.car2, rect(sx + 2743, ry, sx + 2743 + 1524, ry + 5486), 'lines', 300, 45, {part: 'accessible access aisle striping'});
      sym('paving', C.car2, 'sign', P(sx + 1371, ry + 5300), 0, {text: 'accessible parking'});
      continue;
    }
    line('paving', C.white, pts, Object.assign({part: 'lot stall ' + sn}, sn < 7 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {}));
    stalls.push([sx + 1371, ry + 2743, face]);
  }
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8, 6, 3];
  for (const [cx, cy, face] of stalls) {
    if (r2() > 0.45) continue;
    const truck = r2() < 0.3, back = r2() < 0.25;
    sym('vehicle', CARCOL[Math.floor(r2() * CARCOL.length)], truck ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 300), cy + Math.round((r2() - 0.5) * 400)), (face > 0 ? Math.PI : 0) + (back ? Math.PI : 0) + (r2() - 0.5) * 0.08, {part: truck ? 'pickup in the strip mall lot' : (back ? 'car backed in' : 'parked car')});
  }
  // planter islands at the west end of each row, with mesquite trees
  for (const [ry] of rows.slice(0, 2)) {
    const y0 = ry === 340437 ? 340437 : ry, y1 = ry === 340437 ? 351409 : ry + 5486;
    line('lot', C.struct, rounded(a + 300, y0 + 200, 724176, y1 - 200, 600, 152, 4), {part: 'curbed planter island'}, closed);
    line('vegetation', C.veg2, blob((a + 300 + 724176) / 2, (y0 + y1) / 2 - 1300, 500, 10, y0 % 97), {part: 'bursage in the island'}, closed);
    tree((a + 300 + 724176) / 2, (y0 + y1) / 2 + 1200, 3, 6.5 + (y0 % 5) * 0.3);
  }
  for (const ly of [330400, 345923]) { line('structure', C.struct, [P(746900, ly), P(746900, ly, 7600)], {part: 'lot light pole'}); sym('street', C.struct, 'light', P(746900, ly, 7600), 0, {part: 'lot light head'}); }
  // walkways and canopies in front of both wings
  hatch('paving', C.curb, rect(NX0, 359808, 755808, NY0, 152), 'lines', 600, 90, {part: 'storefront walk, north wing', checks: [['sidewalk_width', 3000]]});
  hatch('paving', C.curb, rect(755808, EY0, EX0, NY0, 152), 'lines', 600, 0, {part: 'storefront walk, east wing', checks: [['sidewalk_width', 3000]]});
  hatch('structure', C.roof, rect(NX0, 359808, EX0, NY0, 3658), 'lines', 500, 0, {part: 'canopy over the north walk, standing seam'}, C.struct);
  hatch('structure', C.roof, rect(755808, EY0, EX0, 359808, 3658), 'lines', 500, 90, {part: 'canopy over the east walk, standing seam'}, C.struct);
  for (let x = NX0 + 2000; x < 755000; x += 5486) line('structure', C.struct, [P(x, 359958), P(x, 359958, 3658)], {part: 'canopy post'});
  for (let y = EY0 + 2000; y < 359000; y += 5486) line('structure', C.struct, [P(755958, y), P(755958, y, 3658)], {part: 'canopy post'});
  // pylon sign at the corner of Chuparosa Street and Bladderpod Avenue
  line('structure', C.struct, [P(a + 1500, ys + 700), P(a + 1500, ys + 700, 7000)], {part: 'pylon sign post'});
  line('structure', C.brick, [P(a + 700, ys + 700, 5200), P(a + 2300, ys + 700, 5200), P(a + 2300, ys + 700, 7000), P(a + 700, ys + 700, 7000)], {part: 'pylon sign cabinet', anim: {type: 'blink', period: 9, duty: 0.92}}, closed);
  sym('structure', C.sign, 'sign', P(a + 1500, ys + 700, 7300), 0, {text: 'Pebble Wash Shopping Center'});
  sym('structure', C.sign, 'sign', P(a + 1500, ys + 700, 4800), 0, {text: 'Nails, Tanning, Hair, Taxes, Pawn, Jewelry'});
  // service yard in the corner behind both wings
  {
    const x0 = EX0 + 600, y0 = NY0 + 600;
    line('structure', C.brick, rect(x0 + 1000, y0 + 1000, x0 + 4600, y0 + 3400, 1829), {part: 'block trash enclosure'}, closed);
    line('lot', C.car2, rect(x0 + 1300, y0 + 1300, x0 + 3100, y0 + 2700, 1400), {part: 'trash dumpster'}, closed);
    line('lot', C.plumb, rect(x0 + 3300, y0 + 1300, x0 + 4300, y0 + 2700, 1400), {part: 'cardboard recycling dumpster'}, closed);
    sym('vehicle', C.white, 'truck', P(x0 + 9000, y0 + 9000), Math.PI / 2, {part: 'box truck delivering salon supplies'});
    act(x0 + 3800, y0 + 4200, 'standing', 'tossing flattened boxes in the recycling', Math.PI);
    act(x0 + 9000, y0 + 6200, 'standing', 'rolling a case of shampoo off the box truck', 0);
  }
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
    if (!o.noSign) sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
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
    run('plumbing', C.sewer, [P(sp[0], sp[1], -300), P(sm[0], sm[1], -1700)], {building: N, part: 'building drain to the alley sewer'});
    line('plumbing', C.plumb, [P(wp[0], wp[1], 300), P(wp[0], wp[1], 1500)], {building: N, part: '30 gallon water heater'});
    return f;
  }

  // ---- the six storefronts. Units sit 152 mm apart so each has its own closed footprint.
  const RC = [[10, 7], [5, 7]];
  const unitN = (i) => [NX0 + i * 11144 + 76, NY0, NX0 + (i + 1) * 11144 - 76, NY1];
  const unitE = (i) => [EX0, EY1 - (i + 1) * 11224 + 76, EX1, EY1 - i * 11224 - 76];
  function storefront(N, box, face, H, band, fac) {
    const [x0, y0, x1, y1] = box;
    const f = shell(N, x0, y0, x1, y1, H, face, {facade: fac, fc: band, pos: true, ceil: 3048, beam: 3658, doorU: 5000, noSign: true});
    gravel(N, x0, y0, x1, y1, H + 100, 7, C.struct);
    const s0 = f.m(300, -3000), s1 = f.m(f.W - 300, -3000);
    hatch('structure', band, vface(s0[0], s0[1], s1[0], s1[1], 3700, 4300), 'lines', 200, 0, {building: N, part: 'tenant sign band on the canopy fascia'}, C.white);
    const sc = f.m(f.W / 2, -3050);
    sym('structure', C.sign, 'sign', P(sc[0], sc[1], 4000), 0, {text: N});
    const g0 = f.m(600, 0), g1 = f.m(4600, 0);
    hatch('structure', C.car2, vface(g0[0], g0[1], g1[0], g1[1], 300, 2700), 'lines', 300, 90, {building: N, part: 'storefront glass'});
    return f;
  }
  // ---- Quailbush Nail Parlor
  {
    const N = 'Quailbush Nail Parlor', f = storefront(N, unitN(0), 's', 4877, C.person, 'lines'), {R, Cc, m, W} = f;
    for (let t = 0; t < 4; t++) {
      R(N, 'manicure table ' + (t + 1), C.int, 4500, 4200 + t * 2400, 5700, 4800 + t * 2400, 760);
      R(N, 'uv nail lamp on table ' + (t + 1), C.struct, 5300, 4300 + t * 2400, 5600, 4600 + t * 2400, 900);
    }
    for (let t = 0; t < 3; t++) {
      R(N, 'pedicure spa chair ' + (t + 1), C.person, W - 1500, 4500 + t * 2300, W - 400, 5600 + t * 2300, 1100);
      Cc(N, 'pedicure foot basin ' + (t + 1), C.plumb, W - 1950, 5050 + t * 2300, 300, 400, {disc: 'plumbing', n: 10});
    }
    R(N, 'wall rack of nail polish', C.person, 150, 4000, 300, 8000, 1524, {check: ['shelf_height', 1524]});
    R(N, 'back counter with the autoclave sterilizer', C.int, 600, 14500, 4000, 15100, 914, {check: ['counter_height', 914]});
    R(N, 'autoclave sterilizer', C.struct, 3000, 14550, 3700, 15000, 1250);
    R(N, 'waiting chairs by the window', C.int, 600, 600, 2400, 1100, 450);
    const fan = m(5000, 9000); line('interior', C.int, circ(fan[0], fan[1], 280, 2900, 8), {building: N, part: 'ceiling fan over the tables', anim: {type: 'spin', rpm: 55}}, closed);
    act(...m(2200, 1600), 'standing', 'paying for a gel fill', 0);
    act(...m(2000, 3500), 'standing', 'booking a pedicure for saturday', Math.PI);
    act(...m(6200, 4500), 'standing', 'filing acrylic tips at table one', -Math.PI / 2);
    act(...m(4000, 4500), 'sitting', 'holding still for a french tip', Math.PI / 2);
    act(...m(W - 950, 5050), 'sitting', 'soaking feet in the pedicure tub', -Math.PI / 2);
    act(...m(1000, 6000), 'standing', 'picking a coral polish off the wall', -Math.PI / 2);
  }
  // ---- Sun Spider Tanning Salon
  {
    const N = 'Sun Spider Tanning Salon', f = storefront(N, unitN(1), 's', 5182, C.yellow, 'brick'), {R, Cc, m, W} = f;
    const ln = (u0, v0, u1, v1, label) => { const p = m(u0, v0), q = m(u1, v1); line('interior', C.int, [P(p[0], p[1]), P(q[0], q[1]), P(q[0], q[1], 2438), P(p[0], p[1], 2438)], {building: N, part: label}, closed); };
    ln(5500, 5000, 5500, 15000, 'tanning room partition');
    for (let r = 0; r < 3; r++) ln(5500, 7500 + r * 2500, W - 150, 7500 + r * 2500, 'tanning room divider ' + (r + 1));
    for (let r = 0; r < 3; r++) {
      R(N, 'lay down tanning bed ' + (r + 1), C.struct, 7000, 5500 + r * 2500, 9200, 6600 + r * 2500, 600);
      R(N, 'tanning bed lamp canopy ' + (r + 1), C.yellow, 7000, 5500 + r * 2500, 9200, 6600 + r * 2500, 1100, {anim: {type: 'blink', period: 2 + r * 0.4, duty: 0.85}});
    }
    Cc(N, 'stand up tanning booth', C.yellow, 8000, 13700, 600, 2100, {n: 12, anim: {type: 'blink', period: 3.1, duty: 0.8}});
    R(N, 'shelf of bronzing lotions', C.yellow, 150, 4000, 300, 7000, 1829, {check: ['shelf_height', 1829]});
    R(N, 'warm towel cabinet', C.int, 600, 12000, 1600, 12600, 1800);
    R(N, 'washer and dryer for towels', C.plumb, 600, 14400, 2200, 15100, 900);
    act(...m(2200, 1600), 'standing', 'buying a ten session tanning pack', 0);
    act(...m(2000, 3500), 'standing', 'setting a twelve minute timer', Math.PI);
    act(...m(1000, 5500), 'standing', 'choosing a bronzing lotion', -Math.PI / 2);
    act(...m(6400, 11500), 'standing', 'wiping down tanning bed three', Math.PI / 2);
    act(...m(1400, 13800), 'standing', 'folding warm towels from the dryer', Math.PI);
  }
  // ---- Fan Palm Hair Salon
  {
    const N = 'Fan Palm Hair Salon', f = storefront(N, unitN(2), 's', 4877, C.brick, 'lines'), {R, Cc, m, W} = f;
    for (let t = 0; t < 4; t++) {
      R(N, 'styling station ' + (t + 1), C.int, 150, 4000 + t * 2400, 700, 5200 + t * 2400, 914, {check: ['counter_height', 914]});
      const p = m(150, 4100 + t * 2400), q = m(150, 5100 + t * 2400);
      line('interior', C.car2, [P(p[0], p[1], 1000), P(q[0], q[1], 1000), P(q[0], q[1], 2000), P(p[0], p[1], 2000)], {building: N, part: 'station mirror ' + (t + 1)}, closed);
      Cc(N, 'hydraulic styling chair ' + (t + 1), C.struct, 1500, 4600 + t * 2400, 350, 500, {n: 10});
    }
    for (let t = 0; t < 2; t++) {
      R(N, 'shampoo bowl ' + (t + 1), C.plumb, 6000 + t * 1200, 13000, 6700 + t * 1200, 13700, 900);
      const d = m(6350 + t * 1200, 13350); line('plumbing', C.sewer, [P(d[0], d[1], 750), P(d[0], d[1], -300)], {building: N, part: 'shampoo bowl drain ' + (t + 1)});
    }
    for (let t = 0; t < 2; t++) Cc(N, 'hooded dryer chair ' + (t + 1), C.struct, W - 1200, 6000 + t * 1700, 450, 1300, {n: 12});
    R(N, 'color mixing bar', C.int, 600, 14600, 3500, 15200, 914);
    R(N, 'shelf of shampoo and styling products', C.brick, W - 300, 9000, W - 150, 12000, 1524, {check: ['shelf_height', 1524]});
    act(...m(2200, 1600), 'standing', 'booking a perm at the front desk', 0);
    act(...m(2000, 3500), 'standing', 'answering the salon phone', Math.PI);
    act(...m(2300, 4600), 'standing', 'trimming bangs at station one', Math.PI / 2);
    act(...m(1500, 4600), 'sitting', 'getting a trim at station one', -Math.PI / 2);
    act(...m(6350, 12400), 'standing', 'rinsing color at the shampoo bowl', 0);
    act(...m(W - 1200, 6000), 'sitting', 'reading a magazine under the dryer', Math.PI / 2);
  }
  // ---- Pinyon Jay Tax Office
  {
    const N = 'Pinyon Jay Tax Office', f = storefront(N, unitE(0), 'w', 5486, C.plumb, 'brick'), {R, Cc, m, W} = f;
    for (let t = 0; t < 4; t++) {
      R(N, 'tax preparer desk ' + (t + 1), C.int, 3500, 5000 + t * 2600, 5300, 5800 + t * 2600, 760);
      R(N, 'monitor on desk ' + (t + 1), C.struct, 4200, 5600 + t * 2600, 4700, 5700 + t * 2600, 1150);
    }
    R(N, 'row of lateral file cabinets', C.struct, W - 800, 4000, W - 200, 9000, 1320);
    R(N, 'copier and document scanner', C.int, 600, 12000, 1600, 12700, 1000);
    R(N, 'refund check printer', C.int, 3800, 5100, 4100, 5350, 900);
    R(N, 'locked bin for shredding', C.struct, 600, 13300, 1100, 13800, 900);
    R(N, 'waiting chairs along the window', C.int, 600, 600, 2400, 1100, 450);
    R(N, 'rack of state and federal tax forms', C.sign, W - 300, 10000, W - 150, 12000, 1524, {check: ['shelf_height', 1524]});
    act(...m(2200, 1600), 'standing', 'paying the preparation fee by card', -Math.PI / 2);
    act(...m(4400, 8900), 'sitting', 'signing a tax return at desk two', 0);
    act(...m(4400, 7100), 'sitting', 'checking a farm schedule against receipts', Math.PI);
    act(...m(1100, 11400), 'standing', 'scanning w2 forms into the system', 0);
    act(...m(1500, 850), 'sitting', 'waiting with a folder of receipts', 0);
  }
  // ---- Badger Hole Pawn Shop
  {
    const N = 'Badger Hole Pawn Shop', f = storefront(N, unitE(1), 'w', 4877, C.struct, 'lines'), {R, Cc, m, W} = f;
    R(N, 'glass showcase counter, front', C.car2, 3000, 4000, 8000, 4700, 1016, {check: ['counter_height', 1016]});
    R(N, 'glass showcase counter, side', C.car2, 7300, 4700, 8000, 9000, 1016);
    R(N, 'gold testing scale on the counter', C.yellow, 4600, 4200, 4900, 4450, 1100);
    R(N, 'pawn ticket printer', C.int, 6000, 4200, 6300, 4450, 1100);
    R(N, 'security camera monitor at the counter', C.int, 7500, 5500, 7800, 5800, 1400);
    R(N, 'wall of hanging guitars', C.brick, 150, 5000, 300, 10000, 2000);
    R(N, 'pegboard wall of power tools', C.struct, W - 300, 4000, W - 150, 11000, 1800);
    R(N, 'gondola of used electronics', C.int, 2000, 7000, 2800, 12000, 1524, {check: ['shelf_height', 1524]});
    const pa = m(0, 14000), pb = m(W - 2743, 14000);
    line('interior', C.int, [P(pa[0], pa[1]), P(pb[0], pb[1]), P(pb[0], pb[1], 2438), P(pa[0], pa[1], 2438)], {building: N, part: 'cage wall of the pawn storage room'}, closed);
    R(N, 'pawn storage shelving with tagged items', C.struct, 600, 14600, 6000, 15200, 2134, {check: ['shelf_height', 2134]});
    act(...m(5000, 3300), 'standing', 'pawning a chainsaw for the weekend', 0);
    act(...m(5000, 5300), 'standing', 'weighing a gold chain on the scale', Math.PI);
    act(...m(1000, 7000), 'standing', 'testing a guitar through a little amp', -Math.PI / 2);
    act(...m(W - 1100, 6000), 'standing', 'browsing the drill sets on the pegboard', Math.PI / 2);
  }
  // ---- Agate Wash Jewelry Shop
  {
    const N = 'Agate Wash Jewelry Shop', f = storefront(N, unitE(2), 'w', 5182, C.car2, 'brick'), {R, Cc, m, W} = f;
    R(N, 'glass showcase of turquoise rings', C.car2, 3000, 4500, 5400, 5100, 1016, {check: ['counter_height', 1016]});
    R(N, 'glass showcase of silver necklaces', C.car2, 6000, 4500, 8400, 5100, 1016);
    R(N, 'side case of watches', C.car2, W - 1100, 6000, W - 500, 9000, 1016);
    R(N, 'countertop mirror', C.int, 3200, 4600, 3500, 4700, 1300);
    R(N, 'jeweler bench', C.struct, 600, 13500, 2400, 14200, 914, {check: ['counter_height', 914]});
    Cc(N, 'soldering torch tip at the bench', C.yellow, 1500, 13850, 60, 1000, {n: 6, anim: {type: 'blink', period: 0.8, duty: 0.6}});
    R(N, 'ultrasonic jewelry cleaner', C.plumb, 2000, 13600, 2300, 13900, 1000);
    R(N, 'ring sizing mandrel stand', C.struct, 900, 13600, 1100, 13800, 1150);
    R(N, 'jewelry safe', C.struct, 4000, 14400, 5200, 15300, 1500);
    R(N, 'watch battery station', C.int, 6000, 9000, 7200, 9600, 1016);
    act(...m(4200, 3800), 'standing', 'trying on a turquoise ring', 0);
    act(...m(4200, 5800), 'standing', 'showing a squash blossom necklace', Math.PI);
    act(...m(1500, 14700), 'sitting', 'soldering a broken chain at the bench', Math.PI);
    act(...m(6600, 10200), 'standing', 'replacing a watch battery', Math.PI);
  }
  // ---- life in the lot and on the walks
  {
    const wy = 361400;
    act(726000, wy, 'walking', 'carrying shopping bags to the car', 0, {type: 'path', speed: 1100, pts: [P(726000, wy), P(745000, wy), P(745000, wy - 600), P(726000, wy - 600), P(726000, wy)]});
    act(757000, 333000, 'walking', 'window shopping along the east walk', 0, {type: 'path', speed: 900, pts: [P(757000, 333000), P(757000, 358000), P(756600, 358000), P(756600, 333000), P(757000, 333000)]});
    sym('activity', C.person, 'cyclist', P(751000, 334000), 0, {activity: 'riding over to the tax office with a folder', anim: {type: 'path', speed: 3000, pts: [P(751000, 334000), P(751000, 356000), P(749500, 356000), P(749500, 334000), P(751000, 334000)]}});
    act(744500, 337000, 'standing', 'loading a pawned tv into a pickup', 0);
    for (let j = 0; j < 4; j++) tree(a + 6000 + j * 13000, yn + 1200, 3, 6.8 + j * 0.3);
    for (let j = 0; j < 3; j++) tree(b + 1500, ys + 8000 + j * 9000, 4, 7.2 + j * 0.4);
    line('vegetation', C.veg2, wavy(a + 2600, ys + 600, 734000, ys + 600, 500, 14, 83), {part: 'gravel strip of brittlebush along Chuparosa Street'});
  }
  trafficLoop(9, 4, true, C.car2, 'car', 9500);
  trafficLoop(9, 4, false, C.yellow, 'car', 8500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);
}
