// Agent Orange 2026-10-30 a: claim block 3,4 and build the Chuparosa Street east service row (breakfast grill,
// tractor parts, pottery works, seed cleaning shed, pump repair), then deepen 0,3 Sagebrush Hill and 1,3 cottages.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 301030; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, HSTREET} = k;
  HSTREET[5] = HSTREET[5] || 'Desert Holly Street';
  claim(3, 4);
  streets(3, 4, {s: true, w: true, n: true, e: true});
  const ox = 3 * S, oy = 4 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Chuparosa east service row');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Chuparosa east seed and pump yard');

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

  // ---- Slickrock Breakfast Grill
  {
    const N = 'Slickrock Breakfast Grill', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'dining room windows'});
    for (let s = 0; s < 6; s++) IC(N, 'counter stool ' + (s + 1), C.brick, x0 + 5200 + s * 800, y0 + 5600, 200, 760, {n: 8});
    I(N, 'lunch counter with a formica top', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'flat top griddle with two dozen eggs going', C.struct, x0 + 5200, y0 + 9800, x0 + 7000, y0 + 10600, 914, {check: ['counter_height', 914]});
    I(N, 'double basket fryer for hash browns', C.struct, x0 + 7200, y0 + 9800, x0 + 7800, y0 + 10600, 914);
    I(N, 'exhaust hood over the line', C.struct, x0 + 5000, y0 + 9800, x0 + 8000, y0 + 10900, 2100);
    I(N, 'refrigerated prep rail with salsa and chile', C.car2, x0 + 8200, y0 + 9800, x0 + 9800, y0 + 10500, 914);
    I(N, 'kitchen ticket printer on the pass', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'ticket rail over the pass'});
    I(N, 'pass shelf with heat lamps', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'coffee brewer with two warmers', C.int, x0 + 10400, y0 + 6100, x0 + 11000, y0 + 6500, 1450);
    I(N, 'pie case with a cut pecan pie', C.car2, x0 + 11200, y0 + 6000, x0 + 12400, y0 + 6600, 1300);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'four top table by the window ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'reach in egg and dairy cooler', C.car2, x0 + 10400, y0 + 9800, x0 + 11200, y0 + 10600, 2000);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for chorizo and eggs by card', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'tearing a receipt off the printer', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'flipping eggs over easy on the flat top', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'eating machaca and eggs at the counter', 0);
    act(x0 + 7200, y0 + 5100, 'sitting', 'stirring sugar into black coffee', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'sharing a short stack with a grandkid', Math.PI);
  }
  // ---- Cat Claw Tractor Parts
  {
    const N = 'Cat Claw Tractor Parts', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.yellow, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'parts shelving of filters and belts, row ' + (r + 1), C.int, rx, y0 + 5000, rx + 900, y0 + 10600, 2134, {check: ['shelf_height', 2134]}); }
    I(N, 'parts catalog terminal at the counter', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of hydraulic fluid buckets', C.brick, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 900, {color2: C.yellow});
    I(N, 'rack of pto shafts', C.struct, x0 + 15000, y0 + 7000, x0 + 16800, y0 + 7600, 1500);
    for (let j = 0; j < 3; j++) IC(N, 'stacked tractor tire, front ' + (j + 1), C.struct, x0 + 2000 + j * 1500, y0 + 10500, 550, 600 + j * 10, {n: 10});
    I(N, 'bin wall of grade 8 bolts', C.struct, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1800, {check: ['shelf_height', 1800]});
    I(N, 'hydraulic hose crimper bench', C.car2, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'hose reel rack of bulk hydraulic hose', C.veg2, x0 + 3000, y0 + 7200, x0 + 4600, y0 + 7800, 1600);
    I(N, 'remanufactured starter cores on a pallet', C.brick, x0 + 15000, y0 + 9000, x0 + 16200, y0 + 10200, 700);
    act(x0 + 2200, y0 + 1800, 'standing', 'matching an old fan belt to a new one', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'looking up a part number by serial', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'crimping fittings on a hydraulic hose', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'pulling an oil filter off the shelf', Math.PI / 2);
  }
  // ---- Gourd Vine Pottery Works
  {
    const N = 'Gourd Vine Pottery Works', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.struct, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'gallery window'});
    for (let w = 0; w < 2; w++) { IC(N, 'kick wheel ' + (w + 1), C.struct, x0 + 5600 + w * 2600, y0 + 8000, 350, 600, {n: 10, anim: {type: 'spin', rpm: 90}}); }
    I(N, 'wedging table with a canvas top', C.int, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 864, {check: ['counter_height', 864]});
    I(N, 'electric kiln, front loading', C.struct, x0 + 3200, y0 + 9400, x0 + 4400, y0 + 10600, 1300);
    I(N, 'ware cart of drying bowls', C.int, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1800, {check: ['shelf_height', 1800]});
    I(N, 'gallery shelf of glazed mugs and planters', C.brick, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'glaze buckets on a low bench', C.car2, x0 + 600, y0 + 6400, x0 + 2600, y0 + 6900, 450);
    I(N, 'clay sack stack, 25 lb bags', C.yellow, x0 + 600, y0 + 4400, x0 + 1600, y0 + 5100, 700);
    I(N, 'slab roller', C.struct, x0 + 3200, y0 + 6400, x0 + 4600, y0 + 7100, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'buying a set of four cereal bowls', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'wrapping mugs in newsprint', Math.PI);
    act(x0 + 5600, y0 + 8700, 'sitting', 'centering clay on the kick wheel', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'loading bisque ware into the kiln', 0);
  }
  // ---- Sand Verbena Seed Cleaning Shed (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Sand Verbena Seed Cleaning Shed', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.veg2, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'roll up truck door, open'});
    I(N, 'air screen seed cleaner', C.yellow, x0 + 1500, y0 + 6000, x0 + 4500, y0 + 8400, 2400);
    line('interior', C.struct, [P(x0 + 4500, y0 + 7200, 1800), P(x0 + 7200, y0 + 7200, 400)], {building: N, part: 'cleaned seed discharge chute'});
    I(N, 'gravity table for alfalfa seed', C.veg2, x0 + 7400, y0 + 6400, x0 + 9600, y0 + 8000, 1100, {anim: {type: 'bob', mm: 15, period: 0.3}});
    line('interior', C.struct, [P(x0 + 1200, y0 + 3800, 300), P(x0 + 1800, y0 + 6000, 3400)], {building: N, part: 'bucket elevator leg to the cleaner'});
    for (let t = 0; t < 6; t++) I(N, 'tote bag of cleaned seed ' + (t + 1), C.struct, x0 + 17000 + (t % 3) * 1300, y1 - 2600 + Math.floor(t / 3) * 1300 - 1300, x0 + 18100 + (t % 3) * 1300, y1 - 1600 + Math.floor(t / 3) * 1300 - 1300, 1200);
    I(N, 'dump pit grate for raw seed', C.struct, x0 + 11000, y0 + 1500, x0 + 14000, y0 + 3000, 0);
    I(N, 'germination test bench with trays', C.int, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 9300, 914, {check: ['counter_height', 914]});
    I(N, 'platform scale for seed totes', C.int, x0 + 17000, y0 + 3600, x0 + 19400, y0 + 5400, 150);
    I(N, 'screenings bin of chaff and weed seed', C.brick, x0 + 5000, y0 + 9400, x0 + 6400, y0 + 10600, 1200);
    act(x0 + 3000, y0 + 5400, 'standing', 'swapping a screen on the seed cleaner', 0);
    act(x0 + 8500, y0 + 8600, 'standing', 'watching seed split on the gravity table', Math.PI);
    act(x0 + 22300, y0 + 9800, 'standing', 'counting sprouts in a germination tray', Math.PI);
    act(x0 + 18200, y0 + 6000, 'standing', 'reading a tote weight off the scale', Math.PI);
  }
  // ---- Windmill Flat Pump Repair (back row)
  {
    const N = 'Windmill Flat Pump Repair', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'lines', fc: C.plumb, pos: true});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up service door'});
    I(N, 'submersible pump motor on a test stand', C.car2, x0 + 8600, y0 + 5600, x0 + 9200, y0 + 8600, 900);
    I(N, 'test tank for running pumps', C.plumb, x0 + 10200, y0 + 5600, x0 + 12000, y0 + 7400, 1200);
    I(N, 'teardown bench with a turbine bowl', C.struct, x0 + 600, y0 + 6200, x0 + 4200, y0 + 7000, 940, {check: ['counter_height', 940]});
    I(N, 'rack of drop pipe joints', C.struct, x0 + 600, y0 + 10400, x0 + 6600, y0 + 11000, 900);
    I(N, 'wall shelf of pressure switches and tanks', C.int, x0 + 600, y0 + 4400, x0 + 3600, y0 + 4800, 1700, {check: ['shelf_height', 1700]});
    I(N, 'megohmmeter on a rolling cart', C.yellow, x0 + 5000, y0 + 8400, x0 + 5600, y0 + 8900, 950);
    I(N, 'old windmill head waiting for leathers', C.veg2, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 1100);
    line('interior', C.struct, circ(x0 + 13200, y0 + 10100, 700, 1800, 12), {building: N, part: 'windmill wheel leaned on the head'}, closed);
    act(x0 + 2400, y0 + 7600, 'standing', 'pulling a worn impeller off the shaft', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'watching a pump run in the test tank', Math.PI);
    act(x0 + 2000, y0 + 1800, 'standing', 'paying for a pressure tank by card', 0);
    act(x0 + 5300, y0 + 9500, 'standing', 'megging a motor winding', Math.PI);
  }
  // ---- yard, plantings and life on 3,4
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel seed truck yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'grain truck with a load of raw seed'});
    act(a + 12500, yB0 - 3800, 'standing', 'tarping a truck of raw alfalfa seed', Math.PI / 2);
    // pump yard: a test well head and a shade ramada on the north yard
    run('plumbing', C.plumb, [P(a + 36000, py0 + 2000, -6000), P(a + 36000, py0 + 2000, 600)], {part: 'yard test well casing'});
    line('plumbing', C.plumb, circ(a + 36000, py0 + 2000, 200, 600, 10), {part: 'test well cap'}, closed);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada roof'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 31), {part: ['sand verbena bed', 'desert marigold bed', 'creosote and bursage bed', 'chuparosa bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 4.4 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 5.2 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 7), {part: 'gravel swale with chuparosa'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 7, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a box of mugs to the car', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'rolling a grease drum to the alley', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'riding in for a breakfast burrito', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(3, 4, true, C.car, 'car', 9500);
  trafficLoop(3, 4, false, C.struct, 'truck', 7000);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 0,3 Sagebrush Hill deepen
  {
    const N = 'Sagebrush Hill Parsonage', st = site('0:3');
    const W1 = [57104, 296848, 61981, 305382], SE = [61981, 296848, 67467, 301115], NE = [61981, 301115, 67467, 305382];
    F(st, W1, N, 'reading chair by the study lamp', C.brick, 700, 700, 450);
    F(st, W1, N, 'standing floor lamp', C.yellow, 0, 0, 1600, {r: 180, n: 8, post: true});
    Wl(st, W1, ['n', 'w', 's'], N, 'framed seminary diploma', C.struct, 400, 1500, 1850);
    Wl(st, W1, ['w', 'n', 's'], N, 'wall calendar of weddings and funerals', C.sign, 400, 1300, 1800, {color2: C.yellow});
    Out(st, W1, ['w', 'n', 's'], N, 'outlet for the desk lamp', 457);
    Cl(st, W1, N, 'study ceiling light', C.elec, 200, 2400);
    F(st, SE, N, 'kitchen table for two', C.int, 900, 900, 760);
    Wl(st, SE, ['s', 'e'], N, 'spice shelf over the stove', C.struct, 900, 1400, 1450, {check: ['shelf_height', 1400]});
    Wl(st, SE, ['e', 's'], N, 'kitchen window with a cactus on the sill', C.car2, 900, 1000, 2000, {hatch: 'lines', sp: 200});
    Out(st, SE, ['s', 'e'], N, 'counter outlet for the coffee maker', 1067);
    Cl(st, SE, N, 'kitchen smoke detector', C.elec, 90, 2400);
    F(st, NE, N, 'cedar chest at the foot of the bed', C.struct, 900, 450, 500);
    F(st, NE, N, 'nightstand with a reading lamp', C.int, 450, 450, 600);
    Wl(st, NE, ['n', 'e'], N, 'closet rod of pressed shirts', C.struct, 1200, 1700, 1750);
    Out(st, NE, ['n', 'e'], N, 'bedside outlet', 457);
    Cl(st, NE, N, 'bedroom ceiling fan', C.int, 280, 2350, {disc: 'interior', anim: {type: 'spin', rpm: 40}});
    Per(st, W1, 'sitting', 'reading commentary in the study chair');
    Per(st, SE, 'standing', 'packing a casserole for a sick neighbor');
  }
  {
    const N = 'Sagebrush Hill Fellowship Hall', st = site('0:3');
    const HALL = [15911, 261888, 23836, 271032], KIT = [11644, 261888, 15911, 267374];
    F(st, HALL, N, 'rolling cart of stacked folding chairs', C.struct, 600, 1200, 1300);
    F(st, HALL, N, 'piano bench beside an upright', C.int, 1500, 600, 1270);
    Wl(st, HALL, ['e', 'n', 's'], N, 'bulletin board of the potluck signup', C.sign, 1200, 1200, 1800, {hatch: 'cross', sp: 250, hatch2: C.yellow});
    Wl(st, HALL, ['n', 'e'], N, 'shelf of donated board games', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]});
    Wl(st, HALL, ['s', 'e'], N, 'framed photo of the church founders', C.struct, 700, 1500, 2000);
    Out(st, HALL, ['e', 'n', 's'], N, 'outlet for the roaster oven', 457);
    Out(st, HALL, ['n', 'e', 's'], N, 'outlet for the projector', 457);
    Cl(st, HALL, N, 'hall smoke detector', C.elec, 90, 2700);
    Cl(st, HALL, N, 'ceiling mounted projector', C.elec, 200, 2600);
    Wl(st, KIT, ['s', 'w'], N, 'shelf of mismatched coffee mugs', C.brick, 1000, 1500, 1550, {check: ['shelf_height', 1500]});
    Wl(st, KIT, ['w', 's'], N, 'fire extinguisher on a bracket', C.car, 250, 900, 1400);
    Cl(st, KIT, N, 'kitchen smoke detector', C.elec, 90, 2700);
    Per(st, HALL, 'standing', 'setting out paper plates for the potluck');
    Per(st, HALL, 'standing', 'testing the projector for movie night');
    Per(st, KIT, 'standing', 'washing the big soup pot');
  }
  {
    const N = 'Sagebrush Hill Chapel', st = site('0:3');
    const NAVE = [34747, 258888, 44501, 277176];
    Wl(st, NAVE, ['e', 'w'], N, 'stained glass window of a desert dove', C.car2, 900, 1500, 3600, {hatch: 'cross', sp: 220, hatch2: C.yellow});
    Wl(st, NAVE, ['w', 'e'], N, 'stained glass window of a mesquite tree', C.veg, 900, 1500, 3600, {hatch: 'cross', sp: 220, hatch2: C.brick});
    Wl(st, NAVE, ['e', 'w'], N, 'brass memorial plaque', C.yellow, 400, 1400, 1700);
    Wl(st, NAVE, ['w', 'e'], N, 'wall sconce light', C.yellow, 200, 2200, 2500, {disc: 'electrical'});
    Wl(st, NAVE, ['e', 'w'], N, 'wall sconce light, east', C.yellow, 200, 2200, 2500, {disc: 'electrical'});
    Out(st, NAVE, ['w', 'e'], N, 'outlet for the electric organ', 457);
    Cl(st, NAVE, N, 'nave smoke detector', C.elec, 90, 4600);
    Per(st, NAVE, 'standing', 'polishing the brass memorial plaque');
  }

  // ================================================================= 1,3 cottages and apartments deepen
  {
    const st = site('1:3');
    const cot = [['Caliche Lane Cottage', 90392], ['Packrat Hollow Cottage', 105192], ['Dust Pan Cottage', 119992], ['Lantern Wash Cottage', 134792]];
    const extras = [
      ['rocking chair by the window', 'swamp cooler register', 'photo of a grandson in uniform', 'reading glasses on a side table', 'pinning a photo to the fridge'],
      ['sewing machine on a card table', 'wall rack of cowboy hats', 'framed rodeo poster', 'laundry basket of folded towels', 'mending a work shirt at the machine'],
      ['tool bucket by the back door', 'shelf of canned peaches', 'wall clock shaped like a rooster', 'pet bed for an old dog', 'oiling a squeaky door hinge'],
      ['easel with a desert watercolor', 'shelf of paint tubes', 'calendar from the feed store', 'basket of yarn by the couch', 'painting a saguaro at sunset'],
    ];
    cot.forEach(([N, x0], i) => {
      const L = [x0, 298033, x0 + 4572, 305348], Rr = [x0 + 4572, 298033, x0 + 9144, 305348];
      const ex = extras[i];
      F(st, L, N, ex[0], C.brick, 700, 700, 900);
      F(st, Rr, N, ex[3], C.int, 500, 500, 500);
      Wl(st, L, ['w', 'n', 's'], N, ex[2], C.struct, 500, 1400, 1900);
      Wl(st, Rr, ['n', 'e', 's'], N, 'closet shelf, ' + N.split(' ')[0].toLowerCase(), C.int, 900, 1700, 1750, {check: ['shelf_height', 1700]});
      Out(st, L, ['w', 'n', 's'], N, 'living room outlet', 457);
      Out(st, Rr, ['e', 'n', 's'], N, 'bedside outlet', 457);
      Cl(st, L, N, 'smoke detector', C.elec, 90, 2400);
      Cl(st, Rr, N, 'ceiling fan over the bed', C.int, 280, 2350, {disc: 'interior', anim: {type: 'spin', rpm: 45}});
      Per(st, L, 'standing', ex[4]);
    });
  }
  {
    const N = 'Tumbleweed Terrace Apartments', st = site('1:3');
    const xs = [92392, 99707, 107022, 114337, 121652];
    const items = [['shoe rack by the door', 'calendar of shift schedules'], ['kid bike helmet on a hook', 'framed quinceanera photo'], ['ironing board folded by the closet', 'wall shelf of trophies'], ['laundry rack of jeans', 'mirror by the door']];
    for (let u = 0; u < 4; u++) {
      const R = [xs[u], 250888, xs[u + 1], 260032], nm = 'unit A' + (u + 1);
      Wl(st, R, ['s', 'n'], N, items[u][0] + ', ' + nm, C.int, 700, 300, 900);
      Wl(st, R, ['n', 's'], N, items[u][1] + ', ' + nm, C.struct, 500, 1400, 1900);
      Out(st, R, ['s', 'n'], N, 'outlet by the couch, ' + nm, 457);
      Cl(st, R, N, 'smoke detector, ' + nm, C.elec, 90, 2400);
    }
    Per(st, [xs[0], 250888, xs[1], 260032], 'standing', 'ironing a shirt for the night shift');
    Per(st, [xs[2], 250888, xs[3], 260032], 'standing', 'tying a toddler shoe by the door');
  }

  if (missing) console.log('MISSING ' + missing);
}
