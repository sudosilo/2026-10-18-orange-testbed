// Agent Orange 2026-11-14 a: deepen the oldest blocks 3,3 and 4,3 with a new small building each (4,2 has no open ground),
// and deepen 5,2 with a new pistachio grading lab plus D() items in the huller, cotton barn and cooler shop.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611141; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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
  const {push} = k;
  const {tree, blob, wavy, rounded, S, PL, CURB, wall, run, door, lot, claim, streets, trafficLoop} = k;
  // roof helpers. z is the top of the wall; rise is how far the roof climbs.
  const plane = (N, col, col2, pts, pat, sp, ang, part) => hatch('structure', col, pts, pat, sp, ang, {building: N, part}, col2);
  function gableX(N, x0, y0, x1, y1, z, col, col2) { // ridge runs east west
    const ym = (y0 + y1) / 2, r = Math.round((y1 - y0) / 2 * 0.25);
    plane(N, col, col2, [P(x0, y0, z), P(x1, y0, z), P(x1, ym, z + r), P(x0, ym, z + r)], 'lines', 380, 90, 'south roof slope, standing seam');
    plane(N, col, col2, [P(x0, y1, z), P(x1, y1, z), P(x1, ym, z + r), P(x0, ym, z + r)], 'lines', 380, 90, 'north roof slope, standing seam');
    line('structure', C.roof, [P(x0, ym, z + r), P(x1, ym, z + r)], {building: N, part: 'roof ridge cap'});
  }
  function gableY(N, x0, y0, x1, y1, z, col, col2) { // ridge runs north south
    const xm = (x0 + x1) / 2, r = Math.round((x1 - x0) / 2 * 0.25);
    plane(N, col, col2, [P(x0, y0, z), P(xm, y0, z + r), P(xm, y1, z + r), P(x0, y1, z)], 'lines', 380, 0, 'west roof slope, standing seam');
    plane(N, col, col2, [P(x1, y0, z), P(xm, y0, z + r), P(xm, y1, z + r), P(x1, y1, z)], 'lines', 380, 0, 'east roof slope, standing seam');
    line('structure', C.roof, [P(xm, y0, z + r), P(xm, y1, z + r)], {building: N, part: 'roof ridge cap'});
  }
  function shed(N, x0, y0, x1, y1, z, col, col2, highNorth) {
    const r = Math.round((y1 - y0) * 0.12);
    const zs = highNorth ? [z, z, z + r, z + r] : [z + r, z + r, z, z];
    plane(N, col, col2, [P(x0, y0, zs[0]), P(x1, y0, zs[1]), P(x1, y1, zs[2]), P(x0, y1, zs[3])], 'lines', 450, 90, 'shed roof, corrugated metal');
  }
  function hip(N, x0, y0, x1, y1, z, col, col2) {
    const d = Math.min(x1 - x0, y1 - y0) / 2, r = Math.round(d * 0.22), rx0 = x0 + d, rx1 = x1 - d, ym = (y0 + y1) / 2;
    plane(N, col, col2, [P(x0, y0, z), P(x1, y0, z), P(rx1, ym, z + r), P(rx0, ym, z + r)], 'lines', 300, 0, 'south hip slope, clay tile');
    plane(N, col, col2, [P(x0, y1, z), P(x1, y1, z), P(rx1, ym, z + r), P(rx0, ym, z + r)], 'lines', 300, 0, 'north hip slope, clay tile');
    plane(N, col, col2, [P(x0, y0, z), P(rx0, ym, z + r), P(x0, y1, z)], 'lines', 300, 0, 'west hip slope, clay tile');
    plane(N, col, col2, [P(x1, y0, z), P(rx1, ym, z + r), P(x1, y1, z)], 'lines', 300, 0, 'east hip slope, clay tile');
  }
  function gravel(N, x0, y0, x1, y1, z, col, col2) {
    plane(N, col, col2, rect(x0 + 200, y0 + 200, x1 - 200, y1 - 200, z - 300), 'dots', 700, 0, 'flat roof, gravel over membrane');
    line('structure', C.struct, [P(x1 - 3000, y1 - 3000, z - 300), P(x1 - 3000, y1 - 1800, z - 300), P(x1 - 1500, y1 - 1800, z - 300), P(x1 - 1500, y1 - 3000, z - 300)], {building: N, part: 'evaporative cooler on the roof'}, closed);
  }
  function barrel(N, x0, y0, x1, y1, z, col, col2) { // arched roof across the short span
    const across = (x1 - x0) < (y1 - y0), span = across ? x1 - x0 : y1 - y0, r = span / 2, rise = Math.round(span * 0.18);
    const n = Math.max(4, Math.round((across ? y1 - y0 : x1 - x0) / 3000));
    for (let i = 0; i <= n; i++) {
      const t = (across ? y0 : x0) + (across ? y1 - y0 : x1 - x0) * i / n, pts = [];
      for (let j = 0; j <= 12; j++) { const u = j / 12, zz = z + Math.round(rise * Math.sin(u * Math.PI)); pts.push(across ? P(x0 + span * u, t, zz) : P(t, y0 + span * u, zz)); }
      line('structure', i % n === 0 ? C.roof : col, pts, {building: N, part: i % n === 0 ? 'barrel roof end arch' : 'barrel roof rib'});
    }
    const mid = across ? [P((x0 + x1) / 2, y0, z + rise), P((x0 + x1) / 2, y1, z + rise)] : [P(x0, (y0 + y1) / 2, z + rise), P(x1, (y0 + y1) / 2, z + rise)];
    line('structure', col2, mid, {building: N, part: 'barrel roof crown'});
    return r;
  }
  // ---------------------------------------------------------------- activity guard: every sentence new for its block
  const usedAct = {};
  const usedIn = (ck) => { if (!usedAct[ck]) { usedAct[ck] = new Set(); for (const r of recsIn(ck)) if (r.meta && r.meta.activity) usedAct[ck].add(r.meta.activity); } return usedAct[ck]; };
  const say = (x, y, pose, text, rot = 0, anim) => {
    const set = usedIn(k.ck(x, y));
    if (set.has(text)) { console.log('DUP ACTIVITY ' + text); return; }
    set.add(text); person(P(x, y), rot, pose, text, anim);
  };
  const I = (N, label, col, x0, y0, x1, y1, z, o = {}) => line(o.disc || 'interior', col, rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), z), Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), Object.assign({closed: true}, o.color2 !== undefined ? {color2: o.color2} : {}));
  const IC = (N, label, col, x, y, r, z, o = {}) => line(o.disc || 'interior', col, circ(x, y, r, z, o.n || 10), Object.assign({building: N, part: label}, o.anim ? {anim: o.anim} : {}), {closed: true});
  const VB = (N, label, col, ax, ay, bx, by, z0, z1, o = {}) => line(o.disc || 'interior', col, [P(ax, ay, z0), P(bx, by, z0), P(bx, by, z1), P(ax, ay, z1)], Object.assign({building: N, part: label}, o.check ? {checks: [o.check]} : {}, o.anim ? {anim: o.anim} : {}), closed);

  // local frame helpers for a small building drawn from its southwest corner
  function loc(N, x0, y0) {
    return {
      R: (label, col, a, b, c, d, z, o) => I(N, label, col, x0 + a, y0 + b, x0 + c, y0 + d, z, o),
      O: (label, col, x, y, r, z, o) => IC(N, label, col, x0 + x, y0 + y, r, z, o),
      V: (label, col, ax, ay, bx, by, z0, z1, o) => VB(N, label, col, x0 + ax, y0 + ay, x0 + bx, y0 + by, z0, z1, o),
      S: (type, label, x, y, z, o = {}) => sym('electrical', C.elec, type, P(x0 + x, y0 + y, z), 0, Object.assign({building: N, part: label}, o)),
      Ot: (label, x, y, z) => sym('electrical', C.elec, 'outlet', P(x0 + x, y0 + y, z), 0, {building: N, part: label, checks: [['outlet_height', z]]}),
      say: (x, y, pose, text, rot = 0) => say(x0 + x, y0 + y, pose, text, rot),
    };
  }

  // ================================================================= 3,3 Rawhide Flats Saddle Shop, north of the donut counter, faces Yucca Avenue
  {
    const N = 'Rawhide Flats Saddle Shop', x0 = 253000, x1 = 259096, y0 = 263000, y1 = 267572, H = 3658;
    const {R, O, V, S, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.struct, vface(x0, y1, x0, y0, 0, H), 'lines', 300, 90, {building: N, part: 'rough sawn board and batten, west front'}, C.brick);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 900), 'gradient', 300, 0, {building: N, part: 'dust shadow at the base, south wall'}, C.struct);
    hatch('structure', C.brick, vface(x1, y0, x1, y1, 0, H), 'brick', 400, 0, {building: N, part: 'adobe block, east wall'}, C.yellow);
    gableX(N, x0, y0, x1, y1, H + 100, C.roof, C.brick);
    door(N, x0, y0 + 1700, 'y', 914, 'saddle shop front door', 1);
    sym('structure', C.sign, 'sign', P(x0 - 1500, y0 + 900), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'beadboard ceiling', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.yellow, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'lines', 450, 90, {building: N, part: 'wide plank pine floor'}, C.brick);
    // retail side
    R('sales counter', C.brick, 500, 3800, 2600, 4300, 965, {check: ['counter_height', 965]});
    R('pos terminal on the counter', C.int, 800, 3900, 1100, 4150, 1250);
    R('receipt printer', C.int, 1300, 3900, 1600, 4200, 1100);
    R('cash drawer under the pos', C.struct, 1800, 3850, 2200, 4250, 800);
    R('card reader on a swivel', C.int, 2300, 3880, 2500, 4080, 1100);
    R('saddle stand by the front window', C.struct, 800, 350, 1700, 850, 900);
    R('used roping saddle on the stand', C.brick, 850, 300, 1650, 900, 1150);
    R('saddle stand by the tack wall', C.struct, 2000, 350, 2900, 850, 900);
    R('new barrel racing saddle on the stand', C.yellow, 2050, 300, 2850, 900, 1150);
    V('tack wall of bridles and headstalls', C.struct, 800, 120, 2900, 120, 1300, 2100);
    R('rack of saddle pads and blankets', C.car2, 500, 2900, 1300, 3300, 1219, {check: ['shelf_height', 1219]});
    V('hat shelf of straw work hats', C.yellow, 120, 3500, 120, 4300, 1700, 1900);
    // workshop side
    R('leather workbench', C.struct, 3300, 3800, 5600, 4300, 914, {check: ['counter_height', 914]});
    R('cutting board on the bench', C.int, 3500, 3880, 4300, 4220, 940);
    R('marble tooling slab', C.curb, 4500, 3880, 5000, 4220, 960);
    V('pegboard of swivel knives and stamping tools', C.struct, 3500, 4452, 5400, 4452, 1300, 1900);
    O('harness stitcher', C.struct, 5500, 1700, 300, 1100, {n: 10});
    line('interior', C.struct, [P(x0 + 5500, y0 + 1700, 0), P(x0 + 5500, y0 + 1700, 1100)], {building: N, part: 'stitcher pedestal'});
    R('leather splitter', C.struct, 4400, 1400, 5000, 1900, 1000);
    R('bare saddle tree on a work stand', C.brick, 3300, 1500, 3900, 2100, 900);
    V('roll rack of tooling leather sides', C.brick, 5976, 900, 5976, 2400, 300, 1800);
    R('shelf of rivets, conchos and buckles', C.yellow, 4800, 120, 5900, 420, 1524, {check: ['shelf_height', 1524]});
    R('utility sink for casing leather', C.plumb, 3300, 150, 3900, 650, 900, {disc: 'plumbing'});
    O('20 gallon water heater', C.plumb, 4300, 450, 250, 1300, {disc: 'plumbing'});
    O('casing bucket under the sink', C.car2, 3600, 900, 180, 350);
    // power and light
    R('100 A panel', C.elec, 150, 3000, 400, 3700, 1676, {disc: 'electrical'});
    S('light', 'pendant over the counter', 1500, 2200, 2743);
    S('light', 'shop light over the bench', 4500, 2800, 2743);
    S('switch', 'switch by the front door', 120, 2800, 1219);
    Ot('outlet by the counter', 2000, 4452, 1067);
    Ot('outlet over the workbench', 3800, 4452, 1067);
    Ot('outlet for the stitcher', 5976, 2600, 457);
    O('ceiling fan', C.int, 3000, 2600, 450, 2600, {anim: {type: 'spin', rpm: 45}});
    // services: tap the Yucca Avenue span with a new pole, water and sewer from the Agave Street mains along the west yard
    sym('electrical', C.struct, 'pole', P(246188, 266350), 0, {part: 'saddle shop service pole on the Yucca Avenue span'});
    run('electrical', C.elec, [P(246188, 266350, 6400), P(x0 - 300, 266350, 3400), P(x0 - 300, 266350, 1676), P(x0 + 270, 266350, 1676)], {building: N, part: 'service drop and meter'});
    run('plumbing', C.plumb, [P(249000, 239700, -1219), P(249000, y0 + 300, -900), P(x0 + 3600, y0 + 300, -900), P(x0 + 3600, y0 + 300, 300)], {building: N, part: 'water service from the Agave Street main'});
    run('plumbing', C.sewer, [P(x0 + 3400, y0 + 550, -300), P(249400, y0 + 550, -700), P(249400, 240600, -2134)], {building: N, part: 'shop drain to the Agave Street sewer'});
    // front yard
    hatch('paving', C.curb, rect(246888, y0 + 1500, x0, y0 + 2800), 'dots', 600, 0, {part: 'gravel walk to the saddle shop'});
    line('structure', C.struct, [P(x0 - 1800, y0 + 3400, 1000), P(x0 - 1800, y0 + 4500, 1000)], {part: 'hitching rail by the saddle shop'});
    for (const yy of [y0 + 3400, y0 + 4500]) line('structure', C.struct, [P(x0 - 1800, yy, 0), P(x0 - 1800, yy, 1000)], {part: 'hitching rail post'});
    sym('vehicle', C.car2, 'truck', P(249600, y0 + 4300), 0.05, {part: 'pickup parked at the saddle shop'});
    sy(1900, 3350, 'standing', 'paying for a new headstall at the counter', Math.PI / 2);
    sy(4400, 3300, 'standing', 'tooling a floral pattern into a saddle fender', Math.PI / 2);
    sy(5500, 2500, 'standing', 'running a cinch strap through the stitcher', Math.PI);
    sy(1250, 1400, 'standing', 'lifting a used saddle off the stand', Math.PI);
    say(x0 - 2600, y0 + 2300, 'standing', 'carrying a saddle in for a new latigo', -Math.PI / 2);
  }

  // ================================================================= 4,3 Palm Row Pollen Shed, north of the well house in the date grove
  {
    const N = 'Palm Row Pollen Shed', x0 = 351000, x1 = 355267, y0 = 302000, y1 = 305048, H = 3048;
    const {R, O, V, S, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.curb, vface(x0, y0, x1, y0, 0, H), 'cross', 400, 0, {building: N, part: 'painted block, south face'}, C.yellow);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'silt line at the base, east wall'}, C.brick);
    shed(N, x0, y0, x1, y1, H + 100, C.roof, C.struct, true);
    door(N, x0 + 1900, y0, 'x', 914, 'pollen shed door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 800, y0 - 900), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 90, {building: N, part: 'insulated panel ceiling', checks: [['ceiling_height', 2743]]});
    R('chest freezer of date pollen 1', C.car2, 300, 2300, 1800, 2900, 860);
    R('chest freezer of date pollen 2', C.car2, 2000, 2300, 3500, 2900, 860);
    R('freezer thermometer display', C.elec, 900, 2850, 1200, 2900, 900, {disc: 'electrical', anim: {type: 'blink', period: 3, duty: 0.8}});
    R('strand cutting table', C.struct, 300, 400, 1500, 1000, 914, {check: ['counter_height', 914]});
    R('tray of drying male flower strands', C.yellow, 400, 500, 1400, 900, 960);
    V('rack of pollen drying screens', C.int, 4147, 400, 4147, 2000, 300, 1900);
    R('bale of cotton wads for pollinating', C.int, 3300, 1200, 3900, 1700, 700);
    R('shelf of paper strand bags', C.brick, 300, 1300, 900, 2000, 1524, {check: ['shelf_height', 1524]});
    V('pegboard of pruning knives and twine', C.struct, 3300, 120, 4000, 120, 1200, 1800);
    O('backpack pollen duster', C.yellow, 2600, 1800, 250, 700);
    O('sieve for sifting pollen', C.curb, 1100, 700, 200, 980);
    R('60 A subpanel', C.elec, 150, 1300, 400, 1700, 1676, {disc: 'electrical'});
    S('light', 'shed ceiling light', 2100, 1500, 2743);
    S('switch', 'switch by the shed door', 3000, 120, 1219);
    Ot('outlet behind freezer 1', 1000, 2928, 457);
    Ot('outlet behind freezer 2', 2700, 2928, 457);
    Ot('outlet at the cutting table', 120, 700, 1067);
    sym('electrical', C.struct, 'pole', P(350500, 300800), 0, {part: 'pollen shed service pole'});
    line('electrical', C.elec, [P(350500, 298000, 6400), P(350500, 300800, 6400)], {part: 'secondary span to the pollen shed pole'});
    run('electrical', C.elec, [P(350500, 300800, 6400), P(x0 - 300, y0 + 1500, 3000), P(x0 - 300, y0 + 1500, 1676), P(x0 + 270, y0 + 1500, 1676)], {building: N, part: 'service drop to the pollen shed'});
    sy(1500, 1500, 'standing', 'sifting date pollen through a fine screen', Math.PI);
    sy(2700, 1000, 'standing', 'filling a duster with pollen and flour', 0);
    say(353400, 301000, 'walking', 'carrying a bag of pollen strands to the grove', 0);
  }

  // ================================================================= 5,2 Tortoise Shell Grading Lab, east of the huller off the alley
  {
    const N = 'Tortoise Shell Grading Lab', x0 = 453500, x1 = 458072, y0 = 208000, y1 = 211658, H = 3353;
    const {R, O, V, S, Ot, say: sy} = loc(N, x0, y0);
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -610, true);
    hatch('structure', C.car2, vface(x0, y0, x1, y0, 0, H), 'lines', 350, 0, {building: N, part: 'metal panel siding, south face'}, C.struct);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 900), 'gradient', 300, 0, {building: N, part: 'hull dust at the base, west wall'}, C.yellow);
    hip(N, x0, y0, x1, y1, H + 100, C.brick, C.roof);
    door(N, x0 + 600, y0, 'x', 914, 'lab door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 2200, y0 - 900), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'cross', 1219, 0, {building: N, part: 'lab ceiling grid', checks: [['ceiling_height', 2743]]});
    hatch('structure', C.curb, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 10), 'cross', 300, 0, {building: N, part: 'sealed concrete floor, scored in squares'});
    R('lab bench along the north wall', C.int, 500, 2900, 4200, 3500, 914, {check: ['counter_height', 914]});
    R('grain moisture meter', C.int, 700, 3050, 1000, 3300, 1100);
    R('moisture meter ready light', C.elec, 940, 3060, 990, 3110, 1110, {disc: 'electrical', anim: {type: 'blink', period: 2, duty: 0.6}});
    R('precision sample scale', C.struct, 1300, 3050, 1650, 3350, 1000);
    R('riffle sample splitter', C.curb, 2000, 3000, 2400, 3400, 1250);
    R('benchtop drying oven', C.brick, 3200, 3000, 3900, 3450, 1500);
    R('oven heating light', C.elec, 3800, 3020, 3860, 3080, 1450, {disc: 'electrical', anim: {type: 'blink', period: 4, duty: 0.7}});
    R('grading table with a light box', C.int, 1800, 1400, 3200, 2100, 914, {check: ['counter_height', 914]});
    R('trays of split and closed shell nuts', C.yellow, 1900, 1500, 3100, 2000, 950);
    R('shelf of labeled sample bags', C.struct, 4200, 600, 4452, 2400, 1830, {check: ['shelf_height', 1830]});
    R('lab sink', C.plumb, 3300, 150, 3900, 650, 900, {disc: 'plumbing'});
    O('point of use water heater', C.plumb, 2600, 400, 200, 700, {disc: 'plumbing'});
    R('grade certificate desk', C.struct, 300, 1400, 1000, 2400, 760);
    R('grade certificate computer', C.int, 350, 1700, 950, 1900, 1150);
    R('grade certificate printer', C.int, 400, 2100, 900, 2350, 900);
    R('100 A panel', C.elec, 150, 2400, 400, 2800, 1676, {disc: 'electrical'});
    S('light', 'lab light over the bench', 2300, 2600, 2743);
    S('light', 'lab light over the grading table', 2500, 1100, 2743);
    S('switch', 'switch by the lab door', 1700, 120, 1219);
    Ot('outlet for the moisture meter', 1000, 3538, 1067);
    Ot('outlet for the drying oven', 3500, 3538, 1067);
    Ot('outlet at the desk', 120, 2000, 457);
    sym('electrical', C.struct, 'pole', P(453000, 206500), 0, {part: 'grading lab service pole'});
    line('electrical', C.elec, [P(450032, 202996, 6400), P(453000, 206500, 6400)], {part: 'secondary span to the grading lab pole'});
    run('electrical', C.elec, [P(453000, 206500, 6400), P(x0 - 300, 210600, 3000), P(x0 - 300, 210600, 1676), P(x0 + 270, 210600, 1676)], {building: N, part: 'service drop to the grading lab'});
    run('plumbing', C.plumb, [P(457100, 201544, -1219), P(457100, y0 + 400, -900), P(457100, y0 + 400, 300)], {building: N, part: 'water service from the alley main'});
    run('plumbing', C.sewer, [P(456900, y0 + 400, -300), P(456900, 202444, -1800)], {building: N, part: 'lab drain to the alley sewer'});
    hatch('paving', C.curb, rect(x0 + 400, 203500, x0 + 1700, y0), 'dots', 600, 0, {part: 'concrete walk from the alley to the lab'});
    sy(1300, 2550, 'standing', 'weighing a pistachio sample on the scale', 0);
    sy(2500, 1000, 'standing', 'counting blank nuts in a sample tray', 0);
    say(452700, 209500, 'standing', 'dropping off a sample bag from the huller', 0);
  }

  // ---- D() items in the older 5,2 buildings
  D('5:2', 'Tortoise Shell Pistachio Huller', [436284, 206996, 448781, 219188], 4877, [
    ['f', 'hull pit auger hopper', C.struct, 1500, 1200, 900],
    ['f', 'pistachio dryer burner housing', C.brick, 1200, 1200, 1800],
    ['f', 'bin of split pistachios for the roaster', C.yellow, 1200, 1200, 1100],
    ['w', 'huller control panel with a start button', C.elec, 600, 1200, 1900, {disc: 'electrical'}],
    ['w', 'hearing protection station', C.yellow, 500, 1300, 1700],
    ['o', 'outlet for the sample scale', 1067],
    ['c', 'high bay light over the float tank', C.elec, 140, 0],
    ['c', 'high bay light over the sorting belt', C.elec, 140, 0],
    ['p', 'standing', 'raking hulls off the trailer chute'],
    ['p', 'standing', 'reading the dryer thermometer'],
  ]);
  D('5:2', 'Datura Wash Cotton Module Barn', [408432, 209434, 432816, 219188], 6800, [
    ['f', 'folded spare module tarp on a pallet', C.yellow, 1200, 1000, 400],
    ['w', 'fire extinguisher on a hook', C.brick, 300, 900, 1500],
    ['o', 'outlet for the tag printer', 457],
    ['c', 'barn high bay light', C.elec, 140, 0],
    ['p', 'standing', 'tallying modules on a clipboard'],
  ]);
  D('5:2', 'Horsetail Flats Swamp Cooler Repair', [445008, 184496, 454457, 198496], 3353, [
    ['f', 'cooler pump test tub', C.plumb, 700, 700, 500],
    ['w', 'wall chart of cooler pad sizes', C.sign, 900, 1100, 1900],
    ['o', 'outlet for the pump test tub', 457],
    ['p', 'standing', 'testing a cooler pump in a tub of water'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
