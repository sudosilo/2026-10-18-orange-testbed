// Agent Orange 2026-10-26 a: deepen the three longest untouched blocks.
// 4,2 Javelina Grill, Sandstorm Pivot Irrigation, Borrego Flats Tractor Rental, Kit Fox Bunkhouse.
// 4,3 Brick Kiln Pizza, Masa Moon Tortilleria, Red Mesa Well Drilling, Cottonwood Wash Date Packing Shed, Palm Row Well House.
// 3,2 Mesa Lantern Cafe, Jackrabbit Tire and Lube, Creosote Flats Post Office, Bitterwater Irrigation District Office.
// Reuses the cached site() picker, F/Wl/Out/Cl/Per item helpers and E() from the 2026-10-25-c plan.
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

  // ================================================================= 4,2
  {
    const N = 'Javelina Grill and Cantina', st = site('4:2');
    const R = [330136, 171640, 345136, 183832];
    F(st, R, N, 'frozen margarita machine', C.car2, 600, 500, 1100);
    F(st, R, N, 'rolling salsa bar cart', C.veg, 900, 600, 950);
    F(st, R, N, 'stack of wooden high chairs', C.brick, 500, 500, 1300);
    F(st, R, N, 'dessert case of flan and tres leches', C.int, 900, 600, 1300, {check: ['counter_height', 1050]});
    F(st, R, N, 'bus tub cart by the kitchen', C.struct, 600, 500, 900);
    F(st, R, N, 'coffee urn on a service stand', C.brick, 450, 450, 1150);
    Wl(st, R, ['n', 'e'], N, 'hot sauce and condiment caddy shelf', C.int, 700, 1300, 1500, {check: ['shelf_height', 1300]});
    Wl(st, R, ['s', 'w'], N, 'daily specials chalkboard', C.struct, 1000, 1400, 2000, {hatch: 'lines', sp: 160, hatch2: C.int});
    Wl(st, R, ['e', 'w'], N, 'lit beer brand sign', C.brick, 600, 1600, 1950, {disc: 'electrical', anim: {type: 'blink', period: 3, duty: 0.85}});
    Out(st, R, ['n', 'e'], N, 'outlet for the margarita machine', 1067);
    Out(st, R, ['s', 'w'], N, 'outlet behind the coffee urn', 1067);
    for (let i = 0; i < 2; i++) Cl(st, R, N, 'dining ceiling fan ' + (i + 1), C.int, 650, 3400, {disc: 'interior', anim: {type: 'spin', rpm: 55}, n: 10});
    Cl(st, R, N, 'dining pendant lamp', C.elec, 250, 3450);
    Per(st, R, 'standing', 'blending a pitcher of margaritas');
    Per(st, R, 'standing', 'refilling the salsa bar cart');
    Per(st, R, 'standing', 'wiping down a vacated booth');
    Per(st, R, 'standing', 'carrying three plates on one arm');
    Per(st, R, 'standing', 'sliding a flan into the dessert case');
  }
  {
    const N = 'Sandstorm Pivot Irrigation Supply', st = site('4:2');
    const R = [351136, 171640, 369136, 185640];
    F(st, R, N, 'pallet of valve boxes', C.brick, 1100, 1100, 900, {color2: C.yellow});
    F(st, R, N, 'reel of lay flat hose', C.plumb, 700, 700, 1000, {r: 400, n: 10});
    F(st, R, N, 'bin rack of barbed tees and elbows', C.int, 1200, 500, 1700, {check: ['shelf_height', 1700]});
    F(st, R, N, 'display stand of poly risers', C.veg2, 500, 500, 1500, {check: ['shelf_height', 1500]});
    F(st, R, N, 'counter catalog binder stand', C.struct, 500, 400, 1050, {check: ['counter_height', 1050]});
    Wl(st, R, ['n', 'w'], N, 'wall chart of pipe sizing', C.sign, 900, 1300, 1900, {color2: C.yellow});
    Wl(st, R, ['e', 's'], N, 'pegboard of hose menders', C.brick, 900, 1300, 1900, {hatch: 'dots', sp: 120, hatch2: C.struct});
    Out(st, R, ['n', 'e'], N, 'outlet at the parts counter', 1067);
    for (let i = 0; i < 2; i++) Cl(st, R, N, 'warehouse led high bay ' + (i + 1), C.elec, 280, 4600);
    Per(st, R, 'standing', 'unloading a pallet of valve boxes');
    Per(st, R, 'standing', 'flipping through a parts catalog at the counter');
    Per(st, R, 'standing', 'coiling lay flat hose onto a reel');
    Per(st, R, 'standing', 'labeling a bin of barbed tees');
  }
  {
    const N = 'Borrego Flats Tractor Rental', st = site('4:2');
    const R = [373136, 171640, 381136, 177736];
    F(st, R, N, 'rental counter with a log book', C.struct, 1200, 500, 1050, {check: ['counter_height', 1050]});
    Wl(st, R, ['n', 'e'], N, 'key board of rental fobs', C.int, 500, 1400, 1700);
    Wl(st, R, ['w', 's'], N, 'shelf of equipment manuals', C.brick, 600, 1500, 1750, {check: ['shelf_height', 1500]});
    Wl(st, R, ['e', 'n'], N, 'tire gauge and chalk rack', C.yellow, 300, 1200, 1500);
    Out(st, R, ['s', 'w'], N, 'outlet by the rental counter', 457);
    Cl(st, R, N, 'office led panel', C.elec, 250, 3200);
    Per(st, R, 'standing', 'logging return mileage on a tractor');
    Per(st, R, 'standing', 'wiping grease off a rental key fob');
  }
  {
    const N = 'Kit Fox Bunkhouse', st = site('4:2');
    const R = [370136, 208640, 384136, 220832];
    F(st, R, N, 'row of steel footlockers', C.struct, 1400, 500, 500);
    F(st, R, N, 'boot drying tray by the door', C.brick, 800, 400, 150);
    F(st, R, N, 'coffee maker on a side stand', C.int, 400, 400, 1050, {check: ['counter_height', 1050]});
    F(st, R, N, 'laundry hamper on wheels', C.veg2, 500, 500, 850, {r: 300, n: 10});
    Wl(st, R, ['n', 'e'], N, 'shift swap bulletin board', C.sign, 900, 1300, 1900, {hatch: 'cross', sp: 200, hatch2: C.struct});
    Wl(st, R, ['w', 's'], N, 'ironing board hook', C.struct, 300, 1400, 1550);
    Out(st, R, ['e', 'n'], N, 'outlet by the coffee maker', 1067);
    for (let i = 0; i < 2; i++) Cl(st, R, N, 'bunkroom ceiling light ' + (i + 1), C.elec, 250, 3100);
    Per(st, R, 'standing', 'ironing a work shirt on the board');
    Per(st, R, 'standing', 'lacing up steel toe boots');
    Per(st, R, 'standing', 'brewing a pot before sunrise');
    Per(st, R, 'standing', 'pinning a shift swap on the board');
  }

  // ================================================================= 4,3
  {
    const N = 'Brick Kiln Pizza Kitchen', st = site('4:3');
    const R = [328000, 249000, 342000, 261000];
    F(st, R, N, 'dough proofing rack on casters', C.struct, 700, 500, 1700, {check: ['shelf_height', 1700]});
    F(st, R, N, 'cheese and topping reach in', C.int, 1100, 700, 900, {check: ['counter_height', 900]});
    F(st, R, N, 'stack of flat pizza boxes', C.brick, 500, 500, 1200);
    F(st, R, N, 'glass front drink cooler', C.car2, 700, 700, 1900);
    Wl(st, R, ['n', 'e'], N, 'napkin and pepper flake station', C.int, 500, 1050, 1200);
    Wl(st, R, ['s', 'w'], N, 'health permit frame', C.sign, 300, 1500, 1800);
    Out(st, R, ['e', 'n'], N, 'outlet for the drink cooler', 1067);
    Cl(st, R, N, 'kitchen hood make up fan', C.int, 600, 3500, {disc: 'interior', anim: {type: 'spin', rpm: 40}, n: 10});
    Per(st, R, 'standing', 'stretching a dough ball by hand');
    Per(st, R, 'standing', 'stacking flat pizza boxes');
    Per(st, R, 'standing', 'sliding a proofing rack to the oven');
    Per(st, R, 'standing', 'refilling the napkin station');
  }
  {
    const N = 'Masa Moon Tortilleria', st = site('4:3');
    const R = [345000, 249000, 357000, 259000];
    F(st, R, N, 'bagging scale on the counter', C.int, 500, 400, 1050, {check: ['counter_height', 1050]});
    F(st, R, N, 'stack of masa harina sacks', C.brick, 900, 700, 900, {color2: C.yellow});
    F(st, R, N, 'tortilla cooling rack', C.struct, 700, 500, 1600, {check: ['shelf_height', 1600]});
    F(st, R, N, 'retail shelf of tostadas', C.veg, 900, 400, 1500, {check: ['shelf_height', 1500]});
    Wl(st, R, ['n', 'e'], N, 'price board in pesos and dollars', C.sign, 700, 1400, 1900, {color2: C.brick});
    Out(st, R, ['s', 'w'], N, 'outlet at the bagging scale', 1067);
    Cl(st, R, N, 'shop led panel light', C.elec, 250, 3300);
    Per(st, R, 'standing', 'bagging warm tortillas for a regular');
    Per(st, R, 'standing', 'restocking the tostada shelf');
    Per(st, R, 'standing', 'sweeping masa dust from the floor');
  }
  {
    const N = 'Red Mesa Well Drilling', st = site('4:3');
    const R = [361000, 249000, 384000, 263000];
    F(st, R, N, 'rack of drop pipe couplings', C.struct, 1400, 500, 1700, {check: ['shelf_height', 1700]});
    F(st, R, N, 'pressure tank on a pallet', C.plumb, 700, 700, 1500, {r: 400, n: 12});
    F(st, R, N, 'bin cart of well seals', C.int, 800, 600, 950);
    F(st, R, N, 'spool of safety rope', C.yellow, 500, 500, 700, {r: 300, n: 10});
    Wl(st, R, ['n', 'e'], N, 'well log whiteboard', C.struct, 1200, 1300, 2000, {hatch: 'lines', sp: 170, hatch2: C.int});
    Wl(st, R, ['s', 'w'], N, 'welding curtain on a track', C.brick, 1200, 400, 2000, {hatch: 'lines', sp: 130, hatch2: C.yellow});
    Out(st, R, ['e', 'n'], N, 'outlet by the test bench', 1067);
    for (let i = 0; i < 2; i++) Cl(st, R, N, 'shop high bay light ' + (i + 1), C.elec, 280, 4700);
    Per(st, R, 'standing', 'sorting drop pipe couplings');
    Per(st, R, 'standing', 'pulling a pressure tank off the rack');
    Per(st, R, 'standing', 'sketching a well log on the whiteboard');
  }
  {
    const N = 'Cottonwood Wash Date Packing Shed', st = site('4:3');
    const R = [328000, 286000, 348000, 302000];
    F(st, R, N, 'side bins along the sorting belt', C.struct, 1200, 500, 900);
    F(st, R, N, 'floor scale station', C.int, 800, 800, 120);
    F(st, R, N, 'pallet jack parked by the wall', C.yellow, 600, 1100, 300);
    F(st, R, N, 'carton staging table', C.brick, 1200, 700, 900, {check: ['counter_height', 900]});
    Wl(st, R, ['n', 'e'], N, 'grade standard poster', C.sign, 700, 1400, 1900);
    Wl(st, R, ['s', 'w'], N, 'shelf of flat date cartons', C.brick, 1200, 1300, 1900, {check: ['shelf_height', 1700]});
    Out(st, R, ['e', 'n'], N, 'outlet for the label printer', 1067);
    Cl(st, R, N, 'packing shed high bay ', C.elec, 280, 4800);
    Per(st, R, 'standing', 'taping shut a case of date boxes');
    Per(st, R, 'standing', 'stacking clamshells into a carton');
    Per(st, R, 'standing', 'wheeling a pallet to the cold room');
  }
  {
    const N = 'Palm Row Well House', st = site('4:3');
    const R = [352000, 296000, 356000, 300000];
    Wl(st, R, ['n', 'e'], N, 'pressure gauge board', C.plumb, 400, 1100, 1500);
    Wl(st, R, ['w', 's'], N, 'well control panel', C.elec, 400, 1200, 1700, {disc: 'electrical', anim: {type: 'blink', period: 4, duty: 0.6}});
    Wl(st, R, ['e', 'n'], N, 'chlorinator jug shelf', C.int, 300, 900, 1100);
  }

  // ================================================================= 3,2
  {
    const N = 'Mesa Lantern Cafe', st = site('3:2');
    const R = [250888, 171640, 265888, 183832];
    F(st, R, N, 'rolling dessert pie case', C.int, 700, 600, 1300);
    F(st, R, N, 'coffee station with carafes', C.brick, 700, 500, 1050, {check: ['counter_height', 1050]});
    Wl(st, R, ['n', 'e'], N, 'local art for sale on the wall', C.sign, 900, 1400, 1900, {color2: C.yellow});
    Out(st, R, ['s', 'w'], N, 'outlet at the coffee station', 1067);
    Cl(st, R, N, 'dining pendant lamp', C.elec, 250, 3400);
    Per(st, R, 'standing', 'slicing a wedge of coconut cream pie');
    Per(st, R, 'standing', 'topping off a thermos of coffee to go');
    Per(st, R, 'standing', 'clearing a four top after lunch');
  }
  {
    const N = 'Jackrabbit Tire and Lube', st = site('3:2');
    const R = [280888, 173640, 298888, 185832];
    F(st, R, N, 'stack of mounted truck tires', C.struct, 800, 800, 1700, {r: 450, n: 12, check: ['shelf_height', 1700]});
    F(st, R, N, 'floor jack parked at the bay', C.yellow, 900, 500, 350);
    F(st, R, N, 'oil drum caddy with a pump', C.brick, 500, 500, 950, {r: 300, n: 10});
    F(st, R, N, 'waiting room bench', C.int, 1300, 450, 450);
    Wl(st, R, ['n', 'e'], N, 'tire size and price board', C.sign, 1000, 1400, 1900, {hatch: 'lines', sp: 170, hatch2: C.int});
    Wl(st, R, ['s', 'w'], N, 'rack of wiper blades and air filters', C.brick, 900, 1300, 1900, {check: ['shelf_height', 1600]});
    Out(st, R, ['e', 'n'], N, 'outlet for the impact charger', 1067);
    for (let i = 0; i < 2; i++) Cl(st, R, N, 'bay high bay light ' + (i + 1), C.elec, 280, 4700);
    Per(st, R, 'standing', 'balancing a tire on the spin balancer');
    Per(st, R, 'standing', 'topping off the washer fluid');
    Per(st, R, 'standing', 'writing up a tire rotation ticket');
    Per(st, R, 'standing', 'rolling a new tire to the mount machine');
  }
  {
    const N = 'Creosote Flats Post Office', st = site('3:2');
    const R = [250888, 209640, 266888, 219640];
    F(st, R, N, 'self service shipping kiosk', C.elec, 600, 500, 1400, {check: ['shelf_height', 1400]});
    F(st, R, N, 'lobby parcel drop table', C.int, 900, 600, 900, {check: ['counter_height', 900]});
    Wl(st, R, ['n', 'e'], N, 'wall of brass po boxes', C.yellow, 1200, 900, 1900, {hatch: 'cross', sp: 120, hatch2: C.struct});
    Wl(st, R, ['s', 'w'], N, 'passport hours placard', C.sign, 400, 1500, 1800);
    Out(st, R, ['e', 'n'], N, 'outlet at the shipping kiosk', 1067);
    Cl(st, R, N, 'lobby led panel', C.elec, 250, 3300);
    Per(st, R, 'standing', 'weighing a flat rate box at the kiosk');
    Per(st, R, 'standing', 'checking a po box for mail');
    Per(st, R, 'standing', 'filling out a change of address card');
  }
  {
    const N = 'Bitterwater Irrigation District Office', st = site('3:2');
    const R = [276888, 209640, 290888, 219640];
    F(st, R, N, 'public counter with a form rack', C.struct, 1200, 500, 1050, {check: ['counter_height', 1050]});
    F(st, R, N, 'rolled canal maps in a bin', C.int, 500, 500, 900, {r: 300, n: 10});
    Wl(st, R, ['n', 'e'], N, 'large wall map of the laterals', C.veg, 1400, 1200, 2000, {hatch: 'lines', sp: 140, hatch2: C.yellow});
    Wl(st, R, ['s', 'w'], N, 'water order schedule board', C.sign, 1000, 1300, 1900, {hatch: 'cross', sp: 200, hatch2: C.struct});
    Out(st, R, ['e', 'n'], N, 'outlet at the public counter', 457);
    Cl(st, R, N, 'office ceiling fan', C.int, 600, 3300, {disc: 'interior', anim: {type: 'spin', rpm: 45}, n: 10});
    Per(st, R, 'standing', 'stamping a paid water order');
    Per(st, R, 'standing', 'rolling up a lateral map for a grower');
    Per(st, R, 'standing', 'scheduling a gate change on the board');
  }

  if (missing) console.log('MISSING ' + missing);
}
