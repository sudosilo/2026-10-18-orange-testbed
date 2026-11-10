// Agent Orange 2026-11-10 a: claim 8,4 and build the Ratany Hill side lot block (torta shop, gate valve supply, cab and seat shop,
// alfalfa seed barn, well house, scale house and truck scale), then deepen 0,0 corner market block, 2,2 Cholla Street shops and 3,1 Pecan Hollow farm.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611110; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 8,4, a side lot layout
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, VSTREET} = k;
  VSTREET[8] = VSTREET[8] || 'Pinacate Avenue';
  VSTREET[9] = VSTREET[9] || 'Bladderpod Avenue';
  claim(8, 4);
  streets(8, 4, {s: true, n: true, e: true});
  const ox = 8 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  let s2 = 84841; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  const yAB = oy + 34000;
  lot('commercial', a, oy + PL, b, yAB, 'Spiny Lizard side lot shops');
  lot('agricultural', a, yAB, b, oy + S - PL, 'Ratany Hill seed yard and truck scale');

  // side parking lot on the west, entered from Pinacate Avenue
  const LX1 = a + 15000;
  hatch('paving', C.curb, rect(a, oy + PL + 600, LX1, yAB - 600), 'dots', 1100, 0, {part: 'side parking lot, chip seal'}, C.struct);
  const dy0 = oy + 20000, dy1 = dy0 + 7316;
  hatch('paving', C.curb, rect(ox + CURB, dy0, a, dy1), 'dots', 1000, 0, {part: 'driveway off Pinacate Avenue'}, C.struct);
  line('paving', C.white, [P(ox + CURB, dy0), P(a, dy0)], {part: 'driveway edge, south'});
  line('paving', C.white, [P(ox + CURB, dy1), P(a, dy1)], {part: 'driveway edge, north'});
  const stalls = [];
  let sn = 0;
  for (const sx of [a + 600]) for (let sy = oy + PL + 1500; sy + 2743 <= yAB - 1500; sy += 2743) {
    if (sx === a + 600 && sy + 2743 > dy0 - 300 && sy < dy1 + 300) continue;
    sn++;
    if (sn === 1) { line('paving', C.car2, rect(sx, sy, sx + 5486, sy + 3658), {part: 'accessible stall and aisle', checks: [['stall_width', 3658], ['stall_depth', 5486]]}, closed); hatch('paving', C.car2, rect(sx, sy + 2438, sx + 5486, sy + 3658), 'lines', 300, 45, {part: 'accessible access aisle striping'}); sy += 915; continue; }
    line('paving', C.white, [P(sx, sy), P(sx + 5486, sy), P(sx + 5486, sy + 2743), P(sx, sy + 2743)], {part: 'side lot stall ' + sn, checks: [['stall_width', 2743], ['stall_depth', 5486]]});
    stalls.push([sx + 2743, sy + 1371, sx === a + 600 ? 1 : -1]);
  }
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];
  for (const [cx, cy, side] of stalls) {
    if (r2() > 0.55) continue;
    const truck = r2() < 0.3, back = r2() < 0.35;
    const rot = (side > 0 ? -Math.PI / 2 : Math.PI / 2) + (back ? Math.PI : 0) + (r2() - 0.5) * 0.06;
    sym('vehicle', CARCOL[Math.floor(r2() * CARCOL.length)], truck ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 400), cy + Math.round((r2() - 0.5) * 250)), rot, {part: truck ? (back ? 'pickup backed into the stall' : 'work pickup') : (back ? 'car backed into the stall' : 'parked car')});
  }

  // rear service alley
  const alY = yAB + 3048;
  hatch('paving', C.curb, rect(a, yAB + 600, b, yAB + 6700), 'dots', 900, 0, {part: 'rear service alley'}, C.struct);
  const poles = [];
  for (let i = 0; i < 5; i++) { const px = a + 4200 + i * 13000; poles.push(px); sym('electrical', C.struct, 'pole', P(px, yAB + 4500), 0, {part: 'alley pole line'}); }
  line('electrical', C.elec, poles.map(px => P(px, yAB + 4500, 8230)), {part: 'alley primary'});
  line('electrical', C.elec, poles.map(px => P(px, yAB + 4500, 6400)), {part: 'alley secondary'});
  line('plumbing', C.plumb, [P(a, alY, -1200), P(b, alY, -1200)], {part: 'alley water main'});
  line('plumbing', C.sewer, [P(b, alY + 900, -1800), P(a, alY + 900, -2400)], {part: 'alley sewer main'});

  // roofs
  const [rc, rc2] = [8, 11];
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

  // svc is the side that faces the alley: 'n' for the front row, 's' for the back row.
  function shell(N, x0, x1, y0, y1, H, svc, o = {}) {
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const sY = svc === 'n' ? y1 : y0, sg = svc === 'n' ? -1 : 1;
    const rx0 = x1 - 2743, rIn = sY + sg * 2438;
    wall(N, [[rx0, sY], [rx0, rIn], [x1, rIn]], 3048, 0, false, C.int);
    const fy = svc === 'n' ? y0 : y1;
    hatch('structure', o.fc, vface(x0, fy, x1, fy, 2900, H), o.facade, o.facade === 'brick' ? 300 : 350, o.facade === 'lines' ? 90 : 0, {building: N, part: 'street facade'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 900), 'gradient', 300, 0, {building: N, part: 'wall base shadow'}, C.int);
    sym('structure', C.sign, 'sign', P(x0 + 2000, y0 - 1200), 0, {text: N});
    const cz = o.ceil || 3353;
    if (!o.noCeil) hatch('structure', 7, rect(x0 + 150, y0 + 150, x1 - 150, y1 - 150, cz), 'cross', 1219, 0, {building: N, part: 'ceiling grid, 2 by 4 lay in tile', checks: [['ceiling_height', cz]]});
    const bz = o.beam || 3962;
    for (let by = y0 + 4500; by < y1 - 1500; by += 4500) line('structure', C.struct, [P(x0, by, bz), P(x1, by, bz)], {building: N, part: 'steel beam', checks: [['beam_height', bz]]});
    door(N, x0 + 3950, y0, 'x', 914, 'front door', -1);
    door(N, rx0, svc === 'n' ? y1 - 1500 : y0 + 600, 'y', 864, 'restroom door', -1);
    for (let ly = y0 + 2500; ly < y1 - 1800; ly += 3600) for (let lx = x0 + 2286; lx < rx0 - 600; lx += 4572) sym('electrical', C.elec, 'light', P(lx, ly, o.lightZ || cz), 0, {part: 'ceiling light'});
    sym('electrical', C.elec, 'light', P(x1 - 1370, sY + sg * 1200, 2743), 0, {part: 'restroom light'});
    for (let oy2 = y0 + 2600; oy2 < y1 - 3000; oy2 += 3600) { sym('electrical', C.elec, 'outlet', P(x0 + 150, oy2, 457), 0, {checks: [['outlet_height', 457]]}); sym('electrical', C.elec, 'outlet', P(x1 - 150, oy2 - 600, 457), 0, {checks: [['outlet_height', 457]]}); }
    sym('electrical', C.elec, 'switch', P(x0 + 4950, y0 + 150, 1219), 0, {part: 'entry switch'});
    const pY = sY + sg * 800;
    line('electrical', C.elec, rect(x0 + 200, Math.min(pY, pY + sg * 800), x0 + 500, Math.max(pY, pY + sg * 800), 1676), {building: N, part: '200 A panel'}, closed);
    line('interior', C.int, circ(x1 - 1370, sY + sg * 1800, 150, 2743, 6), {building: N, part: 'restroom exhaust fan', anim: {type: 'spin', rpm: 30}}, closed);
    line('interior', C.int, circ(x1 - 700, sY + sg * 600, 260, 432, 8), {building: N, part: 'water closet'}, closed);
    line('interior', C.int, rect(x1 - 2400, Math.min(sY + sg * 150, sY + sg * 600), x1 - 1800, Math.max(sY + sg * 150, sY + sg * 600), 864), {building: N, part: 'wall hung lavatory', checks: [['counter_height', 864]]}, closed);
    line('interior', C.int, [P(x1 - 2400, sY + sg * 120, 1000), P(x1 - 1800, sY + sg * 120, 1000), P(x1 - 1800, sY + sg * 120, 1700), P(x1 - 2400, sY + sg * 120, 1700)], {building: N, part: 'restroom mirror'}, closed);
    line('interior', C.int, [P(x1 - 120, sY + sg * 1500, 860), P(x1 - 120, sY + sg * 400, 860)], {building: N, part: 'grab bar'});
    if (o.pos) {
      const ky = y0 + 2600;
      line('interior', C.brick, [P(x0 + 600, ky, 1067), P(x0 + 3600, ky, 1067)], {building: N, part: 'sales counter', checks: [['counter_height', 1067]]});
      line('interior', C.int, [P(x0 + 1500, ky, 1067), P(x0 + 1500, ky + 150, 1450)], {building: N, part: 'pos terminal'});
      line('interior', C.int, rect(x0 + 1850, ky + 80, x0 + 2150, ky + 330, 1100), {building: N, part: 'receipt printer'}, closed);
      line('interior', C.int, rect(x0 + 900, ky + 60, x0 + 1300, ky + 420, 1000), {building: N, part: 'cash drawer'}, closed);
      line('interior', C.int, rect(x0 + 2800, ky - 180, x0 + 3100, ky, 1200), {building: N, part: 'card reader on a swivel'}, closed);
    }
    const px = poles.reduce((p, c) => Math.abs(c - (x0 + 350)) < Math.abs(p - (x0 + 350)) ? c : p);
    const outY = sY - sg * 300;
    run('electrical', C.elec, [P(px, yAB + 4500, 6400), P(x0 + 350, outY, 4000), P(x0 + 350, outY, 1676), P(x0 + 350, sY + sg * 1200, 1676)], {building: N, part: 'service drop and meter'});
    run('plumbing', C.plumb, [P(x1 - 900, alY, -1200), P(x1 - 900, sY + sg * 600, -900), P(x1 - 900, sY + sg * 600, 300)], {building: N, part: 'water service'});
    run('plumbing', C.sewer, [P(x1 - 700, sY + sg * 1000, -300), P(x1 - 700, alY + 900, -1800)], {building: N, part: 'building drain to the alley sewer'});
    line('plumbing', C.plumb, [P(x1 - 900, sY + sg * 600, 300), P(x1 - 900, sY + sg * 600, 1500)], {building: N, part: '30 gallon water heater'});
  }
  const I = (N, label, col, x0, y0, x1, y1, z, o = {}) => line(o.disc || 'interior', col, rect(x0, y0, x1, y1, z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), Object.assign({closed: true}, o.color2 !== undefined ? {color2: o.color2} : {}));
  const IC = (N, label, col, x, y, r, z, o = {}) => line(o.disc || 'interior', col, circ(x, y, r, z, o.n || 10), Object.assign({building: N, part: label}, o.anim ? {anim: o.anim} : {}), {closed: true});

  // front walk along Chuparosa Street, storefronts close to the street
  const FX0 = a + 16500;
  hatch('paving', C.curb, rect(LX1 + 300, oy + PL + 200, b - 300, oy + PL + 1900, 152), 'lines', 600, 90, {part: 'storefront walk along Chuparosa Street', checks: [['sidewalk_width', 1700]]});
  hatch('paving', C.curb, rect(LX1 - 1800, oy + PL + 1900, LX1 + 300, yAB - 1200, 152), 'lines', 600, 0, {part: 'walk from the side lot to the shops', checks: [['sidewalk_width', 2100]]});

  // ---- Spiny Lizard Torta Shop
  {
    const N = 'Spiny Lizard Torta Shop', x0 = FX0, x1 = x0 + 12192, y0 = oy + PL + 2400, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hip(N, x0, y0, x1, y1, 4672, 6, C.brick);
    hatch('structure', C.yellow, vface(x0 + 5200, y0, x0 + 10500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front window painted with a torta ahogada'});
    I(N, 'sandwich line with bolillo bins', C.int, x0 + 4800, y0 + 8000, x0 + 10200, y0 + 8700, 914, {check: ['counter_height', 914]});
    I(N, 'flat top for milanesa and ham', C.struct, x0 + 4800, y0 + 10600, x0 + 7200, y0 + 11400, 914);
    I(N, 'hood over the flat top', C.struct, x0 + 4600, y0 + 10600, x0 + 7400, y0 + 11700, 2100);
    I(N, 'panini press for tortas', C.struct, x0 + 7800, y0 + 10700, x0 + 8600, y0 + 11300, 1000);
    I(N, 'kitchen printer on the sandwich line', C.int, x0 + 5200, y0 + 8150, x0 + 5500, y0 + 8400, 1150);
    I(N, 'cooler of pickled jalapenos and carrots', C.car2, x0 + 9000, y0 + 10600, x0 + 10200, y0 + 11400, 1000);
    I(N, 'menu board of tortas by name', C.sign, x0 + 4800, y0 + 12400, x0 + 9000, y0 + 12550, 2300);
    for (let t = 0; t < 3; t++) { const tx = x0 + 5000 + t * 2200; I(N, 'formica table ' + (t + 1), C.int, tx, y0 + 4200, tx + 900, y0 + 5100, 760); }
    I(N, 'glass case of conchas next to the register', C.yellow, x0 + 600, y0 + 4200, x0 + 2200, y0 + 4800, 1100, {check: ['counter_height', 1100]});
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a cubana torta to go', 0);
    act(x0 + 2000, y0 + 3500, 'standing', 'tapping an order into the register', Math.PI);
    act(x0 + 6000, y0 + 9700, 'standing', 'slicing bolillos for the line', 0);
    act(x0 + 5450, y0 + 3600, 'sitting', 'unwrapping a torta at a formica table', 0);
    act(x0 + 7650, y0 + 3600, 'sitting', 'splitting a torta with a coworker', 0);
  }
  // ---- Lechuguilla Gate Valve Supply
  {
    const N = 'Lechuguilla Gate Valve Supply', x0 = FX0 + 12192 + 1524, x1 = x0 + 18288, y0 = oy + PL + 4200, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5486, 'n', {facade: 'lines', fc: C.plumb, pos: true});
    shed(N, x0, y0, x1, y1, 5586, rc, rc2, true);
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 11000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass onto Chuparosa Street'});
    for (let r = 0; r < 3; r++) { const rx = x0 + 6000 + r * 2600; I(N, 'pallet rack of gate valves and alfalfa valves, bay ' + (r + 1), C.plumb, rx, y0 + 5000, rx + 1100, y0 + 13000, 2000, {check: ['shelf_height', 2000]}); }
    I(N, 'cut away display of a 10 inch alfalfa valve', C.yellow, x0 + 14000, y0 + 4600, x0 + 15400, y0 + 5600, 1000);
    I(N, 'bin wall of valve handles and stems', C.struct, x0 + 600, y0 + 5400, x0 + 4400, y0 + 5800, 1800, {check: ['shelf_height', 1800]});
    I(N, 'pressure test bench with a water manifold', C.int, x0 + 600, y0 + 8000, x0 + 3000, y0 + 8700, 940, {check: ['counter_height', 940]});
    for (let j = 0; j < 3; j++) IC(N, 'stack of 12 inch pvc risers ' + (j + 1), C.plumb, x0 + 14600 + j * 1100, y0 + 12500, 330, 1200 + j * 10, {n: 10});
    I(N, 'quote terminal for irrigation district orders', C.int, x0 + 3100, y0 + 2750, x0 + 3500, y0 + 3050, 1400);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for two alfalfa valve lids', 0);
    act(x0 + 2000, y0 + 3500, 'standing', 'looking up a valve part number', Math.PI);
    act(x0 + 1800, y0 + 9300, 'standing', 'pressure testing a rebuilt gate valve', Math.PI);
    act(x0 + 7650, y0 + 9000, 'standing', 'pulling a valve box off the rack', Math.PI / 2);
  }
  // ---- Ground Squirrel Cab and Seat Shop, with a flat upstairs over it
  {
    const N = 'Ground Squirrel Cab and Seat Shop', x0 = FX0 + 12192 + 1524 + 18288 + 1524, x1 = x0 + 9144, y0 = oy + PL + 3000, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4267, 'n', {facade: 'brick', fc: C.car2, pos: true, ceil: 3048, beam: 3658});
    const z = 4267, ux0 = x0 + 900, ux1 = x1 - 900, uy0 = y0 + 900, uy1 = y0 + 9400, uh = z + 3100;
    gravel(N, x0, y0, x1, y1, z + 100, 7, C.struct);
    line('structure', C.struct, [P(ux0, uy0, z), P(ux1, uy0, z), P(ux1, uy1, z), P(ux0, uy1, z)], {wall: true, h: uh, zmin: z, building: N, units: 1, part: 'upstairs apartment over the seat shop'}, closed);
    hatch('structure', rc2, vface(ux0, uy0, ux1, uy0, z, uh), 'lines', 300, 90, {building: N, part: 'upstairs board siding, south face'}, rc);
    for (let wx = ux0 + 1000; wx + 1200 < ux1 - 500; wx += 2700) line('structure', 0, [P(wx, uy0 - 20, z + 900), P(wx + 1200, uy0 - 20, z + 900), P(wx + 1200, uy0 - 20, z + 2300), P(wx, uy0 - 20, z + 2300)], {building: N, part: 'upstairs window'}, closed);
    gableX(N, ux0, uy0, ux1, uy1, uh + 100, rc, rc2);
    I(N, 'sewing machine table for seat covers', C.int, x0 + 600, y0 + 8000, x0 + 2400, y0 + 8700, 760);
    I(N, 'tractor seat on a padded stand', C.yellow, x0 + 4800, y0 + 9000, x0 + 5600, y0 + 9800, 900);
    I(N, 'roll rack of black marine vinyl', C.struct, x0 + 600, y0 + 11000, x0 + 1600, y0 + 13400, 1500);
    I(N, 'rack of cab glass for older tractors', C.car2, x0 + 4600, y0 + 13000, x0 + 5800, y0 + 15200, 1700);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a recovered tractor seat', 0);
    act(x0 + 1500, y0 + 9400, 'standing', 'stitching a seam on a seat cover', Math.PI);
    person(P(x0 + 3300, uy0 - 450, z), 0, 'standing', 'watering geraniums on the roof deck');
  }
  // ---- Ratany Hill Alfalfa Seed Barn (back row)
  const yB0 = yAB + 8500;
  {
    const N = 'Ratany Hill Alfalfa Seed Barn', x0 = a + 2000, x1 = x0 + 27432, y0 = yB0, y1 = yB0 + 16764;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.struct, noCeil: true, beam: 5486, lightZ: 5200});
    barrel(N, x0, y0, x1, y1, 7415, rc, rc2);
    line('structure', C.struct, [P(x0 + 11000, y0), P(x0 + 11000, y0, 4877), P(x0 + 16486, y0, 4877), P(x0 + 16486, y0)], {building: N, part: 'roll up door for seed trucks'});
    for (let t = 0; t < 6; t++) I(N, 'bulk bag of cleaned alfalfa seed ' + (t + 1), C.veg2, x0 + 1500 + (t % 3) * 2400, y0 + 7000 + Math.floor(t / 3) * 2600, x0 + 3300 + (t % 3) * 2400, y0 + 8800 + Math.floor(t / 3) * 2600, 1600);
    I(N, 'seed cleaner with a scalper screen', C.struct, x0 + 20000, y0 + 9600, x0 + 23400, y0 + 12000, 2400);
    IC(N, 'aspirator fan on the seed cleaner', C.struct, x0 + 24600, y0 + 10600, 500, 1600, {n: 12, anim: {type: 'spin', rpm: 35}});
    I(N, 'seed treater with a blue coating drum', C.plumb, x0 + 20000, y0 + 4200, x0 + 22400, y0 + 6000, 1500);
    I(N, 'platform scale for 50 pound seed bags', C.int, x0 + 15000, y0 + 4000, x0 + 16200, y0 + 5000, 900, {check: ['counter_height', 900]});
    I(N, 'germination test trays on a cart', C.veg2, x0 + 13000, y0 + 11500, x0 + 14600, y0 + 12300, 1000);
    act(x0 + 5200, y0 + 6000, 'standing', 'tying off a bulk bag of alfalfa seed', 0);
    act(x0 + 21700, y0 + 8800, 'standing', 'checking the scalper screen for stems', Math.PI);
    act(x0 + 15600, y0 + 5800, 'standing', 'weighing a seed bag on the platform scale', Math.PI);
    act(x0 + 13800, y0 + 2000, 'standing', 'backing a seed truck into the bay', Math.PI);
  }
  // ---- Ratany Hill Well House
  {
    const N = 'Ratany Hill Well House', x0 = a + 33000, x1 = x0 + 4572, y0 = yB0 + 2000, y1 = y0 + 4572;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 2743, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 2743), 'lines', 250, 0, {building: N, part: 'corrugated metal siding'}, C.brick);
    gableX(N, x0, y0, x1, y1, 2843, rc, rc2);
    door(N, x0 + 600, y0, 'x', 914, 'well house door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2438), 'lines', 600, 0, {building: N, part: 'plywood ceiling', checks: [['ceiling_height', 2438]]});
    IC(N, '8 inch well casing', C.struct, x0 + 3200, y0 + 3200, 110, 460, {disc: 'plumbing'});
    line('plumbing', C.plumb, [P(x0 + 3200, y0 + 3200, 460), P(x0 + 3200, y0 + 3200, -60960)], {building: N, part: 'drop pipe to the pump at 200 ft'});
    IC(N, 'bladder pressure tank', C.plumb, x0 + 1200, y0 + 3300, 300, 1100, {disc: 'plumbing'});
    line('electrical', C.elec, rect(x1 - 250, y0 + 1300, x1 - 120, y0 + 1900, 1500), {building: N, part: 'well pump starter'}, closed);
    sym('electrical', C.elec, 'outlet', P(x0 + 120, y0 + 2000, 457), 0, {building: N, part: 'well house outlet', checks: [['outlet_height', 457]]});
    run('plumbing', C.plumb, [P(x0 + 3200, y0 + 3400, 300), P(x0 + 3200, y1 + 1500, -900), P(x0 - 8000, y1 + 1500, -900)], {building: N, part: 'well line to the seed barn'});
    run('electrical', C.elec, [P(poles[2], yAB + 4500, 6400), P(x1 - 180, y0 - 300, 3000), P(x1 - 180, y0 - 300, 1500), P(x1 - 180, y0 + 1300, 1500)], {building: N, part: 'well pump circuit'});
    act(x0 + 2300, y0 - 1200, 'standing', 'reading the well meter by the door', Math.PI);
  }
  // ---- Ratany Hill Scale House and the truck scale
  {
    const N = 'Ratany Hill Scale House', x0 = a + 44000, x1 = x0 + 6096, y0 = yB0 + 6000, y1 = y0 + 4877;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3048, -610, true);
    hatch('structure', rc2, vface(x1, y0, x1, y1, 0, 3048), 'lines', 300, 0, {building: N, part: 'east wall stucco'}, C.struct);
    shed(N, x0, y0, x1, y1, 3148, rc, rc2, false);
    door(N, x0 + 800, y0, 'x', 914, 'scale house door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2591), 'cross', 1219, 0, {building: N, part: 'ceiling grid, 2 by 4 lay in tile', checks: [['ceiling_height', 2591]]});
    I(N, 'weigh counter at the scale window', C.int, x1 - 700, y0 + 800, x1 - 150, y1 - 800, 1067, {check: ['counter_height', 1067]});
    I(N, 'scale indicator head', C.yellow, x1 - 600, y0 + 2000, x1 - 300, y0 + 2400, 1350, {anim: {type: 'blink', period: 3, duty: 0.8}});
    I(N, 'weight ticket printer', C.int, x1 - 600, y0 + 2800, x1 - 300, y0 + 3100, 1150);
    I(N, 'ticket book and card reader', C.int, x1 - 600, y0 + 1300, x1 - 300, y0 + 1600, 1100);
    I(N, 'desk with the seed lot ledger', C.int, x0 + 500, y1 - 1300, x0 + 2300, y1 - 500, 760);
    sym('electrical', C.elec, 'outlet', P(x1 - 150, y0 + 3600, 1067), 0, {building: N, part: 'counter outlet for the indicator', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'light', P(x0 + 3000, y0 + 2400, 2591), 0, {building: N, part: 'scale house light'});
    run('electrical', C.elec, [P(poles[3], yAB + 4500, 6400), P(x0 + 300, y0 - 300, 3000), P(x0 + 300, y0 - 300, 1500), P(x0 + 300, y0 + 900, 1500)], {building: N, part: 'scale house service'});
    act(x1 - 1300, y0 + 2600, 'standing', 'printing a weight ticket for a hay truck', -Math.PI / 2);
    const sx0 = a + 51500, sx1 = sx0 + 3353, sy0 = yB0 - 1500, sy1 = sy0 + 21336;
    line('paving', C.struct, rect(sx0, sy0, sx1, sy1, 152), {part: 'truck scale deck, 70 ft'}, closed);
    hatch('paving', C.struct, rect(sx0 + 100, sy0 + 100, sx1 - 100, sy1 - 100, 152), 'cross', 900, 0, {part: 'truck scale steel deck plate'}, C.curb);
    sym('vehicle', C.yellow, 'truck', P((sx0 + sx1) / 2, sy0 + 9000, 152), 0, {part: 'hay truck stopped on the scale'});
    act(sx0 - 1600, sy0 + 13000, 'standing', 'waving the hay truck forward an inch', Math.PI / 2);
  }
  // ---- yard, plantings and life on 8,4
  {
    const gy0 = yB0 + 18000, gy1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 2000, gy0, a + 30000, gy1), 'dots', 1200, 0, {part: 'gravel seed truck apron'}, C.struct);
    line('lot', C.struct, rounded(a + 34000, yB0 + 9000, a + 40000, yB0 + 13500, 700, 3000, 4), {part: 'shade ramada for the scale line drivers'}, closed);
    sym('activity', C.int, 'bench', P(a + 37000, yB0 + 11200), 0, {part: 'bench under the ramada'});
    act(a + 37000, yB0 + 12200, 'sitting', 'waiting on a weight ticket in the shade', Math.PI);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(FX0 + 3000 + j * 11000, oy + PL - 1200, 700, 14, j + 191), {part: ['ratany bed', 'desert marigold bed', 'chuparosa bed', 'bladderpod bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 3000 + j * 13500, oy + S - PL + 1200, 3, 6.8 + j * 0.3);
    for (let j = 0; j < 3; j++) tree(b + 1500, oy + 40000 + j * 9000, 4, 7.1 + j * 0.4);
    line('vegetation', C.veg2, wavy(b - 2500, yB0, b - 2500, oy + S - PL - 800, 700, 16, 61), {part: 'rock swale planted with ratany'});
    line('vegetation', C.veg2, wavy(a + 300, oy + PL + 300, a + 300, yAB - 900, 500, 14, 67), {part: 'gravel strip of bursage along the lot edge'});
    for (let i = 0; i < 3; i++) sym('street', C.struct, 'light', P(a + 6300, oy + PL + 4000 + i * 9000, 4200), 0, {part: 'lot light', anim: i === 1 ? {type: 'blink', period: 7, duty: 0.9} : undefined});
    const wx = LX1 - 900;
    act(wx, oy + PL + 2600, 'walking', 'carrying a sack of tortas to the truck', 0, {type: 'path', speed: 1200, pts: [P(wx, oy + PL + 2600), P(wx, yAB - 1500), P(wx - 600, yAB - 1500), P(wx - 600, oy + PL + 2600), P(wx, oy + PL + 2600)]});
    sym('activity', C.person, 'cyclist', P(a + 9700, oy + PL + 3000), 0, {activity: 'pedaling in for a torta after school', anim: {type: 'path', speed: 3500, pts: [P(a + 9700, oy + PL + 3000), P(a + 9700, yAB - 2500), P(a + 11200, yAB - 2500), P(a + 11200, oy + PL + 3000), P(a + 9700, oy + PL + 3000)]}});
    act(a + 64000 - 9144, yAB + 1500, 'standing', 'unloading vinyl rolls at the back door', Math.PI);
  }
  trafficLoop(8, 4, true, C.car2, 'car', 9000);
  trafficLoop(8, 4, false, C.yellow, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 0,0 corner market and bungalows deepen
  D('0:0', 'Two Coyote Corner Market', [13716, 25908, 32004, 34442], 3048, [
    ['w', 'rack of road atlases and county maps', C.int, 600, 900, 1600],
    ['w', 'shelf of canned menudo and hominy', C.brick, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['o', 'outlet for the tamale steamer', 1067],
    ['c', 'ceiling speaker for the radio', C.int, 150, 60, {disc: 'interior'}],
    ['f', 'crate of watermelons by the door', C.veg2, 900, 900, 600],
    ['f', 'hand truck of soda cases', C.int, 500, 400, 1200],
    ['p', 'standing', 'buying a road atlas for the drive north'],
    ['p', 'standing', 'thumping a watermelon in the crate'],
  ]);
  D('0:0', 'Cinder Block Bungalow', [45624, 17144, 51110, 26288], 2438, [
    ['w', 'framed quinceanera photo', C.yellow, 500, 1300, 1800],
    ['w', 'shelf of potted succulents', C.veg2, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['p', 'standing', 'misting the succulents on the shelf'],
  ]);
  D('0:0', 'Cinder Block Bungalow', [51110, 17144, 57816, 26288], 2438, [
    ['o', 'outlet for the window air conditioner', 1219],
    ['w', 'coat hooks with a work vest', C.struct, 600, 1500, 1800],
    ['p', 'standing', 'hanging a work vest on the hook'],
  ]);
  D('0:0', 'Blue Door Bungalow', [15144, 47624, 20630, 56768], 2438, [
    ['w', 'quilt hung on a wall rod', C.car, 1500, 900, 2100],
    ['o', 'outlet for the sewing lamp', 1067],
    ['f', 'dog crate by the wall', C.struct, 900, 600, 650],
    ['p', 'standing', 'pinning a quilt square on the wall rod'],
  ]);
  D('0:0', 'Blue Door Bungalow', [20630, 47624, 27336, 56768], 2438, [
    ['w', 'shelf of school trophies', C.yellow, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['p', 'standing', 'dusting a softball trophy'],
  ]);

  // ================================================================= 2,2 Cholla Street shops deepen
  const SH = (x0) => [x0, 168859, x0 + 9144, 181051];
  D('2:2', 'Ocotillo Taqueria', SH(170688), 3353, [
    ['w', 'chalkboard of the weekly pozole special', C.sign, 900, 1300, 2000],
    ['w', 'shelf of chiltepin jars for sale', C.car, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['f', 'stack of high chairs', C.int, 450, 450, 750],
    ['p', 'standing', 'reading the pozole special on the chalkboard'],
    ['p', 'standing', 'buying a jar of chiltepin'],
  ]);
  D('2:2', 'Brass Tack Hardware', SH(179832), 3353, [
    ['w', 'rack of garden hose nozzles', C.yellow, 900, 1200, 1700],
    ['w', 'shelf of swamp cooler pumps', C.plumb, 900, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['f', 'bin of rebar tie wire', C.struct, 500, 500, 700],
    ['p', 'standing', 'picking out a swamp cooler pump'],
    ['p', 'standing', 'testing a hose nozzle spray pattern'],
  ]);
  D('2:2', 'Rattlesnake Ridge Tractor Repair', SH(188976), 3353, [
    ['w', 'chart of tractor fluid capacities', C.sign, 900, 1300, 1900],
    ['w', 'shelf of pto shear bolts', C.struct, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['f', 'mechanic creeper on the floor', C.int, 1000, 450, 120],
    ['p', 'standing', 'looking up a fluid capacity on the chart'],
    ['p', 'standing', 'sorting shear bolts by size'],
  ]);
  D('2:2', 'Two Bit Barber Shop', SH(198120), 3353, [
    ['w', 'framed barber license by the mirror', C.struct, 400, 1400, 1800],
    ['f', 'coat tree by the waiting chairs', C.struct, 0, 0, 1700, {r: 250, n: 8}],
    ['p', 'standing', 'hanging a cap on the coat tree'],
    ['p', 'standing', 'paying with a card at the tablet'],
  ]);
  D('2:2', 'Coin and Suds Laundromat', SH(207264), 3353, [
    ['w', 'wall clock over the dryers', C.struct, 400, 2000, 2400],
    ['w', 'shelf of bleach and stain spray for sale', C.plumb, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['f', 'rolling hanger cart', C.int, 700, 500, 1600],
    ['p', 'standing', 'hanging shirts on the rolling hanger cart'],
    ['p', 'standing', 'buying a stain spray off the shelf'],
  ]);
  D('2:2', 'Static Line Electronics Repair', SH(216408), 3353, [
    ['w', 'rack of used pos terminals for sale', C.int, 1200, 1000, 1600, {check: ['shelf_height', 1600]}],
    ['w', 'poster of capacitor color codes', C.sign, 600, 1300, 1900],
    ['f', 'esd cart of parts trays', C.int, 600, 450, 900],
    ['p', 'standing', 'pricing a used pos terminal'],
    ['p', 'standing', 'pulling a parts tray off the esd cart'],
  ]);

  // ================================================================= 3,1 Pecan Hollow farm deepen
  D('3:1', 'Pecan Hollow Equipment Barn', [266888, 132352, 279080, 144544], 5000, [
    ['w', 'rack of irrigation shovels', C.struct, 1200, 1200, 1800],
    ['w', 'shelf of spare sprinkler heads', C.plumb, 900, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the drop light, barn', 1067],
    ['f', 'pecan shaker head on a stand', C.yellow, 1500, 1200, 1400],
    ['f', 'folded pecan harvest tarps on a pallet', C.car2, 1200, 1000, 400],
    ['p', 'standing', 'folding a pecan harvest tarp'],
    ['p', 'standing', 'greasing the shaker head pads'],
  ]);
  D('3:1', 'Pecan Hollow Equipment Barn', [279080, 132352, 285176, 144544], 5000, [
    ['w', 'board of tractor service hours', C.sign, 900, 1300, 1900],
    ['f', 'bucket of hitch pins and clips', C.struct, 0, 0, 400, {r: 200}],
    ['p', 'standing', 'writing service hours on the board'],
  ]);
  D('3:1', 'Pecan Hollow Farmhouse', [249888, 136852, 255374, 142948], 2438, [
    ['w', 'shelf of mason jars of pecan butter', C.brick, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['p', 'standing', 'labeling jars of pecan butter'],
  ]);
  D('3:1', 'Pecan Hollow Farmhouse', [255374, 136852, 262080, 141424], 2438, [
    ['w', 'framed photo of the first pecan harvest', C.struct, 600, 1400, 1800],
    ['o', 'outlet for the nightlight, farmhouse', 305],
    ['p', 'standing', 'straightening a framed harvest photo'],
  ]);
  D('3:1', 'Pecan Hollow Pump House', [290888, 138352, 294546, 141400], 2438, [
    ['w', 'chart of nitrogen injection rates', C.sign, 500, 1200, 1700],
  ]);
  D('3:1', 'Pecan Hollow Chicken Coop', [296888, 142352, 300546, 144790], 2438, [
    ['w', 'calendar of daily egg counts', C.sign, 400, 1200, 1700],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
