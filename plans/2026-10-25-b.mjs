// Agent Orange 2026-10-25 b: deepen the three blocks touched longest ago.
// 0,2 Desert Willow Elementary, 2,1 Sidewinder Wash Clubhouse, 3,0 Horned Toad Travel Stop.
// Every floor item and person goes through a seeded clear-cell picker that reads the live city,
// every wall item through a wall-slot finder and every ceiling item through a ceiling-slot finder,
// so nothing lands on existing fixtures, doors, windows or people.
export default function (k) {
  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 0,2 Desert Willow Elementary
  {
    const N = 'Desert Willow Elementary', st = site('0:2');
    const y0 = 198496, y1 = 207640;
    const K = [15144, y0, 24288, y1], G1 = [24288, y0, 33432, y1], G2 = [33432, y0, 42576, y1], LIB = [42576, y0, 51720, y1], OFF = [51720, y0, 60864, y1];
    // classroom floors: vinyl composition tile, one hatch per room (texture)
    for (const [r, nm] of [[K, 'kindergarten'], [G1, 'first grade'], [G2, 'second grade'], [OFF, 'office and nurse']]) hatch('structure', C.roof, rect(r[0] + 150, r[1] + 150, r[2] - 150, r[3] - 150, 3), 'cross', 305, 0, {building: N, part: nm + ' vinyl composition tile floor'}, C.int);
    // corridor side wall shadow inside each room (texture)
    for (const [r, nm] of [[K, 'kindergarten'], [G1, 'first grade'], [G2, 'second grade'], [LIB, 'library corner'], [OFF, 'office and nurse']]) hatch('structure', C.struct, vface(r[0] + 150, r[3] - 150, r[2] - 150, r[3] - 150, 0, 1100), 'gradient', 250, 0, {building: N, part: nm + ' wainscot shadow'}, C.roof);

    // Kindergarten
    F(st, K, N, 'kindergarten art easel', C.yellow, 700, 600, 1200, {color2: C.brick});
    F(st, K, N, 'kindergarten sand and water table', C.plumb, 1200, 600, 610, {color2: C.yellow});
    F(st, K, N, 'kindergarten play kitchen', C.brick, 1000, 400, 900);
    F(st, K, N, 'kindergarten wooden block shelf', C.veg, 1200, 350, 760);
    F(st, K, N, 'kindergarten stack of nap mats', C.car2, 500, 900, 300);
    F(st, K, N, 'kindergarten round activity table', C.yellow, 0, 0, 560, {r: 450, n: 12});
    F(st, K, N, 'kindergarten tub of crayons', C.brick, 0, 0, 300, {r: 180, n: 8});
    F(st, K, N, 'kindergarten dress up trunk', C.car, 800, 450, 500);
    Wl(st, K, ['n', 'w'], N, 'kindergarten alphabet line banner', C.yellow, 4800, 2250, 2450, {color2: C.brick});
    Wl(st, K, ['w', 'n'], N, 'kindergarten calendar and weather board', C.brick, 1500, 1100, 2000, {hatch: 'dots', sp: 120, hatch2: C.yellow});
    Wl(st, K, ['e', 'w'], N, 'kindergarten class job chart', C.veg, 900, 1200, 1800);
    Wl(st, K, ['e', 'n'], N, 'kindergarten hand washing poster', C.plumb, 450, 1300, 1900);
    Out(st, K, ['e', 'w'], N, 'kindergarten duplex outlet', 457);
    Out(st, K, ['w', 'e'], N, 'kindergarten outlet by the easel', 457);
    Cl(st, K, N, 'kindergarten ceiling speaker', C.int, 150, 2720);
    Cl(st, K, N, 'kindergarten wireless access point', C.int, 120, 2720, {anim: {type: 'blink', period: 2, duty: 0.8}});
    Cl(st, K, N, 'kindergarten occupancy sensor', C.elec, 80, 2720);
    Cl(st, K, N, 'kindergarten fire sprinkler head', C.car, 60, 2700, {disc: 'plumbing'});
    line('interior', C.int, rect(22000, 205200, 22300, 205500, 1100), {building: N, part: 'kindergarten document camera on the teacher desk'}, closed);
    Per(st, K, 'standing', 'painting a purple cactus at the easel');
    Per(st, K, 'standing', 'pouring water through a funnel at the water table');
    Per(st, K, 'standing', 'serving pretend soup from the play kitchen');
    Per(st, K, 'sitting', 'stacking wooden blocks into a tower');

    // First grade
    F(st, G1, N, 'first grade chromebook charging cart', C.struct, 900, 600, 1000, {color2: C.int});
    line('electrical', C.elec, [P(24438, 199200, 457), P(24438, 199200, 900)], {building: N, part: 'first grade cart charging cord'});
    F(st, G1, N, 'first grade guided reading table', C.yellow, 0, 0, 640, {r: 520, n: 14});
    F(st, G1, N, 'first grade listening center', C.int, 900, 500, 700);
    F(st, G1, N, 'first grade class guinea pig cage on a stand', C.veg, 900, 450, 800, {color2: C.yellow});
    F(st, G1, N, 'first grade pocket chart stand', C.brick, 900, 400, 1500);
    F(st, G1, N, 'first grade math manipulatives bins', C.car2, 1000, 400, 700);
    F(st, G1, N, 'first grade wobble stool', C.car, 0, 0, 450, {r: 180, n: 8});
    F(st, G1, N, 'first grade recycling bin', C.plumb, 0, 0, 600, {r: 200, n: 8});
    Wl(st, G1, ['n', 'w'], N, 'first grade word wall', C.yellow, 4200, 1600, 2400, {hatch: 'lines', sp: 160, hatch2: C.brick});
    Wl(st, G1, ['e', 'w'], N, 'first grade number line', C.veg, 3000, 2300, 2450, {color2: C.car2});
    Wl(st, G1, ['w', 'e'], N, 'first grade birthday chart', C.brick, 900, 1200, 1800);
    Wl(st, G1, ['e', 'n'], N, 'first grade fire evacuation map', C.car, 400, 1400, 1700);
    Out(st, G1, ['e', 'w'], N, 'first grade duplex outlet', 457);
    Out(st, G1, ['w', 'e'], N, 'first grade outlet at the listening center', 457);
    Cl(st, G1, N, 'first grade ceiling speaker', C.int, 150, 2720);
    Cl(st, G1, N, 'first grade wireless access point', C.int, 120, 2720, {anim: {type: 'blink', period: 2.2, duty: 0.8}});
    Cl(st, G1, N, 'first grade occupancy sensor', C.elec, 80, 2720);
    Cl(st, G1, N, 'first grade fire sprinkler head', C.car, 60, 2700, {disc: 'plumbing'});
    line('interior', C.int, rect(31100, 205200, 31400, 205500, 1100), {building: N, part: 'first grade document camera on the teacher desk'}, closed);
    Per(st, G1, 'sitting', 'reading a leveled book at the kidney table');
    Per(st, G1, 'standing', 'feeding a carrot to the class guinea pig');
    Per(st, G1, 'sitting', 'listening to a story on headphones');
    Per(st, G1, 'standing', 'plugging chromebooks into the cart');

    // Second grade
    F(st, G2, N, 'second grade science table with bean sprouts', C.veg, 1200, 600, 760, {color2: C.yellow});
    F(st, G2, N, 'second grade aquarium on a stand', C.plumb, 900, 400, 1100, {color2: C.car2});
    line('electrical', C.elec, [P(33582, 203000, 457), P(33582, 203000, 1100)], {building: N, part: 'second grade aquarium filter cord'});
    F(st, G2, N, 'second grade standing desk', C.struct, 900, 600, 1050);
    F(st, G2, N, 'second grade yoga ball seat', C.car2, 0, 0, 550, {r: 280, n: 10});
    F(st, G2, N, 'second grade book bin crate', C.brick, 700, 400, 350);
    F(st, G2, N, 'second grade lost and found tub', C.yellow, 600, 450, 400);
    F(st, G2, N, 'second grade teacher stool', C.int, 0, 0, 760, {r: 200, n: 8});
    Wl(st, G2, ['n', 'w'], N, 'second grade map of the states', C.plumb, 2400, 1400, 2300, {hatch: 'lines', sp: 200, hatch2: C.veg});
    Wl(st, G2, ['w', 'e'], N, 'second grade multiplication chart', C.yellow, 900, 1300, 2100);
    Wl(st, G2, ['e', 'w'], N, 'second grade lost tooth chart', C.brick, 600, 1200, 1800);
    Wl(st, G2, ['e', 'n'], N, 'second grade cursive alphabet strip', C.veg, 3600, 2280, 2440, {color2: C.yellow});
    Out(st, G2, ['e', 'w'], N, 'second grade duplex outlet', 457);
    Out(st, G2, ['w', 'e'], N, 'second grade outlet by the science table', 457);
    Cl(st, G2, N, 'second grade ceiling speaker', C.int, 150, 2720);
    Cl(st, G2, N, 'second grade wireless access point', C.int, 120, 2720, {anim: {type: 'blink', period: 1.8, duty: 0.8}});
    Cl(st, G2, N, 'second grade occupancy sensor', C.elec, 80, 2720);
    Cl(st, G2, N, 'second grade fire sprinkler head', C.car, 60, 2700, {disc: 'plumbing'});
    line('interior', C.int, rect(40200, 205200, 40500, 205500, 1100), {building: N, part: 'second grade document camera on the teacher desk'}, closed);
    Per(st, G2, 'standing', 'measuring bean sprouts with a ruler');
    Per(st, G2, 'standing', 'tapping the glass to wave at a goldfish');
    Per(st, G2, 'sitting', 'bouncing gently on a yoga ball seat');
    Per(st, G2, 'standing', 'digging through lost and found for a jacket');

    // Library corner
    F(st, LIB, N, 'library magazine rack', C.brick, 900, 350, 1300, {check: ['shelf_height', 1300]});
    F(st, LIB, N, 'library puppet theater', C.car, 1100, 500, 1500, {color2: C.yellow});
    F(st, LIB, N, 'library returned book drop bin', C.struct, 600, 600, 900);
    F(st, LIB, N, 'library rolling step stool', C.int, 0, 0, 400, {r: 220, n: 8});
    F(st, LIB, N, 'library reading tent', C.veg, 0, 0, 1300, {r: 650, n: 6, color2: C.yellow});
    F(st, LIB, N, 'library new arrivals display table', C.yellow, 1200, 600, 760);
    F(st, LIB, N, 'library low board book bin', C.brick, 800, 450, 450);
    Wl(st, LIB, ['n', 'e'], N, 'library summer reading poster', C.yellow, 600, 1300, 2100);
    Wl(st, LIB, ['e', 'w'], N, 'library author birthday board', C.brick, 1200, 1200, 2000, {hatch: 'dots', sp: 120, hatch2: C.yellow});
    Wl(st, LIB, ['w', 'n'], N, 'library quiet please sign', C.car2, 600, 2000, 2300);
    Out(st, LIB, ['e', 'w'], N, 'library duplex outlet', 457);
    Out(st, LIB, ['w', 'e'], N, 'library outlet by the display table', 457);
    Cl(st, LIB, N, 'library ceiling speaker', C.int, 150, 2720);
    Cl(st, LIB, N, 'library wireless access point', C.int, 120, 2720, {anim: {type: 'blink', period: 2.5, duty: 0.8}});
    Cl(st, LIB, N, 'library fire sprinkler head', C.car, 60, 2700, {disc: 'plumbing'});
    Per(st, LIB, 'standing', 'putting on a coyote puppet show');
    Per(st, LIB, 'sitting', 'reading by flashlight in the reading tent');
    Per(st, LIB, 'standing', 'dropping overdue books in the return bin');

    // Office and nurse
    F(st, OFF, N, 'office laminator on a cart', C.int, 900, 500, 900, {anim: {type: 'blink', period: 3, duty: 0.6}});
    F(st, OFF, N, 'office paper cutter table', C.struct, 900, 600, 914, {check: ['counter_height', 914]});
    F(st, OFF, N, 'nurse upright scale', C.int, 400, 400, 1500);
    F(st, OFF, N, 'nurse folded wheelchair', C.struct, 700, 300, 900);
    F(st, OFF, N, 'office water cooler with a five gallon jug', C.plumb, 0, 0, 1200, {r: 170, n: 10, color2: C.car2});
    F(st, OFF, N, 'office lost and found bin', C.yellow, 800, 500, 600);
    F(st, OFF, N, 'office shredder', C.struct, 450, 350, 700);
    Wl(st, OFF, ['e', 'n'], N, 'nurse eye chart', C.int, 450, 1200, 1900);
    Wl(st, OFF, ['n', 'e'], N, 'nurse locked medication cabinet', C.car, 700, 1400, 2100, {check: ['shelf_height', 1400]});
    Wl(st, OFF, ['n', 'w'], N, 'office key cabinet', C.struct, 450, 1500, 2000);
    Wl(st, OFF, ['w', 'n'], N, 'office bell schedule controller', C.elec, 400, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 1, duty: 0.5}});
    Wl(st, OFF, ['n', 'w'], N, 'office two way radio charging bank', C.elec, 900, 1100, 1300, {disc: 'electrical', color2: C.veg});
    Wl(st, OFF, ['w', 'e'], N, 'office student of the month board', C.yellow, 1200, 1300, 2000, {hatch: 'dots', sp: 120, hatch2: C.brick});
    Out(st, OFF, ['w', 'e'], N, 'office outlet by the laminator', 457);
    Out(st, OFF, ['n', 'e'], N, 'office counter height outlet', 1100);
    Cl(st, OFF, N, 'office ceiling speaker', C.int, 150, 2720);
    Cl(st, OFF, N, 'office wireless access point', C.int, 120, 2720, {anim: {type: 'blink', period: 2.1, duty: 0.8}});
    Cl(st, OFF, N, 'office fire sprinkler head', C.car, 60, 2700, {disc: 'plumbing'});
    line('interior', C.plumb, arc(58900, 203450, 1300, 120, 240, 8, 2100), {building: N, part: 'nurse privacy curtain track'});
    // bottle filler in the office, fed off the cold main above the ceiling, drained to the sewer lateral
    line('plumbing', C.plumb, [P(53500, 207200, 2900), P(53500, 207450, 2900), P(53500, 207450, 1000)], {building: N, part: 'bottle filler cold water drop'});
    line('plumbing', C.sewer, [P(53700, 207450, 900), P(53700, 207450, -300)], {building: N, part: 'bottle filler drain and trap'});
    line('interior', C.int, rect(53250, 207350, 53950, 207520, 1000), {building: N, part: 'bottle filling station', checks: [['counter_height', 1000]]}, closed);
    sym('electrical', C.elec, 'outlet', P(53150, 207500, 1100), 0, {building: N, part: 'bottle filler chiller outlet', checks: [['outlet_height', 1100]]});
    Per(st, OFF, 'standing', 'laminating name tags for field day');
    Per(st, OFF, 'standing', 'reading the eye chart with one eye covered');
    Per(st, OFF, 'standing', 'filling a water bottle at the filler');
    Per(st, OFF, 'standing', 'paging a parent over the intercom');
  }

  {   // school extras, round and wall items that differ by room
    const N = 'Desert Willow Elementary', st = site('0:2');
    const y0 = 198496, y1 = 207640;
    const rooms = [['kindergarten', [15144, y0, 24288, y1]], ['first grade', [24288, y0, 33432, y1]], ['second grade', [33432, y0, 42576, y1]], ['library', [42576, y0, 51720, y1]], ['office', [51720, y0, 60864, y1]]];
    const roundSets = {
      'kindergarten': [['floor cushion for circle time', C.car, 300, 120], ['bucket of hula hoops', C.yellow, 300, 500], ['play dough tub', C.veg, 150, 150], ['toy drum', C.brick, 200, 300]],
      'first grade': [['beanbag chair in the calm corner', C.plumb, 400, 450], ['bucket of sidewalk chalk', C.yellow, 200, 300], ['potted pothos on a stool', C.veg, 220, 700], ['round rug spot for partner reading', C.car2, 450, 10]],
      'second grade': [['round seat cushion', C.car, 280, 120], ['bin of jump ropes', C.yellow, 250, 400], ['potted spider plant', C.veg, 220, 600], ['globe on a floor stand', C.plumb, 250, 1000]],
      'library': [['round ottoman', C.brick, 300, 400], ['potted ficus by the window', C.veg, 300, 1500], ['bin of audiobook players', C.int, 220, 350]],
      'office': [['potted ponytail palm', C.veg, 250, 900], ['round side table with brochures', C.yellow, 300, 600], ['umbrella stand by the door', C.struct, 150, 600]],
    };
    const wallSets = {
      'kindergarten': [['color wheel poster', C.yellow, 600, 1300, 1900], ['shapes poster', C.car2, 600, 1300, 1900]],
      'first grade': [['reading strategies anchor chart', C.brick, 700, 1300, 2100], ['clip chart for behavior', C.veg, 300, 1100, 2000]],
      'second grade': [['writing process anchor chart', C.brick, 700, 1300, 2100], ['class rules poster', C.yellow, 600, 1300, 1900]],
      'library': [['dewey decimal poster', C.int, 600, 1300, 1900]],
      'office': [['bus route map', C.yellow, 900, 1300, 2000], ['district calendar', C.brick, 600, 1300, 1900]],
    };
    for (const [nm, room] of rooms) {
      for (const [lab, col, r, h] of roundSets[nm]) F(st, room, N, nm + ' ' + lab, col, 0, 0, h, {r, n: 10});
      for (const [lab, col, w, z0, z1] of wallSets[nm]) Wl(st, room, ['n', 'e', 'w'], N, nm + ' ' + lab, col, w, z0, z1, {color2: C.int});
      Cl(st, room, N, nm + ' smoke detector led', C.brick, 70, 2720, {anim: {type: 'blink', period: 10, duty: 0.05}});
    }
  }

  // ================================================================= 2,1 Sidewinder Wash Clubhouse
  {
    const N = 'Sidewinder Wash Clubhouse', st = site('2:1');
    const y0 = 115214, y1 = 122529;
    const LAU = [192024, y0, 196088, y1], SHS = [196088, y0, 199339, 118872], TOI = [196088, 118872, 199339, y1], REC = [199339, y0, 204216, y1];
    hatch('structure', C.brick, rect(199489, 115364, 204066, 122379, 4), 'lines', 140, 0, {building: N, part: 'rec room pine plank floor'}, C.struct);
    hatch('structure', C.plumb, rect(196238, 118872, 199189, 122379, 4), 'cross', 200, 0, {building: N, part: 'restroom hex tile floor'}, C.int);
    hatch('structure', C.struct, vface(192024, 122529, 204216, 122529, 0, 900), 'gradient', 250, 0, {building: N, part: 'north wall base shadow'}, C.roof);

    // Laundry
    F(st, LAU, N, 'laundry ironing board', C.int, 1100, 350, 900);
    F(st, LAU, N, 'laundry lost sock basket', C.yellow, 0, 0, 350, {r: 220, n: 8});
    F(st, LAU, N, 'laundry trash can for lint', C.struct, 0, 0, 600, {r: 220, n: 8});
    F(st, LAU, N, 'laundry folding drying rack', C.car2, 600, 400, 1100);
    Wl(st, LAU, ['w', 'n', 's'], N, 'laundry rules sign: last load at nine', C.sign, 450, 1500, 1800);
    Wl(st, LAU, ['w', 's'], N, 'laundry lint brush and dryer sheet shelf', C.int, 700, 1500, 1800, {check: ['shelf_height', 1500]});
    Wl(st, LAU, ['e', 'w'], N, 'laundry wall clock', C.brick, 300, 2100, 2400);
    Out(st, LAU, ['w', 'e'], N, 'laundry iron outlet', 1067);
    Cl(st, LAU, N, 'laundry smoke alarm test light', C.int, 80, 2700, {anim: {type: 'blink', period: 6, duty: 0.1}});
    Per(st, LAU, 'standing', 'ironing a pearl snap shirt');
    Per(st, LAU, 'standing', 'matching socks from the lost sock basket');

    // Shower room and restrooms
    line('interior', C.car2, arc(196974, 116800, 650, 200, 340, 8, 2000), {building: N, part: 'shower curtain one'}, {color2: C.yellow});
    line('interior', C.car2, arc(198474, 116800, 650, 200, 340, 8, 2000), {building: N, part: 'shower curtain two'}, {color2: C.yellow});
    Wl(st, SHS, ['w', 'e', 'n'], N, 'shower room soap dispenser', C.int, 150, 1200, 1450);
    Wl(st, SHS, ['e', 'w', 'n'], N, 'shower room paper towel dispenser', C.int, 350, 1100, 1550);
    Wl(st, TOI, ['w', 'e'], N, 'restroom toilet paper holder', C.int, 200, 650, 800);
    Wl(st, TOI, ['e', 'w'], N, 'restroom second toilet paper holder', C.int, 200, 650, 800);
    Wl(st, TOI, ['w', 'e', 'n'], N, 'restroom wall hair dryer', C.struct, 300, 1300, 1600, {disc: 'electrical'});
    F(st, SHS, N, 'shower room bath mat', C.brick, 600, 400, 10);
    F(st, TOI, N, 'restroom sanitary bin', C.struct, 0, 0, 450, {r: 150, n: 8});
    Out(st, TOI, ['w', 'e'], N, 'restroom gfci outlet by the vanity', 1100);
    Cl(st, SHS, N, 'shower room vapor tight light', C.int, 150, 2700);
    Per(st, TOI, 'standing', 'combing wet hair at the vanity');

    // Rec room
    F(st, REC, N, 'rec room plaid couch', C.brick, 1800, 800, 450, {color2: C.veg});
    F(st, REC, N, 'rec room foosball table', C.veg, 1200, 700, 900, {check: ['counter_height', 900]});
    F(st, REC, N, 'rec room jigsaw puzzle table', C.yellow, 0, 0, 760, {r: 550, n: 12});
    F(st, REC, N, 'rec room water cooler', C.plumb, 0, 0, 1200, {r: 170, n: 10});
    F(st, REC, N, 'rec room trash can', C.struct, 0, 0, 600, {r: 200, n: 8});
    F(st, REC, N, 'rec room floor lamp', C.int, 0, 0, 1600, {r: 200, n: 8, post: true});
    Wl(st, REC, ['n', 'e'], N, 'rec room board game shelf', C.int, 1200, 1300, 1900, {check: ['shelf_height', 1900], hatch: 'lines', sp: 110, hatch2: C.brick});
    Wl(st, REC, ['e', 'n', 'w'], N, 'rec room flat screen tv', C.struct, 1200, 1400, 2100, {anim: {type: 'blink', period: 4, duty: 0.95}});
    Wl(st, REC, ['n', 'e', 'w'], N, 'rec room camper mail cubbies', C.brick, 900, 1300, 1900, {check: ['shelf_height', 1900]});
    Wl(st, REC, ['w', 'n'], N, 'rec room coat hooks', C.int, 900, 1500, 1600);
    Wl(st, REC, ['n', 'w', 'e'], N, 'rec room wifi router', C.elec, 250, 1800, 1900, {disc: 'electrical', anim: {type: 'blink', period: 0.8, duty: 0.5}});
    Wl(st, REC, ['e', 'w'], N, 'rec room window air conditioner', C.struct, 650, 1300, 1700, {disc: 'electrical', color2: C.plumb});
    Out(st, REC, ['e', 'w'], N, 'rec room tv outlet', 1219);
    Out(st, REC, ['w', 'n'], N, 'rec room outlet by the couch', 457);
    Out(st, REC, ['n', 'e'], N, 'rec room air conditioner outlet', 1100);
    Cl(st, REC, N, 'rec room recessed can light', C.elec, 120, 2720);
    Cl(st, REC, N, 'rec room second recessed can light', C.elec, 120, 2720);
    Per(st, REC, 'standing', 'spinning the goalie rod at foosball');
    Per(st, REC, 'sitting', 'finding an edge piece of the puzzle');
    Per(st, REC, 'sitting', 'watching the weather channel for wind');
    Per(st, REC, 'standing', 'checking the mail cubby for a package');
    Per(st, REC, 'standing', 'filling a paper cone at the water cooler');
  }

  {   // clubhouse extras
    const N = 'Sidewinder Wash Clubhouse', st = site('2:1');
    const y0 = 115214, y1 = 122529;
    const LAU = [192024, y0, 196088, y1], REC = [199339, y0, 204216, y1];
    F(st, REC, N, 'rec room round footstool', C.brick, 0, 0, 400, {r: 250, n: 10});
    F(st, REC, N, 'rec room potted agave', C.veg, 0, 0, 600, {r: 250, n: 10});
    F(st, LAU, N, 'laundry round hamper', C.yellow, 0, 0, 600, {r: 250, n: 10});
    Wl(st, REC, ['n', 'e', 'w'], N, 'rec room horseshoe league standings', C.yellow, 600, 1300, 1900, {color2: C.brick});
    Wl(st, REC, ['n', 'e', 'w'], N, 'rec room park map with site numbers', C.veg, 900, 1300, 2000, {color2: C.int});
    Wl(st, LAU, ['w', 'n', 'e'], N, 'laundry coin price list', C.sign, 400, 1500, 1800, {color2: C.yellow});
    Cl(st, LAU, N, 'laundry ceiling exhaust grille', C.int, 150, 2720);
    Cl(st, REC, N, 'rec room smoke detector led', C.brick, 70, 2720, {anim: {type: 'blink', period: 10, duty: 0.05}});
  }

  // ================================================================= 3,0 Horned Toad Travel Stop
  {
    const N = 'Horned Toad Travel Stop', st = site('3:0');
    st.block(286176, 45144, 290676, 47500); st.block(286800, 54500, 289400, 55336);
    const SALES = [277788, 43144, 291518, 55336], RR = [291518, 49850, 295176, 55336], FRONT = [291518, 43144, 295176, 49850];
    hatch('structure', C.roof, rect(277038, 43294, 291368, 55186, 3), 'cross', 610, 0, {building: N, part: 'sales floor vinyl tile'}, C.int);
    hatch('structure', C.struct, vface(276888, 55336, 295176, 55336, 0, 1000), 'gradient', 250, 0, {building: N, part: 'back wall base shadow'}, C.roof);
    hatch('structure', C.yellow, rect(285118, 43294, 286946, 44600, 6), 'lines', 100, 90, {building: N, part: 'walk off entry mat'}, C.struct);

    // POS and counter gear behind the checkout counter (286176 to 290676, 45144 to 46944)
    line('interior', C.int, rect(287200, 46300, 287500, 46550, 1150), {building: N, part: 'age verification id scanner'}, closed);
    line('interior', C.int, rect(287700, 46300, 287900, 46450, 1100), {building: N, part: 'counterfeit bill detector light', anim: {type: 'blink', period: 1.2, duty: 0.5}}, closed);
    line('interior', C.int, rect(289200, 46300, 289500, 46600, 1100), {building: N, part: 'coin dispenser'}, closed);
    line('interior', C.int, rect(288200, 46350, 288600, 46650, 1150), {building: N, part: 'money order printer'}, closed);
    line('interior', C.struct, rect(286400, 46500, 286800, 46800, 1100), {building: N, part: 'impulse tin of lip balm and gum'}, closed);
    line('interior', C.brick, [P(286300, 47400, 1800), P(290500, 47400, 1800), P(290500, 47400, 2400), P(286300, 47400, 2400)], {building: N, part: 'overhead cigarette pack rack'}, {closed: true, color2: C.yellow});
    hatch('structure', C.brick, [P(286350, 47400, 1850), P(290450, 47400, 1850), P(290450, 47400, 2350), P(286350, 47400, 2350)], 'lines', 120, 90, {building: N, part: 'cigarette rack pack faces'}, C.yellow);
    line('interior', C.int, rect(289800, 46400, 290050, 46650, 1200), {building: N, part: 'label gun and price tags'}, closed);
    line('electrical', C.elec, [P(290400, 46900, 1016), P(290400, 46900, 457)], {building: N, part: 'counter power whip'});
    sym('electrical', C.elec, 'outlet', P(290600, 46944, 457), 0, {building: N, part: 'counter knee space outlet', checks: [['outlet_height', 457]]});

    // Sales floor
    F(st, SALES, N, 'sunglasses spinner rack', C.struct, 0, 0, 1700, {r: 300, n: 10, anim: {type: 'spin', rpm: 3}, check: ['shelf_height', 1700]});
    F(st, SALES, N, 'phone charger spinner rack', C.int, 0, 0, 1600, {r: 300, n: 10, anim: {type: 'spin', rpm: 2}, check: ['shelf_height', 1600]});
    F(st, SALES, N, 'souvenir t shirt round rack', C.car2, 0, 0, 1400, {r: 450, n: 12, check: ['shelf_height', 1400]});
    F(st, SALES, N, 'bin of horned toad plush toys', C.yellow, 0, 0, 700, {r: 350, n: 10});
    F(st, SALES, N, 'windshield washer fluid pallet', C.plumb, 1100, 1100, 900, {color2: C.car2});
    F(st, SALES, N, 'firewood and charcoal end cap', C.veg, 1200, 600, 1300, {check: ['shelf_height', 1300]});
    F(st, SALES, N, 'state road map rack', C.brick, 600, 300, 1500, {check: ['shelf_height', 1500]});
    F(st, SALES, N, 'wet floor sign by the coffee bar', C.yellow, 300, 300, 650);
    F(st, SALES, N, 'trash and recycling station', C.struct, 900, 450, 1000, {check: ['counter_height', 1000]});
    F(st, SALES, N, 'case stack of bottled water', C.plumb, 900, 900, 1000);
    F(st, SALES, N, 'price check scanner kiosk', C.int, 400, 300, 1500, {anim: {type: 'blink', period: 2, duty: 0.85}});
    F(st, SALES, N, 'nacho cheese and chili dispenser cart', C.brick, 900, 600, 914, {check: ['counter_height', 914], color2: C.yellow});
    F(st, SALES, N, 'frozen drink machine', C.car2, 800, 600, 1100, {check: ['counter_height', 1100]});
    F(st, SALES, N, 'pastry case on a stand', C.yellow, 900, 600, 1067, {check: ['counter_height', 1067]});
    F(st, SALES, N, 'trucker gear and cb radio display', C.struct, 1000, 500, 1600, {check: ['shelf_height', 1600]});
    F(st, SALES, N, 'ice cream novelty chest freezer', C.plumb, 1300, 700, 864, {check: ['counter_height', 864]});
    F(st, SALES, N, 'pallet of motor oil cases', C.yellow, 1100, 1100, 1000);
    Wl(st, SALES, ['s'], N, 'help wanted sign in the window', C.sign, 450, 1300, 1600);
    Wl(st, SALES, ['n', 'w'], N, 'restroom this way sign', C.sign, 600, 2200, 2450);
    Wl(st, SALES, ['n'], N, 'beef jerky wall rack', C.brick, 1500, 1000, 1900, {check: ['shelf_height', 1900], hatch: 'lines', sp: 130, hatch2: C.yellow});
    Wl(st, SALES, ['n', 's'], N, 'menu board over the hot food', C.yellow, 1800, 2200, 2700, {color2: C.brick, disc: 'electrical', anim: {type: 'blink', period: 8, duty: 0.95}});
    Out(st, SALES, ['n', 'w'], N, 'outlet for the frozen drink machine', 457);
    Out(st, SALES, ['n', 's'], N, 'outlet by the chest freezer', 457);
    Out(st, SALES, ['w', 'n'], N, 'outlet by the pastry case', 457);
    Cl(st, SALES, N, 'ceiling speaker playing country radio', C.int, 150, 3000);
    Cl(st, SALES, N, 'second ceiling speaker', C.int, 150, 3000);
    Cl(st, SALES, N, 'wireless access point for the card readers', C.int, 120, 3000, {anim: {type: 'blink', period: 1.6, duty: 0.7}});
    Cl(st, SALES, N, 'fire sprinkler head over the gondolas', C.car, 60, 2980, {disc: 'plumbing'});
    Cl(st, SALES, N, 'fire sprinkler head over the coolers', C.car, 60, 2980, {disc: 'plumbing'});
    Cl(st, SALES, N, 'emergency egress light', C.brick, 150, 2950, {anim: {type: 'blink', period: 5, duty: 0.95}});
    Cl(st, SALES, N, 'ceiling paddle fan', C.int, 600, 2900, {anim: {type: 'spin', rpm: 40}, n: 10});
    Cl(st, SALES, N, 'mirror dome for the back aisle', C.struct, 300, 2900, {disc: 'interior', n: 10});
    // fountain plumbing: cold water to the carbonator and syrup lines from the back room to the soda bar
    line('plumbing', C.plumb, [P(287200, 55000, 2900), P(289050, 55000, 2900), P(289050, 55000, 900)], {building: N, part: 'cold water to the soda carbonator'});
    line('interior', C.struct, rect(288800, 54700, 289300, 55100, 900), {building: N, part: 'soda carbonator pump'}, closed);
    line('interior', C.int, rect(286900, 54750, 288400, 55150, 1600), {building: N, part: 'bag in box syrup rack', checks: [['shelf_height', 1600]]}, closed);
    line('plumbing', C.brick, [P(287600, 55100, 1600), P(287600, 55100, 2900), P(291300, 55100, 2900), P(291300, 48300, 2900), P(291900, 48300, 2900), P(291900, 48300, 1000)], {building: N, part: 'syrup and soda lines to the fountain'}, {color2: C.yellow});
    line('interior', C.plumb, rect(293950, 47700, 294650, 48300, 600), {building: N, part: 'ice bin under the fountain bar'}, closed);
    line('plumbing', C.sewer, [P(294300, 48000, 550), P(294300, 48000, -400), P(293320, 51000, -600)], {building: N, part: 'ice bin drain to the restroom floor drain'});
    Per(st, SALES, 'standing', 'spinning the sunglasses rack');
    Per(st, SALES, 'standing', 'buying a horned toad plush for a kid');
    Per(st, SALES, 'standing', 'pumping nacho cheese onto chips');
    Per(st, SALES, 'standing', 'pulling a cherry slush from the machine');
    Per(st, SALES, 'standing', 'scanning a candy bar at the price checker');
    Per(st, SALES, 'standing', 'reading a state road map');
    Per(st, SALES, 'standing', 'hauling a jug of washer fluid');
    Per(st, SALES, 'standing', 'picking a maple bar from the pastry case');
    Per(st, SALES, 'standing', 'digging in the freezer for an ice cream bar');
    Per(st, SALES, 'standing', 'restocking the jerky wall');
    Per(st, SALES, 'standing', 'comparing cb radios with a trucker');
    Per(st, FRONT, 'standing', 'scanning an id for a beer sale');

    // Restrooms
    Wl(st, RR, ['e', 'n'], N, 'restroom soap dispenser', C.int, 150, 1100, 1350);
    Wl(st, RR, ['e', 'n'], N, 'restroom paper towel dispenser', C.int, 350, 1100, 1550);
    Wl(st, RR, ['n', 'e'], N, 'restroom automatic air freshener', C.int, 150, 2000, 2200, {anim: {type: 'blink', period: 20, duty: 0.05}});
    Wl(st, RR, ['e', 'n'], N, 'restroom cleaning log clipboard', C.sign, 250, 1400, 1700);
    F(st, RR, N, 'restroom sanitary bin', C.struct, 0, 0, 450, {r: 150, n: 8});
  }
  {   // travel stop extras
    const N = 'Horned Toad Travel Stop', st = site('3:0');
    const SALES = [277788, 43144, 291518, 55336];
    for (const [lab, col, r, h] of [['round display of cowboy hats', C.brick, 400, 1600], ['bucket of discount dvds', C.yellow, 300, 600], ['barrel of roasted peanuts', C.veg, 300, 900], ['round table of local honey jars', C.yellow, 350, 800], ['potted barrel cactus', C.veg, 250, 500]]) F(st, SALES, N, lab, col, 0, 0, h, {r, n: 10});
    for (const [lab, col, w, z0, z1] of [['clock over the coolers', C.brick, 350, 2300, 2650], ['no loitering sign', C.sign, 450, 1700, 2000], ['local rodeo flyer board', C.yellow, 800, 1300, 2000]]) Wl(st, SALES, ['n', 'w'], N, lab, col, w, z0, z1, {color2: C.int});
  }
  if (missing) console.log('MISSING ' + missing);
}
