// Agent Orange 2026-11-13 a: claim 7,2 and build the Chinchweed Civic Center (central fire station, police substation, urgent care clinic,
// training tower, radio hut), then deepen the oldest blocks 0,1, 1,1 and 2,0 with a new small building each.
export default function (k) {

  const {C, P, line, sym, hatch, rect, circ, arc, vface, person, eng, W} = k;
  const closed = {closed: true};

  // ---------------------------------------------------------------- live city index
  const recsIn = (ck) => { const c = [...W.chunks.values()].find(c => c.k === ck); return c ? c.records.filter(r => !r.hidden) : []; };
  const segsOf = (r) => { const s = eng.recSegs(r), o = []; for (let i = 0; i + 1 < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let seed = 611131; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

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

  // ================================================================= claim 7,2, the Chinchweed Civic Center
  claim(7, 2);
  streets(7, 2, {s: true, e: true});
  const ox = 7 * S, oy = 2 * S;
  const a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
  let s2 = 72131; const r2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
  const [rc, rc2] = [10, 5];
  lot('civic', a, ys, b, yn, 'Chinchweed Civic Center');

  // ---- utilities: pole line in the west, north and east strips, private water and sewer mains tied to the Tarantula Avenue mains
  const poleW = [172000, 189000, 200000, 214000].map(y => [a + 1200, y]);
  const poleN = [[a + 1200, yn - 1200], [578000, yn - 1200], [590000, yn - 1200], [603000, yn - 1200], [616000, yn - 1200], [b - 1200, yn - 1200]];
  const poleE = [214000, 200000, 186000, 172000].map(y => [b - 1200, y]);
  const poles = [...poleW, ...poleN, ...poleE];
  for (const [px, py] of poles) sym('electrical', C.struct, 'pole', P(px, py), 0, {part: 'civic center pole line'});
  const pl = [...poleW, ...poleN, ...poleE];
  line('electrical', C.elec, pl.map(([x, y]) => P(x, y, 8230)), {part: 'civic center primary'});
  line('electrical', C.elec, pl.map(([x, y]) => P(x, y, 6400)), {part: 'civic center secondary'});
  const WM = [[ox + 2400, ys + 700, -1219], [b - 500, ys + 700, -1219]], WB = [[a + 600, ys + 700, -1219], [a + 600, yn - 700, -1219], [b - 500, yn - 700, -1219]];
  const SM = [[ox + 3600, ys + 1700, -2134], [b - 500, ys + 1700, -1700]], SB = [[a + 1900, yn - 1900, -1700], [a + 1900, ys + 1700, -2000]];
  line('plumbing', C.plumb, WM.map(p => P(...p)), {part: 'civic water main off Tarantula Avenue'});
  line('plumbing', C.plumb, WB.map(p => P(...p)), {part: 'civic water loop along the west and north strips'});
  line('plumbing', C.sewer, SM.map(p => P(...p)), {part: 'civic sewer to Tarantula Avenue'});
  line('plumbing', C.sewer, SB.map(p => P(...p)), {part: 'civic sewer west leg'});
  const nearOn = (paths, x, y) => { let best = null, bd = 1e18; for (const pth of paths) for (let i = 0; i + 1 < pth.length; i++) { const A = pth[i], B = pth[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy || 1; let t = ((x - A[0]) * dx + (y - A[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); const q = [A[0] + dx * t, A[1] + dy * t, A[2] + (B[2] - A[2]) * t], d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = q; } } return best; };
  const nearPole = (x, y) => poles.reduce((p, c) => Math.hypot(c[0] - x, c[1] - y) < Math.hypot(p[0] - x, p[1] - y) ? c : p);

  // ---- a shell that can face any side. u runs along the front, v runs from the front wall to the back.
  function frame(x0, y0, x1, y1, face) {
    const W = face === 's' || face === 'n' ? x1 - x0 : y1 - y0, Dp = face === 's' || face === 'n' ? y1 - y0 : x1 - x0;
    const m = (u, v) => face === 's' ? [x0 + u, y0 + v] : face === 'n' ? [x1 - u, y1 - v] : face === 'e' ? [x1 - v, y0 + u] : [x0 + v, y1 - u];
    const R = (N, label, col, u0, v0, u1, v1, z, o) => { const p = m(u0, v0), q = m(u1, v1); I(N, label, col, p[0], p[1], q[0], q[1], z, o); };
    const Cc = (N, label, col, u, v, r, z, o) => { const p = m(u, v); IC(N, label, col, p[0], p[1], r, z, o); };
    const V = (N, label, col, u0, v0, u1, v1, z0, z1, o) => { const p = m(u0, v0), q = m(u1, v1); VB(N, label, col, p[0], p[1], q[0], q[1], z0, z1, o); };
    const along = face === 's' || face === 'n' ? 'x' : 'y', across = along === 'x' ? 'y' : 'x';
    return {W, Dp, m, R, Cc, V, along, across};
  }
  const dr = (f, N, u, v, dir, w, label, ks = -1) => { const p0 = f.m(u, v), p1 = dir === 'along' ? f.m(u + w, v) : f.m(u, v + w); door(N, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), dir === 'along' ? f.along : f.across, w, label, ks); };
  function shell(N, x0, y0, x1, y1, H, face, o = {}) {
    const f = frame(x0, y0, x1, y1, face), {W, Dp, m, R} = f;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], H, -1219, true);
    const p1 = m(W - 2743, Dp), p2 = m(W - 2743, Dp - 2438), p3 = m(W, Dp - 2438);
    wall(N, [p1, p2, p3], 3048, 0, false, C.int);
    const fa = m(0, 0), fb = m(W, 0);
    hatch('structure', o.fc, vface(fa[0], fa[1], fb[0], fb[1], 2900, H), o.facade, o.facade === 'brick' ? 300 : 350, o.facade === 'lines' ? 90 : 0, {building: N, part: 'front facade'}, C.struct);
    const ba = m(0, Dp), bb = m(W, Dp);
    hatch('structure', C.struct, vface(ba[0], ba[1], bb[0], bb[1], 0, 900), 'gradient', 300, 0, {building: N, part: 'back wall base shadow'}, C.int);
    const sg = m(o.signU || 1500, -1300);
    sym('structure', C.sign, 'sign', P(sg[0], sg[1]), 0, {text: N});
    const cz = o.ceil || 3353;
    if (!o.noCeil) hatch('structure', 7, rect(x0 + 150, y0 + 150, x1 - 150, y1 - 150, cz), 'cross', 1219, 0, {building: N, part: 'ceiling grid, 2 by 4 lay in tile', checks: [['ceiling_height', cz]]});
    const bz = o.beam || 3962;
    for (let v = 4500; v < Dp - 1500; v += 4500) { const p = m(0, v), q = m(W, v); line('structure', C.struct, [P(p[0], p[1], bz), P(q[0], q[1], bz)], {building: N, part: 'steel beam', checks: [['beam_height', bz]]}); }
    const du = o.doorU || 2400;
    dr(f, N, du, 0, 'along', 914, 'front door');
    dr(f, N, W - 2743, Dp - 1900, 'across', 864, 'restroom door');
    for (let v = 2500; v < Dp - 1800; v += 3600) for (let u = 2286; u < W - 3300; u += 4572) { if (o.lightMinU && u < o.lightMinU) continue; const p = m(u, v); sym('electrical', C.elec, 'light', P(p[0], p[1], o.lightZ || cz), 0, {part: 'ceiling light'}); }
    const rl = m(W - 1370, Dp - 1200); sym('electrical', C.elec, 'light', P(rl[0], rl[1], 2743), 0, {part: 'restroom light'});
    for (let v = 2600; v < Dp - 3000; v += 3600) { const p = m(150, v), q = m(W - 150, v + 600); sym('electrical', C.elec, 'outlet', P(p[0], p[1], 457), 0, {checks: [['outlet_height', 457]]}); sym('electrical', C.elec, 'outlet', P(q[0], q[1], 457), 0, {checks: [['outlet_height', 457]]}); }
    const sw = m(du + 1100, 150); sym('electrical', C.elec, 'switch', P(sw[0], sw[1], 1219), 0, {part: 'entry switch'});
    R(N, '200 A panel', C.elec, 200, Dp - 1600, 500, Dp - 800, 1676, {disc: 'electrical'});
    f.Cc(N, 'restroom exhaust fan', C.int, W - 1370, Dp - 1800, 150, 2743, {n: 6, anim: {type: 'spin', rpm: 30}});
    f.Cc(N, 'water closet', C.int, W - 700, Dp - 600, 260, 432, {n: 8});
    R(N, 'wall hung lavatory', C.int, W - 2400, Dp - 600, W - 1800, Dp - 150, 864, {check: ['counter_height', 864]});
    f.V(N, 'restroom mirror', C.int, W - 2400, Dp - 120, W - 1800, Dp - 120, 1000, 1700);
    const g0 = m(W - 120, Dp - 1500), g1 = m(W - 120, Dp - 400);
    line('interior', C.int, [P(g0[0], g0[1], 860), P(g1[0], g1[1], 860)], {building: N, part: 'grab bar'});
    // services
    const mp = m(350, Dp - 300), pole = nearPole(mp[0], mp[1]), outp = m(350, Dp + 300), inp = m(350, Dp - 1200);
    run('electrical', C.elec, [P(pole[0], pole[1], 6400), P(outp[0], outp[1], 4000), P(outp[0], outp[1], 1676), P(inp[0], inp[1], 1676)], {building: N, part: 'service drop and meter'});
    const wp = m(W - 900, Dp - 600), wm = nearOn([WM, WB], wp[0], wp[1]);
    run('plumbing', C.plumb, [P(wm[0], wm[1], -1219), P(wp[0], wp[1], -900), P(wp[0], wp[1], 300)], {building: N, part: 'water service'});
    const sp = m(W - 700, Dp - 1000), sm = nearOn([SM, SB], sp[0], sp[1]);
    run('plumbing', C.sewer, [P(sp[0], sp[1], -300), P(sm[0], sm[1], sm[2] + 300)], {building: N, part: 'building drain to the civic sewer'});
    line('plumbing', C.plumb, [P(wp[0], wp[1], 300), P(wp[0], wp[1], 1500)], {building: N, part: '40 gallon water heater'});
    return f;
  }

  // ---- Chinchweed Central Fire Station, faces Cholla Street, three back in bays east of the crew quarters
  {
    const N = 'Chinchweed Central Fire Station', x0 = 576000, x1 = 600384, y0 = 177000, y1 = 195288;
    const f = shell(N, x0, y0, x1, y1, 6096, 's', {facade: 'brick', fc: C.brick, noCeil: true, beam: 4877, lightZ: 4600, lightMinU: 9500, signU: 5200});
    const {R, Cc, V, m} = f;
    hip(N, x0, y0, x0 + 9144, y1, 6196, rc, rc2);
    barrel(N, x0 + 9144, y0, x1, y1, 6196, rc, rc2);
    wall(N, [[x0 + 9144, y0], [x0 + 9144, y1]], 6096, 0, false, C.int);
    wall(N, [[x0, y0 + 8534], [x0 + 9144, y0 + 8534]], 3048, 0, false, C.int);
    wall(N, [[x0 + 4572, y0 + 8534], [x0 + 4572, y1]], 3048, 0, false, C.int);
    dr(f, N, 9144, 5200, 'across', 914, 'door to the apparatus bay', 1);
    dr(f, N, 1700, 8534, 'along', 914, 'kitchen door');
    dr(f, N, 6400, 8534, 'along', 914, 'bunk room door');
    dr(f, N, 2600, 18288, 'along', 914, 'kitchen back door to the flag plaza', 1);
    hatch('structure', 7, rect(x0 + 150, y0 + 150, x0 + 9000, y1 - 150, 2743), 'cross', 1219, 0, {building: N, part: 'crew quarters ceiling grid', checks: [['ceiling_height', 2743]]});
    const bays = [12029, 16829, 21629];
    bays.forEach((c, i) => {
      const p = m(c - 1829, 0), q = m(c + 1829, 0);
      line('structure', C.struct, [P(p[0], p[1]), P(p[0], p[1], 4267), P(q[0], q[1], 4267), P(q[0], q[1])], {building: N, part: 'sectional bay door ' + (i + 1)});
      hatch('structure', C.int, vface(p[0], p[1] - 50, q[0], q[1] - 50, 0, 4267), 'lines', 300, 0, {building: N, part: 'glazed sectional door panels, bay ' + (i + 1)}, C.struct);
      line('interior', C.yellow, [P(...m(c, 1000), 4300), P(...m(c, 14500), 4300)], {building: N, part: 'vehicle exhaust rail, bay ' + (i + 1)});
      line('interior', C.struct, [P(...m(c, 11000), 4300), P(...m(c, 11000), 3300)], {building: N, part: 'exhaust hose drop to the tailpipe, bay ' + (i + 1)});
      line('plumbing', C.plumb, [P(...m(c, 1200), -150), P(...m(c, 15500), -150)], {building: N, part: 'trench drain down bay ' + (i + 1)});
      line('interior', C.yellow, [P(...m(c - 1600, 15800), 5), P(...m(c + 1600, 15800), 5)], {building: N, part: 'yellow stop line, bay ' + (i + 1)});
    });
    R(N, 'Engine 41 pumper', C.brick, 12029 - 1270, 2600, 12029 + 1270, 12600, 3200);
    R(N, 'Engine 41 hose bed', C.struct, 12029 - 1100, 9800, 12029 + 1100, 12400, 3300);
    R(N, 'Ladder 41 aerial truck', C.brick, 16829 - 1270, 1500, 16829 + 1270, 13800, 3500);
    line('interior', C.struct, [P(...m(16829, 3000), 3600), P(...m(16829, 12500), 3700)], {building: N, part: 'Ladder 41 bedded aerial'});
    R(N, 'Brush 41 four wheel drive brush truck', C.yellow, 21629 - 1200, 3500, 21629 + 1200, 10500, 2800);
    R(N, 'Brush 41 skid tank', C.plumb, 21629 - 1000, 7500, 21629 + 1000, 10200, 2900);
    for (const [c, rot] of [[12029, Math.PI], [16829, Math.PI], [21629, Math.PI]]) sym('vehicle', C.brick, 'truck', P(...m(c, 7500)), rot, {part: 'apparatus backed into the bay'});
    V(N, 'turnout gear rack, B shift', C.yellow, 9600, 18100, 11800, 18100, 0, 1830);
    V(N, 'turnout gear rack, C shift', C.yellow, 12000, 18100, 14200, 18100, 0, 1830);
    R(N, 'SCBA bottle fill station', C.struct, 14600, 17200, 15600, 18100, 1700);
    R(N, 'gear washer extractor', C.int, 16000, 17300, 16900, 18100, 1100);
    R(N, 'ice machine for the coolers', C.car2, 17200, 17300, 18000, 18100, 1700);
    R(N, 'hose rack of rolled supply line', C.struct, 23900, 1600, 24250, 6200, 1800, {check: ['shelf_height', 1800]});
    R(N, 'shelf of spare nozzles and adapters', C.yellow, 23900, 6800, 24250, 9600, 1600, {check: ['shelf_height', 1600]});
    R(N, 'workbench with a pipe vise', C.struct, 9400, 13800, 10100, 16200, 914, {check: ['counter_height', 914]});
    Cc(N, 'shop air compressor', C.plumb, 9700, 12800, 320, 1200, {n: 10});
    Cc(N, 'bay ceiling fan 1', C.int, 14400, 7000, 600, 4700, {n: 10, anim: {type: 'spin', rpm: 45}});
    Cc(N, 'bay ceiling fan 2', C.int, 19200, 7000, 600, 4700, {n: 10, anim: {type: 'spin', rpm: 45}});
    Cc(N, 'eye wash station', C.plumb, 24100, 12000, 180, 1000, {n: 8, disc: 'plumbing'});
    sym('electrical', C.elec, 'outlet', P(...m(9300, 15000), 1067), 0, {building: N, part: 'bench outlet', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'outlet', P(...m(16450, 18138), 1067), 0, {building: N, part: 'outlet for the washer extractor', checks: [['outlet_height', 1067]]});
    for (const c of bays) line('electrical', C.elec, [P(...m(c, 14800), 4400), P(...m(c, 14800), 2800)], {building: N, part: 'shoreline cord reel drop'});
    // watch office and dayroom
    R(N, 'watch office desk', C.int, 400, 5600, 2600, 6400, 760);
    R(N, 'rip and run printer for dispatch tickets', C.int, 600, 5800, 950, 6100, 900);
    R(N, 'dispatch radio console', C.int, 1600, 5750, 2300, 6150, 1100);
    R(N, 'station computer for run reports', C.int, 1100, 5700, 1500, 5900, 1150);
    V(N, 'station alerting tone light', C.brick, 150, 6900, 150, 7300, 2200, 2500, {anim: {type: 'blink', period: 1.2, duty: 0.5}});
    V(N, 'map of first due streets', C.sign, 150, 2000, 150, 4400, 1000, 2100);
    for (let i = 0; i < 4; i++) R(N, 'dayroom recliner ' + (i + 1), C.car, 4400 + i * 1100, 3600, 5250 + i * 1100, 4500, 450);
    V(N, 'dayroom tv on a wall bracket', C.int, 9000, 2600, 9000, 4400, 1300, 2300);
    // kitchen
    R(N, 'six burner range', C.struct, 300, 11800, 1200, 13000, 914, {check: ['counter_height', 914]});
    R(N, 'hood over the range', C.struct, 200, 11700, 1300, 13100, 2100);
    for (let i = 0; i < 3; i++) R(N, 'shift refrigerator ' + ['A', 'B', 'C'][i], C.car2, 300, 14000 + i * 900, 1100, 14800 + i * 900, 1830);
    R(N, 'kitchen island', C.int, 2200, 11000, 3600, 13200, 914, {check: ['counter_height', 914]});
    R(N, 'long dining table', C.int, 1900, 15000, 4000, 17400, 760);
    R(N, 'kitchen sink', C.plumb, 300, 9400, 900, 10300, 900, {disc: 'plumbing'});
    R(N, 'coffee maker on the counter', C.int, 300, 10600, 650, 10900, 1250);
    // bunk room
    for (const [u, v] of [[5000, 10000], [7800, 10000], [5000, 14600], [7800, 14600]]) R(N, 'bunk', C.int, u, v, u + 900, v + 2000, 500);
    V(N, 'crew locker bank', C.struct, 4700, 17900, 6700, 17900, 0, 1830);
    sym('electrical', C.elec, 'outlet', P(...m(150, 11300), 1067), 0, {building: N, part: 'kitchen counter outlet', checks: [['outlet_height', 1067]]});
    // apron and front walk
    hatch('paving', C.curb, rect(585000, oy + CURB, x1, y0), 'lines', 1219, 0, {part: 'concrete apron to Cholla Street'}, C.struct);
    hatch('paving', C.curb, rect(x0 + 2100, ys, x0 + 3600, y0), 'dots', 600, 0, {part: 'front walk to the watch office'});
    sym('street', C.yellow, 'sign', P(584200, ys + 600), 0, {text: 'Fire Station Keep Clear'});
    sym('street', C.brick, 'light', P(584000, y0 - 2000, 3600), 0, {part: 'apron warning beacon', anim: {type: 'blink', period: 1.6, duty: 0.5}});
    say(...m(12029, -2600), 'standing', 'rolling a hose back onto the engine', 0);
    say(...m(19300, 3400), 'standing', 'wiping down the ladder truck chrome', Math.PI / 2);
    say(...m(15100, 16400), 'standing', 'checking the air bottle on an SCBA pack', Math.PI);
    say(...m(1800, 11500), 'standing', 'stirring a pot of green chile stew', Math.PI);
    say(...m(1500, 4900), 'standing', 'logging the morning truck check', 0);
    say(...m(5900, 5600), 'sitting', 'watching the weather on the dayroom tv', 0);
    say(...m(21629, -3600), 'standing', 'washing the brush truck on the apron', 0);
  }

  // ---- Chinchweed Police Substation, faces east onto the shared lot
  {
    const N = 'Chinchweed Police Substation', x0 = 566880, x1 = 579072, y0 = 207000, y1 = 222240;
    const f = shell(N, x0, y0, x1, y1, 4267, 'e', {facade: 'brick', fc: C.struct, pos: false, ceil: 2896, beam: 3353});
    const {R, Cc, V, m} = f;
    gravel(N, x0, y0, x1, y1, 4267, rc, rc2);
    R(N, 'public lobby counter with a pass through window', C.brick, 600, 3000, 4200, 3400, 1067, {check: ['counter_height', 1067]});
    V(N, 'bullet resistant glass over the counter', C.car2, 600, 3200, 4200, 3200, 1067, 2300);
    R(N, 'card reader for permit fees', C.int, 3400, 3050, 3650, 3300, 1150);
    R(N, 'receipt printer for permit fees', C.int, 2800, 3500, 3100, 3800, 1100);
    V(N, 'rack of report forms in the lobby', C.int, 4600, 150, 5300, 150, 900, 1600);
    for (let i = 0; i < 3; i++) R(N, 'patrol desk ' + (i + 1), C.int, 5200 + i * 2400, 5400, 6800 + i * 2400, 6200, 760);
    R(N, 'patrol radio charging rack', C.elec, 600, 7400, 2000, 7800, 1100, {disc: 'electrical'});
    V(N, 'evidence lockers', C.struct, 12800, 4000, 12800, 6400, 0, 1830);
    R(N, 'report printer', C.int, 600, 6200, 1100, 6800, 1000);
    R(N, 'break table with a coffee maker', C.int, 7400, 9000, 9000, 10400, 760);
    V(N, 'cork board of found bicycles and lost dogs', C.sign, 4600, 12042, 6800, 12042, 1000, 1900);
    V(N, 'framed map of the patrol beats', C.sign, 8200, 12042, 10400, 12042, 1000, 2100);
    sym('electrical', C.elec, 'outlet', P(...m(150, 7600), 1067), 0, {building: N, part: 'outlet for the radio chargers', checks: [['outlet_height', 1067]]});
    for (let i = 0; i < 4; i++) R(N, 'lobby bench seat ' + (i + 1), C.int, 400 + i * 700, 900, 1000 + i * 700, 1400, 457);
    line('structure', C.struct, [P(...m(6000, -2600)), P(...m(8400, -2600))], {part: 'bicycle rack by the substation'});
    say(...m(2400, 2400), 'standing', 'reporting a stolen irrigation pump', 0);
    say(...m(2400, 4100), 'standing', 'handing back a found wallet', Math.PI);
    say(...m(8000, 7100), 'sitting', 'typing up a fender bender report', Math.PI);
    say(...m(1300, 8500), 'standing', 'swapping a dead radio battery', Math.PI);
  }

  // ---- Desert Thorn Urgent Care Clinic, faces west onto the shared lot
  {
    const N = 'Desert Thorn Urgent Care Clinic', x0 = 608124, x1 = 621840, y0 = 203000, y1 = 221288;
    const f = shell(N, x0, y0, x1, y1, 4267, 'w', {facade: 'lines', fc: C.car2, ceil: 2743, beam: 3353, signU: 5200});
    const {R, Cc, V, m} = f;
    gableY(N, x0, y0, x1, y1, 4367, rc, rc2);
    wall(N, [m(0, 8000), m(12497, 8000)], 3048, 0, false, C.int);
    for (const u of [4100, 8300, 12497]) wall(N, [m(u, 8000), m(u, 13716)], 3048, 0, false, C.int);
    [0, 4100, 8300].forEach((u0, i) => {
      dr(f, N, u0 + 1500, 8000, 'along', 914, 'exam room ' + (i + 1) + ' door');
      R(N, 'exam table, room ' + (i + 1), C.car2, u0 + 900, 11000, u0 + 1600, 12900, 813);
      R(N, 'rolling stool, room ' + (i + 1), C.int, u0 + 2300, 10200, u0 + 2700, 10600, 550);
      R(N, 'hand sink, room ' + (i + 1), C.plumb, u0 + 2800, 13200, u0 + 3500, 13600, 864, {disc: 'plumbing'});
      V(N, 'wall blood pressure cuff, room ' + (i + 1), C.int, u0 + 300, 13596, u0 + 700, 13596, 1300, 1600);
      V(N, 'sharps container, room ' + (i + 1), C.brick, u0 + 3600, 13596, u0 + 3900, 13596, 1350, 1700);
      sym('electrical', C.elec, 'outlet', P(...m(u0 + 2000, 13566), 457), 0, {building: N, part: 'exam room ' + (i + 1) + ' outlet', checks: [['outlet_height', 457]]});
    });
    R(N, 'check in counter', C.brick, 600, 4800, 4200, 5300, 1067, {check: ['counter_height', 1067]});
    R(N, 'pos terminal for copays', C.int, 1400, 4900, 1700, 5200, 1350);
    R(N, 'card reader at check in', C.int, 2200, 4750, 2400, 4950, 1150);
    R(N, 'receipt printer at check in', C.int, 2900, 4950, 3200, 5200, 1100);
    for (let i = 0; i < 6; i++) R(N, 'waiting room chair ' + (i + 1), C.car2, 6000 + i * 800, 600, 6600 + i * 800, 1150, 457);
    R(N, 'triage station with a scale', C.int, 13500, 5000, 14500, 6000, 900);
    V(N, 'rack of health pamphlets', C.int, 10600, 150, 11400, 150, 900, 1700);
    R(N, 'water cooler in the waiting room', C.car2, 11800, 600, 12300, 1100, 1100);
    R(N, 'crash cart', C.brick, 13300, 7000, 13900, 7500, 1000);
    V(N, 'supply shelf of gauze and splints', C.int, 15500, 7700, 17000, 7700, 0, 1830, {check: ['shelf_height', 1830]});
    sym('electrical', C.elec, 'outlet', P(...m(150, 5000), 1067), 0, {building: N, part: 'check in counter outlet', checks: [['outlet_height', 1067]]});
    say(...m(2400, 3800), 'standing', 'checking in for a tetanus shot', 0);
    say(...m(2400, 6100), 'standing', 'paying a copay with a card', Math.PI);
    say(...m(7200, 1900), 'sitting', 'waiting with a feverish toddler', 0);
    say(...m(2000, 10200), 'standing', 'wrapping a sprained ankle', 0);
    say(...m(6200, 11800), 'standing', 'taking a blood pressure reading', 0);
    say(...m(14000, 4300), 'standing', 'weighing a patient at triage', 0);
  }

  // ---- Chinchweed Fire Training Tower, four floors with a stair, west of the station
  {
    const N = 'Chinchweed Fire Training Tower', x0 = 566880, x1 = 572976, y0 = 178000, y1 = 184096;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 12192, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 12192), 'brick', 400, 0, {building: N, part: 'scorched block, south face'}, C.brick);
    hatch('structure', C.struct, vface(x1, y0, x1, y1, 0, 12192), 'gradient', 600, 0, {building: N, part: 'soot streaks, east face'}, 7);
    for (const z of [3048, 6096, 9144]) hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, z), 'lines', 900, 0, {building: N, part: 'concrete floor slab at ' + z + ' mm'});
    line('structure', C.struct, rect(x0, y0, x1, y1, 13300), {building: N, part: 'roof parapet'}, closed);
    line('structure', C.yellow, [P(x0 + 1000, y1 - 100, 12900), P(x1 - 1000, y1 - 100, 12900)], {building: N, part: 'rappel anchor beam on the roof'});
    door(N, x0 + 3000, y0, 'x', 914, 'tower door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 90, {building: N, part: 'ground floor ceiling', checks: [['ceiling_height', 2743]]});
    for (const [z, x] of [[3500, x0 + 2000], [6548, x0 + 3500], [9596, x0 + 2000]]) line('structure', C.struct, [P(x, y0, z), P(x + 1200, y0, z), P(x + 1200, y0, z + 1200), P(x, y0, z + 1200)], {building: N, part: 'window opening with a burned sill'}, closed);
    for (let i = 0; i < 18; i++) {
      const y = y0 + 500 + i * 279, z = Math.min(3048, (i + 1) * 169);
      line('interior', C.int, [P(x0 + 300, y, z), P(x0 + 1300, y, z)], Object.assign({building: N, part: 'stair tread ' + (i + 1)}, i < 8 ? {checks: [['stair_riser', 169], ['stair_tread', 279]]} : {}));
    }
    line('interior', C.struct, [P(x0 + 1350, y0 + 500, 1000), P(x0 + 1350, y0 + 500 + 18 * 279, 4048)], {building: N, part: 'stair handrail'});
    for (const z of [3048, 6096, 9144]) line('interior', C.int, [P(x0 + 1600, y0 + 500, z), P(x0 + 1600, y0 + 5200, z + 3048)], {building: N, part: 'stair flight from ' + z + ' mm'});
    line('plumbing', C.plumb, [P(x1 - 400, y0 + 400, -900), P(x1 - 400, y0 + 400, 12500)], {building: N, part: 'dry standpipe riser'});
    for (const z of [1200, 4248, 7296, 10344]) I(N, 'standpipe hose valve at ' + z + ' mm', C.brick, x1 - 600, y0 + 300, x1 - 250, y0 + 600, z, {disc: 'plumbing'});
    I(N, 'smoke machine on the second floor', C.int, x0 + 3500, y0 + 3000, x0 + 4300, y0 + 3600, 3600);
    I(N, 'rescue dummy on the third floor', C.car, x0 + 3200, y0 + 4200, x0 + 5000, y0 + 4600, 6300);
    I(N, 'pallet of training hose bundles', C.yellow, x0 + 3300, y0 + 600, x0 + 4500, y0 + 1700, 700);
    sym('electrical', C.elec, 'light', P(x0 + 3000, y0 + 3000, 2743), 0, {building: N, part: 'vapor tight tower light'});
    sym('electrical', C.elec, 'switch', P(x0 + 4100, y0 + 150, 1219), 0, {building: N, part: 'tower light switch'});
    sym('electrical', C.elec, 'outlet', P(x1 - 150, y0 + 2500, 457), 0, {building: N, part: 'outlet for the smoke machine', checks: [['outlet_height', 457]]});
    run('electrical', C.elec, [P(poleW[1][0], poleW[1][1], 6400), P(x0 - 300, 182500, 3500), P(x0 - 300, 182500, 1676), P(x0 + 300, 182500, 1676)], {building: N, part: 'service drop to the tower'});
    I(N, 'tower panel', C.elec, x0 + 150, 182000, x0 + 400, 182900, 1676, {disc: 'electrical'});
    const tw = nearOn([WB], x0 - 500, 181000);
    run('plumbing', C.plumb, [P(tw[0], 181000, -1219), P(x1 - 400, 181000, -900), P(x1 - 400, y0 + 400, -900)], {building: N, part: 'fire line to the standpipe'});
    line('structure', C.struct, [P(x1 + 2500, y0 + 2000, 0), P(x1 + 200, y0 + 2000, 6900)], {part: 'ground ladder raised to the second floor window'});
    hatch('paving', C.curb, rect(x1 + 600, y0 - 3000, 575200, y1 + 2500), 'lines', 900, 45, {part: 'drill yard concrete pad'}, C.struct);
    sym('plumbing', C.brick, 'hydrant', P(x1 + 1200, y1 + 1700), 0, {part: 'training hydrant'});
    sym('activity', C.person, 'person', P(x0 + 2400, y1 + 150, 9000), 0, {pose: 'standing', activity: 'rappelling down the tower face', anim: {type: 'bob', mm: 4500, period: 18}});
    say(x1 + 1500, y0 - 1800, 'standing', 'flaking out a hose bundle in the drill yard', 0);
    say(x1 + 1300, y1 + 600, 'standing', 'timing a ladder raise with a stopwatch', Math.PI);
    say(x0 + 4000, y0 + 2400, 'standing', 'checking the smoke machine fluid', 0);
  }

  // ---- Chinchweed Radio Equipment Hut and antenna tower, east of the station
  {
    const N = 'Chinchweed Radio Equipment Hut', x0 = 604500, x1 = 608767, y0 = 178000, y1 = 181658;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3048, -610, true);
    hatch('structure', C.curb, vface(x0, y0, x1, y0, 0, 3048), 'cross', 400, 0, {building: N, part: 'precast concrete panel, south wall'}, C.struct);
    shed(N, x0, y0, x1, y1, 3148, rc, rc2, false);
    door(N, x0 + 600, y0, 'x', 914, 'steel hut door', 1);
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 600, 0, {building: N, part: 'hut ceiling', checks: [['ceiling_height', 2743]]});
    for (let i = 0; i < 3; i++) I(N, 'radio equipment rack ' + (i + 1), C.int, x0 + 1800 + i * 700, y1 - 900, x0 + 2400 + i * 700, y1 - 300, 2134);
    I(N, 'repeater cabinet', C.elec, x0 + 300, y1 - 900, x0 + 1200, y1 - 300, 1600, {disc: 'electrical'});
    I(N, 'battery backup cabinet', C.elec, x1 - 1100, y0 + 300, x1 - 300, y0 + 1000, 1300, {disc: 'electrical'});
    I(N, 'automatic transfer switch', C.elec, x1 - 250, y0 + 1400, x1 - 120, y0 + 2100, 1600, {disc: 'electrical'});
    line('electrical', C.elec, [P(x0 + 300, y1 - 600, 2400), P(x1 - 300, y1 - 600, 2400)], {building: N, part: 'overhead cable ladder tray'});
    line('electrical', C.struct, [P(x0 + 150, y0 + 1400, 450), P(x0 + 150, y0 + 2400, 450)], {building: N, part: 'copper grounding bar'});
    I(N, 'wall pack air conditioner', C.car2, x0 + 120, y0 + 2600, x0 + 400, y0 + 3300, 1900);
    sym('electrical', C.elec, 'outlet', P(x0 + 2700, y0 + 150, 457), 0, {building: N, part: 'hut outlet', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'light', P(x0 + 2100, y0 + 1800, 2743), 0, {building: N, part: 'hut light'});
    run('electrical', C.elec, [P(poleE[2][0], poleE[2][1], 6400), P(x1 + 300, y0 + 1800, 4000), P(x1 + 300, y0 + 1800, 1600), P(x1 - 250, y0 + 1800, 1600)], {building: N, part: 'service drop to the hut'});
    const tx = 611000, ty = 179800, legs = [0, 120, 240].map(d => [tx + Math.cos(d * Math.PI / 180) * 600, ty + Math.sin(d * Math.PI / 180) * 600]);
    for (const [lx, ly] of legs) line('structure', C.struct, [P(lx, ly, 0), P(tx + (lx - tx) * 0.4, ty + (ly - ty) * 0.4, 30480)], {part: 'antenna tower leg'});
    const zz = []; for (let i = 0; i <= 12; i++) { const [lx, ly] = legs[i % 3], s = 1 - 0.6 * i / 12; zz.push(P(tx + (lx - tx) * s, ty + (ly - ty) * s, i * 2540)); }
    line('structure', C.struct, zz, {part: 'antenna tower lacing'});
    line('structure', C.int, [P(tx, ty, 30480), P(tx, ty, 34500)], {part: 'whip antenna'});
    sym('electrical', C.brick, 'light', P(tx, ty, 34600), 0, {part: 'red aircraft beacon', anim: {type: 'blink', period: 2, duty: 0.5}});
    line('electrical', C.int, [P(tx - 300, ty, 9000), P(x1, y1 - 600, 2600)], {part: 'coax jumper to the hut'});
    line('structure', C.struct, rect(604500, 183200, 607500, 184700, 1500), {part: 'standby diesel generator'}, closed);
    hatch('paving', C.curb, rect(604200, 182900, 607800, 185000, 100), 'dots', 400, 0, {part: 'generator pad'});
    say(x0 + 2600, y0 + 1500, 'standing', 'swapping a card in the repeater', 0);
  }

  // ---- fuel tank and hose drying rack behind the station
  line('structure', C.struct, rect(601500, 189500, 604200, 191200, 1600), {part: 'aboveground diesel tank for the apparatus'}, closed);
  hatch('paving', C.curb, rect(601200, 189200, 604500, 191500, 300), 'lines', 300, 45, {part: 'tank containment curb'}, C.struct);
  line('structure', C.struct, rect(601500, 187200, 602200, 188400, 1300), {part: 'fuel dispenser'}, closed);

  // ---- flag plaza and green between the station, the lot, the substation and the clinic
  {
    const fx = 592000, fy = 200300;
    hatch('paving', C.curb, circ(fx, fy, 3200, 30, 24), 'dots', 600, 0, {part: 'round flag plaza, stamped concrete'}, C.brick);
    line('lot', C.struct, circ(fx, fy, 3200, 150, 24), {part: 'flag plaza seat wall'}, closed);
    line('structure', C.struct, [P(fx, fy, 0), P(fx, fy, 10668)], {part: 'flagpole'});
    line('structure', C.brick, [P(fx, fy, 10300), P(fx + 1500, fy, 10300), P(fx + 1500, fy, 9300), P(fx, fy, 9300)], {part: 'flag on the halyard', anim: {type: 'sway', deg: 18, period: 3, pivot: [fx, fy, 9800]}}, closed);
    line('structure', C.struct, rect(fx - 2400, fy - 400, fx - 1600, fy + 400, 900), {part: 'retired fire bell on a stone plinth'}, closed);
    line('structure', C.yellow, circ(fx - 2000, fy, 350, 1300, 10), {part: 'brass fire bell'}, closed);
    line('paving', C.brick, wavy(fx - 3200, fy, 580000, 205800, 500, 14, 13, 30), {part: 'flagstone walk to the substation'});
    line('paving', C.brick, wavy(fx + 3200, fy, 607500, 203800, 500, 14, 19, 30), {part: 'flagstone walk to the clinic'});
    line('paving', C.brick, wavy(fx, fy + 3200, fx + 600, 205000, 200, 6, 23, 30), {part: 'flagstone walk to the lot'});
    line('paving', C.brick, wavy(fx - 2400, fy - 2200, 579050, 195600, 500, 14, 29, 30), {part: 'flagstone walk to the station kitchen door'});
    for (const [bx, by, r, sd, nm] of [[585500, 199500, 1500, 61, 'globemallow bed'], [599000, 199000, 1700, 67, 'desert marigold bed'], [604200, 196500, 1300, 71, 'penstemon bed']]) line('vegetation', C.veg2, blob(bx, by, r, 14, sd), {part: nm}, closed);
    for (const [tx, ty] of [[583000, 202500], [601500, 202500], [587500, 197500], [597000, 197000]]) tree(tx, ty, 3, 6.2 + (tx % 5) * 0.3);
    sym('activity', C.int, 'bench', P(fx - 1200, fy - 4300), 0, {part: 'bench by the fire bell'});
    sym('activity', C.int, 'bench', P(fx + 4400, fy + 1500), 1.57, {part: 'bench facing the flag'});
    say(fx - 1200, fy - 3700, 'sitting', 'eating lunch on the bench by the bell', 0);
    say(fx + 900, fy + 600, 'standing', 'raising the flag at the start of shift', Math.PI);
    const lp = circ(fx, fy, 2500, 0, 16); lp.push(lp[0]);
    sym('activity', C.person, 'person', lp[0], 0, {pose: 'walking', activity: 'walking a toddler around the flag plaza', anim: {type: 'path', speed: 700, pts: lp}});
  }

  // ---- shared lot between the substation and the clinic, driveway to Agave Street
  {
    const LX0 = 582000, LX1 = 605500, LY0 = 205200, LY1 = 224200;
    hatch('paving', C.curb, rect(LX0, LY0, LX1, LY1), 'dots', 1100, 0, {part: 'civic center lot, chip seal'}, C.struct);
    const DX0 = 591500, DX1 = 598800;
    hatch('paving', C.curb, rect(DX0, LY1, DX1, oy + S - CURB), 'dots', 1000, 0, {part: 'driveway to Agave Street'}, C.struct);
    line('paving', C.white, [P(DX0, LY1), P(DX0, oy + S - CURB)], {part: 'driveway edge, west'});
    line('paving', C.white, [P(DX1, LY1), P(DX1, oy + S - CURB)], {part: 'driveway edge, east'});
    const stalls = []; let sn = 0;
    for (const [sy, side] of [[205500, 1], [218300, -1]]) for (let sx = 582700; sx + 2743 <= 605000; sx += 2743) {
      if (side < 0 && sx + 2743 > DX0 - 300 && sx < DX1 + 300) continue;
      sn++;
      if (sn === 1 || sn === 8) { line('paving', C.car2, rect(sx, sy, sx + 2743, sy + 5486), {part: 'accessible stall', checks: [['stall_width', 2743], ['stall_depth', 5486]]}, closed); hatch('paving', C.car2, rect(sx + 300, sy + 1500, sx + 2443, sy + 4000), 'lines', 300, 45, {part: 'accessible stall symbol'}); continue; }
      line('paving', C.white, side > 0 ? [P(sx, sy + 5486), P(sx, sy), P(sx + 2743, sy), P(sx + 2743, sy + 5486)] : [P(sx, sy), P(sx, sy + 5486), P(sx + 2743, sy + 5486), P(sx + 2743, sy)], Object.assign({part: 'civic lot stall ' + sn}, sn < 8 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {}));
      stalls.push([sx + 1371, sy + 2743, side]);
    }
    const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];
    for (const [cx, cy, side] of stalls) {
      if (r2() > 0.55) continue;
      const truck = r2() < 0.4, back = r2() < 0.3;
      const rot = (side > 0 ? Math.PI : 0) + (back ? Math.PI : 0) + (r2() - 0.5) * 0.06;
      sym('vehicle', CARCOL[Math.floor(r2() * CARCOL.length)], truck ? 'truck' : 'car', P(cx + Math.round((r2() - 0.5) * 250), cy + Math.round((r2() - 0.5) * 400)), rot, {part: truck ? 'pickup in the civic lot' : 'parked car'});
    }
    sym('vehicle', C.car2, 'car', P(584071, 215000), Math.PI / 2, {part: 'patrol car parked by the substation'});
    for (let i = 0; i < 3; i++) sym('street', C.struct, 'light', P(586000 + i * 8500, 214600, 4200), 0, {part: 'lot light', anim: i === 1 ? {type: 'blink', period: 7, duty: 0.92} : undefined});
    sym('activity', C.person, 'cyclist', P(588000, 212500), 0, {activity: 'riding in to pay a water bill', anim: {type: 'path', speed: 3000, pts: [P(588000, 212500), P(603500, 212500), P(603500, 216800), P(588000, 216800), P(588000, 212500)]}});
    line('vegetation', C.veg2, wavy(LX0 + 600, LY1 + 1500, DX0 - 1500, LY1 + 1500, 500, 12, 41), {part: 'bursage strip along Agave Street'});
    line('vegetation', C.veg2, wavy(DX1 + 1500, LY1 + 1500, LX1 - 600, LY1 + 1500, 500, 12, 43), {part: 'brittlebush strip along Agave Street'});
  }
  for (let j = 0; j < 4; j++) tree(b + 400, ys + 8000 + j * 14000, 4, 7 + j * 0.3);
  line('vegetation', C.veg2, wavy(a + 2700, ys + 3000, a + 2700, 176000, 400, 8, 77), {part: 'gravel strip of creosote along Tarantula Avenue'});
  trafficLoop(7, 2, true, C.brick, 'truck', 8200);
  trafficLoop(7, 2, false, C.car2, 'car', 9000);

  // ================================================================= 0,1 Quail Run Wash Nature Hut, inside the loop trail by the dry wash
  {
    const N = 'Quail Run Wash Nature Hut', x0 = 36500, x1 = 42596, y0 = 117748, y1 = 121406;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3353, -610, true);
    hatch('structure', C.brick, vface(x0, y1, x1, y1, 0, 3353), 'brick', 300, 0, {building: N, part: 'rammed earth wall, north face'}, C.struct);
    hatch('structure', C.brick, vface(x0, y0, x1, y0, 0, 3353), 'gradient', 400, 0, {building: N, part: 'rammed earth wall, south face'}, C.yellow);
    gableX(N, x0, y0, x1, y1, 3453, C.roof, C.veg2);
    hatch('structure', C.car2, [P(x0 + 600, (y0 + y1) / 2 + 150, 3700), P(x1 - 600, (y0 + y1) / 2 + 150, 3700), P(x1 - 600, y1 - 100, 3480), P(x0 + 600, y1 - 100, 3480)], 'cross', 300, 0, {building: N, part: 'solar panels on the north slope'});
    door(N, x0 + 2600, y1, 'x', 914, 'nature hut door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 1500, y1 + 1200), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'lines', 450, 0, {building: N, part: 'saguaro rib ceiling', checks: [['ceiling_height', 2743]]});
    I(N, 'terrarium stand', C.struct, x0 + 300, y0 + 300, x0 + 1500, y0 + 900, 760);
    I(N, 'glass terrarium with a desert tortoise', C.car2, x0 + 350, y0 + 350, x0 + 1450, y0 + 850, 1250);
    I(N, 'specimen case of beetles and scorpions', C.int, x0 + 2000, y0 + 300, x0 + 3600, y0 + 800, 1067, {check: ['counter_height', 1067]});
    I(N, 'shelf of skulls and owl pellets', C.struct, x1 - 500, y0 + 600, x1 - 200, y1 - 600, 1524, {check: ['shelf_height', 1524]});
    I(N, 'touch table of rocks and seed pods', C.brick, x0 + 2400, y0 + 1500, x0 + 3900, y0 + 2300, 760);
    VB(N, 'poster of the wash food web', C.sign, x0 + 120, y0 + 800, x0 + 120, y0 + 2600, 1000, 2000);
    VB(N, 'hooks of loaner binoculars', C.struct, x0 + 4200, y1 - 120, x0 + 5200, y1 - 120, 1400, 1700);
    VB(N, 'chalkboard of birds seen this week', C.int, x0 + 400, y1 - 120, x0 + 2200, y1 - 120, 1100, 1900);
    I(N, 'battery box and inverter', C.elec, x0 + 150, y1 - 1400, x0 + 400, y1 - 700, 1400, {disc: 'electrical'});
    line('electrical', C.elec, [P(x0 + 600, y1 - 300, 2743), P(x0 + 300, y1 - 1000, 2743), P(x0 + 300, y1 - 1000, 1400)], {building: N, part: 'solar feed down from the roof'});
    sym('electrical', C.elec, 'light', P(x0 + 2000, y0 + 1800, 2743), 0, {building: N, part: 'led ceiling light'});
    sym('electrical', C.elec, 'light', P(x0 + 4400, y0 + 1800, 2743), 0, {building: N, part: 'led ceiling light over the shelf'});
    sym('electrical', C.elec, 'outlet', P(x0 + 1000, y0 + 150, 457), 0, {building: N, part: 'outlet for the terrarium heat lamp', checks: [['outlet_height', 457]]});
    sym('electrical', C.elec, 'switch', P(x0 + 3700, y1 - 150, 1219), 0, {building: N, part: 'light switch by the door'});
    IC(N, 'terrarium heat lamp', C.brick, x0 + 900, y0 + 600, 120, 1500, {anim: {type: 'blink', period: 4, duty: 0.8}});
    line('paving', C.brick, wavy(x0 + 3057, y1 + 300, x0 + 3300, 131500, 500, 12, 83, 20), {part: 'decomposed granite spur path to the nature hut'});
    line('structure', C.struct, [P(x1 + 900, y0 + 600, 0), P(x1 + 900, y0 + 600, 1200)], {part: 'rain gauge on a post'});
    line('structure', C.yellow, rect(x1 + 600, y1 - 800, x1 + 1000, y1 - 400, 1800), {part: 'hummingbird feeder on a shepherd hook'}, closed);
    say(x0 + 900, y0 + 1500, 'standing', 'watching the tortoise eat a hibiscus flower', Math.PI);
    say(x0 + 4400, y0 + 1700, 'standing', 'holding a shed snakeskin up to the light', 0);
    say(x0 + 3200, y0 - 1500, 'standing', 'counting quail with loaner binoculars', Math.PI);
    say(x1 + 1700, y1 + 1500, 'standing', 'refilling the hummingbird feeder', Math.PI);
  }
  D('0:1', 'Thrasher Grounds Shop', [62500, 90600, 68900, 98400], 3048, [
        ['o', 'outlet for the battery charger', 1067],
    ['p', 'standing', 'shaking a can of field marking paint'],
  ]);

  // ================================================================= 1,1 Hard Pan Tractor Wash Bay, east of the store in the gravel yard
  {
    const N = 'Hard Pan Tractor Wash Bay', x0 = 131500, x1 = 138815, y0 = 98500, y1 = 103986;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 5486, -610, true);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 5486), 'lines', 450, 0, {building: N, part: 'corrugated steel siding, south wall'}, C.brick);
    hatch('structure', C.struct, vface(x0, y1, x1, y1, 0, 1200), 'gradient', 300, 0, {building: N, part: 'mud splash at the base, north wall'}, C.yellow);
    shed(N, x0, y0, x1, y1, 5586, C.roof, C.struct, true);
    line('structure', C.struct, [P(x0, y0 + 800), P(x0, y0 + 800, 4572), P(x0, y0 + 4700, 4572), P(x0, y0 + 4700)], {building: N, part: 'open roll up door to the yard'});
    door(N, x0 + 5500, y0, 'x', 914, 'wash bay man door', 1);
    sym('structure', C.sign, 'sign', P(x0 - 1500, y0 - 900), 0, {text: N});
    hatch('paving', C.curb, rect(x0 - 6000, y0 + 600, x0, y0 + 4900), 'lines', 600, 0, {part: 'concrete approach to the wash bay'}, C.struct);
    I(N, 'utility tractor in the bay', C.yellow, x0 + 1500, y0 + 1700, x0 + 5300, y0 + 3300, 2400);
    IC(N, 'tractor rear tire, left', C.struct, x0 + 2200, y0 + 1500, 700, 800, {n: 12});
    IC(N, 'tractor rear tire, right', C.struct, x0 + 2200, y0 + 3500, 700, 800, {n: 12});
    I(N, 'front loader bucket', C.yellow, x0 + 5450, y0 + 1500, x0 + 6100, y0 + 3500, 600);
    line('plumbing', C.plumb, [P(x0 + 600, y0 + 2500, -150), P(x1 - 600, y0 + 2500, -150)], {building: N, part: 'trench drain across the bay'});
    I(N, 'sand and oil interceptor', C.plumb, x1 - 1600, y0 + 1900, x1 - 400, y0 + 3100, -1200, {disc: 'plumbing'});
    I(N, 'interceptor lid', C.struct, x1 - 1500, y0 + 2000, x1 - 500, y0 + 3000, 10, {disc: 'plumbing'});
    I(N, 'hot water pressure washer skid', C.brick, x1 - 1500, y1 - 1500, x1 - 300, y1 - 300, 1100);
    IC(N, 'diesel burner on the washer', C.struct, x1 - 900, y1 - 900, 250, 1500, {n: 8});
    line('interior', C.struct, [P(x0 + 3600, y0 + 2700, 4300), P(x0 + 5900, y0 + 2700, 4300)], {building: N, part: 'hose boom on a swivel', anim: {type: 'spin', rpm: 2, pivot: [x0 + 3600, y0 + 2700, 4300]}});
    IC(N, 'drum of degreaser', C.car2, x0 + 500, y1 - 600, 290, 900);
    IC(N, 'drum of tire shine', C.yellow, x0 + 1200, y1 - 600, 290, 900);
    VB(N, 'long handled wash brushes on hooks', C.struct, x0 + 2200, y1 - 120, x0 + 3800, y1 - 120, 1200, 2200);
    IC(N, 'reclaim water tank', C.plumb, x1 - 2400, y1 - 800, 500, 1800, {disc: 'plumbing'});
    VB(N, 'wall exhaust fan', C.int, x1 - 120, y0 + 3500, x1 - 120, y0 + 4300, 3800, 4600, {anim: {type: 'spin', rpm: 60}});
    I(N, 'wash bay subpanel', C.elec, x0 + 150, y1 - 1600, x0 + 400, y1 - 900, 1500, {disc: 'electrical'});
    sym('electrical', C.elec, 'outlet', P(x1 - 150, y1 - 2000, 1067), 0, {building: N, part: 'gfci outlet by the washer', checks: [['outlet_height', 1067]]});
    sym('electrical', C.elec, 'light', P(x0 + 2400, y0 + 2700, 4800), 0, {building: N, part: 'vapor tight bay light 1'});
    sym('electrical', C.elec, 'light', P(x0 + 5200, y0 + 2700, 4800), 0, {building: N, part: 'vapor tight bay light 2'});
    run('electrical', C.elec, [P(116626, 100400, 1500), P(116626, 100400, -600), P(x0 + 270, 100400, -600), P(x0 + 270, 100400, 1500), P(x0 + 270, y1 - 1250, 1500)], {building: N, part: 'feeder from the warehouse panel'});
    run('plumbing', C.plumb, [P(156096, 101000, -1219), P(x1 - 850, 101000, -900), P(x1 - 850, y1 - 900, -900), P(x1 - 850, y1 - 900, 300)], {building: N, part: 'water service from the Saguaro Avenue main'});
    line('plumbing', C.sewer, [P(x1 - 1000, y0 + 2500, -1300), P(x1 - 1000, 82848, -2134)], {building: N, part: 'interceptor outlet to the Mesquite Street sewer'});
    say(x0 + 3800, y0 + 900, 'standing', 'pressure washing caliche off a tractor', 0);
    say(x0 + 6500, y0 + 900, 'standing', 'scrubbing the loader bucket with a brush', Math.PI);
    say(x1 - 700, y0 + 3600, 'standing', 'lighting the burner on the hot washer', 0);
    say(x0 - 3500, y0 + 2700, 'standing', 'waving a muddy tractor into the bay', 0);
  }

  // ================================================================= 2,0 Pump Jack Guest Laundry, behind the motel row
  {
    const N = 'Pump Jack Guest Laundry', x0 = 193800, x1 = 200506, y0 = 50300, y1 = 55177;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 3353, -610, true);
    hatch('structure', C.yellow, vface(x0, y0, x1, y0, 0, 3353), 'lines', 300, 0, {building: N, part: 'painted stucco, south wall'}, C.brick);
    hip(N, x0, y0, x1, y1, 3453, C.brick, C.roof);
    door(N, x0 + 2800, y0, 'x', 914, 'laundry door', 1);
    sym('structure', C.sign, 'sign', P(x0 + 1200, y0 - 900), 0, {text: N});
    hatch('structure', 7, rect(x0 + 100, y0 + 100, x1 - 100, y1 - 100, 2743), 'cross', 1219, 0, {building: N, part: 'laundry ceiling grid', checks: [['ceiling_height', 2743]]});
    for (let i = 0; i < 3; i++) {
      I(N, 'front load washer ' + (i + 1), C.int, x0 + 300 + i * 900, y1 - 1000, x0 + 1000 + i * 900, y1 - 300, 950);
      I(N, 'card reader on washer ' + (i + 1), C.brick, x0 + 550 + i * 900, y1 - 350, x0 + 750 + i * 900, y1 - 300, 1100);
      I(N, 'stacked dryer ' + (i + 1), C.car2, x0 + 3300 + i * 900, y1 - 1000, x0 + 4000 + i * 900, y1 - 300, 1900);
      line('interior', C.struct, [P(x0 + 3650 + i * 900, y1 - 300, 1700), P(x0 + 3650 + i * 900, y1 + 300, 1700)], {building: N, part: 'dryer vent through the north wall ' + (i + 1)});
    }
    I(N, 'folding table', C.int, x0 + 1200, y0 + 1800, x0 + 3600, y0 + 2600, 914, {check: ['counter_height', 914]});
    I(N, 'coin and card changer', C.struct, x1 - 450, y0 + 600, x1 - 150, y0 + 1300, 1500);
    I(N, 'detergent vending machine', C.yellow, x1 - 900, y0 + 1700, x1 - 150, y0 + 2500, 1800);
    I(N, 'laundry sink', C.plumb, x1 - 900, y1 - 1000, x1 - 300, y1 - 400, 900, {disc: 'plumbing'});
    IC(N, '40 gallon water heater', C.plumb, x0 + 500, y0 + 600, 300, 1500, {disc: 'plumbing'});
    I(N, 'laundry cart of motel sheets', C.int, x0 + 4500, y0 + 400, x0 + 5600, y0 + 1100, 900);
    I(N, 'waiting chair 1', C.car, x0 + 4300, y0 + 2000, x0 + 4800, y0 + 2500, 457);
    I(N, 'waiting chair 2', C.car, x0 + 5100, y0 + 2000, x0 + 5600, y0 + 2500, 457);
    VB(N, 'bulletin board of diner menus', C.sign, x0 + 120, y0 + 1800, x0 + 120, y0 + 3200, 1100, 1900);
    I(N, 'basket of lost socks', C.brick, x0 + 1300, y0 + 400, x0 + 1800, y0 + 800, 400);
    I(N, 'laundry subpanel', C.elec, x1 - 250, y0 + 2900, x1 - 120, y0 + 3600, 1500, {disc: 'electrical'});
    for (const [ox2, oz] of [[x0 + 1500, 1067], [x0 + 4800, 1067]]) sym('electrical', C.elec, 'outlet', P(ox2, y1 - 150, oz), 0, {building: N, part: 'outlet behind the machines', checks: [['outlet_height', oz]]});
    sym('electrical', C.elec, 'light', P(x0 + 2000, y0 + 2400, 2743), 0, {building: N, part: 'laundry light 1'});
    sym('electrical', C.elec, 'light', P(x0 + 4800, y0 + 3400, 2743), 0, {building: N, part: 'laundry light 2'});
    IC(N, 'laundry ceiling fan', C.int, x0 + 3300, y0 + 3500, 500, 2600, {anim: {type: 'spin', rpm: 50}});
    const lp1 = [215000, 48500], lp2 = [202600, 51800];
    for (const p of [lp1, lp2]) sym('electrical', C.struct, 'pole', P(...p), 0, {part: 'motor court service pole'});
    line('electrical', C.elec, [P(231358, 39624, 6100), P(lp1[0], lp1[1], 6400), P(lp2[0], lp2[1], 6400)], {part: 'secondary span to the laundry'});
    run('electrical', C.elec, [P(lp2[0], lp2[1], 6400), P(x1 + 300, y0 + 3200, 4000), P(x1 + 300, y0 + 3200, 1500), P(x1 - 250, y0 + 3200, 1500)], {building: N, part: 'service drop to the laundry'});
    run('plumbing', C.plumb, [P(235344, 53500, -1219), P(x1 - 600, 53500, -900), P(x1 - 600, 53500, 300)], {building: N, part: 'water service from the Yucca Avenue main'});
    run('plumbing', C.sewer, [P(x1 - 600, y1 - 700, -300), P(x1 - 600, 57500, -900), P(234144, 57500, -2134)], {building: N, part: 'laundry drain to the Yucca Avenue sewer'});
    line('structure', C.struct, [P(190000, 52000, 0), P(190000, 52000, 1900), P(192500, 52000, 1900), P(192500, 52000, 0)], {part: 'clothesline of drying bath rugs'});
    say(x0 + 2400, y0 + 3300, 'standing', 'folding warm towels from the dryer', Math.PI);
    say(x0 + 1650, y1 - 1400, 'standing', 'tapping a card to start a washer', 0);
    say(x0 + 4550, y0 + 2900, 'sitting', 'waiting on the spin cycle with a paperback', Math.PI);
    say(191200, 51200, 'standing', 'pinning a bath rug on the clothesline', 0);
    sym('activity', C.person, 'person', P(196000, 49200), 0, {pose: 'walking', activity: 'pushing a cart of fresh sheets to the rooms', anim: {type: 'path', speed: 900, pts: [P(196000, 49200), P(206000, 49200), P(206000, 48400), P(196000, 48400), P(196000, 49200)]}});
  }
  D('2:0', 'Pump Jack Office', [170640, 18144, 177955, 24240], 3048, [
    ['w', 'rack of road maps for sale', C.yellow, 600, 900, 1500],
    ['o', 'outlet for the key card encoder', 1067],
    ['p', 'standing', 'asking for a late checkout'],
  ]);

  if (missing) console.log('MISSING ' + missing);
}
