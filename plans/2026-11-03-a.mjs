// Agent Orange 2026-11-03 a: claim block 5,4 and build the Chuckwalla corner (burrito window, seed and feed,
// well service, hay press barn, pecan hulling shed), then deepen 0,0 market and bungalows, 2,2 Cholla row and 3,1 Pecan Hollow.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 311103; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 5,4
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, VSTREET, HSTREET} = k;
  HSTREET[5] = HSTREET[5] || 'Desert Holly Street';
  VSTREET[6] = VSTREET[6] || 'Chuckwalla Avenue';
  claim(5, 4);
  streets(5, 4, {s: true, w: true, n: true, e: true});
  const ox = 5 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Chuckwalla corner shops');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Chuckwalla hay and pecan yard');

  // front parking along Chuparosa Street
  const yA = oy + 26000, yAB = yA + 14000;
  const stallY = oy + PL + 2000, aisleY = yA - 6700;
  hatch('paving', C.curb, rect(a, aisleY, b, yA - 1800), 'dots', 1100, 0, {part: 'front drive aisle'}, C.struct);
  hatch('paving', C.curb, rect(a + 3048, yA - 1500, b - 3048, yA - 100, 152), 'lines', 600, 90, {part: 'front walk along the shops', checks: [['sidewalk_width', 1524]]});
  const dx0 = a + 24000, dx1 = dx0 + 7316;
  hatch('paving', C.curb, rect(dx0, oy + CURB, dx1, aisleY), 'dots', 1000, 0, {part: 'driveway off Chuparosa Street'}, C.struct);
  line('paving', C.white, [P(dx0, oy + CURB), P(dx0, aisleY)], {part: 'driveway edge, west'});
  line('paving', C.white, [P(dx1, oy + CURB), P(dx1, aisleY)], {part: 'driveway edge, east'});
  let sn = 0;
  for (let sx = a + 1500; sx + 2743 <= b - 1000; sx += 2743) {
    if (sx + 2743 > dx0 - 300 && sx < dx1 + 300) continue;
    sn++;
    line('paving', C.white, [P(sx, stallY), P(sx, stallY + 5486), P(sx + 2743, stallY + 5486), P(sx + 2743, stallY)], {part: 'front stall ' + sn, checks: [['stall_width', 2743], ['stall_depth', 5486]]});
    if (sn % 3 !== 2 && sn > 1) sym('vehicle', [C.car, C.car2, C.yellow, C.struct][sn % 4], sn % 4 === 1 ? 'truck' : 'car', P(sx + 1371, stallY + 2743), 0, {part: sn % 4 === 1 ? 'ranch pickup' : 'parked car'});
  }
  line('paving', C.car2, rect(a + 1500, stallY, a + 1500 + 3658, stallY + 5486), {part: 'accessible stall and aisle', checks: [['stall_width', 3658], ['stall_depth', 5486]]}, closed);
  hatch('paving', C.car2, rect(a + 1500 + 2438, stallY, a + 1500 + 3658, stallY + 5486), 'lines', 300, 45, {part: 'accessible access aisle striping'});

  // rear service alley
  const alY = yAB + 3048;
  hatch('paving', C.curb, rect(a, yAB + 600, b, yAB + 6700), 'dots', 900, 0, {part: 'rear service alley'}, C.struct);
  const poles = [];
  for (let i = 0; i < 5; i++) { const px = a + 3500 + i * 13716; poles.push(px); sym('electrical', C.struct, 'pole', P(px, yAB + 4500), 0, {part: 'alley pole line'}); }
  line('electrical', C.elec, poles.map(px => P(px, yAB + 4500, 8230)), {part: 'alley primary'});
  line('electrical', C.elec, poles.map(px => P(px, yAB + 4500, 6400)), {part: 'alley secondary'});
  line('plumbing', C.plumb, [P(a, alY, -1200), P(b, alY, -1200)], {part: 'alley water main'});
  line('plumbing', C.sewer, [P(b, alY + 900, -1800), P(a, alY + 900, -2400)], {part: 'alley sewer main'});

  // svc is the side that faces the alley: 'n' for the front row, 's' for the back row.
  function shell(N, x0, x1, y0, y1, H, svc, o = {}) {
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const sY = svc === 'n' ? y1 : y0, sg = svc === 'n' ? -1 : 1; // service wall and inward sign
    const rx0 = x1 - 2743, rIn = sY + sg * 2438;
    wall(N, [[rx0, sY], [rx0, rIn], [x1, rIn]], 3048, 0, false, C.int);
    hatch('structure', o.fc, vface(x0, y0, x1, y0, 2900, H), o.facade, o.facade === 'brick' ? 300 : 350, o.facade === 'lines' ? 90 : 0, {building: N, part: 'south facade'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 900), 'gradient', 300, 0, {building: N, part: 'wall base shadow'}, C.int);
    sym('structure', C.sign, 'sign', P(x0 + 2000, y0 - 1200), 0, {text: N});
    line('structure', C.roof, [...arc(x0 + 900, y0 + 900, 900, 180, 270, 4, H), ...arc(x1 - 900, y0 + 900, 900, 270, 360, 4, H)], {building: N, part: 'parapet cap'});
    const cz = o.ceil || 3353;
    if (!o.noCeil) hatch('structure', C.int, rect(x0 + 150, y0 + 150, x1 - 150, y1 - 150, cz), 'cross', 650, 0, {building: N, part: 'ceiling grid', checks: [['ceiling_height', cz]]});
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
    line('electrical', C.int, circ(x1 - 1370, sY + sg * 1800, 150, 2743, 6), {building: N, part: 'restroom exhaust fan', anim: {type: 'spin', rpm: 30}}, closed);
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


  // ---- Greasewood Gap Burrito Window
  {
    const N = 'Greasewood Gap Burrito Window', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.yellow, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front windows with a hand painted burrito menu'});
    for (let s = 0; s < 5; s++) IC(N, 'red vinyl counter stool ' + (s + 1), C.brick, x0 + 5200 + s * 900, y0 + 5600, 200, 760, {n: 8});
    I(N, 'order counter with a stainless edge', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'flat top griddle for carne asada', C.struct, x0 + 5200, y0 + 9800, x0 + 7000, y0 + 10600, 914, {check: ['counter_height', 914]});
    I(N, 'tortilla warmer drawer stack', C.yellow, x0 + 7200, y0 + 9800, x0 + 7800, y0 + 10600, 1200);
    I(N, 'hood over the griddle', C.struct, x0 + 5000, y0 + 9800, x0 + 8000, y0 + 10900, 2100);
    I(N, 'burrito rolling station with rice and beans wells', C.car2, x0 + 8200, y0 + 9800, x0 + 9800, y0 + 10500, 914);
    I(N, 'kitchen printer by the rolling station', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'ticket rail over the foil wrap table'});
    I(N, 'foil wrap table under a heat lamp', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'self serve salsa and radish bar', C.veg2, x0 + 10400, y0 + 6100, x0 + 11000, y0 + 6500, 1000);
    I(N, 'cooler of glass bottle sodas', C.car, x0 + 11200, y0 + 6000, x0 + 12400, y0 + 6600, 1800);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'tile top table by the window ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'case of flour tortillas on a dolly', C.int, x0 + 10400, y0 + 9800, x0 + 11200, y0 + 10600, 750);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for two machaca burritos by card', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'tearing the receipt off the printer', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'chopping carne asada on the griddle', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'eating a bean and cheese burrito', 0);
    act(x0 + 7400, y0 + 5100, 'sitting', 'reading the paper over breakfast', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'splitting a chile colorado plate', Math.PI);
  }
  // ---- Desert Spoon Seed and Feed
  {
    const N = 'Desert Spoon Seed and Feed', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.yellow, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'gondola of seed packets and garden tools, row ' + (r + 1), C.struct, rx, y0 + 5000, rx + 900, y0 + 10600, 1828, {check: ['shelf_height', 1828]}); }
    I(N, 'feed ticket terminal at the counter', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of 50 pound layer pellet sacks', C.yellow, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 900, {color2: C.struct});
    I(N, 'rack of hand trucks and feed scoops', C.struct, x0 + 15000, y0 + 7000, x0 + 16800, y0 + 7600, 1500);
    for (let j = 0; j < 3; j++) IC(N, 'galvanized seed bin with a scoop ' + (j + 1), C.struct, x0 + 2000 + j * 1500, y0 + 10500, 400, 900 + j * 10, {n: 10});
    I(N, 'wall of vegetable and wildflower seed packets', C.veg2, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1800, {check: ['shelf_height', 1800]});
    I(N, 'platform scale for bulk seed', C.int, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'brooder tank of chicks under a heat lamp', C.car, x0 + 3000, y0 + 7200, x0 + 4600, y0 + 7800, 600);
    I(N, 'pallet of salt and mineral blocks', C.int, x0 + 15000, y0 + 9000, x0 + 16200, y0 + 10200, 700);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a sack of chick starter', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'writing up a feed delivery ticket', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'weighing out a pound of bermuda seed', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'choosing squash seed for the fall', Math.PI / 2);
  }
  // ---- Cinder Cone Well Service
  {
    const N = 'Cinder Cone Well Service', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.plumb, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'shop window'});
    IC(N, 'submersible pump motor turning on the test stand', C.plumb, x0 + 5600, y0 + 8000, 300, 1050, {n: 12, anim: {type: 'spin', rpm: 60}});
    I(N, 'pump teardown bench', C.int, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 940, {check: ['counter_height', 940]});
    I(N, 'pressure tank on a test cradle', C.plumb, x0 + 3200, y0 + 9400, x0 + 4400, y0 + 10600, 1300);
    I(N, 'drawer cabinet of check valves and pitless adapters', C.car2, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1400, {check: ['shelf_height', 1400]});
    I(N, 'shelf of pressure switches and gauges', C.brick, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'rack of drop pipe sticks', C.struct, x0 + 600, y0 + 6400, x0 + 2600, y0 + 6900, 1200);
    I(N, 'reel of submersible pump cable', C.elec, x0 + 600, y0 + 4400, x0 + 1600, y0 + 5100, 1000);
    I(N, 'pump test stand frame', C.struct, x0 + 5300, y0 + 7700, x0 + 5900, y0 + 8300, 1000);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a new pressure switch', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'reading a well log from a ranch', Math.PI);
    act(x0 + 1600, y0 + 8500, 'standing', 'pulling the impellers off a pump', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'charging a pressure tank with air', 0);
  }
  // ---- Bighorn Wash Hay Press Barn (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Bighorn Wash Hay Press Barn', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.brick, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'open bay for hay trucks'});
    for (let t = 0; t < 6; t++) I(N, 'stack of pressed alfalfa bales ' + (t + 1), C.veg2, x0 + 1500 + (t % 3) * 2600, y0 + 6000 + Math.floor(t / 3) * 2200, x0 + 3700 + (t % 3) * 2600, y0 + 7600 + Math.floor(t / 3) * 2200, 1200 + (t % 2) * 400);
    I(N, 'hydraulic bale press', C.yellow, x0 + 17000, y0 + 7600, x0 + 19400, y0 + 9000, 1800);
    I(N, 'strapping bench for pressed bales', C.int, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 9300, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of export bale wrap', C.struct, x0 + 17000, y0 + 3600, x0 + 19400, y0 + 5400, 900);
    I(N, 'moisture meter and probe on a stand', C.elec, x0 + 21000, y0 + 4400, x0 + 22400, y0 + 5600, 1100);
    I(N, 'load board of hay truck pickups', C.sign, x0 + 12000, y1 - 400, x0 + 14500, y1 - 250, 2200);
    act(x0 + 4800, y0 + 5200, 'standing', 'probing a bale for moisture', 0);
    act(x0 + 22300, y0 + 9800, 'standing', 'strapping a pressed bale', Math.PI);
    act(x0 + 18200, y0 + 6000, 'standing', 'feeding a bale into the press', Math.PI);
    act(x0 + 13200, y0 + 2000, 'standing', 'waving a hay truck into the bay', Math.PI);
  }
  // ---- Whiptail Pecan Hulling Shed (back row)
  {
    const N = 'Whiptail Pecan Hulling Shed', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'lines', fc: C.yellow, noCeil: true, beam: 4572, lightZ: 4200});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up door to the drying yard'});
    I(N, 'picking table for in shell pecans', C.struct, x0 + 1200, y0 + 6200, x0 + 7000, y0 + 7000, 900);
    IC(N, 'pecan cracker drum turning', C.struct, x0 + 11100, y0 + 6500, 700, 1000, {n: 12, anim: {type: 'spin', rpm: 30}});
    I(N, 'shelling line belt with a lip', C.int, x0 + 600, y0 + 9200, x0 + 4200, y0 + 10000, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of in shell pecan sacks', C.brick, x0 + 600, y0 + 10400, x0 + 2000, y0 + 11400, 1200);
    I(N, 'walk in cold box for pecan halves', C.car2, x0 + 2600, y0 + 10400, x0 + 4000, y0 + 11400, 2100);
    I(N, 'bagging scale with a heat sealer', C.int, x0 + 5000, y0 + 8400, x0 + 5600, y0 + 8900, 1100);
    I(N, 'hull and shell bin for mulch', C.brick, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 900);
    act(x0 + 3000, y0 + 7600, 'standing', 'picking sticks out of the pecans', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'shoveling pecans into the cracker', Math.PI);
    act(x0 + 2400, y0 + 8600, 'standing', 'sorting halves on the shelling belt', 0);
    act(x0 + 5300, y0 + 9500, 'standing', 'sealing a bag of pecan halves', Math.PI);
  }
  // ---- yard, plantings and life on 5,4
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel hay truck yard'}, C.struct);
    sym('vehicle', C.brick, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'flatbed stacked with pressed hay'});
    act(a + 12500, yB0 - 3800, 'standing', 'throwing a tarp over the hay load', Math.PI / 2);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada over the pecan drying racks'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 71), {part: ['brittlebush bed', 'globe mallow bed', 'desert senna bed', 'chuparosa and penstemon bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 5.3 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 4.6 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 17), {part: 'gravel swale with desert broom'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a bag of burritos to the truck', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'rolling an old pressure tank to scrap', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'riding in for a sack of scratch grain', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(5, 4, true, C.car, 'car', 9000);
  trafficLoop(5, 4, false, C.struct, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 0,0 market and bungalows deepen
  D('0:0', 'Two Coyote Corner Market', [13716, 25908, 32004, 38100], 3048, [
    ['w', 'rack of beef jerky and sunflower seeds', C.brick, 900, 1000, 1700],
    ['w', 'shelf of motor oil funnels and gas cans', C.yellow, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'board of hunting and fishing license rules', C.sign, 900, 1400, 2000],
    ['w', 'hook strip of windshield sunshades', C.car2, 900, 1300, 1900],
    ['w', 'shelf of tortilla warmers and comales', C.int, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'framed photo of the store in 1962', C.struct, 600, 1500, 1900],
    ['w', 'clip strip of hot cheese puffs', C.brick, 300, 900, 1700],
    ['o', 'outlet for the hot dog roller', 1067],
    ['o', 'outlet for the open sign', 457],
    ['o', 'outlet for the floor scrubber', 406],
    ['c', 'ceiling speaker playing the radio', C.int, 150, 40],
    ['c', 'exit sign light', C.elec, 120, 200, glow(4)],
    ['f', 'stack of propane cylinder exchange cages', C.struct, 500, 400, 900],
    ['f', 'end cap of sports drinks', C.car2, 600, 500, 1200],
    ['f', 'pallet of charcoal bags', C.int, 500, 500, 600],
    ['p', 'standing', 'buying a phone card for a cousin'],
    ['p', 'standing', 'grabbing a breakfast burrito from the warmer'],
    ['p', 'standing', 'facing cans of soup on the shelf'],
    ['p', 'standing', 'reading the fishing rules on the board'],
    ['p', 'standing', 'counting out pennies for gum'],
    ['p', 'standing', 'restocking sports drinks on the end cap'],
  ]);
  D('0:0', 'Cinder Block Bungalow', [45624, 17144, 57816, 26288], 2438, [
    ['w', 'spice rack of chile powders', C.brick, 600, 1300, 1700],
    ['w', 'calendar from the tire shop', C.sign, 400, 1400, 1800],
    ['w', 'shelf of family photos', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'wall phone with a long cord', C.car, 200, 1300, 1500],
    ['w', 'thermostat for the swamp cooler', C.elec, 120, 1450, 1580, {disc: 'electrical'}],
    ['o', 'outlet for the rice cooker', 1067],
    ['o', 'outlet for the vacuum', 406],
    ['c', 'hallway ceiling light', C.elec, 150, 40],
    ['f', 'pet bed by the couch', C.car2, 450, 350, 200],
    ['f', 'cooler packed for a fishing trip', C.car, 350, 250, 450],
    ['p', 'standing', 'packing sandwiches into the cooler'],
    ['p', 'standing', 'calling the tire shop on the wall phone'],
    ['p', 'standing', 'dusting the family photos'],
  ]);
  D('0:0', 'Blue Door Bungalow', [15144, 47624, 27336, 56768], 2438, [
    ['w', 'chore chart on the fridge wall', C.sign, 500, 1100, 1500],
    ['w', 'shelf of board games', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'wall mirror by the front door', C.struct, 500, 1100, 1800],
    ['w', 'key rack with a dog leash', C.car, 300, 1400, 1550],
    ['o', 'outlet for the nightlight', 406],
    ['o', 'outlet for the toaster oven', 1067],
    ['c', 'bathroom exhaust fan', C.int, 150, 40, fan],
    ['f', 'backpack dropped by the door', C.car2, 200, 150, 450],
    ['f', 'floor cushion for game night', C.brick, 300, 300, 150],
    ['p', 'standing', 'checking off chores on the chart'],
    ['p', 'standing', 'clipping the leash on the dog'],
    ['p', 'standing', 'setting up a board game'],
  ]);

  // ================================================================= 2,2 Cholla Street row deepen
  D('2:2', 'Ocotillo Taqueria', [170688, 168859, 179832, 187147], 2743, [
    ['w', 'framed photo of the abuela who started it', C.struct, 500, 1500, 1900],
    ['w', 'shelf of molcajetes', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'neon open sign in the window', C.car, 900, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 2, duty: 0.8}}],
    ['o', 'outlet for the tortilla warmer', 1067],
    ['c', 'dining room ceiling fan', C.int, 280, 60, fan],
    ['f', 'high chair by the salsa bar', C.int, 450, 450, 760],
    ['p', 'standing', 'refilling the horchata jar'],
    ['p', 'standing', 'wiping down table four'],
    ['p', 'standing', 'handing a to go bag across the counter'],
  ]);
  D('2:2', 'Brass Tack Hardware', [179832, 168859, 188976, 187147], 2743, [
    ['w', 'rack of extension cords on hooks', C.elec, 900, 1200, 1800],
    ['w', 'shelf of swamp cooler pads and pumps', C.veg2, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'chain spool rack with cutters', C.struct, 900, 900, 1500],
    ['o', 'outlet for the demo drill charger', 1067],
    ['c', 'aisle ceiling speaker', C.int, 150, 40],
    ['f', 'bin of fence post caps', C.struct, 500, 500, 700],
    ['p', 'standing', 'measuring off ten feet of chain'],
    ['p', 'standing', 'picking out a cooler pad size'],
    ['p', 'standing', 'testing a cordless drill'],
  ]);
  D('2:2', 'Rattlesnake Ridge Tractor Repair', [188976, 168859, 198120, 187147], 2743, [
    ['w', 'shelf of manuals for old tractors', C.int, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'calendar of parts deliveries', C.sign, 500, 1400, 1800],
    ['w', 'eye wash station', C.car2, 400, 1000, 1500],
    ['o', 'outlet for the work light', 457],
    ['c', 'shop smoke detector', C.elec, 90],
    ['f', 'pallet of oil filters', C.struct, 600, 600, 700],
    ['p', 'standing', 'flipping through a tractor manual'],
    ['p', 'standing', 'rinsing grit from an eye at the wash station'],
    ['p', 'standing', 'checking the parts delivery calendar'],
  ]);
  D('2:2', 'Two Bit Barber Shop', [198120, 168859, 207264, 187147], 2743, [
    ['w', 'framed price list in chalk', C.sign, 600, 1400, 1900],
    ['w', 'shelf of beard oils for sale', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'wall of signed customer photos', C.struct, 900, 1300, 2000],
    ['o', 'outlet for the hot lather machine', 1067],
    ['c', 'waiting area smoke detector', C.elec, 90],
    ['f', 'booster seat for kids cuts', C.car, 400, 400, 300],
    ['p', 'standing', 'brushing hair off a neck'],
    ['p', 'standing', 'pointing at a haircut photo on the wall'],
    ['p', 'standing', 'paying for a fade with a tip'],
  ]);
  D('2:2', 'Coin and Suds Laundromat', [207264, 168859, 216408, 187147], 2743, [
    ['w', 'lost and found basket shelf', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'community board of rentals and lost dogs', C.sign, 1200, 1200, 1900],
    ['w', 'wall tv on a bracket', C.struct, 900, 1900, 2400],
    ['o', 'outlet for phone charging', 1067],
    ['c', 'ceiling fan over the folding table', C.int, 280, 60, fan],
    ['f', 'rolling hamper on a wire frame', C.struct, 500, 700, 900],
    ['p', 'standing', 'pinning a lost dog flyer to the board'],
    ['p', 'standing', 'digging a sock out of the lost and found'],
    ['p', 'standing', 'pushing a hamper to the dryers'],
  ]);
  D('2:2', 'Static Line Electronics Repair', [216408, 168859, 225552, 187147], 2743, [
    ['w', 'pegboard of test leads and probes', C.elec, 900, 1100, 1700],
    ['w', 'shelf of vintage radios for sale', C.int, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'whiteboard of repair queue', C.sign, 900, 1200, 1900],
    ['o', 'outlet for the hot air rework station', 1067],
    ['c', 'bench pendant light', C.elec, 200, 300],
    ['f', 'esd trash bin', C.car2, 300, 300, 600],
    ['p', 'standing', 'updating the repair queue whiteboard'],
    ['p', 'standing', 'clipping a probe onto a test point'],
    ['p', 'standing', 'tuning a vintage radio for a buyer'],
  ]);

  // ================================================================= 3,1 Pecan Hollow deepen
  D('3:1', 'Pecan Hollow Equipment Barn', [266888, 132352, 285176, 144544], 3962, [
    ['w', 'rack of spare pecan shaker pads', C.struct, 1500, 1200, 1800],
    ['w', 'shelf of grease cartridges', C.yellow, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'hanging hose reel for washdown', C.plumb, 600, 1200, 1800, {disc: 'plumbing'}],
    ['w', 'clipboard of tractor service hours', C.sign, 400, 1400, 1800],
    ['w', 'first aid cabinet', C.car, 500, 1200, 1700],
    ['o', 'outlet for the block heater cord', 457],
    ['o', 'outlet for the radio on the bench', 1067],
    ['f', 'pecan sweeper head on blocks', C.yellow, 1200, 900, 800],
    ['f', 'drum of def fluid with a pump', C.car2, 0, 0, 900, {r: 300, n: 10}],
    ['f', 'stack of empty pecan harvest bins', C.struct, 800, 800, 1000],
    ['p', 'standing', 'swapping a pad on the shaker'],
    ['p', 'standing', 'logging hours on the tractor clipboard'],
    ['p', 'standing', 'washing mud off the sweeper head'],
    ['p', 'standing', 'stacking empty harvest bins'],
  ]);
  D('3:1', 'Pecan Hollow Farmhouse', [249888, 136852, 262080, 145996], 2438, [
    ['w', 'gun cabinet with a padlock', C.struct, 600, 400, 1900],
    ['w', 'shelf of pecan cookbooks', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'framed ribbon from the county fair', C.car2, 400, 1500, 1800],
    ['w', 'thermostat for the swamp cooler', C.elec, 120, 1450, 1580, {disc: 'electrical'}],
    ['o', 'outlet for the stand mixer', 1067],
    ['o', 'outlet for the heating pad', 406],
    ['c', 'hallway ceiling light', C.elec, 150, 40],
    ['f', 'dog water bowl by the door', C.plumb, 0, 0, 120, {r: 150, n: 8}],
    ['p', 'standing', 'creaming butter for a pecan pie'],
    ['p', 'standing', 'filling the dog water bowl'],
    ['p', 'standing', 'hanging the fair ribbon on a nail'],
  ]);
  D('3:1', 'Pecan Hollow Pump House', [290888, 138352, 294546, 141400], 2438, [
    ['w', 'logbook of well readings on a nail', C.sign, 300, 1300, 1600],
    ['w', 'spare fuse block for the pump', C.elec, 250, 1400, 1700, {disc: 'electrical'}],
  ]);
  D('3:1', 'Pecan Hollow Chicken Coop', [296888, 142352, 300546, 144790], 2438, [
    ['w', 'hook of egg baskets', C.brick, 300, 1300, 1600],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
