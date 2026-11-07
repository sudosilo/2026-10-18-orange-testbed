// Agent Orange 2026-11-07 a: claim block 6,4 and build the Iodine Bush corner (pozole cafe, sprinkler parts, hydraulic cylinder shop,
// garlic drying barn, pomegranate packing house), then deepen 3,4 Chuparosa Street shops, 3,2 Mesa Lantern block and 4,2 Javelina block.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611107; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 6,4
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, VSTREET, HSTREET} = k;
  VSTREET[7] = VSTREET[7] || 'Tarantula Avenue';
  claim(6, 4);
  streets(6, 4, {s: true, w: true, n: true, e: true});
  const ox = 6 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Iodine Bush corner shops');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Desert Lavender garlic and pomegranate yard');

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

  // ---- Iodine Bush Pozole Cafe
  {
    const N = 'Iodine Bush Pozole Cafe', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.car, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front windows painted with a red bowl of pozole'});
    for (let s = 0; s < 5; s++) IC(N, 'red vinyl counter stool ' + (s + 1), C.car, x0 + 5200 + s * 900, y0 + 5600, 200, 760, {n: 8});
    I(N, 'tile topped lunch counter', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'four burner range for the pozole pots', C.struct, x0 + 5200, y0 + 9800, x0 + 7000, y0 + 10600, 914, {check: ['counter_height', 914]});
    IC(N, 'stock pot of red pozole with hominy', C.car, x0 + 7600, y0 + 10200, 320, 1300, {n: 12});
    I(N, 'hood over the range', C.struct, x0 + 5000, y0 + 9800, x0 + 8200, y0 + 10900, 2100);
    I(N, 'garnish rail of cabbage, radish and lime', C.veg2, x0 + 8600, y0 + 9800, x0 + 10200, y0 + 10500, 914);
    I(N, 'kitchen printer at the window', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'ticket rail at the window'});
    I(N, 'heat lamp shelf at the window', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'pan dulce case with conchas', C.car2, x0 + 10400, y0 + 6100, x0 + 11400, y0 + 6600, 1300);
    I(N, 'agua fresca jars of jamaica and tamarind', C.car, x0 + 11800, y0 + 6000, x0 + 12900, y0 + 6600, 1200);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'oilcloth window table ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'sack of dried guajillo chiles', C.car, x0 + 10800, y0 + 9800, x0 + 11600, y0 + 10500, 600);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for two bowls of pozole by card', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'handing back a receipt and a mint', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'ladling pozole into a bowl', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'squeezing lime into a bowl of pozole', 0);
    act(x0 + 7400, y0 + 5100, 'sitting', 'dunking a concha in cafe de olla', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'sipping a jamaica by the window', Math.PI);
  }
  // ---- Woolly Daisy Sprinkler Parts
  {
    const N = 'Woolly Daisy Sprinkler Parts', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.plumb, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass onto the lot'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'gondola of impact sprinklers and risers, row ' + (r + 1), C.plumb, rx, y0 + 5000, rx + 900, y0 + 10600, 1828, {check: ['shelf_height', 1828]}); }
    I(N, 'quote terminal for sprinkler layouts', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of aluminum hand line pipe', C.struct, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 1100, {color2: C.plumb});
    I(N, 'wheel line mover on display', C.yellow, x0 + 14400, y0 + 7000, x0 + 15600, y0 + 7800, 1000);
    for (let j = 0; j < 3; j++) IC(N, 'coil of polyethylene pipe ' + (j + 1), C.struct, x0 + 2000 + j * 1500, y0 + 10500, 350, 800 + j * 10, {n: 10});
    I(N, 'wall of brass nozzles in bins', C.yellow, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1700, {check: ['shelf_height', 1700]});
    I(N, 'bench with a sprinkler test riser', C.int, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'booster pump on a skid', C.car, x0 + 3000, y0 + 7200, x0 + 3900, y0 + 7900, 1200);
    I(N, 'gasket and coupler sorting table', C.int, x0 + 15000, y0 + 9000, x0 + 16800, y0 + 9600, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a box of rain bird heads', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'quoting a hand line for a hay field', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'testing a nozzle on the riser', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'counting brass nozzles into a bag', Math.PI / 2);
  }
  // ---- Gila Monster Hydraulic Cylinder Shop
  {
    const N = 'Gila Monster Hydraulic Cylinder Shop', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.car2, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'shop window'});
    IC(N, 'hone turning inside a cylinder barrel', C.struct, x0 + 5600, y0 + 8000, 280, 1050, {n: 12, anim: {type: 'spin', rpm: 40}});
    I(N, 'cylinder teardown bench', C.int, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 940, {check: ['counter_height', 940]});
    I(N, 'rack of chrome cylinder rods', C.struct, x0 + 3200, y0 + 9400, x0 + 4600, y0 + 10600, 1800);
    I(N, 'shelf of seal kits by part number', C.brick, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1600, {check: ['shelf_height', 1600]});
    I(N, 'shelf of gland nuts and pistons', C.struct, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'loader lift cylinder on a stand', C.yellow, x0 + 600, y0 + 6400, x0 + 2200, y0 + 7200, 1100);
    I(N, 'hydraulic test pump cart', C.int, x0 + 600, y0 + 4400, x0 + 1400, y0 + 5000, 1000);
    I(N, 'hone stand base', C.struct, x0 + 5200, y0 + 7600, x0 + 6000, y0 + 8400, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a rebuilt loader cylinder', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'looking up a seal kit by bore size', Math.PI);
    act(x0 + 1600, y0 + 8500, 'standing', 'pulling a piston off a cylinder rod', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'measuring a chrome rod with calipers', 0);
  }
  // ---- Desert Lavender Garlic Drying Barn (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Desert Lavender Garlic Drying Barn', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.struct, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'open bay for garlic wagons'});
    for (let t = 0; t < 4; t++) I(N, 'hanging rack of garlic bunches ' + (t + 1), C.int, x0 + 1500 + (t % 2) * 3600, y0 + 6000 + Math.floor(t / 2) * 2800, x0 + 4300 + (t % 2) * 3600, y0 + 8200 + Math.floor(t / 2) * 2800, 2400);
    IC(N, 'drying fan turning over the garlic racks', C.struct, x0 + 18200, y0 + 8300, 600, 1300, {n: 12, anim: {type: 'spin', rpm: 30}});
    I(N, 'garlic bulb cracker and sizer', C.car, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 10200, 2200);
    I(N, 'scale for thirty pound garlic boxes', C.int, x0 + 17000, y0 + 3600, x0 + 18600, y0 + 4600, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of white garlic cartons', C.int, x0 + 21000, y0 + 3600, x0 + 22400, y0 + 5000, 1300);
    I(N, 'whiteboard of seed garlic orders', C.sign, x0 + 12000, y1 - 400, x0 + 14500, y1 - 250, 2200);
    act(x0 + 4800, y0 + 5200, 'standing', 'clipping roots off a garlic bunch', 0);
    act(x0 + 22300, y0 + 7800, 'standing', 'feeding bulbs into the cracker', Math.PI);
    act(x0 + 17800, y0 + 5200, 'standing', 'weighing a carton of softneck garlic', Math.PI);
    act(x0 + 13200, y0 + 2000, 'standing', 'guiding a garlic wagon into the bay', Math.PI);
  }
  // ---- Snakeweed Pomegranate Packing House (back row)
  {
    const N = 'Snakeweed Pomegranate Packing House', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'brick', fc: C.brick, noCeil: true, beam: 4572, lightZ: 4200});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up door to the fruit dock'});
    I(N, 'brush washer for pomegranates', C.car2, x0 + 1200, y0 + 6200, x0 + 7000, y0 + 7000, 1000);
    IC(N, 'cooling fan at the cold room door', C.struct, x0 + 11100, y0 + 6500, 600, 1100, {n: 12, anim: {type: 'spin', rpm: 25}});
    I(N, 'roller sorting table', C.int, x0 + 600, y0 + 9200, x0 + 4200, y0 + 10000, 1000);
    I(N, 'field bin of red pomegranates', C.brick, x0 + 600, y0 + 10400, x0 + 2000, y0 + 11400, 700);
    I(N, 'aril extractor machine', C.struct, x0 + 2600, y0 + 10400, x0 + 4000, y0 + 11400, 1800);
    I(N, 'tray pack table for export cartons', C.int, x0 + 5000, y0 + 8400, x0 + 6400, y0 + 9100, 914, {check: ['counter_height', 914]});
    I(N, 'juice grade bin for cracked fruit', C.car, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 900);
    act(x0 + 3000, y0 + 7600, 'standing', 'watching fruit roll through the brushes', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'stacking cartons by the cold room', Math.PI);
    act(x0 + 2400, y0 + 8600, 'standing', 'culling sunburned fruit off the rollers', 0);
    act(x0 + 5700, y0 + 9800, 'standing', 'tray packing pomegranates by size', Math.PI);
  }
  // ---- yard, plantings and life on 6,4
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel garlic wagon yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'flatbed stacked with garlic bins'});
    act(a + 12500, yB0 - 3800, 'standing', 'tarping a flatbed of garlic', Math.PI / 2);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada over the fruit sample table'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 141), {part: ['brittlebush bed', 'globe mallow bed', 'desert lavender bed', 'bush muhly bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 7.4 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 6.5 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 41), {part: 'rock lined swale with desert milkweed'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying two pozole to go cups to a pickup', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'loading a rebuilt cylinder on a tailgate', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'pedaling over for a bag of pan dulce', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(6, 4, true, C.car2, 'car', 9000);
  trafficLoop(6, 4, false, C.struct, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 3,4 Chuparosa Street shops deepen
  D('3:4', 'Slickrock Breakfast Grill', [249936, 342992, 262433, 356992], 3353, [
    ['w', 'chalkboard of the breakfast burrito fillings', C.sign, 1200, 1400, 2200],
    ['w', 'shelf of hot sauce bottles for sale', C.brick, 1000, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'framed photo of the grill opening day', C.struct, 600, 1400, 1900],
    ['w', 'paper towel roll holder by the line', C.int, 400, 1200, 1400],
    ['o', 'outlet for the tortilla warmer', 1067],
    ['o', 'outlet for the juice dispenser', 1067],
    ['c', 'grill ceiling fan', C.int, 280, 300, fan],
    ['c', 'grill smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'orange juice dispenser on a stand', C.yellow, 400, 400, 1300],
    ['f', 'tortilla warmer cart', C.car, 500, 400, 1000],
    ['f', 'mop bucket with a wringer', C.yellow, 300, 300, 500],
    ['p', 'standing', 'rolling a burrito in foil'],
    ['p', 'standing', 'pouring orange juice for a kid'],
    ['p', 'standing', 'mopping a spill by the counter'],
  ]);
  D('3:4', 'Cat Claw Tractor Parts', [266700, 342992, 282245, 356992], 3353, [
    ['w', 'wall chart of tractor filter cross references', C.sign, 1200, 1300, 2000],
    ['w', 'pegboard of hitch pins and clips', C.struct, 1500, 1000, 1900],
    ['w', 'shelf of seat cushions', C.int, 1100, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'rack of three point top links', C.yellow, 1200, 600, 1800],
    ['o', 'outlet for the parts counter lamp', 1067],
    ['o', 'outlet for the battery tester', 457],
    ['c', 'parts room ceiling fan', C.int, 280, 300, fan],
    ['c', 'parts room smoke detector', C.int, 90, 60, {disc: 'interior'}],
    ['f', 'barrel of pto shear bolts', C.struct, 0, 0, 900, {r: 300}],
    ['f', 'stack of tractor seats in boxes', C.brick, 600, 500, 900],
    ['f', 'cart of special order parts', C.car2, 600, 400, 900],
    ['p', 'standing', 'boxing up a water pump for a rancher'],
    ['p', 'standing', 'sorting hitch pins by size'],
  ]);
  D('3:4', 'Gourd Vine Pottery Works', [286512, 342992, 295961, 356992], 3353, [
    ['w', 'shelf of test tiles in every glaze', C.car2, 1000, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'apron hooks by the sink', C.car, 600, 1300, 1700],
    ['w', 'framed photo of a raku firing', C.struct, 500, 1400, 1800],
    ['o', 'outlet for the pug mill', 457],
    ['c', 'studio ceiling fan', C.int, 280, 300, fan],
    ['f', 'banding wheel on a stool', C.struct, 0, 0, 700, {r: 200, n: 10, anim: {type: 'spin', rpm: 20}}],
    ['f', 'bucket of slip', C.car2, 0, 0, 400, {r: 180}],
    ['f', 'reclaim clay tub', C.int, 500, 400, 600],
    ['p', 'standing', 'trimming a foot ring on a bowl'],
    ['p', 'standing', 'dipping a mug in turquoise glaze'],
  ]);
  D('3:4', 'Sand Verbena Seed Cleaning Shed', [249936, 365492, 271577, 377684], 5400, [
    ['w', 'board of seed lot tags', C.sign, 1500, 1300, 2100],
    ['w', 'rack of spare cleaner screens', C.struct, 1500, 400, 2200],
    ['w', 'dust mask and earmuff hooks', C.yellow, 600, 1300, 1700],
    ['o', 'outlet for the moisture tester', 1067],
    ['o', 'outlet for the shop vac', 457],
    ['c', 'shed exhaust fan', C.int, 400, 200, {disc: 'interior', anim: {type: 'spin', rpm: 40}}],
    ['f', 'moisture tester on a cart', C.int, 600, 400, 1000],
    ['f', 'pallet of empty seed totes', C.brick, 1200, 1100, 600],
    ['f', 'shop vac', C.yellow, 0, 0, 700, {r: 250}],
    ['p', 'standing', 'testing alfalfa seed moisture'],
    ['p', 'standing', 'vacuuming chaff off the floor'],
  ]);
  D('3:4', 'Windmill Flat Pump Repair', [277788, 365492, 290285, 377684], 3353, [
    ['w', 'chart of pump curves by horsepower', C.sign, 1200, 1300, 2000],
    ['w', 'shelf of check valves', C.brick, 1100, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'reel of pump wire on a wall bracket', C.struct, 800, 1200, 1800],
    ['o', 'outlet for the parts washer', 457],
    ['o', 'outlet for the bench grinder', 1067],
    ['c', 'shop ceiling fan, pump room', C.int, 280, 300, fan],
    ['f', 'parts washer tub', C.car2, 900, 600, 900],
    ['f', 'bench grinder on a pedestal', C.struct, 0, 0, 1000, {r: 200, post: true}],
    ['f', 'crate of torque arrestors', C.brick, 500, 400, 500],
    ['p', 'standing', 'washing a pump bowl in solvent'],
    ['p', 'standing', 'grinding a burr off a shaft key'],
  ]);

  // ================================================================= 3,2 Mesa Lantern block deepen
  D('3:2', 'Mesa Lantern Cafe', [253888, 171640, 265888, 178632], 3048, [
    ['w', 'framed photo of the old cotton gin', C.struct, 600, 1400, 1900],
    ['w', 'rack of to go menus by the door', C.int, 400, 1100, 1500],
    ['o', 'outlet for the milkshake mixer, dining', 1067],
    ['f', 'umbrella stand by the door', C.struct, 0, 0, 600, {r: 150}],
    ['p', 'standing', 'handing a crayon cup to a kid'],
    ['p', 'standing', 'counting the tip jar at closing'],
  ]);
  D('3:2', 'Mesa Lantern Cafe', [250888, 178632, 265888, 183832], 3048, [
    ['w', 'magnetic knife strip', C.struct, 600, 1300, 1400],
    ['w', 'clipboard of the cooler temperature log', C.sign, 300, 1300, 1600],
    ['o', 'outlet for the immersion blender', 1067],
    ['f', 'bus tub of clean silverware', C.int, 500, 350, 800],
    ['p', 'standing', 'rolling silverware into napkins'],
    ['p', 'standing', 'logging the walk in temperature'],
  ]);
  D('3:2', 'Jackrabbit Tire and Lube', [280888, 173640, 286888, 182832], 2743, [
    ['w', 'framed business license', C.struct, 400, 1400, 1700],
    ['w', 'rack of air fresheners', C.car, 400, 1200, 1600],
    ['o', 'outlet for the waiting room coffee', 1067],
    ['p', 'standing', 'picking an air freshener from the rack'],
  ]);
  D('3:2', 'Jackrabbit Tire and Lube', [286888, 173640, 298888, 185832], 5000, [
    ['w', 'tread depth chart on the wall', C.sign, 900, 1300, 1900],
    ['w', 'rack of tire plugs and patches', C.brick, 700, 1200, 1700],
    ['w', 'impact socket rail', C.struct, 900, 1100, 1200],
    ['o', 'outlet for the work light', 457],
    ['f', 'tire spreader on a stand', C.yellow, 600, 500, 1000],
    ['f', 'bucket of tire mounting lube', C.car2, 0, 0, 400, {r: 160}],
    ['f', 'water tank for leak testing', C.plumb, 900, 600, 800],
    ['p', 'standing', 'dunking a tire to find a leak'],
    ['p', 'standing', 'plugging a nail hole in a tread'],
  ]);
  D('3:2', 'Creosote Flats Post Office', [250888, 209640, 266888, 213640], 3048, [
    ['w', 'frame of commemorative stamp sheets', C.car2, 900, 1300, 1800],
    ['w', 'rack of holiday shipping deadline flyers', C.sign, 400, 1100, 1500],
    ['o', 'outlet for the lobby kiosk printer', 457],
    ['p', 'standing', 'reading the holiday shipping dates'],
  ]);
  D('3:2', 'Creosote Flats Post Office', [250888, 213640, 266888, 219640], 3048, [
    ['w', 'pigeonhole shelf of held mail', C.int, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'clipboard of the carrier vehicle log', C.sign, 300, 1300, 1600],
    ['o', 'outlet for the scanner cradle', 1067],
    ['f', 'stack of empty parcel sacks', C.struct, 600, 400, 400],
    ['f', 'hand truck parked by the dock', C.int, 500, 400, 1200],
    ['p', 'standing', 'filing held mail for a vacation stop'],
    ['p', 'standing', 'checking tire pressure on the mail jeep'],
  ]);
  D('3:2', 'Bitterwater Irrigation District Office', [276888, 209640, 284888, 219640], 2743, [
    ['w', 'framed board of directors list', C.struct, 600, 1400, 1800],
    ['w', 'rack of meter reading clipboards', C.int, 600, 1200, 1600],
    ['o', 'outlet for the desk fan', 1067],
    ['f', 'desk fan on a stand', C.int, 0, 0, 1200, {r: 200, n: 10, anim: {type: 'spin', rpm: 80}}],
    ['p', 'standing', 'clipping a meter route to a clipboard'],
  ]);
  D('3:2', 'Bitterwater Irrigation District Office', [284888, 209640, 290888, 219640], 2743, [
    ['w', 'shelf of canal gate gaskets', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'whiteboard of canal outage dates', C.sign, 900, 1200, 1900],
    ['o', 'outlet for the label printer, district', 1067],
    ['f', 'crate of flow meter parts', C.struct, 500, 400, 500],
    ['p', 'standing', 'writing an outage date on the board'],
  ]);

  // ================================================================= 4,2 Javelina block deepen
  D('4:2', 'Javelina Grill and Cantina', [330136, 171640, 341936, 178440], 2743, [
    ['w', 'framed photo of a rodeo queen', C.struct, 600, 1400, 1900],
    ['w', 'shelf of tequila bottles behind the bar', C.car2, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the lime squeezer', 1067],
    ['f', 'ice bin cart for the bar', C.int, 500, 400, 900],
    ['p', 'standing', 'rimming a glass with chile salt'],
    ['p', 'standing', 'bringing a fresh basket of chips'],
  ]);
  D('4:2', 'Javelina Grill and Cantina', [330136, 178440, 345136, 183832], 2743, [
    ['w', 'tortilla press hanging on a hook', C.struct, 300, 1300, 1500],
    ['w', 'shelf of dried chile bags', C.car, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['o', 'outlet for the rice cooker, kitchen', 1067],
    ['f', 'tub of marinating pollo asado', C.yellow, 500, 400, 600],
    ['p', 'standing', 'pressing tortillas by hand'],
    ['p', 'standing', 'toasting guajillos on the comal'],
  ]);
  D('4:2', 'Sandstorm Pivot Irrigation Supply', [351136, 171640, 365936, 178640], 3353, [
    ['w', 'framed aerial photo of pivot circles', C.struct, 900, 1400, 1900],
    ['w', 'rack of pivot end gun nozzles', C.yellow, 900, 1100, 1700],
    ['o', 'outlet for the counter calculator', 1067],
    ['f', 'drop hose sample bin', C.plumb, 600, 400, 700],
    ['p', 'standing', 'comparing two end gun nozzles'],
    ['p', 'standing', 'paying for a pivot tire by card'],
  ]);
  D('4:2', 'Sandstorm Pivot Irrigation Supply', [351136, 178640, 369136, 185640], 3353, [
    ['w', 'shelf of span cable reels', C.struct, 1200, 1700, 1750, {check: ['shelf_height', 1700]}],
    ['w', 'clipboard of pallet receiving', C.sign, 300, 1300, 1600],
    ['o', 'outlet for the banding tool charger', 457],
    ['f', 'stack of pivot tower tires', C.struct, 0, 0, 1200, {r: 550, n: 12}],
    ['f', 'crate of drive shaft couplers', C.brick, 700, 500, 600],
    ['p', 'standing', 'rolling a pivot tire to the dock'],
    ['p', 'standing', 'banding a pallet of couplers'],
  ]);
  D('4:2', 'Borrego Flats Tractor Rental', [373136, 171640, 378936, 177736], 2743, [
    ['w', 'framed price sheet of daily rates', C.sign, 600, 1300, 1800],
    ['w', 'hook of spare ignition keys', C.struct, 300, 1300, 1500],
    ['o', 'outlet for the receipt printer, rental', 1067],
    ['p', 'standing', 'reading the daily rates to a caller'],
  ]);
  D('4:2', 'Kit Fox Bunkhouse', [370136, 208640, 378136, 220832], 2743, [
    ['w', 'hook of reflective work vests', C.yellow, 400, 1300, 1700],
    ['w', 'window shade pulled half down', C.int, 900, 1000, 2000],
    ['o', 'outlet for the clock radio', 457],
    ['f', 'duffel bag at the foot of a bunk', C.car2, 600, 300, 300],
    ['p', 'standing', 'packing a duffel for the weekend'],
  ]);
  D('4:2', 'Kit Fox Bunkhouse', [378136, 208640, 384136, 216640], 2743, [
    ['w', 'wall shelf of lunch coolers', C.int, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'map of the ranch fields', C.sign, 900, 1300, 1900],
    ['o', 'outlet for the slow cooker, bunkhouse', 1067],
    ['f', 'cooler of ice water jugs', C.car, 500, 400, 500],
    ['p', 'standing', 'filling a water jug for the field'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
