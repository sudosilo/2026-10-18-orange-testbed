// 2026-10-24 a: claim block 4,3 north of the cantina block and build a working corner on it:
// Brick Kiln Pizza Kitchen, Masa Moon Tortilleria and Red Mesa Well Drilling face Agave Street,
// Cottonwood Wash Date Packing Shed and Palm Row Well House sit behind the lot beside a date palm grove.
// Also fixes the east edge of block 4,2, which was named Sotol Avenue though the street is Smoke Tree Avenue,
// and deepens the barber shop and tractor repair on block 2,2.
export default async (k) => {
  const {P, C, S, box, line, sym, hatch, run, person, blob, circ, vface, wall, door, tree, lot, claim, streets, trafficLoop, rect, arc, wavy, push} = k;
  const I = (b) => (part, extra = {}) => Object.assign({building: b, part}, extra);
  const face = (disc, col, ax, ay, bx, by, z0, z1, meta) => line(disc, col, vface(ax, ay, bx, by, z0, z1), meta, {closed: true});
  // At most 8 checks of one type per block per turn.
  const used = {};
  const ck = (blk, type, v) => { const key = blk + type; used[key] = (used[key] || 0) + 1; return used[key] <= 8 ? {checks: [[type, v]]} : {}; };
  const B = '4:3';
  const light = (x, y, z, m) => sym('electrical', C.elec, 'light', P(x, y, z), 0, m);
  const outlet = (x, y, z, m) => sym('electrical', C.elec, 'outlet', P(x, y, z), 0, Object.assign(m, ck(B, 'outlet_height', z)));
  const sw = (x, y, m) => sym('electrical', C.elec, 'switch', P(x, y, 1219), 0, m);
  const fan = (x, y, z, rpm, m) => sym('interior', C.int, 'mark', P(x, y, z), 0, Object.assign(m, {anim: {type: 'spin', rpm}}));

  // ===== Fix: 4,2 east edge is Smoke Tree Avenue, as blue named it to the south =====
  for (const r of k.W.chunks.get('4:2').records) {
    if (r.agent !== 'agent-orange' || r.hidden || !JSON.stringify(r.meta || {}).includes('Sotol')) continue;
    const meta = JSON.parse(JSON.stringify(r.meta).replace(/Sotol Avenue/g, 'Smoke Tree Avenue'));
    push('remove', {id: r.id});
    if (r.kind === 'line') push('place_line', Object.assign({discipline: r.discipline, color: r.color, pts: r.pts, closed: !!r.closed, meta}, r.color2 !== undefined ? {color2: r.color2} : {}));
    else if (r.kind === 'hatch') push('place_hatch', Object.assign({discipline: r.discipline, color: r.color, pts: r.pts, pattern: r.pattern, spacing: r.spacing, angle: r.angle || 0, meta}, r.color2 !== undefined ? {color2: r.color2} : {}));
    else if (r.kind === 'symbol') push('place_symbol', {discipline: r.discipline, color: r.color, type: r.type, at: r.at, rot: r.rot || 0, meta});
  }

  // ===== Block 4,3 =====
  const ox = 4 * S, oy = 3 * S; // 316992, 237744
  claim(4, 3);
  streets(4, 3, {n: true, e: true});
  lot('commercial', ox + 9144, oy + 9144, ox + S - 9144, oy + 41000, 'Agave Street shops and well yard');
  lot('agricultural', ox + 9144, oy + 41000, ox + S - 9144, oy + S - 9144, 'Cottonwood Wash date grove');
  trafficLoop(4, 3, false, C.car, 'car', 9000);
  trafficLoop(4, 3, true, C.car2, 'truck', 8000);

  // ----- Brick Kiln Pizza Kitchen -----
  {
    const N = 'Brick Kiln Pizza Kitchen', s = I(N), X0 = 328000, Y0 = 249000, X1 = 342000, Y1 = 261000;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 4267, -1500, true, C.brick);
    hatch('structure', C.brick, vface(X0, Y0, X1, Y0, 0, 4267), 'brick', 300, 0, s('red brick front'), C.struct);
    wall(N, [[X0, 256500], [336500, 256500]], 3048, 0, false);
    wall(N, [[338000, 256500], [X1, 256500]], 3048, 0, false);
    wall(N, [[339000, Y0], [339000, 252000], [X1, 252000]], 3048, 0, false);
    door(N, 330500, Y0, 'x', 914, 'front entry');
    door(N, 340000, Y1, 'x', 914, 'kitchen back door', -1);
    door(N, 336700, 256500, 'x', 914, 'kitchen swing door');
    door(N, 339000, 250300, 'y', 864, 'restroom door', -1);
    sym('structure', C.sign, 'sign', P(329400, 248300), 0, {text: N, building: N});
    sym('structure', C.brick, 'mark', P(332500, 249000, 2400), 0, s('neon open sign in the window', {anim: {type: 'blink', period: 2, duty: 0.7}}));
    line('structure', C.struct, rect(X0 + 150, Y0 + 150, X1 - 150, Y1 - 150, 3048), s('ceiling', ck(B, 'ceiling_height', 3048)), {closed: true});
    hatch('structure', C.int, rect(X0 + 150, Y0 + 150, 338850, 256350, 3048), 'cross', 610, 0, s('dining room ceiling tile grid'));
    hatch('structure', C.car2, rect(X0 + 150, 256650, X1 - 150, Y1 - 150, 5), 'cross', 200, 0, s('quarry tile kitchen floor'), C.brick);
    line('structure', C.struct, [P(X0, 253000, 3658), P(339000, 253000, 3658)], s('glulam beam', ck(B, 'beam_height', 3658)));
    // Order counter and point of sale
    box('interior', C.int, 333000, 254200, 336000, 254800, 1067, s('order counter', ck(B, 'counter_height', 1067)));
    face('interior', C.int, 333000, 254200, 336000, 254200, 0, 1067, s('counter front with corrugated tin'));
    face('interior', C.int, 334000, 254700, 334400, 254700, 1067, 1400, s('pos terminal screen'));
    box('interior', C.int, 334500, 254550, 334750, 254780, 1067, s('receipt printer'));
    box('interior', C.int, 333900, 254400, 334500, 254800, 950, s('cash drawer under the pos'));
    box('interior', C.int, 334100, 254250, 334250, 254350, 1067, s('card reader on a swivel'));
    box('interior', C.int, 335300, 254300, 335900, 254700, 1067, s('pizza box stack'));
    face('interior', C.int, 333000, 256400, 336000, 256400, 2000, 2700, s('chalk menu board'));
    outlet(335000, 254850, 1067, s('pos outlet'));
    // Kitchen line
    box('interior', C.brick, 328300, 258200, 330700, 260700, 1100, s('gas deck oven'));
    hatch('structure', C.brick, vface(328300, 258200, 330700, 258200, 0, 1600), 'brick', 150, 0, s('oven brick face'), C.struct);
    sym('interior', C.brick, 'mark', P(329500, 258300, 600), 0, s('oven burner flame', {anim: {type: 'blink', period: 0.6, duty: 0.8}}));
    box('interior', C.int, 328200, 258000, 331000, 260900, 2100, s('exhaust hood'));
    line('interior', C.int, [P(329600, 259400, 2100), P(329600, 259400, 4600)], s('hood duct to the roof fan'));
    run('plumbing', C.brick, [P(328000, 257900, 900), P(328500, 257900, 900), P(328500, 258200, 900)], s('gas line to the oven'));
    box('interior', C.int, 331500, 259900, 334500, 260700, 914, s('refrigerated prep table', ck(B, 'counter_height', 914)));
    for (let i = 0; i < 6; i++) box('interior', C.int, 331600 + i * 480, 260000, 331980 + i * 480, 260300, 914, s('topping pan'));
    line('interior', C.int, circ(335500, 260200, 350, 1200, 10), s('dough mixer bowl'), {closed: true});
    line('interior', C.int, [P(335500, 260200, 0), P(335500, 260200, 1200)], s('dough mixer stand'));
    box('interior', C.int, 331300, 257000, 332300, 257600, 914, s('dough proofing cabinet'));
    box('interior', C.int, 331050, 256600, 331300, 256750, 1500, s('kitchen ticket printer'));
    face('interior', C.int, 332500, 256600, 334500, 256600, 1700, 1750, s('ticket rail'));
    box('interior', C.int, 339200, 257800, 341800, 260800, 2438, s('walk in cooler'));
    face('interior', C.int, 339200, 258500, 339200, 259400, 0, 2000, s('walk in cooler door'));
    line('interior', C.int, rect(339800, 259500, 341300, 260500, 1829), s('cooler wire shelving', ck(B, 'shelf_height', 1829)), {closed: true});
    box('interior', C.int, 336800, 260200, 338600, 260800, 914, s('three compartment sink'));
    for (const x of [337100, 337700, 338300]) {
      run('plumbing', C.plumb, [P(x, 260750, 914), P(x, 260750, 1200), P(x, 260500, 1200)], s('sink faucet'));
      run('plumbing', C.sewer, [P(x, 260500, 700), P(x, 260500, -450)], s('sink tailpiece'));
    }
    run('plumbing', C.sewer, [P(337100, 260500, -450), P(338300, 260500, -450), P(338300, 262600, -600)], s('sink waste to the grease interceptor'));
    line('plumbing', C.sewer, circ(338300, 263200, 600, -600, 10), {part: 'grease interceptor lid', building: N}, {closed: true});
    line('plumbing', C.sewer, circ(338300, 263200, 600, -1800, 10), {part: 'grease interceptor bottom, buried', building: N}, {closed: true});
    for (const a of [0, 90, 180, 270]) { const r = a * Math.PI / 180; line('plumbing', C.sewer, [P(338300 + Math.cos(r) * 600, 263200 + Math.sin(r) * 600, -600), P(338300 + Math.cos(r) * 600, 263200 + Math.sin(r) * 600, -1800)], {part: 'grease interceptor wall', building: N}); }
    run('plumbing', C.sewer, [P(338900, 263200, -1600), P(338900, 264500, -1700), P(320592, 264500, -2134)], {part: 'pizza kitchen sewer lateral'});
    box('interior', C.int, 335400, 256600, 335900, 257000, 864, s('hand sink'));
    run('plumbing', C.plumb, [P(335650, 256650, 864), P(335650, 256650, 1100), P(335650, 256800, 1100)], s('hand sink faucet'));
    line('plumbing', C.plumb, circ(341400, 257100, 280, 0, 10), s('50 gallon water heater'), {closed: true});
    run('plumbing', C.plumb, [P(341400, 257100, 1600), P(341400, 257100, 2900), P(337700, 257100, 2900), P(337700, 260800, 2900)], s('hot water to the sinks'));
    run('plumbing', C.plumb, [P(319392, 257100, -1219), P(327000, 257100, -900), P(329000, 257100, -900), P(329000, 257100, 2800), P(341400, 257100, 2800)], s('water service from the Ironwood Avenue main'));
    box('electrical', C.elec, 328000, 256900, 328150, 257600, 1676, s('200 amp kitchen panel'));
    sym('electrical', C.elec, 'pole', P(343500, 263000), 0, {part: 'service pole'});
    run('electrical', C.elec, [P(343500, 263000, 7600), P(341500, 261000, 3800), P(341500, 260900, 3800), P(328100, 257300, 2300)], s('service drop to the panel'));
    for (const [x, y] of [[331500, 257500], [334500, 257500], [331500, 259500], [334500, 259500], [337800, 258500]]) light(x, y, 3048, s('kitchen light'));
    for (const [x, y] of [[330000, 251000], [333500, 251000], [336800, 251000], [330000, 254000], [337500, 254000]]) light(x, y, 2600, s('pendant over the tables'));
    light(340500, 250500, 2743, s('restroom light'));
    fan(332000, 252500, 2900, 50, s('dining ceiling fan'));
    fan(336500, 252500, 2900, 50, s('dining ceiling fan'));
    outlet(X0 + 150, 252000, 457, s('dining outlet'));
    outlet(331500, 256600, 1067, s('counter outlet over the proofer'));
    outlet(334000, 260850, 1067, s('prep table outlet'));
    outlet(335500, 260850, 1067, s('mixer outlet'));
    sw(330000, Y0 + 150, s('front light switch'));
    // Restroom
    line('interior', C.int, arc(341500, 251500, 250, 180, 360, 6, 432), s('toilet bowl'));
    box('interior', C.int, 341250, 251500, 341750, 251800, 760, s('toilet tank'));
    box('interior', C.int, 339300, 251400, 339900, 251850, 864, s('restroom lavatory', ck(B, 'counter_height', 864)));
    line('interior', C.int, [P(X1 - 50, 250000, 864), P(X1 - 50, 251200, 864)], s('grab bar'));
    run('plumbing', C.sewer, [P(341500, 251500, 0), P(341500, 251500, -700), P(341500, 262000, -900)], s('toilet drain'));
    // Dining
    const tables = [[330300, 251300], [333600, 251300], [336700, 251300], [331500, 253700]];
    for (const [x, y] of tables) sym('interior', C.int, 'table', P(x, y), 0, s('dining table'));
    box('interior', C.int, 336300, 252000, 336700, 252400, 457, s('empty chair'));
    box('interior', C.int, 334000, 250500, 334400, 250900, 457, s('empty chair'));
    person(P(334500, 255400), Math.PI, 'standing', 'ringing up a large green chile pizza');
    person(P(334600, 253500), 0, 'standing', 'ordering two slices to go');
    person(P(330000, 257400), 0, 'standing', 'turning pies with a long peel');
    person(P(333000, 259300), 0, 'standing', 'spreading sauce on a fresh crust');
    person(P(337700, 259600), 0, 'standing', 'scrubbing a pizza screen at the sink');
    person(P(330300, 250600), 0, 'sitting', 'splitting a pepperoni pie with a friend');
    person(P(330300, 252000), Math.PI, 'sitting', 'blowing on a hot slice');
    person(P(333600, 252000), Math.PI, 'sitting', 'eating a calzone after a shift');
    person(P(331500, 254400), Math.PI, 'sitting', 'kid picking olives off a slice');
  }

  // ----- Masa Moon Tortilleria -----
  {
    const N = 'Masa Moon Tortilleria', s = I(N), X0 = 345000, Y0 = 249000, X1 = 357000, Y1 = 259000;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 4267, -1500, true, C.struct);
    hatch('structure', C.yellow, vface(X0, Y0, X1, Y0, 0, 4267), 'gradient', 400, 0, s('ochre stucco front, darker at the base'), C.struct);
    wall(N, [[X0, 253500], [350000, 253500]], 3048, 0, false);
    wall(N, [[351500, 253500], [X1, 253500]], 3048, 0, false);
    door(N, 347000, Y0, 'x', 914, 'front entry');
    door(N, 355000, Y1, 'x', 914, 'back door', -1);
    sym('structure', C.sign, 'sign', P(346200, 248300), 0, {text: N, building: N});
    line('structure', C.struct, rect(X0 + 150, Y0 + 150, X1 - 150, Y1 - 150, 3200), s('ceiling', ck(B, 'ceiling_height', 3200)), {closed: true});
    hatch('structure', C.int, rect(X0 + 150, 253650, X1 - 150, Y1 - 150, 5), 'cross', 300, 0, s('sealed concrete floor with drains'), C.struct);
    // Retail counter
    box('interior', C.int, 348500, 252000, 354500, 252600, 1016, s('sales counter', ck(B, 'counter_height', 1016)));
    face('interior', C.int, 349500, 252500, 349900, 252500, 1016, 1350, s('pos terminal screen'));
    box('interior', C.int, 350000, 252350, 350250, 252580, 1016, s('receipt printer'));
    box('interior', C.int, 349400, 252200, 350000, 252600, 900, s('cash drawer'));
    box('interior', C.int, 349600, 252050, 349750, 252150, 1016, s('card reader'));
    box('interior', C.int, 351500, 252100, 352000, 252500, 1016, s('kilo scale'));
    box('interior', C.int, 352100, 252200, 352400, 252500, 1016, s('scale label printer'));
    box('interior', C.int, 352800, 252100, 354300, 252500, 1100, s('stacks of warm tortillas in paper'));
    box('interior', C.int, 355500, 249300, 356800, 252500, 2000, s('glass door drink cooler'));
    box('interior', C.int, X0 + 200, 250000, X0 + 700, 253000, 1829, s('chip and tostada shelf', ck(B, 'shelf_height', 1829)));
    for (const z of [400, 900, 1400]) line('interior', C.int, [P(X0 + 450, 250000, z), P(X0 + 450, 253000, z)], s('shelf board'));
    outlet(355400, 250000, 457, s('cooler outlet'));
    outlet(350600, 252650, 1016, s('pos outlet'));
    face('interior', C.int, 348500, 253400, 352000, 253400, 2000, 2600, s('price board by the kilo'));
    // Production
    box('interior', C.int, 346000, 256500, 353000, 257500, 1000, s('tortilla machine oven conveyor'));
    for (const x of [347000, 348000, 349000]) sym('interior', C.brick, 'mark', P(x, 257000, 800), 0, s('machine gas burner', {anim: {type: 'blink', period: 0.5, duty: 0.85}}));
    line('interior', C.int, [P(353000, 257000, 1000), P(354000, 257000, 900)], s('cooling conveyor tail'));
    box('interior', C.int, 352400, 257700, 353800, 258700, 914, s('stacking and counting table'));
    line('interior', C.int, circ(346500, 254800, 500, 900, 12), s('nixtamal cooking kettle'), {closed: true});
    line('interior', C.int, circ(348200, 254800, 500, 900, 12), s('nixtamal cooking kettle'), {closed: true});
    line('interior', C.int, circ(354500, 257500, 450, 1100, 12), s('masa mixer bowl'), {closed: true});
    box('interior', C.int, 354000, 254500, 355200, 255500, 1100, s('stone corn molino'));
    sym('interior', C.int, 'mark', P(354600, 255000, 1200), 0, s('molino grinding stone', {anim: {type: 'spin', rpm: 30}}));
    box('interior', C.int, 356000, 253800, 356800, 255800, 1000, s('corn soaking tubs'));
    run('plumbing', C.brick, [P(X0, 256000, 900), P(345600, 256000, 900), P(345600, 257000, 900), P(346000, 257000, 900)], s('gas line to the tortilla oven'));
    run('plumbing', C.brick, [P(345600, 256000, 900), P(345600, 254800, 400), P(346000, 254800, 400)], s('gas line to the kettles'));
    line('plumbing', C.sewer, circ(350500, 255500, 150, 0, 8), s('floor drain'), {closed: true});
    run('plumbing', C.sewer, [P(350500, 255500, -300), P(350500, Y1 + 1500, -900), P(320592, 262700, -2134)], s('production drain to the sewer main'));
    box('interior', C.int, 356000, 256200, 356800, 256800, 864, s('hand sink'));
    run('plumbing', C.plumb, [P(356700, 256500, 864), P(356700, 256500, 1100), P(356500, 256500, 1100)], s('hand sink faucet'));
    line('plumbing', C.plumb, circ(356500, 258500, 280, 0, 10), s('40 gallon water heater'), {closed: true});
    run('plumbing', C.plumb, [P(356500, 258500, 2800), P(346500, 258500, 2800), P(346500, 254800, 2800), P(346500, 254800, 1300)], s('fill line over the kettles'));
    box('electrical', C.elec, X0, 257800, X0 + 150, 258600, 1676, s('three phase panel'));
    for (const [x, y] of [[347500, 255000], [351500, 255000], [347500, 258000], [351500, 258000], [355000, 256500]]) light(x, y, 3200, s('vapor tight light'));
    light(348000, 251000, 3200, s('retail light')); light(353000, 251000, 3200, s('retail light'));
    fan(350800, 258700, 2800, 80, s('wall exhaust fan'));
    outlet(353500, Y1 - 150, 1067, s('machine control outlet'));
    sw(348000, Y0 + 150, s('front light switch'));
    person(P(351000, 253000), Math.PI, 'standing', 'weighing a kilo of corn tortillas');
    person(P(351000, 251300), 0, 'standing', 'buying masa for tamales');
    person(P(349500, 255900), 0, 'standing', 'feeding masa into the machine hopper');
    person(P(351950, 258200), -Math.PI / 2, 'standing', 'counting tortillas into dozens');
    person(P(355600, 256100), Math.PI / 2, 'standing', 'checking the grind on the molino');
  }

  // ----- Red Mesa Well Drilling -----
  {
    const N = 'Red Mesa Well Drilling', s = I(N), X0 = 361000, Y0 = 249000, X1 = 384000, Y1 = 263000;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 6096, -1500, true, C.struct);
    hatch('structure', C.struct, vface(368000, Y0, X1, Y0, 0, 6096), 'lines', 300, 90, s('corrugated metal siding'), C.roof);
    wall(N, [[368000, Y0], [368000, 258000]], 3048, 0, false);
    wall(N, [[368000, 259000], [368000, Y1]], 3048, 0, false);
    door(N, 363500, Y0, 'x', 914, 'office entry');
    face('structure', C.struct, 371000, Y1, 377000, Y1, 0, 4267, s('roll up shop door'));
    sym('structure', C.sign, 'sign', P(362600, 248300), 0, {text: N, building: N});
    line('structure', C.struct, rect(X0 + 150, Y0 + 150, 367850, Y1 - 150, 2743), s('office ceiling', ck(B, 'ceiling_height', 2743)), {closed: true});
    line('structure', C.struct, [P(368000, 256000, 5486), P(X1, 256000, 5486)], s('crane rail beam', ck(B, 'beam_height', 5486)));
    hatch('structure', C.roof, rect(368150, Y0 + 150, X1 - 150, Y1 - 150, 5), 'dots', 400, 0, s('oil stained shop slab'), C.struct);
    // Office
    box('interior', C.int, 362000, 252000, 366500, 252600, 1067, s('front counter', ck(B, 'counter_height', 1067)));
    face('interior', C.int, 363000, 252500, 363400, 252500, 1067, 1400, s('invoice pos screen'));
    box('interior', C.int, 363500, 252350, 363750, 252580, 1067, s('receipt printer'));
    box('interior', C.int, 362900, 252200, 363500, 252600, 950, s('cash drawer'));
    box('interior', C.int, 363100, 252050, 363250, 252150, 1067, s('card reader'));
    face('interior', C.int, X0 + 150, 253500, X0 + 150, 257500, 1200, 2200, s('aquifer and well log wall map'));
    box('interior', C.int, 364000, 258500, 366000, 259300, 762, s('estimating desk'));
    face('interior', C.int, 364700, 259100, 365300, 259100, 800, 1150, s('desk monitor with pump curves'));
    box('interior', C.int, 362000, 261600, 363800, 262800, 1100, s('flat file of drilling logs'));
    box('interior', C.int, 366500, 261800, 367700, 262800, 1700, s('wide format plotter'));
    box('interior', C.int, X0 + 200, 259000, X0 + 700, 260500, 1400, s('four drawer file cabinet'));
    box('interior', C.int, 366800, 253200, 367700, 253900, 900, s('water sample fridge'));
    box('interior', C.int, 366800, 254200, 367700, 254700, 914, s('coffee maker on a stand'));
    for (const [x, y] of [[363000, 254500], [366000, 254500], [363000, 260000], [366000, 260000]]) light(x, y, 2743, s('office troffer'));
    outlet(X0 + 150, 255000, 457, s('office outlet'));
    outlet(366000, Y1 - 150, 457, s('plotter outlet'));
    outlet(365000, 259350, 457, s('desk outlet'));
    sw(364700, Y0 + 150, s('office light switch'));
    // Shop
    box('interior', C.int, 369000, 249500, 375000, 250700, 1200, s('drill pipe rack'));
    for (const y of [249700, 250000, 250300, 250600]) line('interior', C.roof, [P(369000, y, 1300), P(375000, y, 1300)], s('six meter drill pipe'));
    box('interior', C.int, 382800, 250000, X1 - 150, 256000, 2134, s('submersible pump shelving', ck(B, 'shelf_height', 2134)));
    for (const y of [251000, 252500, 254000, 255500]) line('interior', C.elec, [P(383300, y, 900), P(383300, y + 1000, 900)], s('stainless submersible pump'));
    line('interior', C.int, [P(376000, 256000, 5486), P(376000, 256000, 3000)], s('chain hoist off the crane rail'));
    line('interior', C.plumb, circ(376000, 254000, 900, 1200, 14), s('pump test tank'), {closed: true});
    line('interior', C.plumb, circ(376000, 254000, 870, 1050, 14), s('test tank water line', {anim: {type: 'bob', mm: 30, period: 1.2}}), {closed: true});
    box('interior', C.int, 378500, 260800, 381500, 262000, 914, s('welding bench'));
    box('interior', C.int, 381800, 261000, 382600, 261800, 900, s('mig welder on a cart'));
    box('interior', C.int, 370000, 260500, 371500, 262000, 1100, s('pipe threading machine'));
    line('interior', C.int, circ(373000, 261800, 500, 1000, 12), s('spool of pump drop cable'), {closed: true});
    for (const x of [379000, 380200, 381400]) line('interior', C.plumb, circ(x, 258000, 400, 1200, 10), s('well pressure tank in stock'), {closed: true});
    box('interior', C.int, 369000, 253000, 370500, 254000, 1000, s('parts washer'));
    line('interior', C.int, circ(369600, 257200, 350, 1200, 10), s('air compressor tank'), {closed: true});
    box('interior', C.int, X1 - 600, 258500, X1 - 150, 259000, 1100, s('eye wash station'));
    line('plumbing', C.sewer, rect(372500, 257000, 374500, 257400, 0), s('trench drain to the sand trap'), {closed: true});
    run('plumbing', C.sewer, [P(373500, 257200, -400), P(373500, Y1 + 1500, -900), P(360000, 264200, -1200), P(320592, 264200, -2134)], s('shop drain to the sewer main'));
    run('plumbing', C.plumb, [P(X1 - 400, 258700, 1100), P(X1 - 400, 258700, 2800), P(376000, 258700, 2800), P(376000, 254900, 2800), P(376000, 254900, 1300)], s('fill line to the test tank'));
    box('electrical', C.elec, 368150, 261500, 368300, 262700, 1676, s('400 amp shop panel'));
    for (const [x, y] of [[372000, 252000], [378000, 252000], [372000, 259000], [378000, 259000], [382000, 256000]]) light(x, y, 5800, s('high bay light'));
    outlet(381000, Y1 - 150, 1067, s('240 volt welder receptacle'));
    outlet(370750, Y1 - 150, 457, s('threader outlet'));
    fan(380000, 250500, 4500, 40, s('big shop ceiling fan'));
    person(P(364500, 253000), Math.PI, 'standing', 'printing a pump install invoice');
    person(P(364500, 251400), 0, 'standing', 'asking what a new well pump costs');
    person(P(365000, 257900), 0, 'sitting', 'sizing a pump from a static level');
    person(P(380000, 260100), 0, 'standing', 'welding a pitless adapter flange');
    person(P(374800, 254000), Math.PI / 2, 'standing', 'running a pump in the test tank');
  }

  // ----- Lot, drive and drilling yard -----
  hatch('paving', C.roof, rect(326500, 266000, 360000, 280000, 0), 'dots', 600, 0, {part: 'asphalt customer lot'}, C.struct);
  hatch('paving', C.roof, rect(322478, 268500, 326500, 274500, 0), 'dots', 600, 0, {part: 'drive to Ironwood Avenue'});
  for (let i = 0; i <= 9; i++) {
    const x = 329000 + i * 2743;
    line('paving', C.white, [P(x, 274200), P(x, 279686)], Object.assign({part: 'stall stripe'}, i < 8 ? {checks: [['stall_width', 2743], ['stall_depth', 5486]]} : {}));
  }
  hatch('paving', C.car2, rect(329000 + 9 * 2743, 274200, 329000 + 9 * 2743 + 1524, 279686, 0), 'lines', 300, 45, {part: 'accessible access aisle'});
  sym('paving', C.car2, 'sign', P(329000 + 9 * 2743 + 2400, 279400), 0, {text: 'van accessible parking'});
  for (const [i, col] of [[0, C.car], [2, C.car2], [3, C.yellow], [6, C.car], [7, C.elec]]) sym('vehicle', col, i === 3 ? 'truck' : 'car', P(329000 + i * 2743 + 1371, 276900), Math.PI, {part: 'parked'});
  hatch('paving', C.struct, rect(362000, 266000, 387096, 280000, 0), 'dots', 900, 0, {part: 'gravel drilling yard'}, C.roof);
  hatch('paving', C.struct, rect(387096, 270000, 390754, 276000, 0), 'dots', 900, 0, {part: 'yard drive to Smoke Tree Avenue'});
  sym('vehicle', C.brick, 'truck', P(372000, 272000), Math.PI / 2, {part: 'top head drill rig truck'});
  line('vehicle', C.brick, [P(369000, 272000, 2400), P(369000, 272000, 13000)], {part: 'drill mast raised'});
  line('vehicle', C.brick, [P(369000, 272000, 13000), P(370500, 272000, 2400)], {part: 'mast brace'});
  sym('vehicle', C.plumb, 'truck', P(380000, 268500), Math.PI / 2, {part: 'water truck for drilling mud'});
  line('vehicle', C.roof, rect(377000, 276000, 384000, 278000, 900), {part: 'pipe trailer'}, {closed: true});
  line('vehicle', C.int, blob(366000, 276000, 2200, 12, 3, 0), {part: 'lined mud pit'}, {closed: true});
  person(P(366000, 273600), 0, 'standing', 'mixing bentonite in the mud pit');
  person(P(375200, 274000), -Math.PI / 2, 'standing', 'strapping casing on the trailer');
  for (const x of [330000, 340000, 352000]) tree(x, 264500, 3, 6);
  sym('vegetation', C.veg2, 'shrub', P(358500, 264500), 0, {part: 'creosote bush'});
  sym('structure', C.int, 'bench', P(343800, 247900), 0, {part: 'bench between the pizza and tortilla shops'});
  person(P(344200, 247200), 0, 'sitting', 'eating a warm tortilla with salt');
  for (const x of [330500, 347000, 363500]) hatch('paving', C.curb, rect(x - 300, 246888, x + 1214, 249000, 152), 'lines', 300, 0, {part: 'entry walk'});

  // ----- Cottonwood Wash Date Packing Shed -----
  {
    const N = 'Cottonwood Wash Date Packing Shed', s = I(N), X0 = 328000, Y0 = 286000, X1 = 348000, Y1 = 302000;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 5486, -1500, true, C.struct);
    hatch('structure', C.struct, vface(X0, Y0, X1, Y0, 0, 5486), 'lines', 400, 90, s('board and batten siding'), C.veg2);
    wall(N, [[340000, Y0], [340000, 289500]], 3658, 0, false);
    wall(N, [[340000, 290500], [340000, 294000], [X1, 294000]], 3658, 0, false);
    door(N, 330000, Y0, 'x', 914, 'office and packing entry');
    door(N, 340000, 289550, 'y', 914, 'cold room door');
    face('structure', C.struct, X1, 296500, X1, 300000, 0, 3658, s('roll up dock door to the grove'));
    sym('structure', C.sign, 'sign', P(331200, 285300), 0, {text: N, building: N});
    line('structure', C.struct, [P(X0, 294000, 4267), P(340000, 294000, 4267)], s('glulam beam', ck(B, 'beam_height', 4267)));
    line('structure', C.struct, rect(340150, Y0 + 150, X1 - 150, 293850, 3048), s('insulated cold room ceiling', ck(B, 'ceiling_height', 3048)), {closed: true});
    hatch('structure', C.int, rect(X0 + 150, 294150, X1 - 150, Y1 - 150, 5), 'cross', 500, 0, s('washdown floor'), C.struct);
    // Sorting line
    box('interior', C.int, 330000, 297000, 340000, 297800, 900, s('date sorting conveyor belt'));
    for (const x of [331000, 333500, 336000, 338500]) line('interior', C.int, [P(x, 297000, 0), P(x, 297000, 900)], s('conveyor leg'));
    sym('interior', C.int, 'mark', P(340200, 297400, 950), 0, s('conveyor drive pulley', {anim: {type: 'spin', rpm: 60}}));
    box('interior', C.int, 341000, 296500, 343000, 299500, 1800, s('date hydrator cabinet'));
    for (const [x, y] of [[330000, 300000], [331400, 300000], [332800, 300000], [330000, 295200], [331400, 295200]]) box('interior', C.veg2, x, y, x + 1200, y + 1200, 760, s('field bin of medjool dates'));
    box('interior', C.int, 334500, 299800, 336500, 301000, 914, s('packing table', ck(B, 'counter_height', 914)));
    box('interior', C.int, 337000, 299800, 339000, 301000, 914, s('packing table with clamshells'));
    box('interior', C.int, 344000, 300500, 345500, 301500, 100, s('platform floor scale'));
    box('interior', C.int, 345600, 300800, 346000, 301200, 1100, s('scale ticket printer'));
    box('interior', C.int, 339200, 301300, 339600, 301700, 914, s('case label printer'));
    box('interior', C.int, 333000, 295000, 334500, 295800, 914, s('quality check table'));
    line('interior', C.int, [P(333750, 295400, 914), P(333750, 295400, 1500), P(333750, 295700, 1500)], s('magnifier lamp on the qc table'));
    box('interior', C.int, X0 + 200, 288000, X0 + 1400, 291000, 762, s('shed office desk'));
    face('interior', C.int, X0 + 1300, 289000, X0 + 1300, 289600, 800, 1150, s('lot tracking computer'));
    box('interior', C.int, 336000, 287000, 338500, 288200, 1829, s('clamshell and carton shelving', ck(B, 'shelf_height', 1829)));
    // Cold room
    for (const [x, y] of [[341500, 287500], [343000, 287500], [344500, 287500], [341500, 291500], [343000, 291500], [344500, 291500]]) box('interior', C.int, x, y, x + 1200, y + 1000, 1500, s('pallet of boxed dates'));
    box('interior', C.int, 346000, 292800, 347800, 293700, 2900, s('cold room evaporator'));
    run('plumbing', C.sewer, [P(346900, 293200, 2800), P(346900, 293200, 300), P(347850, 293200, 300)], s('evaporator condensate line'));
    sym('electrical', C.elec, 'switch', P(340150, 291000, 1500), 0, s('cold room thermometer display'));
    // Services
    box('interior', C.int, X0 + 200, 296000, X0 + 700, 296500, 864, s('hand sink'));
    run('plumbing', C.plumb, [P(319392, 296250, -1219), P(326000, 296250, -900), P(X0 + 450, 296250, -900), P(X0 + 450, 296250, 1100)], s('water service to the hand sink'));
    run('plumbing', C.sewer, [P(X0 + 450, 296250, 600), P(X0 + 450, 296250, -500), P(320592, 296000, -2134)], s('hand sink drain'));
    box('electrical', C.elec, X0, 292000, X0 + 150, 292800, 1676, s('shed panel'));
    for (const [x, y] of [[332000, 296000], [337000, 296000], [332000, 300000], [337000, 300000], [343500, 298000], [343000, 290000]]) light(x, y, 4500, s('led high bay'));
    fan(336000, 298500, 4800, 35, s('big ceiling fan over the sorting line'));
    face('interior', C.int, X1 - 50, 294500, X1 - 50, 296000, 1800, 3000, s('evaporative cooler on the wall'));
    outlet(338000, Y1 - 150, 1067, s('label printer outlet'));
    outlet(X0 + 150, 289000, 457, s('office outlet'));
    outlet(342000, Y1 - 150, 457, s('hydrator outlet'));
    sw(331000, Y0 + 150, s('shed light switch'));
    person(P(335000, 296400), 0, 'standing', 'pulling split dates off the belt');
    person(P(338000, 298400), Math.PI, 'standing', 'grading dates by size');
    person(P(335500, 299200), 0, 'standing', 'packing a clamshell of medjools');
    person(P(345000, 299800), Math.PI, 'standing', 'weighing a pallet before the cold room');
    person(P(333750, 294500), 0, 'standing', 'checking a sample for moisture');
    person(P(330500, 289400), -Math.PI / 2, 'sitting', 'logging a grower lot number');
  }

  // ----- Palm Row Well House -----
  {
    const N = 'Palm Row Well House', s = I(N), X0 = 352000, Y0 = 296000, X1 = 356000, Y1 = 300000;
    wall(N, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 3048, -1500, true, C.brick);
    hatch('structure', C.brick, vface(X0, Y0, X1, Y0, 0, 3048), 'brick', 200, 0, s('cmu block wall'), C.struct);
    door(N, 352600, Y0, 'x', 914, 'well house door');
    sym('structure', C.sign, 'sign', P(354800, 295300), 0, {text: N, building: N});
    line('plumbing', C.plumb, circ(355000, 298800, 200, 450, 10), s('well casing top'), {closed: true});
    run('plumbing', C.plumb, [P(355000, 298800, 450), P(355000, 298800, -45720)], s('pump column, 150 feet down'));
    line('plumbing', C.plumb, circ(355000, 298800, 150, -45720, 8), s('submersible pump at the bottom'), {closed: true});
    box('plumbing', C.plumb, 354700, 298500, 355300, 299100, 700, s('discharge head'));
    run('plumbing', C.plumb, [P(355300, 298800, 600), P(355700, 298800, 600)], s('check valve'));
    box('plumbing', C.plumb, 355700, 298600, 355850, 299000, 800, s('flow meter'));
    sym('plumbing', C.plumb, 'mark', P(355500, 298800, 900), 0, s('pressure gauge'));
    run('plumbing', C.plumb, [P(355850, 298800, 600), P(357500, 298800, 600), P(357500, 298800, 0)], s('discharge to the grove ditch'));
    line('plumbing', C.plumb, circ(353200, 299200, 350, 1600, 10), s('pressure tank'), {closed: true});
    run('plumbing', C.plumb, [P(355000, 298800, 600), P(353200, 299200, 600)], s('tee to the pressure tank'));
    box('interior', C.int, 353000, 296200, 353500, 296500, 1000, s('chlorine feed pump'));
    run('plumbing', C.plumb, [P(353250, 296350, 1000), P(355500, 298600, 700)], s('chlorine feed tube'));
    box('plumbing', C.plumb, 355600, 299300, 355800, 299500, 500, s('sample tap'));
    box('electrical', C.elec, X0, 297000, X0 + 200, 298200, 1500, s('vfd for the well pump'));
    box('electrical', C.elec, X0, 298400, X0 + 150, 298900, 1676, s('fused disconnect'));
    run('electrical', C.elec, [P(X0 + 100, 297600, 1000), P(X0 + 100, 297600, -300), P(355000, 298800, -300)], s('pump power to the well'));
    sym('electrical', C.elec, 'pole', P(350500, 298000), 0, {part: 'well service pole'});
    run('electrical', C.elec, [P(350500, 298000, 7000), P(X0 + 100, 298600, 2600), P(X0 + 100, 298600, 1700)], s('service drop to the disconnect'));
    light(354000, 298000, 2743, s('well house light'));
    outlet(X0 + 150, 299500, 457, s('well house outlet'));
    person(P(355000, 297500), Math.PI / 2, 'standing', 'reading gallons off the flow meter');
  }

  // ----- Date grove and irrigation -----
  const ditch = wavy(357500, 298800, 386000, 298000, 900, 18, 1.3, -300);
  line('lot', C.plumb, ditch, {part: 'concrete lined irrigation ditch'});
  hatch('lot', C.plumb, [P(357500, 298600, -300), P(386000, 297800, -300), P(386000, 298200, -300), P(357500, 299000, -300)], 'lines', 200, 0, {part: 'water in the ditch'}, C.car2);
  let n = 0;
  for (const x of [361000, 365400, 369800, 374200, 378600, 383000]) for (const y of [284500, 289000, 293500, 303000]) {
    n++;
    sym('vegetation', C.veg, 'tree', P(x, y), 0, Object.assign({part: 'medjool date palm'}, n % 3 === 0 ? {anim: {type: 'sway', deg: 4, period: 5 + (n % 4)}} : {}));
    line('lot', C.struct, blob(x, y, 1400, 10, n, 0), {part: 'palm basin berm'}, {closed: true});
  }
  for (const y of [284500, 289000, 293500, 303000]) run('lot', C.plumb, [P(359500, y + 900, 0), P(385000, y + 900, 0)], {part: 'drip line along the palm row'});
  line('paving', C.curb, [P(345000, 280000), P(347200, 282600), P(350500, 284000), P(352500, 286500), P(352800, 295800)], {part: 'decomposed granite path to the well house'});
  line('paving', C.curb, [P(334000, 280000), P(333000, 282500), P(331500, 284200), P(330500, 285900)], {part: 'decomposed granite path to the shed'});
  sym('vehicle', C.elec, 'truck', P(358800, 285500), 0, {part: 'compact tractor with date bin forks'});
  person(P(366500, 291300), 0, 'standing', 'tying up a heavy date strand');
  person(P(372000, 286900), Math.PI, 'standing', 'checking a drip emitter at a basin');
  person(P(380800, 301100), 0, 'standing', 'opening a ditch gate with a shovel');
  sym('activity', C.person, 'person', P(361000, 300800), 0, {pose: 'walking', activity: 'walking the rows at sunrise', anim: {type: 'path', speed: 1200, pts: [P(361000, 300800), P(372000, 300900), P(384000, 300800), P(384000, 296000), P(372000, 296000), P(361000, 296000), P(361000, 300800)]}});
  sym('activity', C.person, 'cyclist', P(ox + 7315 + 2000, oy + 7315), 0, {activity: 'riding to the tortilleria for lunch', anim: {type: 'path', speed: 4500, pts: [P(ox + 9300, oy + 7315), P(ox + S - 9300, oy + 7315), P(ox + S - 7315, oy + 9300), P(ox + S - 7315, oy + S - 9300), P(ox + S - 9300, oy + S - 7315), P(ox + 9300, oy + S - 7315), P(ox + 7315, oy + S - 9300), P(ox + 7315, oy + 9300), P(ox + 9300, oy + 7315)]}});

  // ===== Block 2,2: barber shop and tractor repair =====
  {
    const T = I('Rattlesnake Ridge Tractor Repair');
    box('interior', C.int, 194000, 169600, 195000, 170300, 1000, T('solvent parts washer'));
    line('interior', C.int, [P(194500, 169950, 1000), P(194500, 169950, 1500), P(194700, 169950, 1400)], T('parts washer faucet hose'));
    box('interior', C.int, 189500, 175000, 190100, 175600, 900, T('battery charger cart'));
    line('interior', C.int, circ(194200, 176800, 290, 880, 10), T('55 gallon hydraulic oil drum'), {closed: true});
    line('interior', C.int, [P(194200, 176800, 880), P(194200, 176800, 1300), P(194500, 176800, 1250)], T('drum hand pump'));
    line('interior', C.int, circ(196300, 177300, 450, 900, 12), T('tire changer turntable'), {closed: true});
    sym('interior', C.brick, 'mark', P(189200, 172000, 1200), 0, T('fire extinguisher'));
    line('interior', C.int, circ(194500, 172000, 150, 3200, 8), T('drop light cord reel'), {closed: true});
    box('interior', C.int, 190000, 182000, 191800, 182600, 1829, T('grease and fluids shelf'));
    sym('electrical', C.elec, 'mark', P(193500, 177000, 3962), 0, T('shop ceiling fan', {anim: {type: 'spin', rpm: 40}}));
    person(P(194500, 170750), 0, 'standing', 'rinsing a carburetor in the parts washer');
    const R = I('Two Bit Barber Shop');
    box('interior', C.int, 201200, 183500, 202100, 184300, 1100, R('towel warmer cabinet'));
    box('interior', C.int, 202400, 183500, 203100, 184200, 850, R('stacked washer for towels'));
    box('interior', C.int, 199400, 180450, 199600, 180600, 1150, R('neck strip dispenser'));
    box('interior', C.int, 202100, 180450, 202300, 180600, 1150, R('neck strip dispenser'));
    box('interior', C.int, 204800, 180450, 205000, 180600, 1150, R('neck strip dispenser'));
    box('interior', C.int, 206900, 176500, 207100, 179500, 1524, R('pomade and tonic display shelf'));
    sym('interior', C.int, 'mark', P(202700, 172000, 3200), 0, R('pressed tin ceiling fan', {anim: {type: 'spin', rpm: 55}}));
    sym('interior', C.int, 'mark', P(202700, 178000, 3200), 0, R('pressed tin ceiling fan', {anim: {type: 'spin', rpm: 55}}));
    box('interior', C.int, 206200, 172900, 206500, 173100, 1067, R('receipt printer by the tablet'));
    box('interior', C.int, 205900, 172900, 206150, 173050, 1067, R('card reader'));
    person(P(203900, 178200), 0, 'standing', 'sweeping hair off the floor');
    person(P(201600, 184900), 0, 'standing', 'folding warm towels for the next shave');
  }
};
