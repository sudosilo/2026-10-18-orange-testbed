// Agent Orange 2026-10-27 a: deepen 0,2 school, 2,1 RV clubhouse, 3,0 travel stop.

export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 271027; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  const {tree, blob, wavy, rounded, S} = k;

  // ================================================================= 0,2 deepen
  {
    const N = 'Desert Willow Elementary', st = site('0:2');
    const R = [15144, 198496, 60864, 207640];
    F(st, R, N, 'rolling bin of playground balls', C.car, 700, 500, 800);
    F(st, R, N, 'teacher desk with a stack of graded quizzes', C.struct, 1500, 750, 760);
    F(st, R, N, 'mail crate of field trip permission slips', C.yellow, 400, 300, 300);
    F(st, R, N, 'tall cabinet of construction paper', C.int, 900, 450, 1830, {check: ['shelf_height', 1830]});
    F(st, R, N, 'kiln for the clay unit on a stand', C.struct, 700, 700, 900, {r: 380, n: 12});
    F(st, R, N, 'step stool at the sink', C.yellow, 400, 300, 300);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'times tables poster', C.sign, 900, 1300, 1900, {color2: C.yellow});
    Wl(st, R, ['s', 'w', 'n', 'e'], N, 'lunch count magnet board', C.int, 800, 1200, 1700, {hatch: 'lines', sp: 120, hatch2: C.yellow});
    Wl(st, R, ['e', 'n', 's', 'w'], N, 'fire evacuation map by the door', C.sign, 300, 1400, 1700);
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'pencil sharpener mounted on the wall', C.int, 150, 1000, 1150);
    Wl(st, R, ['n', 's', 'e', 'w'], N, 'whiteboard with tomorrow spelling words', C.struct, 1800, 900, 2100, {hatch: 'lines', sp: 300, ang: 90, hatch2: C.int});
    Wl(st, R, ['s', 'n', 'w', 'e'], N, 'wall phone to the front office', C.elec, 200, 1300, 1550, {disc: 'electrical'});
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the document camera', 1067);
    Out(st, R, ['n', 's', 'e', 'w'], N, 'outlet for the classroom fish tank', 457);
    Out(st, R, ['s', 'n', 'w', 'e'], N, 'outlet for the laminator', 1067);
    Cl(st, R, N, 'ceiling speaker for announcements', C.elec, 200, 2900);
    Cl(st, R, N, 'occupancy sensor over the reading corner', C.elec, 100, 2900, {anim: {type: 'blink', period: 4, duty: 0.1}});
    Cl(st, R, N, 'wireless access point', C.elec, 130, 2900, {anim: {type: 'blink', period: 1.2, duty: 0.5}});
    Cl(st, R, N, 'paper snowflakes hung from the grid', C.struct, 300, 2600, {disc: 'interior', anim: {type: 'sway', deg: 8, period: 5}});
    F(st, R, N, 'recycling bin of scrap paper', C.car2, 450, 350, 650);
    F(st, R, N, 'library cart of read aloud picture books', C.int, 900, 400, 1000);
    F(st, R, N, 'rolling easel of chart paper', C.struct, 700, 500, 1700);
    Wl(st, R, ['e', 's', 'n', 'w'], N, 'cactus life cycle bulletin board', C.veg, 1200, 1100, 1800, {hatch: 'cross', sp: 250, hatch2: C.yellow});
    Wl(st, R, ['w', 'n', 'e', 's'], N, 'hall pass hook by the door', C.int, 150, 1300, 1450);
    Wl(st, R, ['n', 'e', 'w', 's'], N, 'wall clock over the whiteboard', C.struct, 300, 2200, 2500);
    Out(st, R, ['w', 'e', 'n', 's'], N, 'outlet for the electric pencil sharpener', 1067);
    Cl(st, R, N, 'exit sign over the hall door', C.elec, 200, 2400, {anim: {type: 'blink', period: 10, duty: 0.92}});
    Per(st, R, 'standing', 'grading quizzes with a green pen');
    Per(st, R, 'sitting', 'counting change for the class store');
    Per(st, R, 'standing', 'moving a magnet to hot lunch');
    Per(st, R, 'sitting', 'rolling clay snakes for a pinch pot');
    Per(st, R, 'standing', 'collecting permission slips at the door');
  }
  {
    // school yard life on open layers
    const ox = 0, oy = 2 * S;
    const loop = [P(ox + 20000, oy + 12000), P(ox + 56000, oy + 12000), P(ox + 56000, oy + 15000), P(ox + 20000, oy + 15000), P(ox + 20000, oy + 12000)];
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'person', at: loop[0], rot: 0, meta: {pose: 'walking', activity: 'running the morning mile loop', anim: {type: 'path', pts: loop, speed: 2800}}});
  }

  // ================================================================= 2,1 deepen
  {
    const N = 'Sidewinder Wash Clubhouse', st = site('2:1');
    const R = [192024, 115214, 204216, 122529];
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'park map with numbered sites', C.sign, 900, 1300, 1900, {color2: C.yellow});
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'key hooks for the laundry room', C.int, 400, 1400, 1600);
    Wl(st, R, ['s', 'n', 'e', 'w'], N, 'potluck sign up sheet on a clipboard', C.sign, 300, 1300, 1700);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the coffee urn', 1067);
    Out(st, R, ['n', 'w', 's', 'e'], N, 'outlet for a phone charging strip', 457);
    Cl(st, R, N, 'evaporative cooler diffuser', C.int, 300, 2700, {disc: 'interior'});
    Wl(st, R, ['e', 'n', 's', 'w'], N, 'shelf of lending board games', C.int, 900, 1300, 1700);
    Wl(st, R, ['n', 's', 'w', 'e'], N, 'framed photo of the first rally', C.struct, 500, 1500, 1900);
    Per(st, R, 'standing', 'signing up to bring green chile stew');
    Per(st, R, 'standing', 'hanging the laundry room key back up');
  }
  {
    const ox = 2 * S, oy = 1 * S;
    for (let j = 0; j < 3; j++) line('vegetation', C.veg2, blob(ox + 20000 + j * 8000, oy + 70000, 650, 14, j + 51), {part: ['creosote and globe mallow bed', 'agave and deer grass bed', 'yucca and verbena bed'][j]}, {closed: true});
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'person', at: P(ox + 24000, oy + 71500), rot: 1, meta: {pose: 'standing', activity: 'tying a shade cloth over the young agave'}});
  }

  // ================================================================= 3,0 deepen
  {
    const N = 'Horned Toad Travel Stop', st = site('3:0');
    const R = [276888, 43144, 295176, 55336];
    F(st, R, N, 'phone charger spinner rack', C.int, 500, 500, 1600, {r: 280, n: 10, check: ['shelf_height', 1600]});
    F(st, R, N, 'floor display of windshield sun shades', C.yellow, 800, 400, 1300, {check: ['shelf_height', 1300]});
    F(st, R, N, 'stack of bottled water cases on a pallet', C.car2, 1100, 1000, 900);
    F(st, R, N, 'wet floor sign by the coffee bar', C.yellow, 300, 250, 600);
    F(st, R, N, 'endcap of motor oil and coolant', C.brick, 1000, 450, 1500, {check: ['shelf_height', 1500]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'wall of trucker caps on pegs', C.struct, 1200, 1500, 2100, {hatch: 'dots', sp: 200, hatch2: C.int});
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'fuel price display behind the register', C.sign, 700, 1900, 2300, {color2: C.yellow, disc: 'electrical'});
    Wl(st, R, ['s', 'n', 'e', 'w'], N, 'restroom code taped to the door frame', C.sign, 150, 1400, 1550);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the hot dog roller', 1067);
    Out(st, R, ['n', 'w', 's', 'e'], N, 'outlet behind the cell phone display', 457);
    Cl(st, R, N, 'convex mirror at the back aisle', C.struct, 300, 2600, {disc: 'interior'});
    Cl(st, R, N, 'door chime sensor', C.elec, 90, 2700, {anim: {type: 'blink', period: 3, duty: 0.2}});
    F(st, R, N, 'basket of single bananas by the register', C.yellow, 400, 300, 1000, {check: ['counter_height', 1000]});
    F(st, R, N, 'cooler of bagged cubed ice', C.int, 1200, 700, 1100);
    Wl(st, R, ['e', 'w', 'n', 's'], N, 'rack of road atlases and maps', C.int, 600, 900, 1500);
    Wl(st, R, ['n', 's', 'w', 'e'], N, 'security camera monitor bracket', C.elec, 500, 2100, 2500, {disc: 'electrical'});
    Out(st, R, ['w', 's', 'e', 'n'], N, 'outlet for the ice cream freezer', 457);
    Cl(st, R, N, 'recessed can light over the pastry case', C.elec, 120, 2800);
    Per(st, R, 'standing', 'picking a sun shade for a long drive');
    Per(st, R, 'standing', 'testing a charger cable at the rack');
    Per(st, R, 'standing', 'restocking water cases from the pallet');
  }

  if (missing) console.log('MISSING ' + missing);
}
