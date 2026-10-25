// Agent Orange 2026-10-25 c: new Thrasher Grounds Shop in the 0,1 park, deepen Hard Pan Feed and Tractor (1,1) and Pump Jack Motor Court and Office (2,0).
// Uses the cached site() picker from 2026-10-25-b plus E(), an explicit floor item that is blocked in the site so later picks keep clear.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 4111; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
    // floor cell for an item of half size hw, hd (or a person, hw = hd = 0)
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
        // footprint corners and center must stay off existing low lines
        const m = isPerson ? 380 : 300;
        if (nearLow(x, y, m + Math.max(hw, hd) * 0.2)) continue;
        if (!isPerson && (nearLow(x - hw, y - hd, m) || nearLow(x + hw, y - hd, m) || nearLow(x + hw, y + hd, m) || nearLow(x - hw, y + hd, m))) continue;
        if (!isPerson) {   // no existing low line may pass through the footprint
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
    // slot on an inside wall face: returns [ax, ay, bx, by] along the wall
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
  // floor item: a box at height h, or a round item when o.r is set
  function F(st, room, N, label, col, w, d, h, o = {}) {
    const hw = o.r ? o.r : w / 2, hd = o.r ? o.r : d / 2;
    const c = st.floor(room, hw, hd); if (!c) return miss(label);
    const pts = o.r ? circ(c[0], c[1], o.r, h, o.n || 10) : rect(c[0] - hw, c[1] - hd, c[0] + hw, c[1] + hd, h);
    line(o.disc || 'interior', col, pts, meta(N, label, o), Object.assign({closed: true}, extra(o)));
    if (o.post) line(o.disc || 'interior', col, [P(c[0], c[1], 0), P(c[0], c[1], h)], {building: N, part: label + ' base'});
    return c;
  }
  // wall item: a vertical panel on an inside wall face
  function Wl(st, room, sides, N, label, col, w, z0, z1, o = {}) {
    const s = st.wallSlot(room, sides, w, z0, z1); if (!s) return miss(label);
    line(o.disc || 'interior', col, [P(s[0], s[1], z0), P(s[2], s[3], z0), P(s[2], s[3], z1), P(s[0], s[1], z1)], meta(N, label, o), Object.assign({closed: true}, extra(o)));
    if (o.hatch) hatch('structure', col, [P(s[0], s[1], z0 + 40), P(s[2], s[3], z0 + 40), P(s[2], s[3], z1 - 40), P(s[0], s[1], z1 - 40)], o.hatch, o.sp || 150, o.ang || 0, {building: N, part: label + ' surface'}, o.hatch2);
    return s;
  }
  // outlet on a wall
  function Out(st, room, sides, N, label, z) {
    const s = st.wallSlot(room, sides, 120, z - 60, z + 60); if (!s) return miss(label);
    sym('electrical', C.elec, 'outlet', P(s[0], s[1], z), 0, {building: N, part: label, checks: [['outlet_height', z]]});
  }
  // ceiling item: a round fixture just under the ceiling
  function Cl(st, room, N, label, col, r, z, o = {}) {
    const c = st.ceilSlot(room, z); if (!c) return miss(label);
    line(o.disc || 'electrical', col, circ(c[0], c[1], r, z, o.n || 8), meta(N, label, o), Object.assign({closed: true}, extra(o)));
    return c;
  }
  function Per(st, room, pose, text) {
    const c = st.floor(room, 0, 0, true); if (!c) return miss(text);
    person(P(c[0], c[1]), Math.round(rnd() * 628) / 100, pose, text);
  }
  const {wall, door, run, push, box} = k;
  // E: an explicit floor item at a fixed spot, blocked in the site so later picks keep clear of it
  function E(st, disc, col, N, label, x0, y0, x1, y1, h, o = {}) {
    line(disc, col, rect(x0, y0, x1, y1, h), meta(N, label, o), Object.assign({closed: true}, extra(o)));
    if (o.post !== false && h > 300 && disc === 'interior') line('interior', col, [P(x0, y0, 0), P(x0, y0, h)], {building: N, part: label + ' leg'});
    st.block(x0, y0, x1, y1);
  }

  // ================================================================= 0,1 Thrasher Grounds Shop (new) and Quail Run Comfort Station
  {
    const N = 'Thrasher Grounds Shop', st = site('0:1');
    const X0 = 62500, Y0 = 90600, X1 = 68900, Y1 = 98400, H = 3658;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], H, -300, true);
    door(N, X0, 96000, 'y', 914, 'man door', 1);
    line('structure', C.int, [P(64300, Y0), P(64300, Y0, 3048), P(67043, Y0, 3048), P(67043, Y0)], {building: N, door: 'roll up door, 9 ft'});
    hatch('structure', C.struct, vface(64350, Y0 - 20, 66993, Y0 - 20, 60, 2990), 'lines', 150, 0, {building: N, part: 'roll up door slats'}, C.roof);
    // corrugated steel skin, darker at the base
    hatch('structure', C.struct, vface(X0, Y1, X1, Y1, 0, H), 'gradient', 200, 90, {building: N, part: 'corrugated steel siding, north'}, C.roof);
    hatch('structure', C.struct, vface(X1, Y0, X1, Y1, 0, H), 'gradient', 200, 90, {building: N, part: 'corrugated steel siding, east'}, C.roof);
    hatch('structure', C.struct, vface(X0, Y0, X0, 95900, 0, H), 'gradient', 200, 90, {building: N, part: 'corrugated steel siding, west'}, C.roof);
    hatch('structure', C.struct, vface(X0, Y0, 64200, Y0, 0, H), 'gradient', 200, 90, {building: N, part: 'corrugated steel siding, south'}, C.roof);
    line('structure', C.roof, rect(X0 - 300, Y0 - 300, X1 + 300, Y1 + 300, H), {building: N, part: 'low slope metal roof'}, closed);
    hatch('structure', C.roof, rect(X0 - 300, Y0 - 300, X1 + 300, Y1 + 300, H), 'lines', 600, 0, {building: N, part: 'standing seam roof panels'}, C.struct);
    for (const y of [92600, 94500, 96400]) line('structure', C.struct, [P(X0 + 150, y, 3200), P(X1 - 150, y, 3200)], {building: N, part: 'steel roof purlin', checks: [['beam_height', 3200]]});
    hatch('structure', C.roof, rect(X0 + 150, Y0 + 150, X1 - 150, Y1 - 150, 4), 'dots', 450, 0, {building: N, part: 'sealed concrete floor'}, C.int);
    hatch('paving', C.curb, rect(64000, 88900, 67350, 90500, 0), 'dots', 400, 0, {building: N, part: 'concrete apron at the roll up door'});
    sym('structure', C.sign, 'sign', P(62100, 97300), 0, {building: N, text: N});

    // workbench wall, north
    E(st, 'interior', C.struct, N, 'steel top workbench', 62900, 97650, 65300, 98250, 914, {check: ['counter_height', 914]});
    line('interior', C.int, rect(63050, 97850, 63350, 98100, 1050), {building: N, part: 'bench vise'}, closed);
    line('interior', C.int, rect(64700, 97800, 65100, 98100, 1150), {building: N, part: 'bench grinder for mower blades'}, closed);
    line('interior', C.elec, rect(63900, 97900, 64500, 98150, 1000), {building: N, part: 'battery charging station for the blowers'}, Object.assign({closed: true}));
    line('electrical', C.elec, rect(64000, 97920, 64100, 98000, 1080), {building: N, part: 'charger status light', anim: {type: 'blink', period: 1.4, duty: 0.5}}, closed);
    line('interior', C.int, [P(63000, Y1 - 100, 1100), P(65200, Y1 - 100, 1100), P(65200, Y1 - 100, 2100), P(63000, Y1 - 100, 2100)], {building: N, part: 'pegboard of hand tools'}, closed);
    hatch('structure', C.int, [P(63050, Y1 - 110, 1150), P(65150, Y1 - 110, 1150), P(65150, Y1 - 110, 2050), P(63050, Y1 - 110, 2050)], 'dots', 120, 0, {building: N, part: 'pegboard holes'}, C.struct);
    for (const [x, lab] of [[63300, 'hanging pruning saw'], [63700, 'hanging loppers'], [64150, 'hanging hedge shears'], [64600, 'hanging pipe wrench'], [64950, 'hanging pvc cutter']]) line('interior', C.brick, [P(x, Y1 - 130, 1300), P(x, Y1 - 130, 1900)], {building: N, part: lab});
    E(st, 'interior', C.car2, N, 'air compressor', 65700, 97700, 66300, 98200, 900);
    E(st, 'interior', C.yellow, N, 'pressure washer', 66600, 97700, 67250, 98200, 950);
    // utility sink corner with water and drain
    E(st, 'interior', C.int, N, 'utility mop sink', 67900, 97600, 68650, 98200, 914, {check: ['counter_height', 914], post: false});
    line('plumbing', C.plumb, [P(68270, 98250, 914), P(68270, 98250, 1150), P(68270, 98000, 1150)], {building: N, part: 'sink faucet with hose thread'});
    run('plumbing', C.plumb, [P(78400, 98100, -1219), P(68450, 98100, -1219), P(68450, 98100, 700)], {building: N, part: 'water service from the Palo Verde Avenue main'});
    run('plumbing', C.sewer, [P(68100, 97900, 700), P(68100, 97900, -1500), P(78600, 97700, -1500)], {building: N, part: 'sink drain to the Palo Verde Avenue sewer'});
    line('plumbing', C.plumb, rect(68650, 96700, 68750, 97200, 1100), {building: N, part: 'emergency eyewash station'}, closed);
    // east wall irrigation parts shelving
    E(st, 'interior', C.struct, N, 'steel shelving of irrigation parts', 68100, 93200, 68700, 96400, 1829, {check: ['shelf_height', 1829]});
    for (const [z, lab] of [[300, 'bottom shelf of pvc pipe fittings'], [900, 'middle shelf of sprinkler heads in bins'], [1500, 'top shelf of drip tubing coils']]) line('interior', C.int, rect(68150, 93250, 68650, 96350, z), {building: N, part: lab}, closed);
    // electrical service, panel and controller
    run('electrical', C.elec, [P(78600, 91700, -600), P(68600, 91700, -600), P(68600, 91700, 1200)], {building: N, part: 'underground feeder from the Palo Verde Avenue pole line'});
    line('electrical', C.elec, [P(X1 - 40, 91300, 1200), P(X1 - 40, 92000, 1200), P(X1 - 40, 92000, 2000), P(X1 - 40, 91300, 2000)], {building: N, part: 'shop panelboard'}, closed);
    line('electrical', C.elec, [P(X1 - 60, 91650, 2000), P(X1 - 60, 91650, 2900), P(X0 + 60, 91650, 2900), P(X0 + 60, 91650, 1700)], {building: N, part: 'conduit to the irrigation controller'});
    line('electrical', C.elec, [P(X0 + 40, 91400, 1300), P(X0 + 40, 91900, 1300), P(X0 + 40, 91900, 1700), P(X0 + 40, 91400, 1700)], {building: N, part: 'park irrigation controller', anim: {type: 'blink', period: 2.5, duty: 0.8}}, closed);
    line('electrical', C.elec, rect(X0 + 30, 92100, X0 + 60, 92300, 1500), {building: N, part: 'rain sensor wire terminal'}, closed);
    for (const [x, y, z, lab] of [[63400, Y1 - 40, 1100, 'bench outlet left'], [64800, Y1 - 40, 1100, 'bench outlet right'], [67600, Y1 - 40, 1100, 'gfci outlet by the sink'], [X0 + 40, 94800, 457, 'outlet by the trimmer rack'], [X1 - 40, 92600, 457, 'outlet for the shop fridge']]) sym('electrical', C.elec, 'outlet', P(x, y, z), 0, {building: N, part: lab, checks: [['outlet_height', z]]});
    sym('electrical', C.elec, 'switch', P(X0 + 40, 97100, 1219), 0, {building: N, part: 'light switch by the man door'});
    for (const [x, y] of [[64200, 93500], [66800, 93500], [64200, 96300], [66800, 96300]]) line('electrical', C.elec, rect(x - 600, y - 80, x + 600, y + 80, 3100), {building: N, part: 'led strip light'}, closed);
    line('electrical', C.int, [P(X1 - 30, 97400, 2400), P(X1 - 30, 97900, 2400), P(X1 - 30, 97900, 2900), P(X1 - 30, 97400, 2900)], {building: N, part: 'wall exhaust fan', anim: {type: 'spin', rpm: 30, pivot: P(X1 - 30, 97650, 2650)}}, closed);
    // west wall: flammables, trimmers, hand tools
    E(st, 'interior', C.yellow, N, 'yellow flammable storage cabinet', 62650, 92500, 63200, 93600, 1651, {color2: C.brick});
    line('interior', C.brick, [P(X0 + 60, 93900, 1300), P(X0 + 60, 95600, 1300), P(X0 + 60, 95600, 1800), P(X0 + 60, 93900, 1800)], {building: N, part: 'string trimmer wall rack'}, closed);
    for (const y of [94200, 94650, 95100, 95500]) line('interior', C.veg2, [P(X0 + 120, y, 400), P(X0 + 120, y, 1750)], {building: N, part: 'string trimmer on the rack'});
    line('interior', C.struct, [P(X0 + 60, 97200, 1500), P(X0 + 60, 97500, 1500), P(X0 + 60, 97500, 1600), P(X0 + 60, 97200, 1600)], {building: N, part: 'hooks for safety vests and ear muffs'}, closed);
    line('interior', C.brick, rect(X0 + 30, 96950, X0 + 130, 97100, 1100), {building: N, part: 'fire extinguisher by the man door'}, closed);
    line('interior', C.int, [P(62800, Y0 + 60, 1100), P(64100, Y0 + 60, 1100), P(64100, Y0 + 60, 1900), P(62800, Y0 + 60, 1900)], {building: N, part: 'work order whiteboard'}, closed);
    line('interior', C.brick, [P(67400, Y0 + 60, 1300), P(67800, Y0 + 60, 1300), P(67800, Y0 + 60, 1700), P(67400, Y0 + 60, 1700)], {building: N, part: 'first aid kit'}, closed);
    line('interior', C.int, [P(68000, Y0 + 60, 1200), P(68300, Y0 + 60, 1200), P(68300, Y0 + 60, 1500), P(68000, Y0 + 60, 1500)], {building: N, part: 'time clock'}, closed);
    // floor equipment
    E(st, 'interior', C.veg, N, 'zero turn mower', 64500, 91200, 66100, 93100, 1000, {color2: C.yellow});
    line('interior', C.struct, rect(64400, 91500, 66200, 92400, 300), {building: N, part: 'zero turn mower deck'}, closed);
    E(st, 'interior', C.veg, N, 'utility vehicle with a dump bed', 64200, 94200, 65700, 97000, 1900, {color2: C.struct});
    line('interior', C.struct, rect(64250, 94250, 65650, 95600, 900), {building: N, part: 'utility vehicle dump bed'}, closed);
    E(st, 'interior', C.car2, N, 'broadcast fertilizer spreader', 66500, 91300, 67100, 91900, 900);
    E(st, 'interior', C.brick, N, 'wheelbarrow', 66500, 92600, 67200, 93900, 600);
    E(st, 'interior', C.brick, N, 'pallet of bagged bark mulch', 66600, 94600, 67700, 95700, 900, {color2: C.yellow});
    E(st, 'interior', C.int, N, 'shop fridge', 67900, 92300, 68500, 92900, 860);
    line('interior', C.plumb, circ(67300, 97000, 300, 900, 12), {building: N, part: 'garden hose reel'}, closed);
    line('interior', C.yellow, circ(63500, 91300, 220, 500, 10), {building: N, part: 'backpack sprayer'}, closed);
    st.block(67000, 96700, 67600, 97300); st.block(63280, 91080, 63720, 91520);

    Per(st, [X0, Y0, X1, Y1], 'standing', 'sharpening a mower blade at the grinder');
    Per(st, [X0, Y0, X1, Y1], 'standing', 'checking the zone schedule on the controller');
    Per(st, [X0, Y0, X1, Y1], 'standing', 'rinsing a sprayer tank at the mop sink');
    Per(st, [X0, Y0, X1, Y1], 'standing', 'hunting for a rotor head on the shelf');
    person(P(65600, 89500), 0, 'standing', 'hosing grass clippings off the apron');
    person(P(63300, 89600), 0, 'standing', 'sweeping the shop apron');
  }
  {   // Quail Run Comfort Station small additions
    const N = 'Quail Run Comfort Station', st = site('0:1');
    const R1 = [61200, 143400, 64050, 148400], R2 = [64050, 143400, 66900, 148400];
    for (const [R, nm] of [[R1, 'room one'], [R2, 'room two']]) {
      Wl(st, R, ['w', 'e', 'n'], N, 'toilet seat cover dispenser, ' + nm, C.int, 400, 1100, 1500);
      Wl(st, R, ['e', 'w', 'n'], N, 'coat hook, ' + nm, C.struct, 120, 1500, 1620);
      Wl(st, R, ['w', 'e'], N, 'sanitary napkin disposal, ' + nm, C.int, 250, 700, 1000);
      Wl(st, R, ['e', 'w', 'n'], N, 'park rules placard, ' + nm, C.sign, 300, 1500, 1800);
    }
    hatch('structure', C.plumb, rect(61350, 143550, 63900, 148250, 3), 'cross', 300, 0, {building: N, part: 'epoxy floor, room one'}, C.int);
    hatch('structure', C.plumb, rect(64200, 143550, 66750, 148250, 3), 'cross', 300, 0, {building: N, part: 'epoxy floor, room two'}, C.int);
  }

  // ================================================================= 1,1 Hard Pan Feed and Tractor
  {
    const N = 'Hard Pan Feed and Tractor', st = site('1:1');
    const STORE = [95392, 97392, 107632, 112632], WEST = [92392, 97392, 95392, 110132], WARE = [107632, 97392, 116776, 112632], RR = [92392, 110132, 95392, 112632];
    st.block(92392, 97392, 97400, 99900);  // behind and in front of the counter
    st.block(108500, 109700, 115000, 112632); // forklift lane by the dock wall
    // restroom
    line('interior', C.int, [P(94150, 112580, 1000), P(94850, 112580, 1000), P(94850, 112580, 1700), P(94150, 112580, 1700)], {building: N, part: 'restroom mirror'}, closed);
    line('interior', C.int, rect(95000, 112500, 95150, 112600, 1200), {building: N, part: 'restroom soap dispenser'}, closed);
    line('interior', C.int, [P(95340, 111850, 1100), P(95340, 112250, 1100), P(95340, 112250, 1500), P(95340, 111850, 1500)], {building: N, part: 'restroom paper towel dispenser'}, closed);
    line('interior', C.int, rect(92450, 111500, 92560, 111700, 650), {building: N, part: 'restroom toilet paper holder'}, closed);
    line('interior', C.int, [P(92800, 112580, 864), P(93700, 112580, 864)], {building: N, part: 'restroom rear grab bar'});
    line('interior', C.struct, circ(94300, 110700, 180, 600, 8), {building: N, part: 'restroom trash can'}, closed);
    line('interior', C.struct, rect(95300, 110350, 95360, 110450, 1600), {building: N, part: 'restroom coat hook'}, closed);
    line('electrical', C.int, circ(93300, 111000, 150, 2743, 8), {building: N, part: 'restroom exhaust fan grille'}, closed);
    hatch('structure', C.plumb, rect(92542, 110282, 95242, 112482, 3), 'cross', 250, 0, {building: N, part: 'restroom sheet vinyl floor'}, C.int);

    // store floor items
    F(st, STORE, N, 'display of galvanized chick waterers', C.int, 0, 0, 450, {r: 300, n: 10});
    F(st, STORE, N, 'stack of molasses lick tubs', C.brick, 0, 0, 750, {r: 380, n: 10});
    F(st, STORE, N, 'spinner rack of leashes and collars', C.car2, 0, 0, 1650, {r: 300, n: 10, anim: {type: 'spin', rpm: 2}, check: ['shelf_height', 1650]});
    F(st, STORE, N, 'barrel of horse treats', C.yellow, 0, 0, 900, {r: 300, n: 10});
    F(st, STORE, N, 'work boot display bench', C.brick, 1200, 450, 450);
    F(st, STORE, N, 'rack of work gloves', C.yellow, 900, 400, 1500, {check: ['shelf_height', 1500]});
    F(st, STORE, N, 'seed packet rack', C.veg, 900, 350, 1600, {check: ['shelf_height', 1600]});
    F(st, STORE, N, 'bin of seed potatoes', C.brick, 900, 700, 750);
    F(st, STORE, N, 'display wheelbarrow with a sale tag', C.veg, 700, 1300, 650);
    F(st, STORE, N, 'electric fence charger display', C.yellow, 800, 400, 1400, {check: ['shelf_height', 1400]});
    F(st, STORE, N, 'stack of dog beds', C.car, 900, 700, 600);
    F(st, STORE, N, 'garden hose end cap', C.plumb, 1000, 450, 1700, {check: ['shelf_height', 1700]});
    F(st, WEST, N, 'rolling ladder for the top shelf', C.struct, 600, 400, 1200);
    Wl(st, STORE, ['n', 'e'], N, 'rope spool rack, sold by the foot', C.brick, 1200, 900, 1500, {hatch: 'lines', sp: 100, hatch2: C.yellow});
    Wl(st, STORE, ['n', 'w'], N, 'county fair 4 h ribbon board', C.yellow, 900, 1300, 2000, {color2: C.brick});
    Wl(st, STORE, ['n', 'e'], N, 'store wall clock', C.int, 350, 2400, 2750);
    Wl(st, STORE, ['s'], N, 'lit open sign in the window', C.brick, 700, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 3, duty: 0.9}});
    Wl(st, STORE, ['s', 'n'], N, 'chalkboard of today hay prices', C.struct, 900, 1300, 2000, {hatch: 'lines', sp: 160, hatch2: C.int});
    for (const [R, lab, z, sd] of [[STORE, 'store outlet by the seed rack', 457, ['n', 'e']], [STORE, 'store outlet by the fence chargers', 457, ['e', 'n']], [WEST, 'outlet behind the bulletin board', 457, ['w']], [WARE, 'warehouse outlet by the dock', 1067, ['s', 'e']], [WARE, 'warehouse outlet for the fan', 1067, ['e', 'n']], [STORE, 'store outlet for the window sign', 1067, ['s']]]) Out(st, R, sd, N, lab, z);
    for (let i = 0; i < 3; i++) Cl(st, STORE, N, 'store ceiling fan ' + (i + 1), C.int, 650, 3500, {disc: 'interior', anim: {type: 'spin', rpm: 60}, n: 10});
    for (let i = 0; i < 3; i++) Cl(st, STORE, N, 'store led panel light ' + (i + 1), C.elec, 300, 3600);
    Cl(st, STORE, N, 'store fire sprinkler head', C.car, 60, 3600, {disc: 'plumbing'});

    // warehouse
    Cl(st, WARE, N, 'big slow warehouse fan', C.int, 2200, 4800, {disc: 'interior', anim: {type: 'spin', rpm: 12}, n: 12});
    for (let i = 0; i < 4; i++) Cl(st, WARE, N, 'warehouse led high bay ' + (i + 1), C.elec, 280, 4900);
    Wl(st, WARE, ['e', 'n'], N, 'forklift daily inspection checklist', C.sign, 400, 1300, 1700);
    Wl(st, WARE, ['e'], N, 'warehouse emergency light', C.brick, 400, 2600, 2800, {disc: 'electrical', anim: {type: 'blink', period: 6, duty: 0.92}});
    Wl(st, WARE, ['n', 'e'], N, 'broom and shovel rack', C.brick, 900, 900, 1700);
    line('plumbing', C.plumb, [P(116700, 111900, 900), P(116700, 112200, 900), P(116700, 112200, 1100), P(116700, 111900, 1100)], {building: N, part: 'battery room eyewash station'}, closed);

    Per(st, STORE, 'standing', 'spinning the rack for a red collar');
    Per(st, STORE, 'standing', 'sorting seed potatoes into a paper sack');
    Per(st, STORE, 'standing', 'trying on work gloves for fit');
    Per(st, STORE, 'standing', 'cutting ten feet of rope off the spool');
    Per(st, STORE, 'standing', 'asking about an electric fence charger');
    Per(st, STORE, 'standing', 'testing the bounce of a dog bed');
    Per(st, WARE, 'standing', 'checking the forklift tires on the list');
    Per(st, WARE, 'standing', 'sweeping chaff from the warehouse floor');
    Per(st, WARE, 'standing', 'inspecting a stock tank for dents');
    Per(st, WARE, 'standing', 'rolling a drum onto the spill pallet');
  }

  // ================================================================= 2,0 Pump Jack Motor Court and Pump Jack Office
  push('remove', {id: 1204});   // an early cholla line that ran through rooms 101 to 103
  {
    const N = 'Pump Jack Motor Court', st = site('2:0');
    const roomActs = ['setting the alarm for a five am start', 'watching the weather on the room tv', 'reading a paperback in the armchair', 'drying hair at the bathroom mirror', 'packing a lunch cooler for the oil field', 'video calling the kids before bed', 'shaking sand out of a pair of boots', 'counting out tip money for housekeeping', 'writing a postcard at the small table', 'rolling a suitcase toward the door'];
    const floors = [['wastebasket', C.struct, 150, 350], ['round side table', C.int, 300, 700]];
    for (let i = 0; i < 10; i++) {
      const x0 = 176640 + 3658 * i, nm = 'room ' + (101 + i);
      const BED = [x0, 39144, x0 + 3658, 44009];
      // textures
      hatch('structure', C.brick, rect(x0 + 150, 39294, x0 + 3508, 44009, 3), 'dots', 300, 0, {building: N, part: 'low pile carpet, ' + nm}, C.struct);
      hatch('structure', C.car2, rect(x0 + 520, 41764, x0 + 2080, 43724, 615), 'lines', 150, 45, {building: N, part: 'quilted bedspread, ' + nm}, C.yellow);
      hatch('structure', C.yellow, vface(x0 + 1350, 45630, x0 + 3350, 45630, 400, 1950), 'lines', 120, 90, {building: N, part: 'shower curtain, ' + nm}, C.car2);
      // bath fixtures at fixed spots, same layout in every room
      line('interior', C.int, rect(x0 + 80, 44300, x0 + 700, 45300, 864), {building: N, part: 'vanity counter, ' + nm, checks: [['counter_height', 864]]}, closed);
      line('interior', C.int, circ(x0 + 430, 44800, 180, 840, 10), {building: N, part: 'vanity sink basin, ' + nm}, closed);
      line('plumbing', C.plumb, [P(x0 + 120, 44800, 864), P(x0 + 120, 44800, 1000), P(x0 + 300, 44800, 1000)], {building: N, part: 'lavatory faucet, ' + nm});
      line('plumbing', C.sewer, [P(x0 + 430, 44800, 820), P(x0 + 430, 44800, 450), P(x0 + 90, 44800, 450)], {building: N, part: 'lavatory p trap, ' + nm});
      line('interior', C.int, [P(x0 + 30, 44400, 1150), P(x0 + 30, 45200, 1150), P(x0 + 30, 45200, 1800), P(x0 + 30, 44400, 1800)], {building: N, part: 'vanity mirror, ' + nm}, closed);
      line('interior', C.int, rect(x0 + 30, 45450, x0 + 130, 45600, 650), {building: N, part: 'toilet paper holder, ' + nm}, closed);
      line('interior', C.int, [P(x0 + 1300, 45630, 2000), P(x0 + 3400, 45630, 2000)], {building: N, part: 'shower curtain rod, ' + nm});
      line('electrical', C.struct, [P(x0 + 3620, 44200, 1300), P(x0 + 3620, 44380, 1300), P(x0 + 3620, 44380, 1550), P(x0 + 3620, 44200, 1550)], {building: N, part: 'wall mounted hair dryer, ' + nm}, closed);
      line('interior', C.brick, rect(x0 + 1900, 45150, x0 + 2700, 45550, 8), {building: N, part: 'bath mat, ' + nm}, closed);
      line('interior', C.yellow, rect(x0 + 2950, 46250, x0 + 3150, 46350, 560), {building: N, part: 'shampoo bottles on the tub ledge, ' + nm}, closed);
      line('electrical', C.brick, rect(x0 + 2160, 41800, x0 + 2360, 41880, 640), {building: N, part: 'digital alarm clock, ' + nm, anim: {type: 'blink', period: 2, duty: 0.9}}, closed);
      // bedroom items through the pickers
      Wl(st, BED, ['w', 'e'], N, 'framed print of a pump jack at sunset, ' + nm, C.brick, 700, 1300, 1800, {color2: C.yellow});
      Wl(st, BED, ['w', 'e'], N, 'open closet rod and hat shelf, ' + nm, C.struct, 900, 1700, 1750, {check: ['shelf_height', 1700]});
      const f = floors[i % 2]; F(st, BED, N, f[0] + ', ' + nm, f[1], 0, 0, f[3], {r: f[2], n: 8});
      Per(st, BED, i === 3 ? 'standing' : i === 2 ? 'sitting' : 'standing', roomActs[i]);
    }
  }
  {
    const N = 'Pump Jack Office', st = site('2:0');
    const OFF = [170640, 18144, 177955, 24240];
    hatch('structure', C.brick, rect(170790, 18294, 177805, 24090, 3), 'brick', 400, 0, {building: N, part: 'saltillo tile floor'}, C.yellow);
    F(st, OFF, N, 'lobby armchair', C.brick, 800, 800, 450);
    F(st, OFF, N, 'potted soaptree yucca', C.veg, 0, 0, 1400, {r: 300, n: 10});
    F(st, OFF, N, 'umbrella and cane stand', C.struct, 0, 0, 600, {r: 150, n: 8});
    F(st, OFF, N, 'magazine table with road atlases', C.int, 700, 450, 500);
    Wl(st, OFF, ['n', 'w', 'e'], N, 'framed aerial photo of the old oil field', C.brick, 1000, 1300, 1900, {color2: C.yellow});
    Wl(st, OFF, ['w', 'n'], N, 'lobby wall clock', C.int, 350, 2200, 2550);
    Wl(st, OFF, ['w', 'n', 'e'], N, 'county road map behind plexiglass', C.veg, 900, 1200, 1900, {hatch: 'lines', sp: 120, hatch2: C.yellow});
    Wl(st, OFF, ['e', 'w'], N, 'office fire extinguisher', C.brick, 200, 900, 1400);
    Wl(st, OFF, ['n', 'e'], N, 'first aid cabinet', C.brick, 400, 1300, 1700);
    Cl(st, OFF, N, 'lobby ceiling fan', C.int, 600, 3300, {disc: 'interior', anim: {type: 'spin', rpm: 45}, n: 10});
    Cl(st, OFF, N, 'lobby recessed light', C.elec, 120, 3400);
    Cl(st, OFF, N, 'lobby fire sprinkler head', C.car, 60, 3400, {disc: 'plumbing'});
    Per(st, OFF, 'sitting', 'waiting in the armchair for a ride');
    Per(st, OFF, 'standing', 'tracing a route in a road atlas');
    Per(st, OFF, 'standing', 'asking where to get a good breakfast');
  }
  if (missing) console.log('MISSING ' + missing);
}
