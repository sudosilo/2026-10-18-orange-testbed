// Agent Orange 2026-11-06 a: claim block 6,3 and build the Tufa Spring corner (chile verde diner, drip tape supply, tractor glass,
// onion curing shed, jujube packing house), then deepen 0,3 Sagebrush Hill, 1,3 apartments and cottages, and 3,3 Agave Street shops and grange.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611106; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 6,3
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, VSTREET, HSTREET} = k;
  VSTREET[7] = VSTREET[7] || 'Tarantula Avenue';
  claim(6, 3);
  streets(6, 3, {s: true, w: true, n: true, e: true});
  const ox = 6 * S, oy = 3 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Tufa Spring corner shops');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Kangaroo Rat onion and jujube yard');

  // front parking along Agave Street
  const yA = oy + 26000, yAB = yA + 14000;
  const stallY = oy + PL + 2000, aisleY = yA - 6700;
  hatch('paving', C.curb, rect(a, aisleY, b, yA - 1800), 'dots', 1100, 0, {part: 'front drive aisle'}, C.struct);
  hatch('paving', C.curb, rect(a + 3048, yA - 1500, b - 3048, yA - 100, 152), 'lines', 600, 90, {part: 'front walk along the shops', checks: [['sidewalk_width', 1524]]});
  const dx0 = a + 24000, dx1 = dx0 + 7316;
  hatch('paving', C.curb, rect(dx0, oy + CURB, dx1, aisleY), 'dots', 1000, 0, {part: 'driveway off Agave Street'}, C.struct);
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



  // ---- Tufa Spring Chile Verde Diner
  {
    const N = 'Tufa Spring Chile Verde Diner', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.veg2, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front windows painted with a green chile and a coffee cup'});
    for (let s = 0; s < 5; s++) IC(N, 'green vinyl counter stool ' + (s + 1), C.veg2, x0 + 5200 + s * 900, y0 + 5600, 200, 760, {n: 8});
    I(N, 'formica lunch counter', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'flat top for eggs and hash browns', C.struct, x0 + 5200, y0 + 9800, x0 + 7000, y0 + 10600, 914, {check: ['counter_height', 914]});
    IC(N, 'stock pot of pork chile verde', C.veg2, x0 + 7600, y0 + 10200, 320, 1300, {n: 12});
    I(N, 'hood over the flat top', C.struct, x0 + 5000, y0 + 9800, x0 + 8200, y0 + 10900, 2100);
    I(N, 'steam table of beans and rice', C.car2, x0 + 8600, y0 + 9800, x0 + 10200, y0 + 10500, 914);
    I(N, 'kitchen ticket printer at the pass', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'order wheel rail at the pass'});
    I(N, 'heat lamp shelf at the pass', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'pie case with a lemon meringue', C.car2, x0 + 10400, y0 + 6100, x0 + 11400, y0 + 6600, 1300);
    I(N, 'iced tea and coffee station', C.car, x0 + 11800, y0 + 6000, x0 + 12900, y0 + 6600, 1200);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'window booth table ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'sack of roasted green chiles', C.veg2, x0 + 10800, y0 + 9800, x0 + 11600, y0 + 10500, 600);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for two plates of chile verde', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'counting change back into the drawer', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'flipping hash browns on the flat top', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'mopping up chile verde with a tortilla', 0);
    act(x0 + 7400, y0 + 5100, 'sitting', 'stirring sugar into a diner coffee', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'reading the paper in the window booth', Math.PI);
  }
  // ---- Ghost Flower Drip Tape Supply
  {
    const N = 'Ghost Flower Drip Tape Supply', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.plumb, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'counter window onto the lot'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'shelving of drip fittings and emitters, row ' + (r + 1), C.plumb, rx, y0 + 5000, rx + 900, y0 + 10600, 1828, {check: ['shelf_height', 1828]}); }
    I(N, 'order terminal for field layouts', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of drip tape reels', C.plumb, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 1100, {color2: C.struct});
    I(N, 'sand media filter tank on display', C.struct, x0 + 14400, y0 + 7000, x0 + 15600, y0 + 7800, 1000);
    for (let j = 0; j < 3; j++) IC(N, 'coil of poly lay flat hose ' + (j + 1), C.car, x0 + 2000 + j * 1500, y0 + 10500, 350, 800 + j * 10, {n: 10});
    I(N, 'wall of pressure regulators in bins', C.veg2, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1700, {check: ['shelf_height', 1700]});
    I(N, 'bench with a pipe threader', C.int, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'fertilizer injector pump on a skid', C.car, x0 + 3000, y0 + 7200, x0 + 3900, y0 + 7900, 1200);
    I(N, 'cutting table for lay flat hose', C.int, x0 + 15000, y0 + 9000, x0 + 16800, y0 + 9600, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for ten reels of drip tape', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'printing a pick list for a melon field', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'threading a pipe nipple at the bench', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'filling a bag with emitter plugs', Math.PI / 2);
  }
  // ---- Scorpion Wash Tractor Glass
  {
    const N = 'Scorpion Wash Tractor Glass', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.car2, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'shop window'});
    IC(N, 'glass drill turning on a cab door pane', C.car2, x0 + 5600, y0 + 8000, 280, 1050, {n: 12, anim: {type: 'spin', rpm: 40}});
    I(N, 'padded glass cutting table', C.int, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 940, {check: ['counter_height', 940]});
    I(N, 'A frame rack of cab glass panes', C.car2, x0 + 3200, y0 + 9400, x0 + 4600, y0 + 10600, 1800);
    I(N, 'shelf of urethane tubes and primers', C.brick, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1600, {check: ['shelf_height', 1600]});
    I(N, 'shelf of rubber window gaskets', C.struct, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'combine door on a glazing stand', C.yellow, x0 + 600, y0 + 6400, x0 + 2200, y0 + 7200, 1100);
    I(N, 'suction cup lifter cart', C.int, x0 + 600, y0 + 4400, x0 + 1400, y0 + 5000, 1000);
    I(N, 'drill stand base', C.struct, x0 + 5200, y0 + 7600, x0 + 6000, y0 + 8400, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a new tractor windshield', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'writing a cab glass order slip', Math.PI);
    act(x0 + 1600, y0 + 8500, 'standing', 'scoring a pane on the cutting table', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'pulling a pane off the A frame', 0);
  }
  // ---- Kangaroo Rat Onion Curing Shed (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Kangaroo Rat Onion Curing Shed', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.yellow, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'open bay for onion trailers'});
    for (let t = 0; t < 4; t++) I(N, 'stack of onion bulk bins ' + (t + 1), C.yellow, x0 + 1500 + (t % 2) * 3600, y0 + 6000 + Math.floor(t / 2) * 2800, x0 + 4300 + (t % 2) * 3600, y0 + 8200 + Math.floor(t / 2) * 2800, 2400);
    IC(N, 'curing fan turning over the bins', C.struct, x0 + 18200, y0 + 8300, 600, 1300, {n: 12, anim: {type: 'spin', rpm: 30}});
    I(N, 'onion topper and sizer hopper', C.car, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 10200, 2200);
    I(N, 'scale for fifty pound onion sacks', C.int, x0 + 17000, y0 + 3600, x0 + 18600, y0 + 4600, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of red mesh onion sacks', C.car, x0 + 21000, y0 + 3600, x0 + 22400, y0 + 5000, 1300);
    I(N, 'whiteboard of loads by buyer', C.sign, x0 + 12000, y1 - 400, x0 + 14500, y1 - 250, 2200);
    act(x0 + 4800, y0 + 5200, 'standing', 'checking onion necks for dryness', 0);
    act(x0 + 22300, y0 + 7800, 'standing', 'tipping a bin into the sizer hopper', Math.PI);
    act(x0 + 17800, y0 + 5200, 'standing', 'tying off a sack of yellow onions', Math.PI);
    act(x0 + 13200, y0 + 2000, 'standing', 'waving a trailer back into the bay', Math.PI);
  }
  // ---- Blackbrush Jujube Packing House (back row)
  {
    const N = 'Blackbrush Jujube Packing House', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'brick', fc: C.brick, noCeil: true, beam: 4572, lightZ: 4200});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up door to the fruit receiving dock'});
    I(N, 'wash flume for fresh jujubes', C.car2, x0 + 1200, y0 + 6200, x0 + 7000, y0 + 7000, 1000);
    IC(N, 'drying rack fan turning', C.struct, x0 + 11100, y0 + 6500, 600, 1100, {n: 12, anim: {type: 'spin', rpm: 25}});
    I(N, 'stainless sorting belt', C.int, x0 + 600, y0 + 9200, x0 + 4200, y0 + 10000, 1000);
    I(N, 'lug of ripe red jujubes', C.brick, x0 + 600, y0 + 10400, x0 + 2000, y0 + 11400, 700);
    I(N, 'dehydrator cabinet for dried fruit', C.struct, x0 + 2600, y0 + 10400, x0 + 4000, y0 + 11400, 1800);
    I(N, 'clamshell packing table', C.int, x0 + 5000, y0 + 8400, x0 + 6400, y0 + 9100, 914, {check: ['counter_height', 914]});
    I(N, 'cull bin for split fruit', C.veg2, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 900);
    act(x0 + 3000, y0 + 7600, 'standing', 'skimming leaves out of the wash flume', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'turning a tray on the drying rack', Math.PI);
    act(x0 + 2400, y0 + 8600, 'standing', 'pulling split jujubes off the belt', 0);
    act(x0 + 5700, y0 + 9800, 'standing', 'snapping a clamshell of jujubes shut', Math.PI);
  }
  // ---- yard, plantings and life on 6,3
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel onion trailer yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'bob truck stacked with onion bins'});
    act(a + 12500, yB0 - 3800, 'standing', 'ratcheting a strap over the onion bins', Math.PI / 2);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada over the jujube sample table'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 131), {part: ['desert marigold bed', 'apricot mallow bed', 'blue sage and penstemon bed', 'deer grass bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 7.1 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 6.2 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 37), {part: 'gravel swale with bunch grasses'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a to go bag of chile verde to a truck', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'sliding a new windshield into a pickup bed', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'pedaling over for a slice of pie', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(6, 3, true, C.car2, 'car', 9000);
  trafficLoop(6, 3, false, C.struct, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 0,3 Sagebrush Hill deepen
  D('0:3', 'Sagebrush Hill Chapel', [34747, 258888, 44501, 274128], 4877, [
    ['w', 'rack of offering envelopes by the door', C.int, 400, 1100, 1500],
    ['w', 'framed list of pastors since the founding', C.struct, 600, 1400, 1900],
    ['w', 'coat hooks by the narthex door', C.struct, 900, 1500, 1700],
    ['w', 'stained glass window of a gambel quail', C.yellow, 900, 1500, 3600, {hatch: 'cross', sp: 220, hatch2: C.brick}],
    ['o', 'outlet for the sound board', 457],
    ['o', 'outlet for the christmas tree lights', 457],
    ['c', 'nave ceiling fan', C.int, 280, 300, fan],
    ['c', 'exit light over the side door', C.elec, 120, 2000, Object.assign({disc: 'interior'}, glow(5))],
    ['f', 'box of donated hymnals', C.brick, 300, 250, 300],
    ['f', 'flower stand of desert marigolds', C.yellow, 0, 0, 1000, {r: 220, n: 8, post: true}],
    ['p', 'standing', 'arranging marigolds by the altar'],
    ['p', 'standing', 'setting out bulletins for sunday'],
  ]);
  D('0:3', 'Sagebrush Hill Fellowship Hall', [15911, 261888, 23836, 271032], 2743, [
    ['w', 'whiteboard of the youth group schedule', C.sign, 1200, 1100, 1900],
    ['w', 'shelf of jigsaw puzzle boxes', C.int, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'banner for vacation bible school', C.car2, 1500, 1800, 2400],
    ['o', 'outlet for the popcorn machine', 1067],
    ['o', 'outlet for the karaoke speaker', 457],
    ['c', 'hall ceiling fan', C.int, 280, 300, fan],
    ['c', 'hall exit light', C.elec, 120, 200, Object.assign({disc: 'interior'}, glow(4))],
    ['f', 'popcorn machine on a cart', C.car, 500, 400, 1500],
    ['f', 'bin of craft supplies', C.yellow, 400, 300, 400],
    ['p', 'standing', 'popping corn for movie night'],
    ['p', 'standing', 'cutting out paper doves with the kids'],
    ['p', 'standing', 'sorting donated canned food'],
  ]);
  D('0:3', 'Sagebrush Hill Fellowship Hall', [11644, 261888, 15911, 267374], 2743, [
    ['w', 'hooks of potluck aprons', C.car, 700, 1300, 1800],
    ['w', 'shelf of slow cookers', C.int, 900, 1600, 1650, {check: ['shelf_height', 1600]}],
    ['o', 'outlet for a slow cooker', 1067],
    ['c', 'kitchen exhaust fan', C.int, 150, 200, {disc: 'interior', anim: {type: 'spin', rpm: 60}}],
    ['p', 'standing', 'wiping down the kitchen counter'],
  ]);
  D('0:3', 'Sagebrush Hill Parsonage', [57104, 296848, 61981, 305382], 2438, [
    ['w', 'shelf of concordances and hymnals', C.brick, 900, 1800, 1850, {check: ['shelf_height', 1800]}],
    ['w', 'framed photo of a church picnic', C.yellow, 400, 1400, 1800],
    ['f', 'footstool by the study chair', C.brick, 400, 300, 400],
    ['o', 'outlet for the laptop charger', 457],
    ['p', 'standing', 'typing the church newsletter'],
  ]);
  D('0:3', 'Sagebrush Hill Parsonage', [61981, 296848, 67467, 301115], 2438, [
    ['w', 'rack of pot holders by the stove', C.car, 400, 1300, 1600],
    ['w', 'potluck calendar on the fridge side', C.sign, 300, 1300, 1700],
    ['o', 'outlet for the toaster', 1067],
    ['f', 'trash and recycling bins', C.struct, 300, 300, 700],
    ['p', 'standing', 'drying dishes by the sink'],
  ]);
  D('0:3', 'Sagebrush Hill Parsonage', [61981, 301115, 67467, 305382], 2438, [
    ['w', 'framed wedding photo', C.struct, 400, 1400, 1800],
    ['w', 'hook with a bathrobe', C.car2, 300, 1300, 1700],
    ['f', 'wicker laundry hamper', C.yellow, 250, 250, 650],
    ['o', 'outlet for the alarm clock', 457],
    ['p', 'standing', 'folding towels at the foot of the bed'],
  ]);

  // ================================================================= 1,3 apartments and cottages deepen
  {
    const xs = [92392, 99707, 107022, 114337, 121652];
    const low = [
      ['key hooks by the door', 'laundry basket of work uniforms', 'outlet for the window cooler', 'counting tips at the kitchen counter'],
      ['kid drawing taped to the wall', 'toy bin by the couch', 'outlet for the game console', 'stacking blocks with a toddler'],
      ['wall mounted tv', 'box fan on the floor', 'outlet for the tv', 'cheering at the late game'],
      ['framed photo of a quarter horse', 'cooler of sodas by the door', 'outlet for the rice cooker', 'scooping rice from the rice cooker'],
    ];
    const up = ['calendar of payday fridays', 'framed band poster', 'hat rack of ball caps', 'wall shelf of potted pothos'];
    for (let u = 0; u < 4; u++) {
      const R = [xs[u], 250888, xs[u + 1], 260032], L = low[u], A = ', unit A' + (u + 1);
      D('1:3', 'Tumbleweed Terrace Apartments', R, 2438, [
        ['w', L[0] + A, C.struct, 500, 1200, 1700],
        ['f', L[1] + A, C.int, 350, 300, 500, u === 2 ? {anim: {type: 'spin', rpm: 90}} : {}],
        ['o', L[2] + A, 457],
        ['w', up[u] + ', unit B' + (u + 1), C.car2, 600, 3048 + 1300, 3048 + 1800],
        ['p', 'standing', L[3]],
      ]);
    }
    const cot = [
      ['Caliche Lane Cottage', 90392, 'shelf of salt and pepper shakers', 'tv tray with a crossword', 'hook with a sunday dress', 'outlet for the heating pad', 'doing the crossword in pen'],
      ['Packrat Hollow Cottage', 105192, 'framed belt buckle collection', 'box of fabric scraps', 'mirror over the dresser', 'outlet for the iron', 'pinning the hem on a dress'],
      ['Dust Pan Cottage', 119992, 'wall rack of fishing rods', 'tackle box by the door', 'hook of dog leashes', 'outlet for the dog water fountain', 'clipping a leash on the old dog'],
      ['Lantern Wash Cottage', 134792, 'framed watercolor of an ocotillo bloom', 'jar of brushes on a stool', 'shelf of sketchbooks', 'outlet for the easel lamp', 'washing brushes in a jar'],
    ];
    for (const [N, x0, w1, f1, w2, o1, p1] of cot) {
      D('1:3', N, [x0, 298033, x0 + 4572, 305348], 2438, [
        ['w', w1, C.int, 600, 1300, 1700],
        ['f', f1, C.brick, 300, 300, 600],
        ['c', 'living room light fixture', C.yellow, 150, 60, {disc: 'interior'}],
        ['p', 'standing', p1],
      ]);
      D('1:3', N, [x0 + 4572, 298033, x0 + 9144, 305348], 2438, [
        ['w', w2, C.struct, 500, 1300, 1800, /shelf/.test(w2) ? {check: ['shelf_height', 1500]} : {}],
        ['o', o1, 457],
      ]);
    }
  }

  // ================================================================= 3,3 Agave Street shops and grange deepen
  D('3:3', 'Sun Dog Donut Counter', [250888, 250888, 260888, 256388], 2743, [
    ['w', 'chalkboard of the daily special', C.sign, 900, 1400, 2100],
    ['w', 'shelf of coffee bean bags for sale', C.brick, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['o', 'outlet for the drink blender', 1067],
    ['p', 'standing', 'ordering coffee for the work crew'],
    ['p', 'standing', 'wiping crumbs off a cafe table'],
  ]);
  D('3:3', 'Sun Dog Donut Counter', [250888, 256388, 257888, 259888], 2743, [
    ['w', 'clipboard of the fryer oil log', C.sign, 300, 1300, 1600],
    ['o', 'outlet for the dough scale', 1067],
    ['f', 'bucket of chocolate icing', C.brick, 200, 200, 400],
    ['p', 'standing', 'weighing dough for the next batch'],
  ]);
  D('3:3', 'Burro Flats Welding and Fab', [266888, 250888, 272888, 256888], 2743, [
    ['w', 'framed photo of a finished ranch gate', C.struct, 600, 1400, 1900],
    ['w', 'key cabinet for customer trailers', C.int, 400, 1300, 1800],
    ['o', 'outlet for the label maker', 1067],
    ['p', 'standing', 'answering the shop phone'],
  ]);
  D('3:3', 'Burro Flats Welding and Fab', [272888, 250888, 284888, 266888], 5800, [
    ['w', 'chalkboard of the day jobs', C.sign, 1500, 1300, 2300],
    ['w', 'shop air hose reel', C.car, 500, 1600, 2100],
    ['w', 'first aid kit on the wall', C.car, 400, 1300, 1700],
    ['f', 'barrel of welding wire spools', C.struct, 0, 0, 900, {r: 300}],
    ['f', 'drum of cutting fluid', C.car2, 0, 0, 900, {r: 300}],
    ['o', 'outlet for the battery charger, shop', 1067],
    ['c', 'big shop ceiling fan', C.int, 280, 300, fan],
    ['p', 'standing', 'measuring a gate with a tape'],
    ['p', 'standing', 'chalking a cut line on a plate'],
  ]);
  D('3:3', 'Dry Lake Implement Sales', [290888, 250888, 304888, 256888], 3658, [
    ['w', 'framed photo of a tractor pull win', C.struct, 700, 1400, 1900],
    ['w', 'rack of work gloves', C.yellow, 900, 1000, 1700],
    ['f', 'bale spear attachment on display', C.yellow, 1100, 600, 800],
    ['o', 'outlet for the showroom tv', 1067],
    ['p', 'standing', 'testing the seat on a lawn tractor'],
    ['p', 'standing', 'reading a brochure on small balers'],
  ]);
  D('3:3', 'Dry Lake Implement Sales', [290888, 256888, 304888, 262888], 3048, [
    ['w', 'shelf of spark plugs and points', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'board of special order tags', C.sign, 900, 1200, 1800],
    ['f', 'cart of returned parts', C.struct, 500, 350, 900],
    ['o', 'outlet for the parts scanner', 1067],
    ['p', 'standing', 'scanning a box of filters into stock'],
  ]);
  D('3:3', 'Saltcedar Grange Hall', [252888, 285888, 270888, 301888], 3658, [
    ['w', 'framed photo of the old fair board', C.struct, 800, 1400, 1900],
    ['w', 'shelf of 4-h record books', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'pull down projection screen', C.int, 2400, 1200, 3300],
    ['o', 'outlet for the bingo blower', 457],
    ['c', 'hall smoke detector', C.elec, 90, 60],
    ['f', 'bingo ball cage on a card table', C.yellow, 0, 0, 1000, {r: 250, n: 10, anim: {type: 'spin', rpm: 30}}],
    ['f', 'box of door prizes', C.car, 400, 300, 500],
    ['p', 'standing', 'calling bingo numbers'],
    ['p', 'standing', 'hanging a fair poster by the door'],
    ['p', 'standing', 'checking a bingo card twice'],
  ]);
  D('3:3', 'Saltcedar Grange Hall', [270888, 291888, 276888, 301888], 2743, [
    ['w', 'clipboard of kitchen volunteer shifts', C.sign, 300, 1300, 1600],
    ['w', 'rack of cast iron pans', C.struct, 900, 1500, 1900],
    ['o', 'outlet for the waffle iron', 1067],
    ['c', 'kitchen smoke detector, grange', C.int, 90, 60, {disc: 'interior'}],
    ['p', 'standing', 'flipping sausage patties'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
