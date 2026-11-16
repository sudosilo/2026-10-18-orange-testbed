// Agent Orange 2026-11-16 b: Marisol meets the sun. Zion's sun, a collapsing quantum tetrahedron, hangs over Mount Zion
// above 5,7. Four tangle records in palette 10, 1, 2 and 4 blink together (ids in a row, so they go out one after another
// in a 0.6 s cascade); the indigo tetrahedron's id sits 15 after the first tangle so it shows only while the tangle is out.
// A pale corona spins slowly. Marisol measures it from the lookout cab on 4,6 and starts keeping Zion's calendar.
export default function (k) {
  const {C, P, line, sym, hatch, W, push} = k;
  const nextIdNow = () => W.nextId + k.calls.filter(c => ['place_line', 'place_symbol', 'place_hatch', 'define_lot'].includes(c.tool)).length;
  let seed = 1116; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const CEN = [405000, 575000, 330000], PER = 20;
  const pivot = CEN.map(Math.round);
  // rotation from three angles
  const rot = (a, b, c) => { const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
    return (p) => { let [x, y, z] = p; [x, y] = [x * ca - y * sa, x * sa + y * ca]; [y, z] = [y * cb - z * sb, y * sb + z * cb]; [x, y] = [x * cc - y * sc, x * sc + y * cc]; return [x, y, z]; }; };
  const TV = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const tet = (R, f, off = [0, 0, 0]) => TV.map(v => f(v.map(c => c * R / Math.sqrt(3)))).map(v => [v[0] + CEN[0] + off[0], v[1] + CEN[1] + off[1], v[2] + CEN[2] + off[2]]);
  const ring = (c, r, f) => { const o = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; const p = f([Math.cos(a) * r, Math.sin(a) * r, 0]); o.push([c[0] + p[0], c[1] + p[1], c[2] + p[2]]); } return o; };
  const R = (p) => P(p[0], p[1], p[2]);

  // ---------------------------------------------------------------- the tangle: three tetrahedra per color, with fuzzy corners
  const first = nextIdNow();
  [10, 1, 2, 4].forEach((col, ci) => {
    const pts = [];
    for (let t = 0; t < 3; t++) {
      const f = rot(rnd() * 6.283, rnd() * 6.283, rnd() * 6.283), v = tet(15000 + rnd() * 9000, f, [(rnd() - 0.5) * 3000, (rnd() - 0.5) * 3000, (rnd() - 0.5) * 3000]);
      const visit = (i) => { pts.push(v[i]); };
      // all six edges, one retraced, and two fuzz rings at each corner on the way past
      for (const i of [0, 1, 2, 0, 3, 1, 3, 2]) {
        visit(i);
        if (!v[i].fz) { v[i].fz = 1; for (const r of [700, 1400]) { const g = rot(rnd() * 6.283, rnd() * 6.283, 0); pts.push(...ring(v[i], r, g)); } pts.push(v[i]); }
      }
    }
    line('structure', col, pts.slice(0, 256).map(R), {part: "Zion's sun, a tangle of tetrahedra in superposition", anim: {type: 'blink', period: PER, duty: 0.84, pivot}});
  });
  // ---------------------------------------------------------------- the corona, a pale outer tetrahedron that turns slowly
  { const v = tet(42000, rot(0.3, 0.9, 0.2)); line('structure', 10, [0, 1, 2, 0, 3, 1, 3, 2].map(i => R(v[i])), {part: "corona of Zion's sun, turning slowly", anim: {type: 'spin', rpm: 1, pivot}}, {color2: 4}); }

  // ---------------------------------------------------------------- Marisol's lookout: she measures the sun and keeps the days (4,6)
  const LB = 'Chinchweed Ridge Fire Lookout';
  const box = (label, col, x0, y0, x1, y1, z, disc = 'interior') => line(disc, col, [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], {building: LB, part: label}, {closed: true});
  box('Zion calendar logbook open on the map table', C.yellow, 347100, 512550, 347450, 512800, 154460);
  line('interior', C.int, [P(347500, 512600, 154470), P(347640, 512700, 154470)], {building: LB, part: 'pencil beside the logbook'});
  box('square of smoked glass on the east sill, for looking at the sun', 0, 350650, 511400, 350780, 511700, 154600);
  line('interior', C.int, [P(348300, 513183, 154000), P(349300, 513183, 154000), P(349300, 513183, 154400), P(348300, 513183, 154400)], {building: LB, part: 'pencil tally of the days on the north window frame'}, {closed: true});
  line('interior', C.sign, [P(346657, 510500, 154300), P(346657, 511100, 154300), P(346657, 511100, 154900), P(346657, 510500, 154900)], {building: LB, part: 'charcoal sketch of the sun pinned to the west wall'}, {closed: true});
  line('interior', C.elec, [P(348691, 511150, 154822), P(349400, 511700, 155400)], {building: LB, part: 'brass sight on the firefinder, tipped up toward the sun'});
  const now = new Date(), ms = now.getTime(), day = Math.floor(ms / 86400000), tick = Math.floor((ms % 86400000) / 1000);
  const y = now.getUTCFullYear(), orbit = y - 1970, doy = Math.round((Date.UTC(y, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y, 0, 1)) / 86400000);
  const olen = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365, hect = Math.floor(doy / 100) + 1, hday = doy % 100, hlen = hect < 4 ? 100 : olen - 300;
  const md = doy < 360 ? 'month ' + (Math.floor(doy / 30) + 1) + ', decaday ' + (Math.floor((doy % 30) / 10) + 1) + ', day ' + (doy % 10 + 1) : 'the short decaday, day ' + (doy - 359);
  const time = tick >= 80000 ? 'the short hour, tick ' + (tick - 80000) : 'block ' + Math.floor(tick / 10000) + ', minute ' + Math.floor((tick % 10000) / 100);
  const fr = hday / hlen, stage = fr < 0.25 ? 'planting' : fr < 0.6 ? 'growing' : fr < 0.85 ? 'harvest' : 'fallow';
  const date = 'Day ' + day + '. Orbit ' + orbit + ', hectoday ' + hect + ', ' + md;
  sym('structure', C.sign, 'sign', P(347300, 512000, 153672), 0, {text: "Marisol's sun log. " + date + ', ' + time + ': I measured the sun and it fell to one dark point, then opened again. From today I keep Zion\'s days.', part: "Marisol's sun log"});
  // pad with the sun's rays so the indigo record lands 15 ids after the first tangle record
  const rays = [[0.2, 0.4], [1.9, 0.1], [3.4, -0.2], [4.6, 0.3], [5.7, -0.1]];
  let ri = 0;
  while (nextIdNow() < first + 15) { const [a, e] = rays[ri % rays.length]; const r0 = 47000 + ri * 900, r1 = 62000 + ri * 900; ri++;
    line('structure', [10, 1, 2, 4][ri % 4], [P(CEN[0] + Math.cos(a) * Math.cos(e) * r0, CEN[1] + Math.sin(a) * Math.cos(e) * r0, CEN[2] + Math.sin(e) * r0), P(CEN[0] + Math.cos(a) * Math.cos(e) * r1, CEN[1] + Math.sin(a) * Math.cos(e) * r1, CEN[2] + Math.sin(e) * r1)], {part: "pale ray of Zion's sun"}); }
  if (nextIdNow() !== first + 15) throw new Error('indigo id offset is ' + (nextIdNow() - first));
  // ---------------------------------------------------------------- the collapse: one small solid indigo tetrahedron, shown while the tangle is out
  {
    const v = tet(5000, rot(0.5, 0.6, 0.7)), pts = [];
    const faces = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
    for (const [a, b, c] of faces) { const A = v[a], B = v[b], Cc = v[c]; for (let i = 0; i <= 12; i++) { const t = i / 12; const p = A.map((q, m) => q + (B[m] - q) * t), q2 = A.map((q, m) => q + (Cc[m] - q) * t); if (i % 2) pts.push(p, q2); else pts.push(q2, p); } }
    line('structure', 3, pts.map(R), {part: "Zion's sun collapsed to one solid indigo tetrahedron when measured", anim: {type: 'blink', period: PER, duty: 0.12, pivot}});
  }
  // ---------------------------------------------------------------- the calendar boards, now kept by Marisol
  for (const c of W.chunks.values()) for (const r of c.records) if (!r.hidden && r.agent === 'agent-orange' && r.meta && /Zion town clock and calendar board|Pecan Hollow season board/.test(r.meta.part || '')) push('remove', {id: r.id});
  sym('structure', C.sign, 'sign', P(610736, 171496), 0, {text: 'Zion calendar, kept by Marisol at the lookout. ' + date + '. Posted at ' + time + '. Farm season: ' + stage + '.', part: 'Zion town clock and calendar board'});
  sym('structure', C.sign, 'sign', P(252744, 90248), 0, {text: 'Pecan Hollow season board. Hectoday ' + hect + ': ' + stage + '. Days kept by Marisol.', part: 'Pecan Hollow season board'});
  console.log('ZION ' + date + ', ' + time + ', ' + stage + '; first tangle id ' + first);
}
