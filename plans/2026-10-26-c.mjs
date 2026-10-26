// Agent Orange 2026-10-26 c: deepen the three oldest blocks 0,0 (market and two bungalows),
// 2,2 (six shop strip) and 3,1 (Pecan Hollow farm) with the cached site() picker.
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

  const {tree, blob, wavy, rounded, S} = k;


  // ================================================================= 0,0 deepen
  {
    const N = 'Two Coyote Corner Market', st = site('0:0');
    const R = [13716, 25908, 32004, 38100];
    F(st, R, N, 'spinner of scratch off lottery tickets', C.yellow, 500, 500, 1500, {r: 300, n: 10, check: ['shelf_height', 1500]});
    F(st, R, N, 'floor tub of bagged ice melt and charcoal', C.brick, 1000, 800, 600);
    F(st, R, N, 'rack of single serve motor oil quarts', C.int, 800, 400, 1400, {check: ['shelf_height', 1400]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'beer cave temperature gauge', C.int, 300, 1500, 1800);
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'local ranch brand sticker board', C.struct, 700, 1300, 1700, {hatch: 'dots', sp: 200, hatch2: C.int});
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet behind the coffee counter', 1067);
    Cl(st, R, N, 'security dome camera', C.elec, 180, 3100);
    Per(st, R, 'standing', 'scratching a ticket against the counter');
    Per(st, R, 'standing', 'filling a bag with crushed ice');
  }
  {
    const N = 'Cinder Block Bungalow', st = site('0:0');
    const R = [45624, 17144, 57816, 26288];
    F(st, R, N, 'swamp cooler return vent on the floor', C.int, 600, 600, 150);
    F(st, R, N, 'crock pot of beans on the counter', C.brick, 400, 400, 950, {r: 250, n: 10, check: ['counter_height', 950]});
    F(st, R, N, 'basket of folded dish towels', C.yellow, 500, 400, 400);
    F(st, R, N, 'potted aloe on a plant stand', C.veg, 400, 400, 900, {r: 220, n: 10});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'framed loteria print', C.struct, 600, 1500, 1900);
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'wall mounted can opener', C.int, 200, 1100, 1250);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'kitchen counter outlet', 1067);
    Cl(st, R, N, 'kitchen ceiling fan with a light', C.elec, 650, 2700, {anim: {type: 'spin', rpm: 55}});
    Per(st, R, 'standing', 'ladling beans into a bowl');
    Per(st, R, 'standing', 'wiping down the stovetop');
    Per(st, R, 'sitting', 'listening to the radio in the kitchen');
  }
  {
    const N = 'Blue Door Bungalow', st = site('0:0');
    const R = [15144, 47624, 27336, 56768];
    F(st, R, N, 'laundry hamper of work clothes', C.int, 500, 500, 700);
    F(st, R, N, 'window box fan on a chair', C.yellow, 500, 300, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'toy box of building blocks', C.brick, 700, 500, 400);
    F(st, R, N, 'floor lamp beside the recliner', C.int, 350, 350, 1500, {r: 180, n: 10});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'crayon drawing taped to the wall', C.sign, 400, 1200, 1500, {color2: C.yellow});
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'thermostat by the hallway', C.int, 150, 1450, 1600);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the box fan', 457);
    Cl(st, R, N, 'smoke detector in the hallway', C.elec, 150, 2900, {anim: {type: 'blink', period: 6, duty: 0.08}});
    Per(st, R, 'standing', 'carrying a basket of laundry down the hall');
    Per(st, R, 'sitting', 'reading a bedtime story');
    Per(st, R, 'standing', 'winding up the box fan cord');
  }

  // ================================================================= 2,2 deepen
  {
    const N = 'Ocotillo Taqueria', st = site('2:2');
    const R = [170688, 168859, 179832, 187147];
    F(st, R, N, 'steam table of guisados', C.brick, 1600, 700, 950, {check: ['counter_height', 950]});
    F(st, R, N, 'squeeze bottle caddy of salsas', C.int, 500, 350, 980, {check: ['counter_height', 980]});
    F(st, R, N, 'floor mat behind the line', C.struct, 1800, 600, 15);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'menu board of daily plates', C.sign, 1400, 1700, 2100, {color2: C.yellow});
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the blender station', 1067);
    Cl(st, R, N, 'kitchen hood exhaust fan', C.elec, 400, 2800, {anim: {type: 'spin', rpm: 60}});
    Per(st, R, 'standing', 'ladling guisado onto a plate');
    Per(st, R, 'standing', 'squeezing lime over a torta');
  }
  {
    const N = 'Brass Tack Hardware', st = site('2:2');
    const R = [179832, 168859, 188976, 187147];
    F(st, R, N, 'bin rack of loose bolts by size', C.int, 1300, 600, 1500, {check: ['shelf_height', 1500]});
    F(st, R, N, 'barrel of wood stakes and lath', C.yellow, 500, 500, 1200, {r: 300, n: 10});
    F(st, R, N, 'paint shaker on a stand', C.car2, 600, 600, 1100, {check: ['counter_height', 1100]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'pegboard of hand tools', C.struct, 1500, 1300, 2000, {hatch: 'cross', sp: 150, hatch2: C.int});
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the key machine', 1067);
    Per(st, R, 'standing', 'weighing out a scoop of lag bolts');
    Per(st, R, 'standing', 'loading a can into the paint shaker');
  }
  {
    const N = 'Rattlesnake Ridge Tractor Repair', st = site('2:2');
    const R = [188976, 168859, 198120, 187147];
    F(st, R, N, 'engine hoist folded against the wall', C.struct, 1200, 900, 1700);
    F(st, R, N, 'drum of waste oil with a pump', C.brick, 600, 600, 900, {r: 350, n: 12});
    F(st, R, N, 'rolling tool chest, red', C.car, 1000, 600, 1000);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'hanging coil of air hose on a reel', C.int, 500, 1700, 2100);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the battery charger cart', 457);
    Per(st, R, 'standing', 'pumping waste oil into the drum');
    Per(st, R, 'standing', 'rolling the tool chest to the bay');
  }
  {
    const N = 'Two Bit Barber Shop', st = site('2:2');
    const R = [198120, 168859, 207264, 187147];
    F(st, R, N, 'row of waiting chairs with a magazine rack', C.int, 1800, 600, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'rolling stool at the second chair', C.struct, 400, 400, 600, {r: 220, n: 10});
    F(st, R, N, 'barbicide jar of combs on the counter', C.car2, 300, 300, 1050, {check: ['counter_height', 1050]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'mirror over the second station', C.struct, 900, 1100, 2000);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the clippers', 1067);
    Per(st, R, 'sitting', 'waiting with a folded newspaper');
    Per(st, R, 'standing', 'sweeping up at the second chair');
  }
  {
    const N = 'Coin and Suds Laundromat', st = site('2:2');
    const R = [207264, 168859, 216408, 187147];
    F(st, R, N, 'rolling laundry cart with a canvas bag', C.int, 700, 500, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'folding table down the center', C.struct, 2400, 800, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'change machine on the wall end', C.car2, 600, 400, 1400, {check: ['shelf_height', 1400]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'posted rules and hours sign', C.sign, 600, 1500, 1900);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the vending machine', 457);
    Cl(st, R, N, 'exhaust fan over the dryers', C.elec, 350, 2800, {anim: {type: 'spin', rpm: 45}});
    Per(st, R, 'standing', 'folding a fitted sheet at the table');
    Per(st, R, 'standing', 'feeding quarters into the change machine');
  }
  {
    const N = 'Static Line Electronics Repair', st = site('2:2');
    const R = [216408, 168859, 225552, 187147];
    F(st, R, N, 'shelf of boxed remotes and adapters', C.int, 1200, 400, 1600, {check: ['shelf_height', 1600]});
    F(st, R, N, 'anti static mat on the bench', C.struct, 1000, 600, 920, {check: ['counter_height', 920]});
    F(st, R, N, 'bin of pulled circuit boards', C.brick, 500, 400, 700);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'spool rack of hookup wire', C.car2, 700, 1300, 1800);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the soldering iron', 1067);
    Per(st, R, 'standing', 'testing a remote against a receiver');
    Per(st, R, 'sitting', 'desoldering a bad capacitor');
  }

  // ================================================================= 3,1 deepen
  {
    const N = 'Pecan Hollow Equipment Barn', st = site('3:1');
    const R = [266888, 132352, 285176, 144544];
    F(st, R, N, 'barrel of used hydraulic fittings', C.brick, 600, 600, 900, {r: 350, n: 12});
    F(st, R, N, 'floor jack parked along the wall', C.car, 900, 400, 400);
    F(st, R, N, 'pallet of bar oil and two stroke jugs', C.yellow, 1100, 1000, 700, {color2: C.brick});
    F(st, R, N, 'welding cart with two bottles', C.struct, 700, 500, 1300);
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'wall chart of torque specs', C.sign, 700, 1400, 1800, {color2: C.int});
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'rack of hanging log chains', C.int, 600, 1600, 2100);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet for the bench grinder', 1067);
    Cl(st, R, N, 'high bay shop light', C.elec, 300, 4200, {anim: {type: 'blink', period: 8, duty: 0.9}});
    Per(st, R, 'standing', 'swapping bottles on the welding cart');
    Per(st, R, 'standing', 'rolling the floor jack under a mower deck');
    Per(st, R, 'standing', 'reading torque specs off the wall chart');
  }
  {
    const N = 'Pecan Hollow Farmhouse', st = site('3:1');
    const R = [249888, 136852, 262080, 145996];
    F(st, R, N, 'pie safe with punched tin panels', C.brick, 800, 500, 1600, {check: ['shelf_height', 1600]});
    F(st, R, N, 'enamel stockpot on the back burner', C.struct, 400, 400, 950, {r: 220, n: 10, check: ['counter_height', 950]});
    F(st, R, N, 'braided rug by the kitchen door', C.yellow, 1000, 700, 10);
    F(st, R, N, 'crock of wooden spoons on the counter', C.int, 300, 300, 1050, {r: 170, n: 10, check: ['counter_height', 1050]});
    Wl(st, R, ['n', 'e', 's', 'w'], N, 'calendar from the seed company', C.sign, 500, 1400, 1800);
    Wl(st, R, ['w', 's', 'n', 'e'], N, 'wall rack of coffee mugs', C.int, 600, 1300, 1550);
    Out(st, R, ['e', 'n', 's', 'w'], N, 'outlet behind the toaster', 1067);
    Cl(st, R, N, 'kitchen pendant over the table', C.elec, 250, 2600);
    Per(st, R, 'standing', 'stirring the stockpot on the stove');
    Per(st, R, 'sitting', 'shelling peas into a bowl');
    Per(st, R, 'standing', 'hanging a mug on the rack');
  }
  // ---- 3,1 yard life and plantings along the farm frontage (open layers)
  {
    const ox = 3 * S, oy = 1 * S;
    for (let j = 0; j < 3; j++) line('vegetation', C.veg2, blob(ox + 20000 + j * 9000, oy + 10000, 700, 14, j + 31), {part: ['brittlebush and penstemon bed', 'desert marigold bed', 'chuparosa and bursage bed'][j]}, {closed: true});
    line('vegetation', C.veg2, wavy(ox + 14000, oy + 8000, ox + 56000, oy + 8000, 700, 20, 7), {part: 'gravel windbreak row of young pecans'});
    for (let j = 0; j < 5; j++) tree(ox + 16000 + j * 9000, oy + 6500, 4, 4 + j * 0.3);
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'person', at: P(ox + 24000, oy + 9000), rot: 0, meta: {pose: 'standing', activity: 'raking gravel smooth around the new beds'}});
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'dog', at: P(ox + 27000, oy + 9200), rot: 0.5, meta: {activity: 'farm dog napping in the shade of a pecan'}});
  }

  if (missing) console.log('MISSING ' + missing);
}
