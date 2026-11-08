// Agent Orange 2026-11-08 a: claim block 7,4 and build the Bur Sage corner (machaca kitchen, well pump supply, tractor radiator shop,
// chile ristra barn, citrus packing house), then deepen 2,3 Saguaro Avenue shops, 4,3 Brick Kiln block and 4,4 Lava Rock block.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611108; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 7,4
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, VSTREET, HSTREET} = k;
  VSTREET[7] = VSTREET[7] || 'Tarantula Avenue';
  VSTREET[8] = VSTREET[8] || 'Pinacate Avenue';
  claim(7, 4);
  streets(7, 4, {s: true, n: true, e: true});
  const ox = 7 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Bur Sage corner shops');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Arrowweed chile and citrus yard');

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


  // ---- Bur Sage Machaca Kitchen
  {
    const N = 'Bur Sage Machaca Kitchen', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.yellow, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front windows lettered with machaca and eggs'});
    for (let s = 0; s < 5; s++) IC(N, 'turquoise vinyl counter stool ' + (s + 1), C.plumb, x0 + 5200 + s * 900, y0 + 5600, 200, 760, {n: 8});
    I(N, 'butcher block topped lunch counter', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'griddle for machaca and eggs', C.struct, x0 + 5200, y0 + 9800, x0 + 7000, y0 + 10600, 914, {check: ['counter_height', 914]});
    IC(N, 'pot of pinto beans simmering', C.brick, x0 + 7600, y0 + 10200, 320, 1300, {n: 12});
    I(N, 'hood over the griddle', C.struct, x0 + 5000, y0 + 9800, x0 + 8200, y0 + 10900, 2100);
    I(N, 'salsa bar of pico, roja and verde', C.veg2, x0 + 8600, y0 + 9800, x0 + 10200, y0 + 10500, 914);
    I(N, 'kitchen printer by the griddle', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'order clip rail by the griddle'});
    I(N, 'heat lamp shelf over the plates', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'glass case of flour tortillas by the dozen', C.car2, x0 + 10400, y0 + 6100, x0 + 11400, y0 + 6600, 1300);
    I(N, 'horchata and coffee urns', C.car, x0 + 11800, y0 + 6000, x0 + 12900, y0 + 6600, 1200);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'red checked window table ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'tub of shredded dried beef', C.brick, x0 + 10800, y0 + 9800, x0 + 11600, y0 + 10500, 600);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for machaca burritos with cash', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'tearing a receipt off the printer', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'scrambling eggs into the machaca', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'spooning salsa roja over a burrito', 0);
    act(x0 + 7400, y0 + 5100, 'sitting', 'sipping horchata at the counter', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'doing a crossword in the window seat', Math.PI);
  }
  // ---- Sacaton Well Pump Supply
  {
    const N = 'Sacaton Well Pump Supply', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.plumb, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass onto the lot'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'gondola of pump fittings and pitless adapters, row ' + (r + 1), C.plumb, rx, y0 + 5000, rx + 900, y0 + 10600, 1828, {check: ['shelf_height', 1828]}); }
    I(N, 'quote terminal for well pump sizing', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of pressure tanks', C.struct, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 1100, {color2: C.plumb});
    I(N, 'submersible pump on a display stand', C.yellow, x0 + 14400, y0 + 7000, x0 + 15600, y0 + 7800, 1000);
    for (let j = 0; j < 3; j++) IC(N, 'coil of drop pipe ' + (j + 1), C.struct, x0 + 2000 + j * 1500, y0 + 10500, 350, 800 + j * 10, {n: 10});
    I(N, 'wall of pressure switches in bins', C.yellow, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1700, {check: ['shelf_height', 1700]});
    I(N, 'bench with a pressure switch tester', C.int, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'control box rack for three wire pumps', C.car, x0 + 3000, y0 + 7200, x0 + 3900, y0 + 7900, 1200);
    I(N, 'well cap and seal sorting table', C.int, x0 + 15000, y0 + 9000, x0 + 16800, y0 + 9600, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a pressure tank by card', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'sizing a pump for a 300 foot well', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'setting the cut in on a switch', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'pulling a pitless adapter off the shelf', Math.PI / 2);
  }
  // ---- Horned Lizard Tractor Radiator Shop
  {
    const N = 'Horned Lizard Tractor Radiator Shop', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.car2, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'shop window'});
    IC(N, 'shop fan drying a flushed core', C.struct, x0 + 5600, y0 + 8000, 280, 1050, {n: 12, anim: {type: 'spin', rpm: 40}});
    I(N, 'radiator test tank of water', C.plumb, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 940, {check: ['counter_height', 940]});
    I(N, 'rack of recored tractor radiators', C.struct, x0 + 3200, y0 + 9400, x0 + 4600, y0 + 10600, 1800);
    I(N, 'shelf of radiator caps by pressure', C.brick, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1600, {check: ['shelf_height', 1600]});
    I(N, 'shelf of hose clamps and thermostats', C.struct, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'tractor radiator on a solder stand', C.yellow, x0 + 600, y0 + 6400, x0 + 2200, y0 + 7200, 1100);
    I(N, 'pressure tester cart', C.int, x0 + 600, y0 + 4400, x0 + 1400, y0 + 5000, 1000);
    I(N, 'fan stand base', C.struct, x0 + 5200, y0 + 7600, x0 + 6000, y0 + 8400, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a recored radiator', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'writing up a leaking core on a ticket', Math.PI);
    act(x0 + 1600, y0 + 8500, 'standing', 'watching for bubbles in the test tank', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'soldering a pinhole in a tank seam', 0);
  }
  // ---- Arrowweed Chile Ristra Barn (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Arrowweed Chile Ristra Barn', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.struct, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'open bay for chile trailers'});
    for (let t = 0; t < 4; t++) I(N, 'hanging rack of red chile ristras ' + (t + 1), C.car, x0 + 1500 + (t % 2) * 3600, y0 + 6000 + Math.floor(t / 2) * 2800, x0 + 4300 + (t % 2) * 3600, y0 + 8200 + Math.floor(t / 2) * 2800, 2400);
    IC(N, 'drying fan over the ristra racks', C.struct, x0 + 18200, y0 + 8300, 600, 1300, {n: 12, anim: {type: 'spin', rpm: 30}});
    I(N, 'chile stem cutter and grinder', C.car, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 10200, 2200);
    I(N, 'scale for sacks of dried pods', C.int, x0 + 17000, y0 + 3600, x0 + 18600, y0 + 4600, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of chile powder buckets', C.car, x0 + 21000, y0 + 3600, x0 + 22400, y0 + 5000, 1300);
    I(N, 'whiteboard of ristra orders', C.sign, x0 + 12000, y1 - 400, x0 + 14500, y1 - 250, 2200);
    act(x0 + 4800, y0 + 5200, 'standing', 'tying red chile pods onto a string', 0);
    act(x0 + 22300, y0 + 7800, 'standing', 'feeding pods into the grinder', Math.PI);
    act(x0 + 17800, y0 + 5200, 'standing', 'weighing a sack of dried pods', Math.PI);
    act(x0 + 13200, y0 + 2000, 'standing', 'backing a chile trailer into the bay', Math.PI);
  }
  // ---- Burrobush Citrus Packing House (back row)
  {
    const N = 'Burrobush Citrus Packing House', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'brick', fc: C.brick, noCeil: true, beam: 4572, lightZ: 4200});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up door to the citrus dock'});
    I(N, 'brush washer and waxer for lemons', C.yellow, x0 + 1200, y0 + 6200, x0 + 7000, y0 + 7000, 1000);
    IC(N, 'cooling fan at the citrus cold room', C.struct, x0 + 11100, y0 + 6500, 600, 1100, {n: 12, anim: {type: 'spin', rpm: 25}});
    I(N, 'roller grading table', C.int, x0 + 600, y0 + 9200, x0 + 4200, y0 + 10000, 1000);
    I(N, 'field bin of grapefruit', C.yellow, x0 + 600, y0 + 10400, x0 + 2000, y0 + 11400, 700);
    I(N, 'sizing belt with drop chutes', C.struct, x0 + 2600, y0 + 10400, x0 + 4000, y0 + 11400, 1800);
    I(N, 'pack table for lemon cartons', C.int, x0 + 5000, y0 + 8400, x0 + 6400, y0 + 9100, 914, {check: ['counter_height', 914]});
    I(N, 'juice grade bin for culls', C.car, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 900);
    act(x0 + 3000, y0 + 7600, 'standing', 'watching lemons come off the waxer', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'stacking citrus cartons by the cold room', Math.PI);
    act(x0 + 2400, y0 + 8600, 'standing', 'pulling wind scarred fruit off the rollers', 0);
    act(x0 + 5700, y0 + 9800, 'standing', 'packing lemons in a carton by count', Math.PI);
  }
  // ---- yard, plantings and life on 7,4
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel chile trailer yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'flatbed stacked with citrus bins'});
    act(a + 12500, yB0 - 3800, 'standing', 'strapping citrus bins on a flatbed', Math.PI / 2);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada over the citrus sample table'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 151), {part: ['bur sage bed', 'desert marigold bed', 'chuparosa bed', 'deer grass bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 7.6 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 6.7 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 47), {part: 'rock lined swale with desert senna'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a bag of burritos to a pickup', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'lifting a radiator into a truck bed', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'pedaling over for a dozen tortillas', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(7, 4, true, C.car2, 'car', 9000);
  trafficLoop(7, 4, false, C.struct, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 2,3 Saguaro Avenue shops deepen
  D('2:3', 'Dust Devil Sheet Metal Works', [170688, 263744, 179832, 276400], 3353, [
    ['w', 'rack of hand seamers and snips', C.struct, 900, 1100, 1700],
    ['w', 'shelf of rivet boxes by size', C.brick, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'chalk outline of a stovepipe pattern', C.sign, 1200, 1200, 2000],
    ['w', 'hook of welding gloves and a hood', C.yellow, 500, 1300, 1700],
    ['o', 'outlet for the plasma cutter', 1067],
    ['o', 'outlet for the drill charger, sheet metal', 457],
    ['c', 'shop ceiling fan, sheet metal', C.int, 280, 300, fan],
    ['c', 'shop smoke detector, sheet metal', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'stack of galvanized sheets on sawhorses', C.struct, 1200, 600, 800],
    ['f', 'bin of duct elbows', C.int, 600, 500, 700],
    ['f', 'rolling tool cart, sheet metal', C.car, 500, 400, 950],
    ['p', 'standing', 'crimping the end of a stovepipe'],
    ['p', 'standing', 'cutting a rectangle with aviation snips'],
    ['p', 'standing', 'drilling rivet holes in a hood'],
  ]);
  D('2:3', 'Mirage Glass and Mirror', [179832, 263744, 188976, 276400], 3353, [
    ['w', 'board of beveled edge samples', C.car2, 900, 1200, 1800],
    ['w', 'shelf of mirror clips and channel', C.struct, 900, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'calendar of install appointments', C.sign, 500, 1300, 1800],
    ['o', 'outlet for the edge polisher', 1067],
    ['o', 'outlet for the glazing gun charger', 457],
    ['c', 'glass shop ceiling fan', C.int, 280, 300, fan],
    ['c', 'glass shop smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'a frame cart of cut panes', C.plumb, 900, 500, 1500],
    ['f', 'bucket of glazing points', C.struct, 0, 0, 400, {r: 170}],
    ['f', 'box of window screen frames', C.int, 700, 400, 600],
    ['p', 'standing', 'polishing the edge of a shelf glass'],
    ['p', 'standing', 'rescreening a window frame'],
    ['p', 'standing', 'loading a pane onto the a frame cart'],
  ]);
  D('2:3', 'Packrat Upholstery Shop', [188976, 263744, 198120, 276400], 3353, [
    ['w', 'rack of thread cones by color', C.car, 900, 1200, 1700],
    ['w', 'shelf of foam rolls', C.int, 1100, 1600, 1650, {check: ['shelf_height', 1600]}],
    ['w', 'board of finished tractor seat photos', C.struct, 900, 1300, 1900],
    ['o', 'outlet for the hog ring stapler compressor', 457],
    ['o', 'outlet for the steamer, upholstery', 1067],
    ['c', 'upholstery ceiling fan', C.int, 280, 300, fan],
    ['c', 'upholstery smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'tractor seat waiting for a new cover', C.yellow, 600, 500, 800],
    ['f', 'bolt cart of saddle vinyl', C.car2, 800, 500, 1100],
    ['f', 'small air compressor, upholstery', C.struct, 0, 0, 600, {r: 250}],
    ['p', 'standing', 'fitting a new cover on a tractor seat'],
    ['p', 'standing', 'cutting vinyl along a paper pattern'],
    ['p', 'standing', 'hog ringing a cover to a seat frame'],
  ]);
  D('2:3', 'Roadrunner Lunch Counter', [198120, 263744, 207264, 276400], 3353, [
    ['w', 'menu board of daily specials', C.sign, 1200, 1500, 2300],
    ['w', 'shelf of jarred salsa for sale', C.car, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'clock over the pass', C.struct, 300, 2200, 2500],
    ['o', 'outlet for the blender, lunch counter', 1067],
    ['o', 'outlet for the toaster, lunch counter', 1067],
    ['c', 'lunch counter ceiling fan', C.int, 280, 300, fan],
    ['c', 'lunch counter smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'high chair by the booths', C.int, 450, 450, 750],
    ['f', 'bus cart of dirty dishes', C.car2, 700, 450, 900],
    ['p', 'standing', 'refilling a coffee for a trucker'],
    ['p', 'standing', 'buttering toast for a breakfast plate'],
    ['p', 'standing', 'pushing the bus cart to the dish pit'],
  ]);
  D('2:3', 'Caliche Pipe and Supply', [207264, 263744, 216408, 276400], 3353, [
    ['w', 'board of valve cutaway samples', C.plumb, 900, 1200, 1800],
    ['w', 'shelf of pvc cement and primer', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'rack of pipe wrenches for sale', C.struct, 900, 1100, 1700],
    ['o', 'outlet for the pipe threader', 457],
    ['o', 'outlet for the counter label printer, pipe', 1067],
    ['c', 'pipe supply ceiling fan', C.int, 280, 300, fan],
    ['c', 'pipe supply smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'bin of ball valves', C.plumb, 600, 500, 800],
    ['f', 'pipe threader on a stand', C.struct, 700, 500, 900],
    ['f', 'cart of irrigation risers', C.car2, 600, 400, 900],
    ['p', 'standing', 'cutting oil onto a threading die'],
    ['p', 'standing', 'comparing two brass gate valves'],
  ]);

  // ================================================================= 4,3 Brick Kiln block deepen
  D('4:3', 'Brick Kiln Pizza Kitchen', [328000, 249000, 339000, 256500], 3048, [
    ['w', 'framed photo of the first pizza oven', C.struct, 600, 1400, 1900],
    ['w', 'shelf of grated cheese shakers', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the soda cooler, dining', 457],
    ['c', 'dining smoke detector, pizza', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'booster seat stack', C.car2, 450, 450, 700],
    ['p', 'standing', 'filling a pitcher of root beer'],
    ['p', 'sitting', 'shaking red pepper on a slice'],
  ]);
  D('4:3', 'Brick Kiln Pizza Kitchen', [328000, 256500, 342000, 261000], 3048, [
    ['w', 'rack of pizza peels', C.struct, 900, 1300, 2000],
    ['w', 'shelf of canned tomatoes', C.car, 900, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the dough sheeter', 1067],
    ['f', 'dough proofing boxes on a dolly', C.int, 700, 500, 900],
    ['p', 'standing', 'sheeting a dough ball through the rollers'],
    ['p', 'standing', 'cutting a pie into eight slices'],
  ]);
  D('4:3', 'Masa Moon Tortilleria', [345000, 249000, 357000, 253500], 3200, [
    ['w', 'shelf of dried corn husk bundles', C.yellow, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'price list of masa by the kilo', C.sign, 900, 1300, 1800],
    ['o', 'outlet for the counter scale, tortilleria', 1067],
    ['c', 'front room smoke detector, tortilleria', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'cooler of fresh queso fresco', C.int, 700, 500, 900],
    ['p', 'standing', 'buying husks and masa for a tamalada'],
    ['p', 'standing', 'wrapping tortillas in brown paper'],
  ]);
  D('4:3', 'Masa Moon Tortilleria', [345000, 253500, 357000, 259000], 3200, [
    ['w', 'clipboard of the nixtamal soak times', C.sign, 300, 1300, 1600],
    ['w', 'hook of rubber aprons', C.car2, 500, 1300, 1700],
    ['o', 'outlet for the masa mixer', 1067],
    ['f', 'tub of soaked corn', C.yellow, 0, 0, 700, {r: 350}],
    ['f', 'bag rack of lime for nixtamal', C.struct, 600, 400, 600],
    ['p', 'standing', 'rinsing soaked corn in a colander'],
    ['p', 'standing', 'mixing masa by hand in a tub'],
  ]);
  D('4:3', 'Red Mesa Well Drilling', [361000, 249000, 368000, 263000], 2743, [
    ['w', 'framed drilling license', C.struct, 400, 1400, 1700],
    ['w', 'shelf of well log binders', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the plan printer', 457],
    ['f', 'map tube bin', C.int, 0, 0, 900, {r: 200}],
    ['p', 'standing', 'filing a finished well log'],
    ['p', 'standing', 'scheduling a pump test on the phone'],
  ]);
  D('4:3', 'Red Mesa Well Drilling', [368000, 249000, 384000, 263000], 5400, [
    ['w', 'rack of drill collar subs', C.struct, 1500, 600, 1500],
    ['w', 'shelf of bit grease and thread dope', C.car2, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'whiteboard of rig crew assignments', C.sign, 1200, 1200, 2000],
    ['o', 'outlet for the shop welder', 457],
    ['o', 'outlet for the grease pump', 1067],
    ['c', 'shop exhaust fan, well drilling', C.int, 400, 200, {disc: 'interior', anim: {type: 'spin', rpm: 40}}],
    ['f', 'stack of tricone bits on a pallet', C.struct, 900, 900, 600],
    ['f', 'drum of drilling foam', C.plumb, 0, 0, 900, {r: 300}],
    ['f', 'grease pump on a drum', C.int, 0, 0, 1100, {r: 300}],
    ['p', 'standing', 'doping the threads on a drill sub'],
    ['p', 'standing', 'reading crew assignments for tomorrow'],
  ]);
  D('4:3', 'Cottonwood Wash Date Packing Shed', [328000, 286000, 340000, 302000], 5000, [
    ['w', 'board of grower lot tags, dates', C.sign, 1200, 1300, 2000],
    ['w', 'shelf of empty gift boxes', C.car2, 1100, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the shrink wrapper', 1067],
    ['c', 'packing shed exhaust fan', C.int, 400, 200, {disc: 'interior', anim: {type: 'spin', rpm: 35}}],
    ['f', 'shrink wrap table', C.int, 900, 600, 900],
    ['f', 'stack of date lug boxes', C.brick, 700, 500, 900],
    ['p', 'standing', 'shrink wrapping a gift box of dates'],
    ['p', 'standing', 'stamping a lot number on a lug'],
  ]);
  D('4:3', 'Cottonwood Wash Date Packing Shed', [340000, 286000, 348000, 294000], 3048, [
    ['w', 'framed photo of the first date harvest', C.struct, 600, 1400, 1900],
    ['w', 'binder shelf of food safety audits', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the office printer, dates', 457],
    ['p', 'standing', 'printing a bill of lading for dates'],
  ]);
  D('4:3', 'Palm Row Well House', [352000, 296000, 356000, 300000], 2743, [
    ['w', 'pressure gauge on the discharge line', C.plumb, 300, 1300, 1600],
    ['w', 'clipboard of well meter readings', C.sign, 300, 1200, 1500],
    ['c', 'well house light globe', C.int, 120, 60, {disc: 'interior'}],
    ['p', 'standing', 'writing down the well meter reading'],
  ]);

  // ================================================================= 4,4 Lava Rock block deepen
  D('4:4', 'Lava Rock Fry Bread Kitchen', [329184, 342992, 344424, 354400], 3353, [
    ['w', 'shelf of honey jars for sale', C.yellow, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'framed photo of a powwow arena', C.struct, 600, 1400, 1900],
    ['w', 'paper towel holder by the fryer', C.int, 400, 1200, 1400],
    ['o', 'outlet for the powdered sugar sifter', 1067],
    ['o', 'outlet for the drink cooler, fry bread', 457],
    ['c', 'dining ceiling fan, fry bread', C.int, 280, 300, fan],
    ['c', 'kitchen smoke detector, fry bread', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'flour bin on casters', C.int, 600, 500, 800],
    ['f', 'oil filter cart for the fryer', C.struct, 600, 400, 900],
    ['f', 'mop sink bucket, fry bread', C.yellow, 300, 300, 500],
    ['p', 'standing', 'filtering the fryer oil after lunch'],
    ['p', 'standing', 'rolling dough balls on a floured board'],
    ['p', 'standing', 'buying a jar of mesquite honey'],
  ]);
  D('4:4', 'Packsaddle Harness and Tack', [345948, 342992, 364236, 354400], 3353, [
    ['w', 'rack of saddle pads by size', C.car2, 1200, 1100, 1700],
    ['w', 'shelf of hoof care tins', C.brick, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'pegboard of spurs and rowels', C.struct, 900, 1200, 1900],
    ['w', 'hook of lead ropes', C.yellow, 600, 1300, 1700],
    ['o', 'outlet for the leather sewing machine', 1067],
    ['o', 'outlet for the counter lamp, tack', 1067],
    ['c', 'tack room ceiling fan', C.int, 280, 300, fan],
    ['c', 'tack room smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'saddle stand with a ranch saddle', C.brick, 700, 400, 1000],
    ['f', 'barrel of horse treats', C.struct, 0, 0, 800, {r: 280}],
    ['f', 'leather sewing machine table', C.int, 1000, 600, 900],
    ['p', 'standing', 'oiling a pair of leather reins'],
    ['p', 'standing', 'fitting spurs to a rider boot'],
    ['p', 'standing', 'picking a saddle pad for a mare'],
  ]);
  D('4:4', 'Dry Wash Hydraulic Hose Shop', [365760, 342992, 377952, 354400], 3353, [
    ['w', 'chart of hose fittings by thread type', C.sign, 1200, 1300, 2000],
    ['w', 'shelf of o ring kits', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'reel rack of bulk hose', C.struct, 1500, 400, 1800],
    ['o', 'outlet for the hose crimper', 1067],
    ['o', 'outlet for the hose cleaner', 457],
    ['c', 'hose shop ceiling fan', C.int, 280, 300, fan],
    ['c', 'hose shop smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'bin of hydraulic adapters', C.plumb, 600, 500, 800],
    ['f', 'hose cleaner launcher on a bench stand', C.int, 600, 400, 1000],
    ['f', 'drip pan under a test rig', C.struct, 900, 600, 200],
    ['p', 'standing', 'shooting a cleaning projectile through a hose'],
    ['p', 'standing', 'capping the ends of a finished hose'],
    ['p', 'standing', 'reading a thread gauge on a fitting'],
  ]);
  D('4:4', 'Mule Deer Hay Exchange', [329184, 368100, 353568, 377684], 5400, [
    ['w', 'board of hay prices by cutting', C.sign, 1500, 1300, 2100],
    ['w', 'rack of bale hooks', C.struct, 900, 1200, 1700],
    ['w', 'shelf of salt and mineral blocks', C.int, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the moisture probe charger', 1067],
    ['o', 'outlet for the scale indicator', 1067],
    ['c', 'barn exhaust fan, hay exchange', C.int, 400, 200, {disc: 'interior', anim: {type: 'spin', rpm: 35}}],
    ['f', 'stack of bermuda grass bales', C.veg2, 1200, 800, 1100],
    ['f', 'stack of alfalfa bales', C.veg2, 1200, 800, 1300],
    ['f', 'hand truck for bales', C.int, 500, 400, 1200],
    ['p', 'standing', 'writing a new alfalfa price on the board'],
    ['p', 'standing', 'handing a salt block to a rancher'],
    ['p', 'standing', 'rolling a bale onto the hand truck'],
  ]);
  D('4:4', 'Coyote Melon Packing Shed', [357036, 368100, 372276, 377684], 5400, [
    ['w', 'board of melon shipping schedules', C.sign, 1200, 1300, 2000],
    ['w', 'shelf of carton labels', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'hook of hairnets and gloves', C.yellow, 600, 1300, 1700],
    ['o', 'outlet for the label printer, melon', 1067],
    ['o', 'outlet for the floor fan, melon', 457],
    ['c', 'shed exhaust fan, melon', C.int, 400, 200, {disc: 'interior', anim: {type: 'spin', rpm: 40}}],
    ['f', 'bin of honeydew melons', C.veg2, 1200, 1000, 800],
    ['f', 'pallet of flat cantaloupe cartons', C.brick, 1100, 1000, 700],
    ['f', 'floor fan on a stand', C.struct, 0, 0, 1000, {r: 300, n: 10, anim: {type: 'spin', rpm: 70}}],
    ['p', 'standing', 'thumping a honeydew for ripeness'],
    ['p', 'standing', 'printing labels for a melon order'],
    ['p', 'standing', 'gluing up a stack of cartons'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
