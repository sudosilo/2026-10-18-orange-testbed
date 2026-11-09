// Agent Orange 2026-11-09 b: break up the look of the templated shop blocks.
// Every block built from the shell() template got the same purple ceiling grids, flat tops and the same parked cars.
// Per block, seeded by its chunk: real roofs (gable either way, shed either way, low hip, gravel flat, barrel on barns)
// in a block-specific color set, an apartment second story over one shop on some blocks, a lighter ceiling grid,
// and the parked cars cleared and re-parked at random stalls, some backed in.
export default function (k) {
  const {C, P, line, sym, hatch, rect, arc, vface, push, W} = k;
  const closed = {closed: true};
  const BLOCKS = ['2:4', '3:4', '4:4', '5:2', '5:3', '5:4', '6:2', '6:3', '6:4', '7:3', '7:4'];
  const recsIn = (key) => { const c = [...W.chunks.values()].find(c => c.k === key); return c ? c.records.filter(r => !r.hidden && r.agent === 'agent-orange') : []; };
  const remove = (id) => push('remove', {id});
  const ROOFCOL = [[C.brick, C.struct], [11, C.struct], [5, 7], [8, C.struct], [10, 7], [9, C.brick], [2, 8], [7, 0], [1, 11], [4, 9], [6, 7]];
  const CARCOL = [1, 10, 11, 9, 7, 5, 2, 0, 4, 8];

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

  for (const key of BLOCKS) {
    const [cx, cy] = key.split(':').map(Number);
    let seed = 7919 * (cx * 31 + cy * 17 + 5); const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const recs = recsIn(key);
    const [col, col2] = ROOFCOL[BLOCKS.indexOf(key)];

    // ---- buildings: first closed wall per name gives box and height
    const bld = new Map();
    for (const r of recs) { const m = r.meta || {}; if (r.kind === 'line' && m.wall && r.closed && m.building && !bld.has(m.building) && (m.zmin || 0) <= 0) { const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]); bld.set(m.building, {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), h: m.h || 3048}); } }
    // skip anything that already has a roof drawn by an earlier turn of ours
    const roofed = new Set(recs.filter(r => r.meta && /roof slope|flat roof|barrel roof|shed roof/.test(r.meta.part || '')).map(r => r.meta.building));

    // ---- lighter ceiling grid replaces the purple one
    for (const r of recs) {
      const m = r.meta || {};
      if (r.kind === 'hatch' && m.part === 'ceiling grid' && r.color === C.int && r.spacing === 650) {
        remove(r.id);
        hatch('structure', 7, r.pts, 'cross', 1219, 0, {building: m.building, part: 'ceiling grid, 2 by 4 lay in tile', checks: m.checks || []});
      }
    }

    // ---- roofs, and one upstairs apartment on some blocks
    const names = [...bld.keys()].filter(n => !roofed.has(n));
    const frontY = Math.min(...[...bld.values()].map(b => b.y0));
    const front = names.filter(n => bld.get(n).y0 === frontY);
    const upstairs = rnd() < 0.6 && front.length ? pick(front) : null;
    for (const N of names) {
      const b = bld.get(N), w = b.x1 - b.x0, d = b.y1 - b.y0, z = b.h + 100;
      const isBarn = b.h >= 5400 || (b.y0 !== frontY && rnd() < 0.5);
      if (N === upstairs) {
        const ux0 = b.x0 + 1200, ux1 = b.x1 - 1200, uy0 = b.y0 + 900, uy1 = b.y0 + Math.min(d - 2000, 8500), uh = b.h + 3200;
        gravel(N, b.x0, b.y0, b.x1, b.y1, z, 7, C.struct);
        line('structure', C.struct, [P(ux0, uy0, b.h), P(ux1, uy0, b.h), P(ux1, uy1, b.h), P(ux0, uy1, b.h)], {wall: true, h: uh, zmin: b.h, building: N, units: 1, part: 'upstairs apartment over the shop'}, closed);
        hatch('structure', col2, vface(ux0, uy0, ux1, uy0, b.h, uh), 'lines', 300, 90, {building: N, part: 'upstairs stucco, south face'}, col);
        for (let wx = ux0 + 1200; wx + 1200 < ux1 - 600; wx += 2600) line('structure', 0, [P(wx, uy0 - 20, b.h + 900), P(wx + 1200, uy0 - 20, b.h + 900), P(wx + 1200, uy0 - 20, b.h + 2300), P(wx, uy0 - 20, b.h + 2300)], {building: N, part: 'upstairs window'}, closed);
        sym('activity', C.person, 'person', P(ux0 + 1800, uy0 - 450, b.h), 0, {activity: 'watering a potted geranium on the roof deck', pose: 'standing'});
        (rnd() < 0.5 ? gableX : hip)(N, ux0, uy0, ux1, uy1, uh + 100, col, col2);
        continue;
      }
      if (isBarn) { if (rnd() < 0.55) barrel(N, b.x0, b.y0, b.x1, b.y1, z, col, col2); else (w > d ? gableX : gableY)(N, b.x0, b.y0, b.x1, b.y1, z, col, col2); continue; }
      const t = pick(['gx', 'gy', 'sn', 'ss', 'hip', 'flat']);
      if (t === 'gx') gableX(N, b.x0, b.y0, b.x1, b.y1, z, col, col2);
      else if (t === 'gy') gableY(N, b.x0, b.y0, b.x1, b.y1, z, col, col2);
      else if (t === 'sn' || t === 'ss') shed(N, b.x0, b.y0, b.x1, b.y1, z, col, col2, t === 'sn');
      else if (t === 'hip') hip(N, b.x0, b.y0, b.x1, b.y1, z, col, col2);
      else gravel(N, b.x0, b.y0, b.x1, b.y1, z, rnd() < 0.5 ? 7 : col, col2);
    }

    // ---- re-park the front lot
    for (const r of recs) if (r.kind === 'symbol' && r.discipline === 'vehicle' && /^(parked car|ranch pickup)$/.test((r.meta || {}).part || '')) remove(r.id);
    const stalls = recs.filter(r => r.kind === 'line' && /^front stall \d+$/.test((r.meta || {}).part || ''));
    const fill = 0.35 + rnd() * 0.45;
    for (const s of stalls) {
      if (rnd() > fill) continue;
      const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
      const sx = (Math.min(...xs) + Math.max(...xs)) / 2 + Math.round((rnd() - 0.5) * 300), sy = (Math.min(...ys) + Math.max(...ys)) / 2 + Math.round((rnd() - 0.5) * 400);
      const truck = rnd() < 0.3, back = rnd() < 0.3;
      sym('vehicle', pick(CARCOL), truck ? 'truck' : 'car', P(sx, sy), (back ? Math.PI : 0) + (rnd() - 0.5) * 0.06, {part: truck ? (back ? 'pickup backed into the stall' : 'work pickup') : (back ? 'car backed into the stall' : 'parked car')});
    }
  }
}
