// Agent Orange 2026-11-09 a: claim block 7,3 and build the Fairy Duster corner (carne asada kitchen, drip emitter supply, PTO shaft shop,
// pinto bean barn, fig packing house), then deepen 2,4 Smokethorn farm block, 1,0 diner block and 1,2 fire station block.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611109; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  // ================================================================= claim 7,3
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop, box, VSTREET, HSTREET} = k;
  VSTREET[7] = VSTREET[7] || 'Tarantula Avenue';
  VSTREET[8] = VSTREET[8] || 'Pinacate Avenue';
  claim(7, 3);
  streets(7, 3, {s: true, e: true});
  const ox = 7 * S, oy = 3 * S;
  const a = ox + PL, b = ox + S - PL;
  const acts = [];
  const act = (x, y, pose, t, rot = 0, anim) => acts.push([x, y, pose, t, rot, anim]);
  lot('commercial', a, oy + PL, b, oy + 46700, 'Fairy Duster corner shops');
  lot('agricultural', a, oy + 46700, b, oy + S - PL, 'Indigo Bush bean and fig yard');

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

  // ---- Fairy Duster Carne Asada Kitchen
  {
    const N = 'Fairy Duster Carne Asada Kitchen', x0 = a + 3048, x1 = x0 + 15240, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.brick, pos: true});
    hatch('structure', C.yellow, vface(x0 + 6000, y0, x0 + 12500, y0, 700, 2600), 'lines', 350, 90, {building: N, part: 'front windows lettered with plates of carne asada'});
    for (let s = 0; s < 5; s++) IC(N, 'red vinyl counter stool ' + (s + 1), C.car, x0 + 5200 + s * 900, y0 + 5600, 200, 760, {n: 8});
    I(N, 'tiled lunch counter', C.int, x0 + 4800, y0 + 6000, x0 + 10000, y0 + 6600, 1067, {check: ['counter_height', 1067]});
    I(N, 'mesquite charcoal grill for carne asada', C.struct, x0 + 5200, y0 + 9800, x0 + 7400, y0 + 10600, 914, {check: ['counter_height', 914]});
    IC(N, 'comal warming corn tortillas', C.struct, x0 + 8000, y0 + 10200, 320, 950, {n: 12});
    I(N, 'hood over the charcoal grill', C.struct, x0 + 5000, y0 + 9800, x0 + 8600, y0 + 10900, 2100);
    I(N, 'cold well of guacamole, onions and cilantro', C.veg2, x0 + 8900, y0 + 9800, x0 + 10500, y0 + 10500, 914);
    I(N, 'kitchen printer by the grill', C.int, x0 + 6000, y0 + 7600, x0 + 6300, y0 + 7850, 1300);
    line('interior', C.yellow, [P(x0 + 4900, y0 + 7700, 1700), P(x0 + 9800, y0 + 7700, 1700)], {building: N, part: 'ticket rail over the pass'});
    I(N, 'stainless pass shelf with a heat strip', C.struct, x0 + 4900, y0 + 7500, x0 + 9800, y0 + 7900, 1400);
    I(N, 'cooler of jamaica and tamarindo aguas frescas', C.car2, x0 + 10400, y0 + 6100, x0 + 11400, y0 + 6600, 1300);
    I(N, 'glass bottle soda cooler', C.car, x0 + 11800, y0 + 6000, x0 + 12900, y0 + 6600, 1800);
    for (let t = 0; t < 3; t++) { const tx = x0 + 6000 + t * 2300; I(N, 'oilcloth window table ' + (t + 1), C.int, tx, y0 + 1200, tx + 900, y0 + 2100, 760); }
    I(N, 'hotel pan of marinating skirt steak', C.brick, x0 + 10800, y0 + 9800, x0 + 11600, y0 + 10500, 600);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for two carne asada plates', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'handing a number card to a customer', Math.PI);
    act(x0 + 6100, y0 + 9200, 'standing', 'turning steaks over the mesquite coals', 0);
    act(x0 + 5600, y0 + 5100, 'sitting', 'squeezing lime over a taco', 0);
    act(x0 + 7400, y0 + 5100, 'sitting', 'drinking agua de jamaica at the counter', 0);
    act(x0 + 6450, y0 + 2700, 'sitting', 'reading the sports page by the window', Math.PI);
  }
  // ---- Pupfish Spring Drip Emitter Supply
  {
    const N = 'Pupfish Spring Drip Emitter Supply', x0 = a + 3048 + 15240 + 1524, x1 = x0 + 18288, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 5182, 'n', {facade: 'lines', fc: C.plumb, pos: true});
    hatch('structure', C.car2, vface(x0 + 6000, y0, x0 + 10000, y0, 500, 2700), 'lines', 400, 90, {building: N, part: 'storefront glass onto the lot'});
    for (let r = 0; r < 4; r++) { const rx = x0 + 6000 + r * 2200; I(N, 'gondola of drip emitters, stakes and tubing tees, row ' + (r + 1), C.plumb, rx, y0 + 5000, rx + 900, y0 + 10600, 1828, {check: ['shelf_height', 1828]}); }
    I(N, 'quote terminal for drip zone layouts', C.int, x0 + 3100, y0 + 2700, x0 + 3500, y0 + 3000, 1400);
    I(N, 'pallet of boxed drip line rolls', C.struct, x0 + 15000, y0 + 4800, x0 + 16200, y0 + 6000, 1100, {color2: C.plumb});
    I(N, 'demo board of an orchard drip zone', C.veg2, x0 + 14400, y0 + 7000, x0 + 15600, y0 + 7800, 1000);
    for (let j = 0; j < 3; j++) IC(N, 'spool of half inch poly tubing ' + (j + 1), C.struct, x0 + 2000 + j * 1500, y0 + 10500, 350, 800 + j * 10, {n: 10});
    I(N, 'wall of emitter bins by gallons per hour', C.yellow, x0 + 600, y0 + 5200, x0 + 4400, y0 + 5600, 1700, {check: ['shelf_height', 1700]});
    I(N, 'bench with a flow test manifold', C.int, x0 + 600, y0 + 7200, x0 + 2600, y0 + 7900, 940, {check: ['counter_height', 940]});
    I(N, 'rack of battery valve timers', C.car, x0 + 3000, y0 + 7200, x0 + 3900, y0 + 7900, 1200);
    I(N, 'filter and pressure regulator display table', C.int, x0 + 15000, y0 + 9000, x0 + 16800, y0 + 9600, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a box of emitters by card', 0);
    act(x0 + 3300, y0 + 3400, 'standing', 'drawing a drip zone for a pecan row', Math.PI);
    act(x0 + 1600, y0 + 8400, 'standing', 'timing a bucket fill on the test bench', Math.PI);
    act(x0 + 7450, y0 + 6800, 'standing', 'counting tubing tees into a bag', Math.PI / 2);
  }
  // ---- Vinegaroon PTO Shaft Repair
  {
    const N = 'Vinegaroon PTO Shaft Repair', x0 = a + 3048 + 15240 + 1524 + 18288 + 1524, x1 = x0 + 12192, y0 = yA, y1 = yAB;
    shell(N, x0, x1, y0, y1, 4572, 'n', {facade: 'brick', fc: C.car2, pos: true});
    hatch('structure', C.car2, vface(x0 + 5200, y0, x0 + 10500, y0, 600, 2600), 'lines', 350, 90, {building: N, part: 'shop window'});
    IC(N, 'shop fan over the press bench', C.struct, x0 + 5600, y0 + 8000, 280, 1050, {n: 12, anim: {type: 'spin', rpm: 40}});
    I(N, 'hydraulic press for u joint caps', C.plumb, x0 + 600, y0 + 9000, x0 + 2600, y0 + 9900, 940, {check: ['counter_height', 940]});
    I(N, 'rack of driveline shafts by length', C.struct, x0 + 3200, y0 + 9400, x0 + 4600, y0 + 10600, 1800);
    I(N, 'shelf of yokes and cross kits', C.brick, x0 + 9600, y0 + 6800, x0 + 10400, y0 + 8400, 1600, {check: ['shelf_height', 1600]});
    I(N, 'shelf of shear bolts and slip clutches', C.struct, x0 + 5200, y0 + 4400, x0 + 8800, y0 + 4800, 1500, {check: ['shelf_height', 1500]});
    I(N, 'pto shaft on a balancing stand', C.yellow, x0 + 600, y0 + 6400, x0 + 2200, y0 + 7200, 1100);
    I(N, 'bin of plastic shaft guards', C.yellow, x0 + 600, y0 + 4400, x0 + 1400, y0 + 5000, 1000);
    I(N, 'fan stand base', C.struct, x0 + 5200, y0 + 7600, x0 + 6000, y0 + 8400, 900);
    act(x0 + 2200, y0 + 1800, 'standing', 'paying for a rebuilt pto shaft', 0);
    act(x0 + 2000, y0 + 3400, 'standing', 'measuring a shaft length on a tape', Math.PI);
    act(x0 + 1600, y0 + 8500, 'standing', 'pressing a new cross into a yoke', Math.PI);
    act(x0 + 3800, y0 + 8800, 'standing', 'greasing a u joint zerk', 0);
  }
  // ---- Indigo Bush Pinto Bean Barn (back row)
  const yB0 = oy + 48500, yB1 = yB0 + 12192;
  {
    const N = 'Indigo Bush Pinto Bean Barn', x0 = a + 3048, x1 = x0 + 24384, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 7315, 's', {facade: 'lines', fc: C.struct, noCeil: true, beam: 5486, lightZ: 5200});
    line('structure', C.struct, [P(x0 + 10000, y0), P(x0 + 10000, y0, 4877), P(x0 + 15486, y0, 4877), P(x0 + 15486, y0)], {building: N, part: 'open bay for bean trucks'});
    for (let t = 0; t < 4; t++) I(N, 'tote bag of cleaned pinto beans ' + (t + 1), C.brick, x0 + 1500 + (t % 2) * 3600, y0 + 6000 + Math.floor(t / 2) * 2800, x0 + 4300 + (t % 2) * 3600, y0 + 8200 + Math.floor(t / 2) * 2800, 1500);
    IC(N, 'aeration fan on the bean bin', C.struct, x0 + 18200, y0 + 8300, 600, 1300, {n: 12, anim: {type: 'spin', rpm: 30}});
    I(N, 'bean cleaner and gravity table', C.struct, x0 + 21000, y0 + 8600, x0 + 23600, y0 + 10200, 2200);
    I(N, 'bagging scale for 25 pound sacks', C.int, x0 + 17000, y0 + 3600, x0 + 18600, y0 + 4600, 914, {check: ['counter_height', 914]});
    I(N, 'pallet of sewn bean sacks', C.brick, x0 + 21000, y0 + 3600, x0 + 22400, y0 + 5000, 1300);
    I(N, 'whiteboard of bean lot moisture', C.sign, x0 + 12000, y1 - 400, x0 + 14500, y1 - 250, 2200);
    act(x0 + 4800, y0 + 5200, 'standing', 'sewing shut a sack of pintos', 0);
    act(x0 + 22300, y0 + 7800, 'standing', 'skimming split beans off the gravity table', Math.PI);
    act(x0 + 17800, y0 + 5200, 'standing', 'weighing a sack of pinto beans', Math.PI);
    act(x0 + 13200, y0 + 2000, 'standing', 'waving a bean truck into the bay', Math.PI);
  }
  // ---- Cheesebush Fig Packing House (back row)
  {
    const N = 'Cheesebush Fig Packing House', x0 = a + 30900, x1 = x0 + 15240, y0 = yB0, y1 = yB1;
    shell(N, x0, x1, y0, y1, 5182, 's', {facade: 'brick', fc: C.brick, noCeil: true, beam: 4572, lightZ: 4200});
    line('structure', C.brick, [P(x0 + 8000, y0), P(x0 + 8000, y0, 3658), P(x0 + 11658, y0, 3658), P(x0 + 11658, y0)], {building: N, part: 'roll up door to the fig dock'});
    I(N, 'drying trays of black mission figs', C.car2, x0 + 1200, y0 + 6200, x0 + 7000, y0 + 7000, 1000);
    IC(N, 'cooling fan at the fig cold room', C.struct, x0 + 11100, y0 + 6500, 600, 1100, {n: 12, anim: {type: 'spin', rpm: 25}});
    I(N, 'sorting table for fresh figs', C.int, x0 + 600, y0 + 9200, x0 + 4200, y0 + 10000, 1000);
    I(N, 'picking lug of brown turkey figs', C.car2, x0 + 600, y0 + 10400, x0 + 2000, y0 + 11400, 700);
    I(N, 'clamshell filling line', C.struct, x0 + 2600, y0 + 10400, x0 + 4000, y0 + 11400, 1800);
    I(N, 'pack table for fig flats', C.int, x0 + 5000, y0 + 8400, x0 + 6400, y0 + 9100, 914, {check: ['counter_height', 914]});
    I(N, 'bin of split figs for jam', C.car, x0 + 12400, y0 + 9400, x0 + 14000, y0 + 10800, 900);
    act(x0 + 3000, y0 + 7600, 'standing', 'turning figs on a drying tray', Math.PI);
    act(x0 + 11100, y0 + 8000, 'standing', 'stacking fig flats by the cold room', Math.PI);
    act(x0 + 2400, y0 + 8600, 'standing', 'sorting soft figs from firm ones', 0);
    act(x0 + 5700, y0 + 9800, 'standing', 'closing a clamshell of figs', Math.PI);
  }
  // ---- yard, plantings and life on 7,3
  {
    const py0 = yB1 + 1500, py1 = oy + S - PL - 1500;
    hatch('paving', C.curb, rect(a + 3048, py0, a + 27432, py1), 'dots', 1200, 0, {part: 'gravel bean truck yard'}, C.struct);
    sym('vehicle', C.yellow, 'truck', P(a + 9000, yB0 - 3800), Math.PI / 2, {part: 'bobtail truck of bean totes'});
    act(a + 12500, yB0 - 3800, 'standing', 'chaining a tote of beans on a truck', Math.PI / 2);
    line('lot', C.struct, rounded(a + 39000, py0 + 500, a + 45000, py0 + 4500, 600, 3000, 4), {part: 'shade ramada over the fig tasting table'}, closed);
    for (let j = 0; j < 4; j++) line('vegetation', C.veg2, blob(a + 8000 + j * 15000, oy + PL + 1000, 750, 14, j + 171), {part: ['fairy duster bed', 'globe mallow bed', 'brittlebush bed', 'bear grass bed'][j]}, closed);
    for (let j = 0; j < 5; j++) tree(a + 4000 + j * 13000, oy + PL - 600, 4, 7.4 + j * 0.3);
    for (let j = 0; j < 4; j++) tree(b - 2200, oy + 50000 + j * 5000, 3, 6.5 + j * 0.3);
    line('vegetation', C.veg2, wavy(b - 3500, oy + 48000, b - 3500, oy + S - PL - 800, 600, 16, 53), {part: 'rock lined swale with indigo bush'});
    for (let i = 0; i <= 4; i++) sym('street', C.struct, 'light', P(a + 9000 + i * 11500, yA - 1000, 4200), 0, {part: 'lot light', anim: i % 2 ? {type: 'blink', period: 6, duty: 0.9} : undefined});
    act(a + 21000, yA - 1100, 'walking', 'carrying a foil tray of carne asada to a truck', Math.PI / 2, {type: 'path', speed: 1200, pts: [P(a + 21000, yA - 1100), P(a + 30000, yA - 1100), P(a + 30000, yA - 500), P(a + 21000, yA - 500), P(a + 21000, yA - 1100)]});
    act(a + 52000, yAB + 1400, 'standing', 'sliding a pto shaft into a pickup bed', 0);
    sym('activity', C.person, 'cyclist', P(dx0 + 1800, oy + CURB + 2000), 0, {activity: 'pedaling over for a bag of drip stakes', anim: {type: 'path', speed: 3500, pts: [P(dx0 + 1800, oy + CURB + 2000), P(dx0 + 1800, aisleY + 3000), P(dx1 - 1800, aisleY + 3000), P(dx1 - 1800, oy + CURB + 2000), P(dx0 + 1800, oy + CURB + 2000)]}});
  }
  trafficLoop(7, 3, true, C.car2, 'car', 9000);
  trafficLoop(7, 3, false, C.struct, 'truck', 7500);
  for (const [x, y, pose, t, rot, anim] of acts) person(P(x, y), rot, pose, t, anim);

  // ================================================================= 2,4 Smokethorn farm block deepen
  D('2:4', 'Smokethorn Ag Co-op', [170688, 342992, 188976, 356992], 3353, [
    ['w', 'rack of lariats and lead ropes', C.yellow, 900, 1300, 1800],
    ['w', 'shelf of chick waterers and feeders', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'calendar from the brand inspector', C.sign, 500, 1300, 1800],
    ['o', 'outlet for the chick brooder lamp', 457],
    ['o', 'outlet for the label printer, co-op', 1067],
    ['c', 'co-op exhaust fan', C.int, 300, 60, {disc: 'interior', anim: {type: 'spin', rpm: 40}}],
    ['f', 'stock tank for sale', C.struct, 0, 0, 600, {r: 500, n: 14}],
    ['f', 'brooder tub of peeping chicks', C.yellow, 900, 600, 500],
    ['f', 'hand truck for feed sacks', C.int, 500, 400, 1200],
    ['p', 'standing', 'picking out six chicks for a coop'],
    ['p', 'standing', 'coiling a new lariat'],
    ['p', 'standing', 'reading the brand inspector calendar'],
  ]);
  D('2:4', 'Sweetbush Panaderia', [190500, 342992, 201168, 356992], 3353, [
    ['w', 'shelf of piloncillo cones', C.brick, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'hook of oven mitts and peels', C.struct, 600, 1300, 1800],
    ['o', 'outlet for the dough divider', 1067],
    ['c', 'kitchen exhaust fan, panaderia', C.int, 300, 60, {disc: 'interior', anim: {type: 'spin', rpm: 45}}],
    ['f', 'flour sack dolly', C.int, 600, 500, 900],
    ['f', 'tub of sugar topping paste', C.yellow, 0, 0, 800, {r: 250}],
    ['p', 'standing', 'pressing shell pattern onto concha tops'],
    ['p', 'standing', 'brushing egg wash on empanadas'],
  ]);
  D('2:4', 'Bajada Small Engine Repair', [202692, 342992, 217932, 356992], 3353, [
    ['w', 'rack of mower blades by length', C.struct, 1200, 1200, 1800],
    ['w', 'shelf of air filters and spark plugs', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the battery charger, engines', 457],
    ['f', 'leaf blower on the teardown floor', C.car, 600, 400, 500],
    ['f', 'go kart frame waiting on an engine', C.struct, 1200, 700, 400],
    ['p', 'standing', 'cleaning a clogged air filter'],
    ['p', 'standing', 'test running a leaf blower'],
  ]);
  D('2:4', 'Smokethorn Hay Barn', [170688, 365492, 195072, 377684], 5000, [
    ['w', 'pegboard of hay hooks', C.struct, 900, 1200, 1800],
    ['w', 'shelf of barn cat food', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['f', 'hay probe cart', C.int, 600, 500, 900],
    ['f', 'tarp folded on a pallet', C.car2, 1000, 1000, 300],
    ['p', 'standing', 'probing a stack for heat'],
    ['p', 'standing', 'filling the barn cat bowl'],
  ]);
  D('2:4', 'Bajada Large Animal Clinic', [198540, 365492, 213780, 377684], 3353, [
    ['w', 'shelf of bandage rolls and vet wrap', C.car2, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'board of hoof trim schedules', C.sign, 900, 1300, 1900],
    ['o', 'outlet for the hoof grinder', 1067],
    ['f', 'hoof stand and rasp tray', C.struct, 500, 400, 600],
    ['f', 'oxygen tank cart', C.plumb, 400, 400, 1200],
    ['p', 'standing', 'rolling vet wrap around a pastern'],
    ['p', 'standing', 'filling a syringe with dewormer'],
  ]);

  // ================================================================= 1,0 diner and court houses deepen
  D('1:0', 'Little Chuckwalla Diner', [94488, 18288, 109728, 30480], 3048, [
    ['w', 'neon open sign in the window', C.car, 900, 1300, 1700, {anim: {type: 'blink', period: 2, duty: 0.8}}],
    ['w', 'shelf of jarred prickly pear jelly', C.car2, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'framed menu from opening day', C.struct, 600, 1400, 1900],
    ['w', 'rack of booster seats', C.int, 600, 700, 1400],
    ['o', 'outlet for the neon sign', 1067],
    ['o', 'outlet for the vacuum', 406],
    ['c', 'pendant light over booth one', C.elec, 200],
    ['f', 'wait station with silverware bins', C.int, 900, 500, 1000],
    ['f', 'coat tree by the front door', C.struct, 0, 0, 1700, {r: 250, n: 8}],
    ['p', 'standing', 'rolling silverware into napkins'],
    ['p', 'standing', 'buying a jar of prickly pear jelly'],
    ['p', 'standing', 'hanging a jacket on the coat tree'],
  ]);
  D('1:0', 'Saltbush Court House', [93392, 45624, 105584, 54768], 2438, [
    ['w', 'framed embroidered roadrunner', C.yellow, 400, 1400, 1800],
    ['w', 'shelf of cookbooks', C.int, 900, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the stand mixer at home', 1067],
    ['f', 'dog bed by the sofa', C.brick, 0, 0, 200, {r: 400, n: 10}],
    ['f', 'shoe rack by the door', C.struct, 700, 300, 450],
    ['p', 'standing', 'flipping through a cookbook for supper'],
    ['p', 'standing', 'lining up boots on the shoe rack'],
  ]);
  D('1:0', 'Red Rock Court House', [114392, 57624, 126584, 66768], 2438, [
    ['w', 'wall shelf of potted cactus', C.veg2, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'framed map of the county', C.struct, 600, 1400, 1900],
    ['o', 'outlet for the record player', 1067],
    ['f', 'record crate by the sofa', C.int, 400, 350, 350],
    ['f', 'floor fan on a stand at home', C.struct, 0, 0, 1000, {r: 250, n: 10, anim: {type: 'spin', rpm: 60}}],
    ['p', 'standing', 'putting a record on the turntable'],
    ['p', 'standing', 'misting the potted cactus'],
  ]);

  // ================================================================= 1,2 fire station block deepen
  D('1:2', 'Cholla Street Fire Station Two', [100392, 181640, 118680, 202976], 2743, [
    ['w', 'rack of spare hose nozzles', C.struct, 1200, 1200, 1700],
    ['w', 'shelf of medical oxygen bottles', C.car2, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'board of station chores by shift', C.sign, 1200, 1300, 2000],
    ['w', 'key box for the apparatus', C.yellow, 300, 1400, 1700],
    ['o', 'outlet for the floor fan, station', 457],
    ['o', 'outlet for the radio dock', 1067],
    ['c', 'day room ceiling light', C.elec, 200],
    ['f', 'rolling stool by the ems cabinet', C.int, 0, 0, 500, {r: 200}],
    ['f', 'basket of clean station t shirts', C.int, 600, 500, 500],
    ['f', 'cooler of sports drinks for rehab', C.car2, 600, 400, 450],
    ['p', 'standing', 'checking off a chore on the board'],
    ['p', 'standing', 'swapping an oxygen bottle on the shelf'],
    ['p', 'standing', 'folding station t shirts'],
    ['p', 'standing', 'grabbing the engine key from the box'],
  ]);
  D('1:2', 'Tamarisk Flat Fire Training Hall', [132000, 184000, 146000, 194000], 3048, [
    ['w', 'poster of wildland watch out situations', C.sign, 900, 1300, 2000],
    ['w', 'shelf of radio training handsets', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'bulletin board of class schedules', C.struct, 900, 1300, 1900],
    ['o', 'outlet for the radio handset charger', 1067],
    ['c', 'classroom pendant light', C.elec, 200],
    ['f', 'bin of practice fire shelters', C.yellow, 700, 500, 600],
    ['f', 'easel with a flip chart', C.struct, 600, 400, 1800],
    ['p', 'standing', 'drawing a fire line on the flip chart'],
    ['p', 'standing', 'handing out training radios'],
    ['p', 'standing', 'practicing a shelter deployment'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
