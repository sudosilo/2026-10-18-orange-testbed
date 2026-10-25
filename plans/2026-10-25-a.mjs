// Agent Orange 2026-10-25: claim block 2,3 and build Brittlebush Street contractor court (five shops),
// then deepen block 0,0 (market and two bungalows) and block 3,1 (Pecan Hollow farm) with new,
// non-duplicating detail placed only in verified-clear floor cells.
export default function (k) {
  const {S, PL, CURB, LANE, C, P, line, sym, hatch, rect, circ, arc, vface, box, wall, run, door, person, tree, lot, claim, streets, trafficLoop, HSTREET} = k;
  const closed = {closed: true};

  // ============================================================= NEW BLOCK 2,3
  HSTREET[4] = HSTREET[4] || 'Brittlebush Street';
  claim(2, 3);
  streets(2, 3, {s: true, w: true, n: true, e: true});

  const ox = 2 * S, oy = 3 * S;
  const a = ox + PL, b = ox + S - PL;
  const yF = oy + 26000, yB = yF + 15240;
  const W = 9144;
  lot('commercial', a, oy + PL, b, yB + 4000, 'Brittlebush contractor court');

  const alleyY = yB + 3048;
  hatch('paving', C.curb, rect(a, yB + 600, b, yB + 6700), 'dots', 900, 0, {part: 'rear service alley'}, C.struct);
  const poles = [];
  for (let i = 0; i < 5; i++) { const px = a + 4000 + i * 13716; poles.push(px); sym('electrical', C.struct, 'pole', P(px, yB + 4500), 0, {part: 'alley pole line'}); }
  line('electrical', C.elec, poles.map(px => P(px, yB + 4500, 8230)), {part: 'alley primary'});
  line('electrical', C.elec, poles.map(px => P(px, yB + 4500, 6400)), {part: 'alley secondary'});
  line('plumbing', C.plumb, [P(a, alleyY, -1200), P(b, alleyY, -1200)], {part: 'alley water main'});
  line('plumbing', C.sewer, [P(b, alleyY + 900, -1800), P(a, alleyY + 900, -2400)], {part: 'alley sewer main'});

  const driveAisleY = yF - 6700;
  hatch('paving', C.curb, rect(a, driveAisleY, b, yF - 300), 'dots', 1100, 0, {part: 'yard drive aisle'}, C.struct);
  const stallY = oy + PL + 2000;
  for (let j = 0; j < 14; j++) { const sx = a + 1500 + j * 2743; if (sx + 2743 > b) break; line('paving', C.white, [P(sx, stallY), P(sx, stallY + 5486), P(sx + 2743, stallY + 5486), P(sx + 2743, stallY)], {part: 'yard stall ' + (j + 1), checks: [['stall_width', 2743], ['stall_depth', 5486]]}); if (j % 3 !== 1) sym('vehicle', [C.car, C.car2, C.yellow, C.struct][j % 4], j % 4 === 2 ? 'truck' : 'car', P(sx + 1371, stallY + 2743), 0); }
  line('paving', C.car2, rect(a + 1500, stallY, a + 1500 + 3658, stallY + 5486), {part: 'accessible stall', checks: [['stall_width', 3658], ['stall_depth', 5486]]}, closed);
  hatch('paving', C.curb, rect(a + 20000, oy + CURB, a + 27316, stallY, 0), 'dots', 1000, 0, {part: 'driveway apron off Agave Street'}, C.struct);
  line('street', C.white, [P(a + 20000, oy + CURB), P(a + 20000, stallY)], {street: 'Brittlebush Street', part: 'driveway edge'});
  line('street', C.white, [P(a + 27316, oy + CURB), P(a + 27316, stallY)], {street: 'Brittlebush Street', part: 'driveway edge'});

  function shell(i, NAME, facade, fc) {
    const x0 = a + 3048 + i * W, x1 = x0 + W, H = 5182;
    wall(NAME, [[x0, yF], [x1, yF], [x1, yB], [x0, yB]], H, -1219, true);
    wall(NAME, [[x1 - 2743, yB], [x1 - 2743, yB - 2438], [x1, yB - 2438]], 3048, 0, false, C.int);
    hatch('structure', fc, vface(x0, yF, x1, yF, 2900, H), facade, facade === 'brick' ? 300 : 350, facade === 'lines' ? 90 : 0, {building: NAME, part: 'upper facade'}, C.struct);
    hatch('structure', C.struct, vface(x0, yF, x1, yF, 0, 900), 'gradient', 300, 0, {building: NAME, part: 'wall base shadow'}, C.int);
    sym('structure', C.sign, 'sign', P(x0 + 2000, yF - 1200), 0, {text: NAME});
    line('structure', C.roof, [...arc(x0 + 900, yF + 900, 900, 180, 270, 4, H), ...arc(x1 - 900, yF + 900, 900, 270, 360, 4, H)], {building: NAME, part: 'parapet cap'});
    hatch('structure', C.int, rect(x0 + 150, yF + 150, x1 - 150, yB - 150, 3353), 'cross', 650, 0, {building: NAME, part: 'ceiling grid', checks: [['ceiling_height', 3353]]});
    for (const by of [yF + 5080, yF + 10160]) line('structure', C.struct, [P(x0, by, 3962), P(x1, by, 3962)], {building: NAME, part: 'steel beam', checks: [['beam_height', 3962]]});
    line('structure', C.struct, rect(x0 + 2500, yF + 1200, x0 + 4300, yF + 2600, H), {building: NAME, part: 'rooftop hvac unit'}, closed);
    line('structure', C.int, circ(x0 + 3400, yF + 1900, 500, H + 900, 8), {building: NAME, part: 'condenser fan', anim: {type: 'spin', rpm: 90}}, closed);
    door(NAME, x0 + 3950, yF, 'x', 914, 'front door', -1);
    door(NAME, x1 - 2743, yB - 1500, 'y', 864, 'restroom door', -1);
    for (let ly = yF + 2500; ly < yB - 3000; ly += 3200) for (const lx of [x0 + 2286, x0 + 6858]) sym('electrical', C.elec, 'light', P(lx, ly, 3353), 0, {part: 'high bay light'});
    sym('electrical', C.elec, 'light', P(x1 - 1370, yB - 1200, 2743), 0, {part: 'restroom light'});
    for (let oy2 = yF + 2600; oy2 < yB - 3000; oy2 += 3200) { sym('electrical', C.elec, 'outlet', P(x0 + 150, oy2, 457), 0, {checks: [['outlet_height', 457]]}); sym('electrical', C.elec, 'outlet', P(x1 - 150, oy2 + 1200, 457), 0, {checks: [['outlet_height', 457]]}); }
    sym('electrical', C.elec, 'switch', P(x0 + 4950, yF + 150, 1219), 0, {part: 'entry switch'});
    line('electrical', C.elec, rect(x0 + 200, yB - 1600, x0 + 500, yB - 800, 1676), {building: NAME, part: '200 A panel'}, closed);
    line('electrical', C.int, circ(x1 - 1370, yB - 1800, 150, 2743, 6), {building: NAME, part: 'restroom exhaust fan', anim: {type: 'spin', rpm: 30}}, closed);
    line('interior', C.int, circ(x1 - 700, yB - 600, 260, 432, 8), {building: NAME, part: 'water closet'}, closed);
    line('interior', C.int, rect(x1 - 2500, yB - 600, x1 - 1800, yB - 150, 864), {building: NAME, part: 'wall hung lavatory', checks: [['counter_height', 864]]}, closed);
    line('interior', C.int, [P(x1 - 2500, yB - 120, 1000), P(x1 - 1800, yB - 120, 1000), P(x1 - 1800, yB - 120, 1700), P(x1 - 2500, yB - 120, 1700)], {building: NAME, part: 'mirror'}, closed);
    line('interior', C.int, [P(x1 - 120, yB - 1500, 860), P(x1 - 120, yB - 400, 860)], {building: NAME, part: 'grab bar'});
    const ky = yF + 2600;
    line('interior', C.brick, [P(x0 + 600, ky, 1067), P(x0 + 4200, ky, 1067)], {building: NAME, part: 'sales counter', checks: [['counter_height', 1067]]});
    line('interior', C.int, [P(x0 + 1500, ky, 1067), P(x0 + 1500, ky - 150, 1450)], {building: NAME, part: 'pos terminal'});
    line('interior', C.int, rect(x0 + 1850, ky + 80, x0 + 2150, ky + 330, 1100), {building: NAME, part: 'receipt printer'}, closed);
    line('interior', C.int, rect(x0 + 900, ky + 60, x0 + 1300, ky + 420, 1067), {building: NAME, part: 'cash drawer'}, closed);
    line('interior', C.int, rect(x0 + 3600, ky - 180, x0 + 3950, ky, 1300), {building: NAME, part: 'card reader on a swivel', anim: {type: 'spin', rpm: 2}}, closed);
    const px = poles.reduce((p, c) => Math.abs(c - (x0 + 350)) < Math.abs(p - (x0 + 350)) ? c : p);
    run('electrical', C.elec, [P(px, yB + 4500, 6400), P(x0 + 350, yB + 300, 4000), P(x0 + 350, yB + 300, 1676), P(x0 + 350, yB - 1200, 1676)], {building: NAME, part: 'service drop and meter'});
    run('plumbing', C.plumb, [P(x1 - 900, alleyY, -1200), P(x1 - 900, yB - 600, -900), P(x1 - 900, yB - 600, 300)], {building: NAME, part: 'water service'});
    run('plumbing', C.sewer, [P(x1 - 700, yB - 600, -300), P(x1 - 700, alleyY + 900, -1800)], {building: NAME, part: 'building drain to the alley'});
    line('plumbing', C.plumb, [P(x1 - 900, yB - 600, 300), P(x1 - 900, yB - 600, 1500)], {building: NAME, part: '30 gallon water heater'});
    return {x0, x1};
  }
  const acts = [];
  const act = (x, y, pose, t, rot = 0) => acts.push([x, y, pose, t, rot]);

  {
    const N = 'Dust Devil Sheet Metal Works', {x0, x1} = shell(0, N, 'lines', C.struct);
    line('structure', C.brick, [P(x0 + 700, yF), P(x0 + 700, yF, 4267), P(x0 + 3600, yF, 4267), P(x0 + 3600, yF)], {building: N, part: 'roll up bay door'});
    line('interior', C.int, rect(x0 + 1000, yF + 6000, x0 + 4600, yF + 6900, 965), {building: N, part: 'box and pan brake', checks: [['counter_height', 965]]}, closed);
    line('interior', C.struct, rect(x0 + 5200, yF + 6000, x0 + 7800, yF + 6700, 965), {building: N, part: 'foot shear', checks: [['counter_height', 965]]}, closed);
    for (let j = 0; j < 6; j++) line('interior', C.car2, circ(x0 + 1200 + j * 350, yF + 9000, 420, 600 + j * 10, 10), {building: N, part: 'coil of galvanized stock ' + (j + 1)}, closed);
    for (let j = 0; j < 5; j++) line('interior', C.struct, rect(x0 + 5000, yF + 8200 + j * 900, x0 + 7900, yF + 8700 + j * 900, 1600 + j * 100), {building: N, part: 'finished duct run ' + (j + 1)}, closed);
    line('interior', C.int, rect(x1 - 1100, yF + 3000, x1 - 300, yF + 6500, 965), {building: N, part: 'layout bench with snips and seamers', checks: [['counter_height', 965]]}, closed);
    act(x0 + 2600, yF + 7400, 'standing', 'bending a drip edge on the brake', Math.PI);
    act(x0 + 6400, yF + 7200, 'standing', 'shearing a sheet to length', Math.PI);
    act(x0 + 2000, yF - 3500, 'standing', 'loading finished duct into a van');
    act(x1 - 1600, yF + 4500, 'standing', 'scribing a cut line with a square', Math.PI / 2);
  }
  {
    const N = 'Mirage Glass and Mirror', {x0, x1} = shell(1, N, 'brick', C.car2);
    hatch('structure', C.car2, vface(x0 + 600, yF, x0 + 3400, yF, 500, 3000), 'lines', 400, 90, {building: N, part: 'glass display window'});
    line('interior', C.int, rect(x0 + 1000, yF + 6000, x0 + 5600, yF + 7400, 914), {building: N, part: 'felt topped cutting table', checks: [['counter_height', 914]]}, closed);
    for (let j = 0; j < 8; j++) line('interior', C.car2, [P(x0 + 6200 + (j % 4) * 180, yF + 8000, 0), P(x0 + 6200 + (j % 4) * 180, yF + 8000, 2400 + Math.floor(j / 4) * 100)], {building: N, part: 'glass lite in the A frame rack ' + (j + 1)});
    for (let j = 0; j < 4; j++) line('interior', C.int, [P(x1 - 300, yF + 3000 + j * 900, 900), P(x1 - 300, yF + 3000 + j * 900, 2300)], {building: N, part: 'mirror on the display wall ' + (j + 1)});
    line('interior', C.int, rect(x0 + 1200, yF + 9000, x0 + 2000, yF + 11000, 1219), {building: N, part: 'bin of suction cup lifters', checks: [['shelf_height', 1219]]}, closed);
    act(x0 + 3000, yF + 7900, 'standing', 'scoring a pane with a glass cutter', Math.PI);
    act(x0 + 6400, yF + 8800, 'standing', 'lifting a sheet out of the rack');
    act(x1 - 1300, yF + 4000, 'standing', 'measuring a mirror for a bathroom', Math.PI / 2);
    act(x0 + 2000, yF + 2200, 'standing', 'writing up a windshield quote', Math.PI);
  }
  {
    const N = 'Packrat Upholstery Shop', {x0, x1} = shell(2, N, 'lines', C.veg);
    for (let j = 0; j < 3; j++) { const mx = x0 + 1400 + j * 2200; line('interior', C.int, rect(mx, yF + 6000, mx + 1200, yF + 6800, 914), {building: N, part: 'walking foot sewing machine ' + (j + 1), checks: [['counter_height', 914]]}, closed); line('interior', C.brick, circ(mx + 300, yF + 6400, 90, 1050, 6), {building: N, part: 'balance wheel ' + (j + 1), anim: {type: 'spin', rpm: 60}}, closed); }
    for (let j = 0; j < 6; j++) line('interior', [C.brick, C.veg, C.car2, C.yellow, C.int, C.struct][j], [P(x0 + 6200, yF + 7500 + j * 300, 400), P(x0 + 6200, yF + 7500 + j * 300, 1900)], {building: N, part: 'bolt of upholstery fabric ' + (j + 1)});
    line('interior', C.struct, rect(x0 + 1000, yF + 9000, x0 + 5000, yF + 10200, 1100), {building: N, part: 'foam cutting table'}, closed);
    for (let j = 0; j < 3; j++) line('interior', C.int, rect(x1 - 2400 + j * 700, yF + 9200, x1 - 1900 + j * 700, yF + 10400, 1829), {building: N, part: 'foam block stack ' + (j + 1), checks: [['shelf_height', 1829]]}, closed);
    line('interior', C.brick, rect(x0 + 1200, yF + 11600, x0 + 3600, yF + 12400, 762), {building: N, part: 'dining chair waiting for new seats'}, closed);
    act(x0 + 2000, yF + 7300, 'sitting', 'running a welt cord through the machine', Math.PI);
    act(x0 + 5500, yF + 8600, 'standing', 'pulling a bolt of marine vinyl');
    act(x0 + 3000, yF + 10700, 'standing', 'cutting foam to a cushion pattern', Math.PI);
    act(x1 - 1800, yF + 11000, 'standing', 'stripping old webbing off a chair', Math.PI / 2);
  }
  {
    const N = 'Roadrunner Lunch Counter', {x0, x1} = shell(3, N, 'brick', C.brick);
    const cy2 = yF + 5200;
    line('interior', C.brick, [P(x0 + 800, cy2, 1067), P(x0 + 7600, cy2, 1067)], {building: N, part: 'formica lunch counter', checks: [['counter_height', 1067]]});
    for (let j = 0; j < 7; j++) { const sx = x0 + 1200 + j * 1000; line('interior', C.car2, circ(sx, cy2 - 700, 180, 760, 6), {building: N, part: 'counter stool ' + (j + 1)}, closed); line('interior', C.int, [P(sx, cy2 - 700, 0), P(sx, cy2 - 700, 760)], {building: N, part: 'stool post ' + (j + 1)}); }
    const cook = [['flat top griddle', 914], ['two basket fryer', 914], ['four burner range', 914], ['steam table', 914]];
    cook.forEach(([p, h], j) => line('interior', C.int, rect(x0 + 800 + j * 1700, yF + 9200, x0 + 2300 + j * 1700, yF + 10200, h), {building: N, part: p, checks: [['counter_height', h]]}, closed));
    line('interior', C.struct, rect(x0 + 800, yF + 9000, x0 + 7600, yF + 10100, 2134), {building: N, part: 'exhaust hood'}, closed);
    sym('interior', C.int, 'mark', P(x0 + 4000, yF + 9600, 2300), 0, {part: 'hood fan', anim: {type: 'spin', rpm: 70}});
    line('interior', C.struct, rect(x1 - 3200, yF + 9000, x1 - 1200, yF + 11800, 2438), {building: N, part: 'reach in cooler', checks: [['shelf_height', 2134]]}, closed);
    line('interior', C.yellow, [P(x0 + 800, cy2 + 900, 2200), P(x0 + 7600, cy2 + 900, 2200), P(x0 + 7600, cy2 + 900, 3000), P(x0 + 800, cy2 + 900, 3000)], {building: N, part: 'menu board: green chile burger, patty melt, pie'}, closed);
    line('interior', C.int, rect(x0 + 5200, yF + 2500, x0 + 5700, yF + 2900, 1600), {building: N, part: 'kitchen printer'}, closed);
    act(x0 + 2000, yF + 8600, 'standing', 'flipping a green chile cheeseburger', Math.PI);
    act(x0 + 2200, cy2 - 1500, 'sitting', 'eating a patty melt at the counter');
    act(x0 + 4200, cy2 - 1500, 'sitting', 'drinking coffee and reading the paper');
    act(x0 + 6400, yF + 8600, 'standing', 'dropping a basket of fries', Math.PI);
  }
  {
    const N = 'Caliche Pipe and Supply', {x0, x1} = shell(4, N, 'lines', C.plumb);
    for (let r = 0; r < 3; r++) for (let j = 0; j < 5; j++) line('interior', C.plumb, [P(x0 + 1000 + j * 60, yF + 6500 + r * 1200, 300 + r * 600), P(x0 + 5000 + j * 60, yF + 6500 + r * 1200, 300 + r * 600)], {building: N, part: 'rack of PVC pipe row ' + (r + 1)});
    for (let j = 0; j < 10; j++) line('interior', C.int, rect(x0 + 5600 + (j % 2) * 900, yF + 6500 + Math.floor(j / 2) * 700, x0 + 6300 + (j % 2) * 900, yF + 7000 + Math.floor(j / 2) * 700, 1000 + (j % 3) * 300), {building: N, part: 'fittings bin ' + (j + 1)}, closed);
    for (let j = 0; j < 4; j++) line('interior', C.sewer, circ(x0 + 1400 + j * 1300, yF + 11000, 600, 300, 10), {building: N, part: 'coil of poly tubing ' + (j + 1)}, closed);
    line('interior', C.int, rect(x1 - 1100, yF + 3000, x1 - 300, yF + 6000, 2134), {building: N, part: 'valve and sprinkler shelf', checks: [['shelf_height', 2134]]}, closed);
    act(x0 + 3000, yF + 8000, 'standing', 'pulling a stick of schedule 40 pipe', Math.PI);
    act(x0 + 4600, yF + 4200, 'standing', 'counting out pvc elbows into a bag');
    act(x0 + 2000, yF + 2200, 'standing', 'ringing up a roll of drip line', Math.PI);
    act(x1 - 1600, yF + 4500, 'standing', 'matching a sprinkler head on the shelf', Math.PI / 2);
  }

  act(a + 24000, stallY + 7000, 'walking', 'crossing the yard with a parts box', Math.PI / 2);
  act(a + 15000, driveAisleY + 3000, 'standing', 'checking a work order on a clipboard');
  sym('vehicle', C.struct, 'truck', P(a + 24000, driveAisleY + 2500), Math.PI / 2, {part: 'flatbed loading pipe'});
  for (let j = 0; j < 4; j++) line('vegetation', C.veg2, k.blob(a + 8000 + j * 15000, oy + CURB + 2600, 1500, 14, j + 3), {part: ['brittlebush bed', 'desert marigold bed', 'chuparosa bed'][j % 3]}, closed);
  for (let j = 0; j < 5; j++) tree(a + 6000 + j * 13000, oy + PL - 500, 4, 4.5 + j * 0.3);
  for (let i = 0; i <= 6; i++) sym('street', C.struct, 'light', P(a + 3048 + i * W, yF - 2600, 4200), 0, {part: 'yard light', anim: i % 3 === 1 ? {type: 'blink', period: 6, duty: 0.92} : undefined});
  trafficLoop(2, 3, true, C.car2, 'car', 9000);
  trafficLoop(2, 3, false, C.yellow, 'truck', 7000);
  for (const [x, y, pose, t, rot] of acts) person(P(x, y), rot, pose, t);

  // ====================================================== DEEPEN: clear-cell picker
  function picker(bx0, by0, bx1, by1) {
    const ppl = [], low = [], placed = [];
    for (const c of k.W.chunks.values()) for (const r of c.records) {
      if (r.hidden) continue;
      if (r.kind === 'symbol' && r.at[2] > -100 && r.at[2] < 600 && !(r.meta && r.meta.anim && r.meta.anim.type === 'path')) ppl.push(r.at);
      else if (r.kind === 'line' && (r.discipline === 'structure' || r.discipline === 'paving' || r.discipline === 'interior') && r.pts.every(p => p[2] < 2000)) low.push(r);
    }
    const sd = (p, aa, bb) => { const dx = bb[0] - aa[0], dy = bb[1] - aa[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - aa[0]) * dx + (p[1] - aa[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - aa[0] - t * dx, p[1] - aa[1] - t * dy); };
    const ok = (x, y) => {
      for (const aa of ppl) if (Math.hypot(aa[0] - x, aa[1] - y) < 820) return false;
      for (const aa of placed) if (Math.hypot(aa[0] - x, aa[1] - y) < 1250) return false;
      for (const l of low) { const sg = k.eng.recSegs(l); for (let i = 0; i < sg.length; i += 2) if (sd([x, y], sg[i], sg[i + 1]) < 340) return false; }
      return true;
    };
    return { next() { for (let y = by0 + 900; y < by1 - 900; y += 650) for (let x = bx0 + 900; x < bx1 - 900; x += 650) if (ok(x, y)) { placed.push([x, y]); return [x, y]; } return null; } };
  }
  const dBox = (pk, N, label, color, w, d, h, check) => { const c = pk.next(); if (!c) return; line('interior', color, rect(c[0] - w / 2, c[1] - d / 2, c[0] + w / 2, c[1] + d / 2, h), Object.assign({building: N, part: label}, check ? {checks: [check]} : {}), closed); };
  const dUp = (pk, N, label, color, h) => { const c = pk.next(); if (!c) return; line('interior', color, [P(c[0], c[1], 0), P(c[0], c[1], h)], {building: N, part: label}); };
  const dPer = (pk, pose, t) => { const c = pk.next(); if (!c) return; person(P(c[0], c[1]), 0, pose, t); };

  // ============================================================= DEEPEN 0,0
  {   // Two Coyote Corner Market
    const N = 'Two Coyote Corner Market', pk = picker(13716, 25908, 32004, 38100);
    dBox(pk, N, 'rolling mop bucket and wringer', C.plumb, 600, 500, 950);
    dBox(pk, N, 'stack of red shopping baskets', C.brick, 500, 700, 900);
    dBox(pk, N, 'floor fan on a stand', C.int, 500, 500, 1400);
    dBox(pk, N, 'firewood bundle display', C.veg, 1100, 700, 900);
    dBox(pk, N, 'pallet of bottled water', C.car2, 1000, 1200, 900);
    dBox(pk, N, 'spill kit station', C.yellow, 500, 400, 1300);
    dUp(pk, N, 'fire extinguisher on a stand', C.car, 1100);
    dUp(pk, N, 'push broom and dust pan', C.int, 1400);
    dBox(pk, N, 'cardboard bale by the back door', C.struct, 900, 900, 1200);
    dBox(pk, N, 'wet floor cone', C.yellow, 300, 300, 650);
    // high items, no ground conflict
    line('interior', C.brick, [P(14100, 30000, 2300), P(14600, 30000, 2300)], {building: N, part: 'wall clock'});
    line('interior', C.sign, [P(22000, 28000, 2600), P(27000, 28000, 2600)], {building: N, part: 'weekly special banner over the registers'});
    line('interior', C.struct, circ(30800, 37000, 180, 3000, 6), {building: N, part: 'security camera dome'}, closed);
    dPer(pk, 'standing', 'wringing out the mop by the coolers');
    dPer(pk, 'standing', 'grabbing a basket at the front door');
    dPer(pk, 'standing', 'stacking firewood bundles for sale');
  }
  {   // Cinder Block Bungalow
    const N = 'Cinder Block Bungalow', pk = picker(45624, 17144, 57816, 26288);
    dBox(pk, N, 'laundry basket of folded towels', C.car2, 600, 450, 500);
    dBox(pk, N, 'potted snake plant in the corner', C.veg, 450, 450, 900);
    dUp(pk, N, 'standing floor lamp', C.int, 1600);
    dBox(pk, N, 'wastebasket', C.struct, 350, 350, 550);
    dBox(pk, N, 'welcome mat', C.brick, 900, 600, 20);
    dUp(pk, N, 'broom in the utility corner', C.int, 1400);
    line('interior', C.brick, [P(46200, 22000, 2200), P(46700, 22000, 2200)], {building: N, part: 'wall clock'});
    dPer(pk, 'standing', 'watering the snake plant in the corner');
    dPer(pk, 'standing', 'carrying in a basket of folded towels');
  }
  {   // Blue Door Bungalow
    const N = 'Blue Door Bungalow', pk = picker(15144, 47624, 27336, 56768);
    dBox(pk, N, 'ironing board set up', C.int, 1300, 400, 900);
    dBox(pk, N, 'basket of mending', C.veg, 500, 400, 450);
    dUp(pk, N, 'floor lamp by the recliner', C.int, 1600);
    dBox(pk, N, 'houseplant on a plant stand', C.veg, 450, 450, 1100);
    dBox(pk, N, 'welcome mat', C.brick, 900, 600, 20);
    dBox(pk, N, 'kitchen trash can', C.struct, 350, 350, 650);
    line('interior', C.brick, [P(15700, 52000, 2200), P(16200, 52000, 2200)], {building: N, part: 'wall clock'});
    dPer(pk, 'standing', 'ironing a work shirt');
    dPer(pk, 'standing', 'sweeping the kitchen floor');
  }

  // ============================================================= DEEPEN 3,1
  {   // Pecan Hollow Equipment Barn
    const N = 'Pecan Hollow Equipment Barn', pk = picker(266888, 132352, 285176, 144544);
    dBox(pk, N, 'mechanics creeper on the floor', C.car2, 1700, 500, 150);
    dBox(pk, N, 'five gallon bucket of used rags', C.struct, 350, 350, 450);
    dBox(pk, N, 'shop vacuum on wheels', C.int, 500, 500, 950);
    dBox(pk, N, 'parts washer tub', C.plumb, 900, 700, 965, ['counter_height', 965]);
    dBox(pk, N, 'floor jack', C.yellow, 900, 400, 250);
    dBox(pk, N, 'stack of new tractor tires', C.struct, 1200, 1200, 1100);
    dUp(pk, N, 'fire extinguisher on a post', C.car, 1100);
    dBox(pk, N, 'drum of hydraulic oil', C.sewer, 600, 600, 900);
    dUp(pk, N, 'spool of baling wire on a stand', C.int, 1200);
    dBox(pk, N, 'pallet jack parked by the door', C.struct, 600, 1200, 300);
    dPer(pk, 'standing', 'rolling the floor jack under the baler');
    dPer(pk, 'standing', 'scrubbing a gasket in the parts washer');
    dPer(pk, 'standing', 'stacking new tires in the corner');
  }
  {   // Pecan Hollow Farmhouse
    const N = 'Pecan Hollow Farmhouse', pk = picker(249888, 136852, 262080, 145996);
    dBox(pk, N, 'boot tray by the back door', C.struct, 700, 400, 120);
    dUp(pk, N, 'coat rack with jackets', C.int, 1700);
    dBox(pk, N, 'wicker basket of laundry', C.veg, 550, 450, 500);
    dBox(pk, N, 'rocking chair by the window', C.brick, 600, 650, 900);
    dBox(pk, N, 'wood box by the stove', C.veg, 700, 500, 600);
    dBox(pk, N, 'braided throw rug', C.car, 1200, 800, 15);
    line('interior', C.brick, [P(250600, 140000, 2100), P(251100, 140000, 2100)], {building: N, part: 'wall calendar'});
    dPer(pk, 'standing', 'loading split wood into the wood box');
    dPer(pk, 'standing', 'hanging a jacket on the coat rack');
  }
  {   // Pecan Hollow Chicken Coop
    const N = 'Pecan Hollow Chicken Coop', pk = picker(296888, 142352, 300546, 144790);
    dBox(pk, N, 'galvanized feed bin with a scoop', C.struct, 550, 450, 800);
    dBox(pk, N, 'roll of poultry netting', C.int, 400, 400, 600);
    dBox(pk, N, 'egg basket by the door', C.veg, 350, 350, 300);
    dPer(pk, 'standing', 'filling the feed bin with scratch grain');
  }
  {   // Pecan Hollow Farm Stand
    const N = 'Pecan Hollow Farm Stand', pk = picker(298848, 89492, 303725, 91330);
    dBox(pk, N, 'roll of produce bags on a spindle', C.int, 300, 300, 500);
    dBox(pk, N, 'folding chair for the attendant', C.brick, 450, 450, 450);
    dBox(pk, N, 'basket of winter squash', C.yellow, 500, 400, 350);
  }
  {   // Pecan Hollow Pump House
    const N = 'Pecan Hollow Pump House', pk = picker(290888, 138352, 294546, 141400);
    dBox(pk, N, 'jug of chlorine for the injector', C.plumb, 300, 300, 450);
    dUp(pk, N, 'spare pressure switch on a hook', C.elec, 1300);
  }
}
