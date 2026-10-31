// Agent Orange 2026-10-31 a: deepen the three blocks touched longest ago, 3,2 Cholla Street row, 4,2 Ironwood row and 4,3 pizza, tortilla, well and date block.
// Wall, ceiling and floor items through the cached site picker, plus new life inside and around each building.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 311031; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 3,2 Cholla Street row
  D('3:2', 'Mesa Lantern Cafe', [250888, 171640, 265888, 183832], 3048, [
    ['w', 'chalkboard of the daily pie list', C.sign, 1200, 1300, 2000, {hatch: 'lines', sp: 200, hatch2: C.white}],
    ['w', 'framed photo of the 1962 flood', C.struct, 600, 1500, 1900],
    ['w', 'neon open sign in the window', C.car, 700, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 2.5, duty: 0.8}}],
    ['w', 'wall phone by the kitchen door', C.int, 250, 1300, 1600],
    ['w', 'coat hooks with two straw hats', C.struct, 900, 1600, 1700],
    ['o', 'outlet for the pie case light', 457],
    ['o', 'outlet behind the host stand', 457],
    ['c', 'ceiling fan over the booths', C.int, 280, 60, fan],
    ['c', 'ceiling fan over the counter', C.int, 280, 60, fan],
    ['c', 'dining room smoke detector', C.elec, 90],
    ['f', 'high chair parked by booth one', C.int, 450, 450, 760],
    ['f', 'bus tub cart', C.struct, 500, 800, 900],
    ['p', 'standing', 'writing the pie list on the chalkboard'],
    ['p', 'standing', 'answering the phone for a pickup order'],
    ['p', 'standing', 'buckling a toddler into the high chair'],
    ['p', 'standing', 'hanging a straw hat on the hook'],
  ]);
  D('3:2', 'Jackrabbit Tire and Lube', [280888, 173640, 298888, 185832], 2743, [
    ['w', 'poster of tire sizes and load ratings', C.sign, 900, 1300, 2000],
    ['w', 'air hose reel on the wall', C.car2, 600, 1500, 2100],
    ['w', 'pegboard of valve stem tools', C.struct, 1200, 1100, 1900, {hatch: 'dots', sp: 150}],
    ['w', 'wall shelf of wiper blades', C.int, 1200, 1600, 1650, {check: ['shelf_height', 1600]}],
    ['w', 'first aid kit on the wall', C.car, 400, 1300, 1700],
    ['o', 'outlet for the battery charger', 457],
    ['o', 'outlet for the tire changer', 610],
    ['c', 'bay ceiling light', C.elec, 250],
    ['c', 'bay ceiling light, north', C.elec, 250],
    ['f', 'used oil drain pan on wheels', C.struct, 450, 450, 300, {r: 400, n: 12}],
    ['f', 'stack of four used tires', C.struct, 0, 0, 900, {r: 380, n: 12}],
    ['f', 'rolling creeper', C.int, 450, 1000, 120],
    ['p', 'standing', 'filling a valve stem cap jar'],
    ['p', 'standing', 'reeling the air hose back up'],
    ['p', 'standing', 'draining old oil into the pan'],
  ]);
  D('3:2', 'Creosote Flats Post Office', [250888, 209640, 266888, 219640], 3048, [
    ['w', 'framed wanted poster board', C.sign, 900, 1200, 1900, {hatch: 'cross', sp: 250}],
    ['w', 'rack of priority mail envelopes', C.car2, 900, 900, 1600],
    ['w', 'wall clock over the window', C.struct, 350, 2200, 2550],
    ['w', 'flag in a wall bracket', C.car, 300, 1800, 2700],
    ['w', 'shelf of customs forms', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for the postage meter', 1067],
    ['o', 'lobby outlet', 457],
    ['c', 'lobby smoke detector', C.elec, 90],
    ['c', 'workroom ceiling light', C.elec, 250],
    ['f', 'hamper cart of flats', C.struct, 600, 1000, 900],
    ['f', 'stool at the writing desk', C.int, 200, 200, 650, {r: 200, n: 10}],
    ['p', 'standing', 'grabbing a priority envelope from the rack'],
    ['p', 'standing', 'setting the wall clock back an hour'],
    ['p', 'standing', 'wheeling a hamper of flats to the case'],
  ]);
  D('3:2', 'Bitterwater Irrigation District Office', [276888, 209640, 290888, 219640], 2743, [
    ['w', 'rain gauge chart on the wall', C.car2, 700, 1300, 1900],
    ['w', 'key board for the gate padlocks', C.struct, 600, 1300, 1800, {hatch: 'dots', sp: 120}],
    ['w', 'framed aerial photo of the canal', C.struct, 1200, 1300, 2000],
    ['w', 'shelf of water rights binders', C.int, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['o', 'outlet for the plotter', 457],
    ['o', 'outlet by the front counter', 1067],
    ['c', 'office smoke detector', C.elec, 90],
    ['c', 'ceiling fan in the front office', C.int, 280, 60, fan],
    ['f', 'flat file cabinet of canal plans', C.struct, 1000, 700, 900],
    ['f', 'water cooler', C.car2, 0, 0, 1100, {r: 170, n: 10}],
    ['p', 'standing', 'pulling a gate key off the board'],
    ['p', 'standing', 'filling a paper cup at the cooler'],
    ['p', 'standing', 'reading last month on the rain chart'],
  ]);

  // ================================================================= 4,2 Ironwood row
  D('4:2', 'Javelina Grill and Cantina', [330136, 171640, 345136, 183832], 2743, [
    ['w', 'painted tin mirror', C.yellow, 600, 1400, 2000],
    ['w', 'string of papel picado over the bar', C.car, 1500, 2300, 2450, {color2: C.yellow}],
    ['w', 'tv over the bar showing the game', C.int, 1100, 1800, 2400, {disc: 'electrical'}],
    ['w', 'framed charro saddle photo', C.struct, 600, 1400, 1900],
    ['w', 'neon cerveza sign', C.yellow, 600, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 3, duty: 0.7}}],
    ['o', 'outlet for the blender', 1067],
    ['o', 'outlet by the jukebox', 457],
    ['c', 'ceiling fan over the dining room', C.int, 280, 60, fan],
    ['c', 'cantina smoke detector', C.elec, 90],
    ['c', 'pendant light over table six', C.elec, 200],
    ['f', 'jukebox', C.car, 900, 600, 1500],
    ['f', 'stack of high chairs', C.int, 450, 450, 900],
    ['p', 'standing', 'picking a song on the jukebox'],
    ['p', 'standing', 'straightening the papel picado'],
    ['p', 'standing', 'turning up the game on the tv'],
    ['p', 'standing', 'restacking the high chairs'],
  ]);
  D('4:2', 'Sandstorm Pivot Irrigation Supply', [351136, 171640, 369136, 185640], 3353, [
    ['w', 'wall display of sprinkler nozzles by color', C.car2, 1200, 1100, 1800, {hatch: 'dots', sp: 120, hatch2: C.yellow}],
    ['w', 'poster of pivot span lengths', C.sign, 900, 1300, 2000],
    ['w', 'hanging coils of wire for valves', C.yellow, 1200, 1500, 2100],
    ['w', 'shelf of pvc cement cans', C.int, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'shelf of timer controllers', C.int, 1200, 1700, 1750, {check: ['shelf_height', 1700]}],
    ['o', 'outlet for the demo controller', 1067],
    ['o', 'warehouse outlet', 457],
    ['c', 'warehouse high bay light', C.elec, 250],
    ['c', 'warehouse high bay light, south', C.elec, 250],
    ['c', 'store smoke detector', C.elec, 90],
    ['f', 'pallet of valve boxes', C.struct, 600, 600, 900],
    ['f', 'pipe cutter on a stand', C.car2, 450, 900, 900],
    ['p', 'standing', 'matching a nozzle color to a chart'],
    ['p', 'standing', 'cutting a coil of valve wire'],
    ['p', 'standing', 'reading pivot span lengths off the poster'],
  ]);
  D('4:2', 'Borrego Flats Tractor Rental', [373136, 171640, 381136, 177736], 2743, [
    ['w', 'whiteboard of rentals out this week', C.sign, 1200, 1000, 1900],
    ['w', 'rack of safety vests', C.yellow, 800, 1300, 1800],
    ['w', 'shelf of grease guns', C.int, 900, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['o', 'outlet behind the rental counter', 1067],
    ['c', 'office ceiling light', C.elec, 250],
    ['c', 'office smoke detector', C.elec, 90],
    ['p', 'standing', 'erasing a returned tractor from the board'],
    ['p', 'standing', 'handing over a safety vest'],
  ]);
  D('4:2', 'Kit Fox Bunkhouse', [370136, 208640, 384136, 220832], 2743, [
    ['w', 'wall calendar of crew rotations', C.sign, 500, 1300, 1800],
    ['w', 'hat rack of hard hats', C.yellow, 900, 1600, 1700],
    ['w', 'framed photo of the crew at harvest', C.struct, 700, 1400, 1900],
    ['w', 'shelf of shared paperbacks', C.int, 900, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['o', 'outlet for a phone charger', 457],
    ['o', 'outlet by the bunks', 457],
    ['c', 'bunk room ceiling fan', C.int, 280, 60, fan],
    ['c', 'bunk room smoke detector', C.elec, 90],
    ['f', 'footlocker at the end of a bunk', C.struct, 800, 450, 450],
    ['f', 'box fan on the floor', C.int, 250, 250, 600],
    ['p', 'standing', 'hanging a hard hat on the rack'],
    ['p', 'standing', 'picking a paperback off the shelf'],
    ['p', 'standing', 'aiming the box fan at a bunk'],
  ]);
  {
    const st = site('4:2');
    Per(st, [348000, 188000, 372000, 205000], 'standing', 'loading pivot nozzles into a farm truck');
    Per(st, [348000, 188000, 372000, 205000], 'standing', 'waving goodbye to the night crew');
  }

  // ================================================================= 4,3 pizza, tortilla, wells and dates
  D('4:3', 'Brick Kiln Pizza Kitchen', [328000, 249000, 342000, 261000], 3048, [
    ['w', 'peel rack beside the oven', C.struct, 900, 1200, 2100],
    ['w', 'menu board of specialty pies', C.sign, 1500, 1800, 2500, {hatch: 'lines', sp: 200, hatch2: C.yellow}],
    ['w', 'framed photo of the first pie', C.struct, 500, 1400, 1800],
    ['w', 'shelf of canned tomatoes', C.brick, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['w', 'neon slice sign in the window', C.yellow, 600, 1500, 1900, {disc: 'electrical', anim: {type: 'blink', period: 2, duty: 0.75}}],
    ['o', 'outlet for the dough mixer', 610],
    ['o', 'outlet for the drink cooler', 457],
    ['c', 'dining room ceiling fan', C.int, 280, 60, fan],
    ['c', 'kitchen smoke detector', C.elec, 90],
    ['f', 'flour bin on casters', C.int, 500, 700, 750],
    ['f', 'kids table with crayons', C.yellow, 700, 700, 560],
    ['p', 'sitting', 'coloring a placemat while waiting'],
    ['p', 'standing', 'scooping flour from the bin'],
    ['p', 'standing', 'reading the specialty pie board'],
  ]);
  D('4:3', 'Masa Moon Tortilleria', [345000, 249000, 357000, 259000], 3200, [
    ['w', 'framed photo of the first molino', C.struct, 600, 1400, 1900],
    ['w', 'shelf of dried chile bags', C.brick, 1200, 1400, 1450, {check: ['shelf_height', 1400]}],
    ['w', 'hand painted price board', C.sign, 1200, 1700, 2300],
    ['w', 'altar shelf with a candle', C.yellow, 500, 1500, 1550],
    ['o', 'outlet for the tortilla counter scale', 1067],
    ['c', 'shop ceiling fan', C.int, 280, 60, fan],
    ['c', 'shop smoke detector', C.elec, 90],
    ['f', 'sack cart of corn', C.struct, 500, 900, 900],
    ['p', 'standing', 'lighting the candle on the altar shelf'],
    ['p', 'standing', 'picking out guajillo chiles'],
    ['p', 'standing', 'wheeling sacks of corn to the soak tubs'],
  ]);
  D('4:3', 'Red Mesa Well Drilling', [361000, 249000, 384000, 263000], 2743, [
    ['w', 'map of every well drilled in the valley', C.car2, 1500, 1200, 2100, {hatch: 'dots', sp: 200}],
    ['w', 'rack of drill bits by size', C.struct, 1200, 600, 1600],
    ['w', 'shelf of bentonite buckets', C.int, 1200, 1300, 1350, {check: ['shelf_height', 1300]}],
    ['w', 'eye wash station', C.car2, 400, 1000, 1500],
    ['w', 'framed drilling license', C.struct, 400, 1500, 1800],
    ['o', 'outlet for the grinder bench', 1067],
    ['o', 'shop outlet', 457],
    ['c', 'shop ceiling light', C.elec, 250],
    ['c', 'shop ceiling light, east', C.elec, 250],
    ['c', 'office smoke detector', C.elec, 90],
    ['f', 'tricone bit on a pallet', C.struct, 0, 0, 500, {r: 350, n: 12}],
    ['f', 'welding cart with bottles', C.car, 600, 500, 1400],
    ['p', 'standing', 'pinning a new well on the valley map'],
    ['p', 'standing', 'rinsing grit out at the eye wash'],
    ['p', 'standing', 'choosing a bit off the rack'],
  ]);
  D('4:3', 'Cottonwood Wash Date Packing Shed', [328000, 286000, 348000, 302000], 3048, [
    ['w', 'grower lot board', C.sign, 1500, 1200, 2000, {hatch: 'cross', sp: 250}],
    ['w', 'hairnet and glove dispenser', C.int, 600, 1200, 1600],
    ['w', 'hand wash sign over the sink', C.sign, 400, 1500, 1800],
    ['w', 'shelf of clamshell lids', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]}],
    ['o', 'outlet for the label printer', 1067],
    ['o', 'outlet for the floor scale', 457],
    ['c', 'packing line high bay light', C.elec, 250],
    ['c', 'packing line high bay light, north', C.elec, 250],
    ['c', 'shed smoke detector', C.elec, 90],
    ['f', 'stack of empty date lugs', C.struct, 600, 400, 900],
    ['f', 'pallet jack parked by the dock', C.yellow, 700, 1600, 200],
    ['p', 'standing', 'pulling on a hairnet before the line'],
    ['p', 'standing', 'restacking empty date lugs'],
    ['p', 'standing', 'chalking a new lot on the board'],
  ]);
  D('4:3', 'Palm Row Well House', [352000, 296000, 356000, 300000], 3048, [
    ['w', 'pump run log on a clipboard', C.sign, 300, 1300, 1600],
    ['c', 'well house ceiling light', C.elec, 200],
  ]);

  // ---- yard texture and plantings on the three blocks, placed through the picker
  const {blob, wavy} = k;
  function Bed(ck, zone, r, label, sd) { const st = site(ck); const c = st.floor(zone, r, r); if (!c) return miss(label); line('vegetation', C.veg2, blob(c[0], c[1], r * 0.85, 14, sd), {part: label}, closed); }
  function Grav(ck, zone, w, d, label) { const st = site(ck); const c = st.floor(zone, w / 2, d / 2); if (!c) return miss(label); hatch('paving', C.curb, rect(c[0] - w / 2, c[1] - d / 2, c[0] + w / 2, c[1] + d / 2), 'dots', 400, 0, {part: label}, C.struct); }
  Bed('3:2', [250000, 188000, 300000, 206000], 1000, 'brittlebush bed between the shops', 7);
  Bed('3:2', [250000, 188000, 300000, 206000], 900, 'desert marigold bed by the walk', 11);
  Grav('3:2', [250000, 188000, 300000, 206000], 3000, 2000, 'gravel pad for the mail carts');
  Bed('4:2', [328000, 188000, 384000, 206000], 1000, 'globe mallow bed behind the cantina', 3);
  Grav('4:2', [328000, 188000, 384000, 206000], 3000, 2400, 'gravel pad for returned rentals');
  Bed('4:3', [328000, 266000, 384000, 284000], 1000, 'desert marigold bed by the date shed', 9);
  Bed('4:3', [328000, 266000, 384000, 284000], 900, 'creosote and bursage bed', 13);
  Grav('4:3', [328000, 266000, 384000, 284000], 3000, 2000, 'gravel apron for date lugs');

  if (missing) console.log('MISSING ' + missing);
}
