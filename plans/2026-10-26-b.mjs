// Agent Orange 2026-10-26 b: claim block 2,4 and build the Smokethorn farm service block (ag co-op, panaderia,
// small engine shop, hay barn, large animal clinic) on Chuparosa Street and new Desert Holly Street,
// then deepen 3,3, 1,0 and 1,2 with the cached site() picker from the 2026-10-25-c plan.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 90216; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  const {push} = k;

  const {S, PL, CURB, wall, run, door, tree, lot, claim, streets, trafficLoop, box, blob, wavy, rounded, HSTREET} = k;

  // ================================================================= NEW BLOCK 2,4
  // Smokethorn farm service block on Chuparosa Street: ag co-op, panaderia, small engine shop,
  // hay barn and a large animal clinic, with a rear service alley between the two rows.
  HSTREET[5] = HSTREET[5] || 'Desert Holly Street';
  claim(2, 4);
  streets(2, 4, {s: true, w: true, n: true, e: true});
  const ox = 2 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Smokethorn farm service row');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Smokethorn hay and clinic yard');

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

  // ---- Smokethorn Ag Co-op
  {
    const N = 'Smokethorn Ag Co-op', x0 = a + 3048, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.veg, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 11000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass'});
    for (let g = 0; g < 3; g++) { const gx = x0 + 6000 + g * 2600; I(N, 'gondola of work gloves, fencing pliers and fly spray ' + (g + 1), C.int, gx, y0 + 4800, gx + 900, y0 + 8400, 1524, {check: ['shelf_height', 1524]}); }
    I(N, 'pallet of 50 lb sacks of horse feed', C.brick, x0 + 14000, y0 + 4800, x0 + 15200, y0 + 6000, 1000, {color2: C.yellow});
    I(N, 'pallet of layer pellets', C.yellow, x0 + 14000, y0 + 7000, x0 + 15200, y0 + 8200, 900, {color2: C.brick});
    I(N, 'stack of salt and mineral blocks', C.struct, x0 + 14000, y0 + 9200, x0 + 15000, y0 + 10000, 500);
    for (let j = 0; j < 3; j++) IC(N, 'roll of field fence ' + (j + 1), C.struct, x0 + 1600 + j * 1300, y0 + 10500, 500, 1200, {n: 10});
    I(N, 'rack of t posts', C.veg2, x0 + 900, y0 + 5200, x0 + 4400, y0 + 5600, 1300);
    I(N, 'wall shelf of livestock vaccines in a fridge', C.car2, x0 + 300, y0 + 7000, x0 + 900, y0 + 8000, 1830, {check: ['shelf_height', 1830]});
    I(N, 'coffee pot for regulars on a side table', C.brick, x0 + 4000, y0 + 3000, x0 + 4600, y0 + 3500, 900);
    line('interior', C.sign, [P(x0 + 600, y0 + 2820, 2000), P(x0 + 3600, y0 + 2820, 2000), P(x0 + 3600, y0 + 2820, 2700), P(x0 + 600, y0 + 2820, 2700)], {building: N, part: 'grain and hay price board'}, closed);
    for (let i = 0; i < 2; i++) IC(N, 'store ceiling fan ' + (i + 1), C.int, x0 + 7000 + i * 5000, y0 + 10500, 650, 3300, {anim: {type: 'spin', rpm: 50}});
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a sack of feed by card', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'ringing up fence staples', Math.PI);
    act(x0 + 7450, y0 + 6600, 'standing', 'comparing two pairs of work gloves', Math.PI / 2);
    act(x0 + 13300, y0 + 6500, 'standing', 'hefting a sack of horse feed', Math.PI / 2);
    act(x0 + 4300, y0 + 4300, 'standing', 'pouring a free cup of coffee');
    act(x0 + 2900, y0 + 9300, 'standing', 'measuring a roll of field fence', 0);
  }
  // ---- Sweetbush Panaderia
  {
    const N = 'Sweetbush Panaderia', x0 = a + 3048 + 18288 + 1524, x1 = x0 + 10668, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 9500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'bakery window'});
    I(N, 'glass case of conchas and orejas', C.int, x0 + 4400, y0 + 2400, x0 + 8400, y0 + 3100, 1100, {check: ['counter_height', 1100]});
    for (let j = 0; j < 3; j++) I(N, 'self serve rack of pan dulce trays ' + (j + 1), C.brick, x0 + 5000 + j * 1300, y0 + 4600, x0 + 5800 + j * 1300, y0 + 5200, 1700, {check: ['shelf_height', 1700]});
    I(N, 'stack of aluminum trays and tongs', C.struct, x0 + 4600, y0 + 1000, x0 + 5300, y0 + 1500, 950);
    I(N, 'three deck bread oven', C.struct, x0 + 600, y0 + 9000, x0 + 2600, y0 + 10500, 1900);
    for (let d = 0; d < 3; d++) line('interior', C.brick, [P(x0 + 600, y0 + 9000, 500 + d * 450), P(x0 + 2600, y0 + 9000, 500 + d * 450)], {building: N, part: 'oven deck door ' + (d + 1)});
    I(N, '60 quart planetary mixer', C.int, x0 + 3600, y0 + 9200, x0 + 4400, y0 + 10000, 1400);
    I(N, 'wood topped bench with bolillo dough', C.brick, x0 + 4800, y0 + 8000, x0 + 7800, y0 + 8900, 914, {check: ['counter_height', 914]});
    I(N, 'proof cabinet', C.car2, x0 + 600, y0 + 6400, x0 + 1400, y0 + 7200, 1950);
    I(N, 'speed rack of cooling bolillos', C.struct, x0 + 2000, y0 + 6400, x0 + 2600, y0 + 7200, 1750, {check: ['shelf_height', 1750]});
    I(N, 'kitchen order printer', C.int, x0 + 4800, y0 + 8100, x0 + 5100, y0 + 8350, 1180);
    I(N, 'cafe table by the window', C.int, x0 + 6800, y0 + 600, x0 + 7600, y0 + 1400, 760);
    IC(N, 'oven hood fan', C.int, x0 + 1600, y0 + 9750, 400, 2600, {anim: {type: 'spin', rpm: 60}, n: 8});
    act(x0 + 6400, y0 + 1700, 'standing', 'picking conchas with tongs', Math.PI);
    act(x0 + 6400, y0 + 3800, 'standing', 'boxing a dozen pan dulce', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'counting change into the cash drawer', Math.PI);
    act(x0 + 1600, y0 + 8300, 'standing', 'sliding bolillos into the deck oven', Math.PI);
    act(x0 + 6300, y0 + 9500, 'standing', 'shaping bolillos on the bench', Math.PI);
    act(x0 + 7200, y0 + 2000, 'sitting', 'dunking a concha in cafe de olla', 0);
  }
  // ---- Bajada Small Engine Repair
  {
    const N = 'Bajada Small Engine Repair', x0 = a + 3048 + 18288 + 1524 + 10668 + 1524, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.struct, pos: true});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up service door'});
    I(N, 'riding mower on a scissor lift', C.veg, x0 + 8400, y0 + 5000, x0 + 10200, y0 + 7200, 800);
    I(N, 'teardown bench with a tiller engine', C.struct, x0 + 600, y0 + 6200, x0 + 4200, y0 + 7000, 940, {check: ['counter_height', 940]});
    I(N, 'solvent parts washer', C.car2, x0 + 5200, y0 + 6200, x0 + 6200, y0 + 6900, 960);
    I(N, 'blade grinder and balancer stand', C.int, x0 + 600, y0 + 9000, x0 + 1400, y0 + 9800, 1000);
    line('interior', C.brick, [P(x0 + 120, y0 + 3800, 1300), P(x0 + 120, y0 + 5600, 1300), P(x0 + 120, y0 + 5600, 2000), P(x0 + 120, y0 + 3800, 2000)], {building: N, part: 'wall rack of chainsaws for sale'}, closed);
    I(N, 'line of string trimmers waiting for pickup', C.veg2, x0 + 11600, y0 + 9000, x0 + 12000, y0 + 11400, 1200);
    I(N, 'carburetor rebuild kit drawers', C.int, x0 + 2600, y0 + 9000, x0 + 4000, y0 + 9500, 1300, {check: ['shelf_height', 1300]});
    I(N, 'drain pan of old two stroke mix', C.brick, x0 + 10800, y0 + 6000, x0 + 11400, y0 + 6500, 120);
    for (let m = 0; m < 4; m++) I(N, 'push mower tagged for repair ' + (m + 1), [C.car, C.veg, C.yellow, C.car2][m], x0 + 5200 + m * 900, y0 + 10200, x0 + 5800 + m * 900, y0 + 11200, 450);
    act(x0 + 2400, y0 + 7600, 'standing', 'rebuilding a carburetor at the bench', Math.PI);
    act(x0 + 9300, y0 + 4200, 'standing', 'checking blade wear under the lift', 0);
    act(x0 + 1000, y0 + 10500, 'standing', 'balancing a mower blade on the cone', Math.PI);
    act(x0 + 2000, y0 + 1800, 'standing', 'dropping off a chainsaw for a tune up', 0);
    act(x0 + 5700, y0 + 7600, 'standing', 'scrubbing a carb bowl in solvent', Math.PI);
  }
  // ---- Smokethorn Hay Barn (back row, faces the alley)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Smokethorn Hay Barn', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.brick, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'sliding barn door, open'});
    for (let r = 0; r < 4; r++) for (let t = 0; t < 3; t++) { const bx = x0 + 600 + r * 2500; I(N, 'stack of alfalfa large squares, column ' + (r + 1) + ' tier ' + (t + 1), C.veg2, bx, y1 - 3200, bx + 2400, y1 - 600, 900 * (t + 1), {color2: C.yellow}); }
    for (let j = 0; j < 6; j++) I(N, 'small bale of bermuda hay ' + (j + 1), C.yellow, x0 + 13000 + (j % 3) * 1300, y1 - 2400 + Math.floor(j / 3) * 700, x0 + 14100 + (j % 3) * 1300, y1 - 1900 + Math.floor(j / 3) * 700, 450);
    I(N, 'compact tractor with a bale spear', C.car, x0 + 12000, y0 + 4200, x0 + 13500, y0 + 7200, 1400);
    IC(N, 'tractor rear tire, left', C.struct, x0 + 12000, y0 + 6600, 550, 550, {n: 10});
    IC(N, 'tractor rear tire, right', C.struct, x0 + 13500, y0 + 6600, 550, 550, {n: 10});
    line('interior', C.struct, [P(x0 + 12750, y0 + 4200, 600), P(x0 + 12750, y0 + 3000, 600)], {building: N, part: 'bale spear tine'});
    line('interior', C.struct, [P(x0 + 17000, y0 + 7500, 400), P(x0 + 21500, y0 + 7500, 3600)], {building: N, part: 'bale elevator conveyor', anim: {type: 'bob', mm: 30, period: 0.6}});
    I(N, 'platform scale for weighing bales', C.int, x0 + 17000, y0 + 3000, x0 + 19400, y0 + 4800, 150);
    I(N, 'twine and baling wire bin', C.brick, x0 + 22500, y0 + 4500, x0 + 23500, y0 + 5300, 700);
    line('plumbing', C.plumb, [P(x0 + 23800, y0 + 3000, -900), P(x0 + 23800, y0 + 3000, 900)], {building: N, part: 'frost free yard hydrant'});
    act(x0 + 4200, y1 - 3900, 'standing', 'pulling a flake of alfalfa for a buyer', 0);
    act(x0 + 14000, y1 - 3000, 'standing', 'stacking bermuda bales by hand', Math.PI);
    act(x0 + 18200, y0 + 5600, 'standing', 'reading the bale weight off the scale', Math.PI);
    act(x0 + 11000, y0 + 5600, 'standing', 'climbing onto the tractor seat', Math.PI / 2);
    act(x0 + 21000, y0 + 6600, 'standing', 'feeding bales onto the elevator', Math.PI / 2);
  }
  // ---- Bajada Large Animal Clinic
  {
    const N = 'Bajada Large Animal Clinic', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 4572, 's', {facade: 'brick', fc: C.struct, pos: true});
    wall(N, [[x0 + 7000, y0 + 4200], [x0 + 7000, y1]], 3048, 0, false, C.int);
    door(N, x0 + 7000, y0 + 4800, 'y', 1067, 'door to the treatment barn', 1);
    I(N, 'waiting room bench', C.int, x0 + 600, y0 + 4200, x0 + 2400, y0 + 4700, 450);
    I(N, 'shelf of wormer paste and fly spray for sale', C.veg, x0 + 3200, y0 + 4400, x0 + 5600, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'pharmacy counter with pill counter tray', C.brick, x0 + 600, y0 + 8000, x0 + 3800, y0 + 8700, 1000, {check: ['counter_height', 1000]});
    I(N, 'lab counter with a microscope', C.struct, x0 + 4200, y0 + 10800, x0 + 6600, y0 + 11500, 914, {check: ['counter_height', 914]});
    I(N, 'tabletop autoclave', C.car2, x0 + 4400, y0 + 10900, x0 + 4900, y0 + 11300, 1250);
    line('interior', C.int, [P(x0 + 6880, y0 + 5600, 1300), P(x0 + 6880, y0 + 6800, 1300), P(x0 + 6880, y0 + 6800, 2100), P(x0 + 6880, y0 + 5600, 2100)], {building: N, part: 'x ray view box', anim: {type: 'blink', period: 5, duty: 0.8}}, closed);
    I(N, 'pipe stocks for standing a horse', C.struct, x0 + 8800, y0 + 6000, x0 + 9900, y0 + 9000, 1300);
    I(N, 'cattle squeeze chute', C.struct, x0 + 10800, y0 + 7200, x0 + 11700, y0 + 10800, 1700);
    I(N, 'rolling vet cart of syringes and bandage', C.brick, x0 + 8800, y0 + 4800, x0 + 9500, y0 + 5300, 950);
    I(N, 'portable ultrasound on a stand', C.int, x0 + 10200, y0 + 5000, x0 + 10600, y0 + 5400, 1300);
    I(N, 'rubber mat in the treatment barn', C.struct, x0 + 8400, y0 + 5600, x0 + 10400, y0 + 9400, 20);
    act(x0 + 1500, y0 + 5200, 'sitting', 'waiting with a goat on a lead', 0);
    sym('activity', C.brick, 'dog', P(x0 + 2600, y0 + 5600), 0.6, {activity: 'cattle dog waiting by the bench'});
    act(x0 + 2000, y0 + 1800, 'standing', 'paying a farm call bill by card', 0);
    act(x0 + 2200, y0 + 9300, 'standing', 'counting out antibiotic tablets', Math.PI);
    act(x0 + 5400, y0 + 10100, 'standing', 'reading a fecal sample under the scope', Math.PI);
    act(x0 + 9350, y0 + 9700, 'standing', 'floating a horse tooth in the stocks', Math.PI);
    act(x0 + 12400, y0 + 9000, 'standing', 'working the headgate on the chute', Math.PI / 2);
  }
  // ---- yard north of the back row: holding pens, plantings, life
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    const pen = rounded(a + 30900, py0, a + 46140, py1, 1200, 0, 4);
    line('lot', C.struct, pen.map(p => P(p[0], p[1], 1300)), {part: 'pipe corral top rail'}, closed);
    line('lot', C.struct, pen.map(p => P(p[0], p[1], 600)), {part: 'pipe corral mid rail'}, closed);
    line('plumbing', C.plumb, circ(a + 34000, py0 + 2500, 700, 600, 12), {part: 'galvanized stock tank'}, closed);
    run('plumbing', C.plumb, [P(a + 34000, py0 + 1800, -900), P(a + 34000, yB1 - 400, -900)], {part: 'stock tank supply from the clinic'});
    act(a + 38000, py0 + 3200, 'walking', 'leading a limping mare around the pen', 0, {type: 'path', speed: 900, pts: [P(a + 38000, py0 + 3200), P(a + 43000, py0 + 3200), P(a + 43000, py1 - 1800), P(a + 38000, py1 - 1800), P(a + 38000, py0 + 3200)]});
    act(a + 36000, py1 - 800, 'standing', 'watching the mare trot out', Math.PI);
    hatch('paving', C.curb, rect(a + 3048, yB1 + 600, a + 27432, oy + S - PL - 600), 'dots', 1200, 0, {part: 'gravel hay yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'flatbed loaded with hay'});
    act(a + 12500, yB0 - 3800, 'standing', 'strapping down a load of hay', Math.PI / 2);
    act(a + 52000, yAB + 1400, 'standing', 'rolling a trash can to the alley', 0);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 11), {part: ['desert holly bed', 'brittlebush bed', 'globe mallow bed', 'smokethorn and bursage bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 4.2 + j * 0.35);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 5 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 3), {part: 'gravel swale with desert holly'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 7, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a pink box of pan dulce', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 11000, yA - 800, 'standing', 'carrying a feed sack out to the truck', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'riding in for morning bread', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(2, 4, true, C.car2, 'car', 9000);
  trafficLoop(2, 4, false, C.yellow, 'truck', 7000);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 3,3 deepen
  {
    const N = 'Dry Lake Implement Sales', st = site('3:3');
    const R = [290888, 250888, 304888, 262888];
    F(st, R, N, 'used lawn tractor with a sold tag', C.yellow, 1100, 1900, 1100);
    F(st, R, N, 'display rack of safety glasses and ear muffs', C.int, 600, 400, 1500, {check: ['shelf_height', 1500]});
    F(st, R, N, 'pallet of bagged tractor hydraulic fluid', C.brick, 1100, 1100, 1000, {color2: C.yellow});
    F(st, R, N, 'kids pedal tractor on display', C.veg, 700, 450, 600);
    Wl(st, R, ['n', 'e'], N, 'service department hours sign', C.sign, 700, 1500, 1900);
    Wl(st, R, ['s', 'w'], N, 'parts diagram poster of a loader valve', C.struct, 900, 1300, 1900, {hatch: 'lines', sp: 160, hatch2: C.int});
    Out(st, R, ['e', 'n'], N, 'outlet for the battery charger', 457);
    Cl(st, R, N, 'parts room pendant light', C.elec, 250, 3200);
    Per(st, R, 'standing', 'reading the loader valve diagram');
    Per(st, R, 'standing', 'hanging a sold tag on a mower');
    Per(st, R, 'standing', 'trying on a pair of ear muffs');
  }
  {
    const N = 'Sun Dog Donut Counter', st = site('3:3');
    const R = [250888, 250888, 260888, 259888];
    F(st, R, N, 'high chair by the window table', C.yellow, 450, 450, 750);
    Wl(st, R, ['n', 'e'], N, 'donut of the month poster', C.sign, 500, 1400, 1900, {color2: C.yellow});
    Wl(st, R, ['s', 'w'], N, 'community flyer board', C.struct, 600, 1300, 1800, {hatch: 'cross', sp: 180, hatch2: C.int});
    Out(st, R, ['e', 'w'], N, 'outlet for the glaze warmer', 1067);
    Per(st, R, 'standing', 'pinning a lost dog flyer on the board');
    Per(st, R, 'standing', 'waiting on a dozen to go');
  }
  {
    const N = 'Burro Flats Welding and Fab', st = site('3:3');
    const R = [266888, 250888, 284888, 266888];
    F(st, R, N, 'cattle guard frame on sawhorses', C.struct, 1800, 1200, 800);
    F(st, R, N, 'rolling bin of drops and offcuts', C.brick, 700, 500, 800);
    F(st, R, N, 'welding rod oven', C.car2, 400, 400, 900);
    Wl(st, R, ['n', 'e'], N, 'clamp rack of bar clamps', C.int, 1000, 1300, 1900);
    Out(st, R, ['s', 'w'], N, 'outlet for the rod oven', 1067);
    Per(st, R, 'standing', 'squaring a cattle guard frame');
    Per(st, R, 'standing', 'pulling a rod from the rod oven');
    Per(st, R, 'standing', 'sorting offcuts into the drop bin');
  }
  {
    const N = 'Saltcedar Grange Hall', st = site('3:3');
    const R = [252888, 285888, 276888, 301888];
    F(st, R, N, 'quilt frame with a quilt in progress', C.brick, 2200, 1300, 760);
    F(st, R, N, 'lost and found box', C.int, 500, 400, 450);
    Wl(st, R, ['n', 'e'], N, 'framed charter of the grange', C.struct, 600, 1500, 1900);
    Wl(st, R, ['s', 'w'], N, 'shelf of donated board games', C.veg, 900, 1300, 1700, {check: ['shelf_height', 1300]});
    Per(st, R, 'sitting', 'hand stitching a quilt block');
    Per(st, R, 'standing', 'digging through the lost and found');
  }

  // ================================================================= 1,0 deepen
  {
    const N = 'Little Chuckwalla Diner', st = site('1:0');
    const R = [94488, 18288, 109728, 30480];
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'framed photo of the old highway', C.struct, 600, 1500, 1900);
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'shelf of hot sauce bottles for sale', C.brick, 700, 1300, 1450, {check: ['shelf_height', 1300]});
    Per(st, R, 'standing', 'reading the guest check aloud');
    Per(st, R, 'standing', 'restocking hot sauce on the shelf');
  }
  for (const [N, R] of [['Saltbush Court House', [93392, 45624, 105584, 54768]], ['Red Rock Court House', [114392, 57624, 126584, 66768]]]) {
    const st = site('1:0'), red = N.startsWith('Red');
    F(st, R, N, red ? 'sewing machine on a card table' : 'ironing board set up', C.int, red ? 900 : 1300, red ? 600 : 400, red ? 760 : 850);
    F(st, R, N, red ? 'basket of yarn by the chair' : 'cat tree by the window', C.brick, 450, 450, red ? 400 : 1200);
    Wl(st, R, ['n', 'e', 's', 'w'], N, red ? 'wall calendar from the feed store' : 'cork board of grandkid drawings', C.sign, 500, 1400, 1800);
    Out(st, R, ['w', 's', 'e', 'n'], N, red ? 'outlet for the sewing machine' : 'outlet for the iron', 457);
    Per(st, R, 'standing', red ? 'hemming a pair of jeans' : 'ironing a church dress');
  }

  // ================================================================= 1,2 deepen
  {
    const N = 'Tamarisk Flat Fire Training Hall', st = site('1:2');
    const R = [132000, 184000, 146000, 194000];
    F(st, R, N, 'rolling cart of turnout gear for class', C.yellow, 900, 600, 1300);
    F(st, R, N, 'scba mask fit test station', C.int, 700, 500, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'stack of practice hose couplings', C.struct, 500, 500, 600, {r: 300, n: 10});
    F(st, R, N, 'roof ventilation prop on a frame', C.brick, 1500, 1200, 1000);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'poster of the fire triangle', C.sign, 600, 1400, 1900, {color2: C.brick});
    Wl(st, R, ['s', 'w', 'n', 'e'], N, 'sign in sheet clipboard on a hook', C.int, 300, 1300, 1600);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the fit test machine', 1067);
    Cl(st, R, N, 'cache second high bay light', C.elec, 280, 4200);
    Per(st, R, 'standing', 'fit testing a recruit mask');
    Per(st, R, 'standing', 'cutting a vent hole in the roof prop');
    Per(st, R, 'standing', 'signing in for the morning drill');
    Per(st, R, 'standing', 'coupling two lengths of practice hose');
  }
  {
    const N = 'Cholla Street Fire Station Two', st = site('1:2');
    const R = [100392, 181640, 118680, 202976];
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'framed photo of the first engine', C.struct, 700, 1500, 1900);
    Wl(st, R, ['w', 's', 'e', 'n'], N, 'plaque wall of retired helmets', C.brick, 900, 1600, 2000);
    Per(st, R, 'standing', 'straightening the retired helmets');
  }

  if (missing) console.log('MISSING ' + missing);
}
