// Agent Orange 2026-10-27 b: deepen 0,1 grounds shop and comfort station, 1,1 Hard Pan Feed, 2,0 Pump Jack Office and motel rooms.

export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 271127; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= 0,1 Thrasher Grounds Shop
  {
    const N = 'Thrasher Grounds Shop', st = site('0:1');
    const R = [62500, 90600, 68900, 98400];
    st.block(64300, 90600, 67043, 93000); // keep the roll up door lane clear
    F(st, R, N, 'rolling parts cart of sprinkler nozzles', C.int, 700, 450, 900);
    F(st, R, N, 'five gallon bucket of pvc primer and glue', C.yellow, 0, 0, 380, {r: 160, n: 8});
    F(st, R, N, 'sawhorse with a cracked bench slat', C.struct, 1000, 300, 760);
    Wl(st, R, ['n', 'e', 'w'], N, 'irrigation zone map of the park', C.veg, 1200, 1200, 1900, {hatch: 'cross', sp: 250, hatch2: C.yellow});
    Wl(st, R, ['e', 'n', 'w'], N, 'clipboard of mower hour logs', C.sign, 250, 1300, 1600);
    Wl(st, R, ['e', 'w', 'n'], N, 'wall mounted air hose reel', C.yellow, 500, 1300, 1800);
    Wl(st, R, ['w', 'e', 'n'], N, 'calendar of park reservations', C.sign, 400, 1400, 1800);
    Out(st, R, ['n', 'e', 'w'], N, 'outlet for the battery tender', 457);
    Out(st, R, ['e', 'w', 'n'], N, 'outlet for the radio', 1067);
    Cl(st, R, N, 'smoke detector by the panel', C.elec, 90, 3300);
    Cl(st, R, N, 'motion light over the bench', C.elec, 150, 3300, {anim: {type: 'blink', period: 6, duty: 0.6}});
    Per(st, R, 'standing', 'replacing a mower belt on the shop floor');
    Per(st, R, 'standing', 'gluing a pvc riser for zone four');
    Per(st, R, 'standing', 'logging mower hours on the clipboard');
  }
  {
    const N = 'Quail Run Comfort Station', st = site('0:1');
    const R1 = [61200, 143400, 64050, 148400], R2 = [64050, 143400, 66900, 148400];
    Cl(st, R1, N, 'smoke detector, room one', C.elec, 90, 2700);
    Cl(st, R2, N, 'smoke detector, room two', C.elec, 90, 2700);
    Wl(st, R1, ['n', 'w', 'e'], N, 'cleaning log sheet in a frame, room one', C.sign, 250, 1300, 1600);
    Wl(st, R2, ['n', 'w', 'e'], N, 'cleaning log sheet in a frame, room two', C.sign, 250, 1300, 1600);
    Per(st, R1, 'standing', 'initialing the cleaning log at noon');
  }
  {
    const ox = 0, oy = 1 * S;
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'person', at: P(ox + 66000, oy + 22500), rot: 2, meta: {pose: 'standing', activity: 'flagging a broken sprinkler head'}});
  }

  // ================================================================= 1,1 Hard Pan Feed and Tractor
  {
    const N = 'Hard Pan Feed and Tractor', st = site('1:1');
    const STORE = [95392, 97392, 107632, 112632], WARE = [107632, 97392, 116776, 112632];
    st.block(92392, 97392, 97400, 99900);
    st.block(108500, 109700, 115000, 112632);
    F(st, STORE, N, 'bin of horseshoe nails and farrier rasps', C.struct, 600, 400, 900);
    F(st, STORE, N, 'display stack of poultry feeders', C.yellow, 700, 700, 1000);
    F(st, STORE, N, 'rack of sun hats and work bandanas', C.car2, 0, 0, 1700, {r: 300, n: 10});
    F(st, STORE, N, 'tub of mixed bird seed with a scoop', C.int, 0, 0, 700, {r: 320, n: 10});
    Wl(st, STORE, ['n', 'e', 'w', 's'], N, 'shelf of canning jars and lids', C.int, 1200, 1500, 1550, {check: ['shelf_height', 1500]});
    Wl(st, STORE, ['e', 'n', 'w', 's'], N, 'poster of county burn day rules', C.sign, 500, 1300, 1900, {color2: C.yellow});
    Wl(st, STORE, ['w', 'n', 'e', 's'], N, 'pegboard of livestock ear tags', C.struct, 900, 1200, 1800, {hatch: 'dots', sp: 150, hatch2: C.yellow});
    Out(st, STORE, ['n', 'e', 'w'], N, 'outlet for the chick brooder light timer', 457);
    Cl(st, STORE, N, 'store smoke detector by the tack wall', C.elec, 90, 3300);
    F(st, WARE, N, 'drum of diesel exhaust fluid on a cradle', C.veg, 0, 0, 900, {r: 300, n: 12});
    Wl(st, WARE, ['e', 'n', 's'], N, 'load chart for the pallet rack', C.sign, 400, 1400, 1800);
    Wl(st, WARE, ['n', 'e', 's'], N, 'rack of straps and ratchets', C.yellow, 900, 1200, 1700);
    Out(st, WARE, ['e', 'n', 's'], N, 'warehouse outlet for the shrink wrap tool', 1067);
    Cl(st, WARE, N, 'warehouse smoke detector', C.elec, 90, 5200);
    Per(st, STORE, 'standing', 'filling a paper sack with bird seed');
    Per(st, STORE, 'standing', 'reading the burn day poster');
    Per(st, WARE, 'standing', 'wrapping a pallet of gypsum');
    Per(st, STORE, 'standing', 'comparing two sizes of poultry feeder');
  }

  // ================================================================= 2,0 Pump Jack Office and motel rooms
  {
    const N = 'Pump Jack Office', st = site('2:0');
    const OFF = [170640, 18144, 177955, 24240];
    F(st, OFF, N, 'basket of local apples by the desk', C.car, 0, 0, 600, {r: 220, n: 10});
    Wl(st, OFF, ['n', 'e', 'w'], N, 'brochure board of nearby ghost towns', C.sign, 700, 1200, 1800, {color2: C.yellow});
    Wl(st, OFF, ['e', 'n', 'w'], N, 'checkout time sign at the desk', C.sign, 300, 1400, 1650);
    Wl(st, OFF, ['w', 'e', 'n'], N, 'license and permit frames', C.struct, 600, 1500, 1900);
    Wl(st, OFF, ['n', 'w', 'e'], N, 'shelf of lost and found items', C.int, 800, 1600, 1650, {check: ['shelf_height', 1600]});
    Out(st, OFF, ['e', 'n', 'w'], N, 'outlet for the water cooler', 457);
    Out(st, OFF, ['w', 'n', 'e'], N, 'outlet for a guest phone charger', 1067);
    Cl(st, OFF, N, 'lobby wireless access point', C.elec, 130, 3400, {anim: {type: 'blink', period: 1.4, duty: 0.5}});
    Per(st, OFF, 'standing', 'checking the lost and found for sunglasses');
    Per(st, OFF, 'standing', 'buying two cold waters for the road');
  }
  {
    const N = 'Pump Jack Motor Court', st = site('2:0');
    const items = [['do not disturb hanger on the door', C.yellow, 120, 1500, 1700], ['framed fire exit diagram', C.sign, 300, 1400, 1750], ['towel hook by the door', C.struct, 120, 1600, 1700]];
    for (let i = 0; i < 10; i++) {
      const x0 = 176640 + 3658 * i, nm = 'room ' + (101 + i);
      const BED = [x0, 39144, x0 + 3658, 44009];
      const it = items[i % 3];
      Wl(st, BED, ['s', 'w', 'e'], N, it[0] + ', ' + nm, it[1], it[2], it[3], it[4]);
      Out(st, BED, ['w', 'e', 's'], N, 'outlet by the desk, ' + nm, 457);
    }
  }
  {
    const ox = 2 * S, oy = 0;
    push('place_symbol', {discipline: 'activity', color: C.person, type: 'person', at: P(ox + 15900, oy + 16600), rot: 0.5, meta: {pose: 'standing', activity: 'restringing the vacancy sign lights'}});
  }

  if (missing) console.log('MISSING ' + missing);
}
