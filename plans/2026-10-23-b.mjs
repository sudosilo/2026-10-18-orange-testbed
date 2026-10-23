// 2026-10-23 b: a comfort station in the 0,1 park, and deeper detail in the 1,1 feed store and 2,0 motor court.
export default async (k) => {
  const {P, C, box, line, sym, hatch, run, person, blob, circ, vface, wall, door, wavy} = k;
  const I = (b) => (part, extra = {}) => Object.assign({building: b, part}, extra);
  const face = (disc, col, ax, ay, bx, by, z0, z1, meta) => line(disc, col, vface(ax, ay, bx, by, z0, z1), meta, {closed: true});

  // ===== Quail Run Comfort Station, new building in the park on block 0,1 =====
  const QB = 'Quail Run Comfort Station', q = I(QB);
  const X0 = 61200, X1 = 66900, Y0 = 143400, Y1 = 148400, XM = 64050;
  wall(QB, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 3048, -914, true);
  wall(QB, [[XM, Y0], [XM, Y1]], 3048, -914, false);
  hatch('structure', C.struct, vface(X0, Y0, X1, Y0, 0, 3048), 'brick', 400, 0, q('split face block, south wall'), C.brick);
  hatch('structure', C.struct, vface(X0, Y1, X1, Y1, 0, 3048), 'brick', 400, 0, q('split face block, north wall'), C.brick);
  hatch('structure', C.roof, [P(X0 - 300, Y0 - 300, 3048), P(X1 + 300, Y0 - 300, 3048), P(X1 + 300, Y1 + 300, 3048), P(X0 - 300, Y1 + 300, 3048)], 'lines', 600, 0, q('standing seam roof with a deep overhang'), C.struct);
  hatch('structure', C.int, [P(X0 + 150, Y0 + 150, 2743), P(X1 - 150, Y0 + 150, 2743), P(X1 - 150, Y1 - 150, 2743), P(X0 + 150, Y1 - 150, 2743)], 'lines', 900, 90, q('painted hard lid ceiling', {checks: [['ceiling_height', 2743]]}));
  hatch('paving', C.curb, [P(X0 - 200, Y0 - 1200, 0), P(X1 + 200, Y0 - 1200, 0), P(X1 + 200, Y0, 0), P(X0 - 200, Y0, 0)], 'dots', 300, 0, {part: 'broom finish concrete apron'});
  door(QB, 62600, Y0, 'x', 914, 'restroom one door', 1);
  door(QB, 65300, Y0, 'x', 914, 'restroom two door', 1);
  sym('structure', C.sign, 'sign', P(60600, 143000), 0, {text: QB});
  // Both single user rooms
  for (const [x0, x1, n] of [[X0, XM, 'one'], [XM, X1, 'two']]) {
    const w = x0 + 150, e = x1 - 150, cx = (x0 + x1) / 2, isTwo = n === 'two';
    const tx = isTwo ? e - 400 : w + 400; // toilet against the outside wall
    box('interior', C.int, tx - 250, 146950, tx + 250, 147650, 406, q('wall hung toilet, room ' + n));
    run('plumbing', C.plumb, [P(isTwo ? e : w, 147300, 400), P(isTwo ? e : w, 147300, 1100)], q('flush valve, room ' + n));
    run('plumbing', C.sewer, [P(tx, 147300, 0), P(tx, 147300, -600), P(tx, 149000, -760), P(tx, 162096, -2134)], q('toilet waste to the Cholla Street sewer, room ' + n));
    line('interior', C.int, [P(isTwo ? e : w, 146300, 864), P(isTwo ? e : w, 147900, 864)], q('side grab bar, room ' + n));
    line('interior', C.int, [P(tx - 450, Y1 - 150, 864), P(tx + 450, Y1 - 150, 864)], q('rear grab bar, room ' + n));
    box('interior', C.int, isTwo ? e - 120 : w, 146400, isTwo ? e : w + 120, 146800, 600, q('jumbo toilet paper dispenser, room ' + n));
    const lx = isTwo ? x0 + 900 : x1 - 900;
    box('interior', C.int, lx - 300, Y1 - 600, lx + 300, Y1 - 150, 864, q('wall hung lavatory, room ' + n, {checks: [['counter_height', 864]]}));
    run('plumbing', C.plumb, [P(lx, Y1 - 150, 864), P(lx, Y1 - 150, 1050), P(lx, Y1 - 350, 1050)], q('push button metering faucet, room ' + n));
    run('plumbing', C.sewer, [P(lx, Y1 - 350, 780), P(lx, Y1 - 350, -450)], q('lavatory trap, room ' + n));
    face('interior', C.car2, lx - 350, Y1 - 150, lx + 350, Y1 - 150, 1000, 1700, q('stainless steel mirror, room ' + n));
    box('interior', C.int, lx + 400, Y1 - 250, lx + 550, Y1 - 150, 1200, q('soap dispenser, room ' + n));
    sym('electrical', C.elec, 'mark', P(isTwo ? x0 + 150 : x1 - 150, 146200, 1100), 0, q('hand dryer, room ' + n));
    line('plumbing', C.sewer, circ(cx, 145600, 90, 0, 6), q('floor drain, room ' + n), {closed: true});
    sym('electrical', C.elec, 'light', P(cx, 145800, 2743), 0, q('vandal resistant ceiling light, room ' + n));
    sym('electrical', C.elec, 'mark', P(cx, 147400, 2743), 0, q('exhaust fan, room ' + n, {anim: {type: 'spin', rpm: 40}}));
    sym('electrical', C.elec, 'switch', P(isTwo ? 65150 : 62450, Y0 + 150, 1219), 0, q('occupancy sensor switch, room ' + n));
    line('interior', C.int, circ(isTwo ? x0 + 500 : x1 - 500, 144000, 220, 700, 8), q('trash can, room ' + n), {closed: true});
    sym('electrical', C.elec, 'outlet', P(isTwo ? x0 + 150 : x1 - 150, 147500, 1067), 0, q('gfci outlet, room ' + n, {checks: [['outlet_height', 1067]]}));
  }
  box('interior', C.int, X1 - 150 - 120, 144400, X1 - 150, 145300, 864, q('fold down baby changing station, room two'));
  box('interior', C.int, 65900, Y1 - 250, 66150, Y1 - 150, 1100, q('paper towel dispenser, room two'));
  box('electrical', C.elec, XM - 250, 144000, XM - 150, 144600, 1500, q('small load center'));
  run('electrical', C.elec, [P(XM - 200, 144300, 1500), P(XM - 200, 144300, -600), P(59800, 144300, -600), P(59800, 149000, -600), P(6386, 149000, -600), P(6386, 147296, -600), P(6386, 147296, 4500)], q('underground service from the Ocotillo Avenue pole'));
  run('plumbing', C.plumb, [P(XM, 148100, 600), P(XM, 149000, -1067), P(XM, 160896, -1219)], q('water service from the Cholla Street main'));
  run('plumbing', C.plumb, [P(XM - 150, 148200, 2400), P(X0 + 150, 148200, 2400), P(X0 + 150, 148200, 400)], q('cold water header above the ceiling'));
  // Outside
  face('plumbing', C.plumb, 63500, Y0 - 50, 64000, Y0 - 50, 0, 1100, {part: 'bottle filler and drinking fountain'});
  run('plumbing', C.plumb, [P(63750, Y0 - 50, 900), P(63750, Y0 + 150, 900)], {part: 'bottle filler supply', building: QB});
  sym('electrical', C.elec, 'light', P(61800, Y0 - 50, 2400), 0, {part: 'wall pack light over the apron'});
  sym('electrical', C.elec, 'light', P(66300, Y0 - 50, 2400), 0, {part: 'wall pack light over the apron'});
  line('paving', C.curb, wavy(59677, 136149, 63750, 142200, 500, 10, 2), {part: 'decomposed granite spur to the comfort station'});
  line('vegetation', C.veg2, blob(59700, 146600, 900, 12, 3), {part: 'gravel bed of brittlebush'}, {closed: true});
  line('vegetation', C.veg2, blob(68700, 148000, 700, 11, 5), {part: 'gravel bed of desert marigold'}, {closed: true});
  sym('vegetation', C.veg, 'shrub', P(59700, 146600), 0, {part: 'brittlebush', anim: {type: 'sway', deg: 4, period: 3}});
  sym('vegetation', C.veg, 'shrub', P(68700, 148000), 0, {part: 'desert marigold', anim: {type: 'sway', deg: 4, period: 3.5}});
  person(P(63300, 147500), 0, 'standing', 'wiping down the sink with a blue rag');
  person(P(65750, 147550), 0, 'standing', 'restocking the paper towel roll');
  person(P(63750, 142700), 0, 'standing', 'filling a water bottle at the station');
  person(P(65200, 142300), 0, 'standing', 'waiting by the restroom with a toddler');
  sym('activity', C.car2, 'cart', P(67800, 142600), 0, {activity: 'parks crew cart parked by the restroom'});
  person(P(62400, 142400), Math.PI, 'standing', 'unlocking the restrooms for the day');

  // ===== Hard Pan Feed and Tractor, block 1,1 =====
  const FB = 'Hard Pan Feed and Tractor', f = I(FB);
  const racks = [[94392, '50 lb layer pellets', 'chick starter crumbles', 'POULTRY'], [97392, 'sweet feed for horses', 'beet pulp shreds', 'HORSE'], [100392, 'goat chow', 'loose mineral for sheep', 'GOAT AND SHEEP'], [103392, 'dry dog food', 'cat litter', 'DOG AND CAT']];
  for (const [rx, lo, mid, sign] of racks) {
    box('interior', C.int, rx + 50, 101500, rx + 1150, 109500, 300, f('bottom shelf of ' + lo));
    box('interior', C.int, rx + 50, 101500, rx + 1150, 109500, 1219, f('middle shelf of ' + mid, {checks: [['shelf_height', 1219]]}));
    sym('interior', C.sign, 'sign', P(rx + 600, 105500, 3200), 0, f('hanging aisle sign', {text: sign}));
  }
  face('interior', C.int, 96000, 112482, 99000, 112482, 900, 2100, f('tack wall pegboard'));
  [['nylon halters, horse size', 96300], ['rope halters', 96800], ['cotton lead ropes', 97300], ['fly masks', 97800], ['hoof picks and curry combs', 98300], ['show sticks and crops', 98750]].forEach(([nm, x]) => sym('interior', C.int, 'mark', P(x, 112460, 1600), 0, f(nm)));
  [['bulk black oil sunflower seed bin', 99200], ['bulk scratch grain bin', 99900], ['bulk rabbit pellet bin', 100600]].forEach(([nm, x]) => box('interior', C.brick, x, 111800, x + 600, 112400, 900, f(nm)));
  box('interior', C.int, 101250, 112100, 101400, 112400, 1000, f('aluminum feed scoop on a hook'));
  box('interior', C.int, 92542, 105200, 92942, 109800, 1829, f('fly spray and wormer shelf', {checks: [['shelf_height', 1829]]}));
  [[105400, 103600, 'roll of 47 inch field fence'], [106300, 103600, 'roll of barbed wire'], [105400, 104500, 'roll of poultry netting'], [106300, 104500, 'roll of welded wire']].forEach(([x, y, nm]) => line('interior', C.int, circ(x, y, 350, 1219, 10), f(nm), {closed: true}));
  box('electrical', C.elec, 98800, 104100, 100000, 105300, 7200, f('rooftop evaporative cooler cabinet'));
  line('interior', C.int, [P(99400, 104700, 6096), P(99400, 104700, 3658)], f('cooler drop duct through the roof'));
  box('interior', C.int, 99100, 104400, 99700, 105000, 3658, f('cooler supply grille in the ceiling'));
  run('plumbing', C.plumb, [P(94950, 110600, 1300), P(94950, 110600, 3500), P(99400, 110600, 3500), P(99400, 104700, 3500), P(99400, 104700, 7000)], f('copper float valve supply to the roof cooler'));
  run('electrical', C.elec, [P(93192, 104700, 3000), P(98900, 104700, 3000), P(98900, 104700, 7000)], f('cooler motor circuit'));
  sym('electrical', C.elec, 'switch', P(92542, 102000, 1524), 0, f('evaporative cooler wall control'));
  for (const [x, y] of [[93500, 98000], [106800, 110800], [115800, 98400]]) sym('electrical', C.elec, 'mark', P(x, y, 3500), 0, f('security camera dome'));
  for (const [x, y] of [[96392, 104392], [111392, 108392]]) sym('electrical', C.elec, 'mark', P(x, y, 3600), 0, f('smoke detector'));
  sym('electrical', C.elec, 'light', P(98900, 97542, 2286), 0, f('insect light trap over the entry'));
  sym('interior', C.int, 'mark', P(92542, 99200, 1400), 0, f('wall phone by the counter'));
  box('interior', C.int, 115500, 98000, 116300, 100200, 150, f('bundle of steel t posts'));
  box('interior', C.int, 93450, 98900, 93700, 99100, 1016, f('price gun and tag roll by the register'));
  hatch('structure', C.curb, [P(92542, 97542, 5), P(107482, 97542, 5), P(107482, 110000, 5), P(92542, 110000, 5)], 'dots', 600, 0, f('sealed concrete floor'), C.int);
  box('structure', C.struct, 117500, 98000, 118700, 98800, 1800, {part: 'propane exchange cage'});
  person(P(100200, 111200), 0, 'standing', 'weighing a pound of sunflower seed');
  person(P(97500, 111900), 0, 'standing', 'trying a halter for size');
  person(P(93300, 107500), Math.PI / 2, 'standing', 'reading the label on a fly spray');
  person(P(105400, 105300), Math.PI, 'standing', 'counting rolls of field fence');
  person(P(92950, 102000), Math.PI / 2, 'standing', 'turning the cooler fan to high');
  person(P(109500, 103300), 0, 'standing', 'cutting twine off a hay bale');
  person(P(115900, 100800), -Math.PI / 2, 'standing', 'counting t posts in the bundle');
  person(P(118100, 97300), 0, 'standing', 'swapping a propane tank at the cage');
  person(P(112600, 96500), 0, 'standing', 'hosing dust off the loading dock');

  // ===== Pump Jack Motor Court and Pump Jack Office, block 2,0 =====
  const MB = 'Pump Jack Motor Court', m = I(MB);
  for (let i = 0; i < 10; i++) {
    const x0 = 176640 + i * 3658, n = 101 + i, r = (s, e) => m(s + ', room ' + n, e);
    box('interior', C.int, x0 + 300, 45700, x0 + 800, 46400, 406, r('toilet'));
    run('plumbing', C.plumb, [P(x0 + 550, 46380, 150), P(x0 + 550, 46380, 400)], r('toilet supply stop'));
    box('interior', C.int, x0 + 1300, 45650, x0 + 3400, 46380, 508, r('bathtub with shower'));
    run('plumbing', C.plumb, [P(x0 + 2350, 46400, 2032), P(x0 + 2350, 46200, 2000)], r('shower head'));
    line('plumbing', C.sewer, circ(x0 + 3100, 46000, 60, 0, 6), r('tub drain'), {closed: true});
    sym('electrical', C.elec, 'mark', P(x0 + 1800, 45300, 2438), 0, r('bath exhaust fan'));
    sym('electrical', C.elec, 'outlet', P(x0 + 160, 44700, 1067), 0, r('gfci outlet by the vanity', {checks: [['outlet_height', 1067]]}));
    sym('electrical', C.elec, 'mark', P(x0 + 1829, 41000, 2438), 0, r('smoke detector'));
    line('interior', C.int, [P(x0 + 3600, 44500, 1200), P(x0 + 3600, 45300, 1200)], r('towel bar'));
    hatch('structure', C.int, [P(x0 + 150, 44159, 5), P(x0 + 3508, 44159, 5), P(x0 + 3508, 46309, 5), P(x0 + 150, 46309, 5)], 'cross', 305, 0, r('ceramic tile bath floor'), C.struct);
  }
  box('interior', C.int, 176640 + 3658 + 2400, 41000, 176640 + 3658 + 3000, 41350, 914, m('ironing board, room 102'));
  box('interior', C.int, 176640 + 6 * 3658 + 2200, 41850, 176640 + 6 * 3658 + 2450, 42100, 610, m('room phone on the nightstand, room 107'));
  const rp = [[1, 2700, 40600, 'ironing a shirt for a job interview'], [3, 2600, 40700, 'packing a suitcase for checkout'], [4, 2600, 40700, 'vacuuming the carpet in room 105'], [6, 2600, 40700, 'calling home on the room phone'], [7, 2600, 40700, 'peeking past the curtain at the pool'], [9, 2600, 40700, 'stretching after ten hours of driving']];
  for (const [i, dx, y, a] of rp) person(P(176640 + i * 3658 + dx, y), Math.PI, 'standing', a);
  box('electrical', C.brick, 213400, 39300, 214200, 40100, 1829, {part: 'soda vending machine at the end of the walkway'});
  person(P(213800, 38600), 0, 'standing', 'buying a root beer from the machine');
  const OB = 'Pump Jack Office', o = I(OB);
  face('electrical', C.elec, 171000, 24090, 171500, 24090, 1200, 2000, o('main panel for the office and rooms'));
  line('plumbing', C.plumb, circ(170990, 21300, 250, 1500, 10), o('30 gallon water heater'), {closed: true});
  run('plumbing', C.plumb, [P(171440, 22944, 864), P(171440, 22944, 1100), P(171440, 22744, 1100)], o('office sink faucet'));
  run('plumbing', C.sewer, [P(171440, 22744, 800), P(171440, 22744, -450)], o('office sink trap'));
  box('interior', C.int, 173300, 21194, 173700, 21500, 1067, o('guest folio printer', {checks: [['counter_height', 1067]]}));
  face('electrical', C.elec, 176000, 21250, 176500, 21250, 1067, 1400, o('security camera monitor'));
  line('interior', C.int, circ(172200, 19600, 300, 1700, 10), o('postcard spinner rack'), {closed: true});
  box('interior', C.brick, 176500, 19500, 177600, 20100, 300, o('brass luggage cart'));
  sym('electrical', C.elec, 'mark', P(174300, 21800, 2743), 0, o('smoke detector'));
  sym('electrical', C.brick, 'light', P(174297, 18294, 2300), 0, o('exit sign over the door'));
  sym('electrical', C.elec, 'switch', P(177805, 20000, 1524), 0, o('lobby thermostat'));
  box('electrical', C.elec, 173700, 23500, 174000, 23800, 1829, o('wifi router on the shelf'));
  box('interior', C.int, 176200, 21500, 176700, 22000, 600, o('under desk safe'));
  box('electrical', C.elec, 170640, 19800, 171040, 20800, 700, o('wall sleeve air conditioner'));
  sym('electrical', C.elec, 'switch', P(170790, 23000, 1400), 0, o('switch for the neon vacancy sign'));
  person(P(173500, 22000), 0, 'standing', 'printing a folio at checkout');
};
