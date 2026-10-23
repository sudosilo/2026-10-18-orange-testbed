// 2026-10-23 a: deepen the three blocks untouched since 10-19.
// Desert Willow Elementary on 0,2, Sidewinder Wash Clubhouse on 2,1, Horned Toad Travel Stop on 3,0.
export default async (k) => {
  const {P, C, box, line, sym, hatch, run, person, blob, circ, vface} = k;
  const I = (b) => (part, extra = {}) => Object.assign({building: b, part}, extra);
  const face = (disc, col, ax, ay, bx, by, z0, z1, meta) => line(disc, col, vface(ax, ay, bx, by, z0, z1), meta, {closed: true});

  // ===== Desert Willow Elementary, block 0,2 =====
  const SB = 'Desert Willow Elementary', s = I(SB);
  const Y0 = 198496, Y1 = 207640;
  const rooms = [[15144, 'kindergarten'], [24288, 'first grade'], [33432, 'second grade']];
  for (const [r, nm] of rooms) {
    box('interior', C.int, r + 150, 204700, r + 450, 207300, 1219, s(nm + ' backpack cubbies', {checks: [['shelf_height', 1219]]}));
    for (const y of [205220, 205740, 206260, 206780]) line('interior', C.int, [P(r + 150, y, 1219), P(r + 450, y, 1219), P(r + 450, y, 0)], s('cubby divider'));
    const rug = blob(r + 3200, 206100, 1000, 14, r % 7, 10);
    line('interior', C.brick, rug, s(nm + ' reading rug'), {closed: true});
    hatch('structure', C.brick, rug, 'dots', 220, 0, s(nm + ' rug weave'), C.yellow);
    sym('interior', C.int, 'mark', P(r + 8300, 207490, 2300), 0, s('wall clock'));
    box('interior', C.int, r + 4300, 203000, r + 4800, 203400, 2590, s('ceiling projector'));
    line('interior', C.int, [P(r + 4550, 203200, 2590), P(r + 4550, 203200, 2743)], s('projector mount pole'));
    box('interior', C.int, r + 8444, 206200, r + 9000, 207300, 864, s('sink cabinet with bubbler', {checks: [['counter_height', 864]]}));
    run('plumbing', C.plumb, [P(r + 8900, 206750, 864), P(r + 8900, 206750, 1120), P(r + 8700, 206750, 1120)], s('gooseneck faucet'));
    run('plumbing', C.sewer, [P(r + 8700, 206750, 800), P(r + 8700, 206750, -450)], s('sink tailpiece and trap'));
    run('plumbing', C.plumb, [P(r + 9000, 206500, 500), P(r + 9000, 206500, 2900)], s('cold water riser'));
    sym('electrical', C.elec, 'switch', P(r + 150, 203500, 1524), 0, s('thermostat'));
    sym('electrical', C.brick, 'switch', P(r + 300, 198646, 1219), 0, s('fire alarm pull station'));
    sym('electrical', C.elec, 'mark', P(r + 4572, 202000, 2743), 0, s('smoke detector'));
    sym('electrical', C.brick, 'light', P(r + 1057, 198646, 2300), 0, s('exit sign over the door'));
    sym('electrical', C.elec, 'outlet', P(r + 8994, 203500, 457), 0, s('data and power outlet', {checks: [['outlet_height', 457]]}));
    sym('interior', C.int, 'mark', P(r + 2286, 203068, 2743), 0, s('supply air diffuser'));
    sym('interior', C.int, 'mark', P(r + 6858, 203068, 2743), 0, s('supply air diffuser'));
    box('interior', C.int, r + 4272, 206900, r + 4872, 207300, 2743, s('return air grille'));
    for (const c of [r + 1200, r + 2900, r + 4600, r + 6300]) for (const row of [200296, 201996, 203696]) box('interior', C.int, c + 310, row + 700, c + 690, row + 1080, 432, s('student chair'));
    box('interior', C.int, r + 7044, 205940, r + 7544, 206400, 457, s('teacher rolling chair'));
    line('interior', C.int, circ(r + 8600, 205200, 200, 600, 8), s('trash and recycling bins'), {closed: true});
    box('interior', C.int, r + 150, 202800, r + 250, 202900, 1100, s('wall mounted pencil sharpener'));
  }
  // Library corner
  const L = 42576;
  hatch('structure', C.car2, [P(L + 300, 205000, 5), P(L + 4200, 205000, 5), P(L + 4200, 207300, 5), P(L + 300, 207300, 5)], 'cross', 400, 0, s('library carpet tiles'), C.int);
  line('interior', C.brick, blob(L + 1500, 206400, 450, 9, 1, 400), s('red beanbag'), {closed: true});
  line('interior', C.yellow, blob(L + 3000, 206500, 450, 9, 2, 400), s('yellow beanbag'), {closed: true});
  box('interior', C.int, L + 3000, 205200, L + 3800, 205600, 1016, s('rolling book return cart'));
  face('interior', C.int, L + 6600, 205300, L + 7100, 205300, 800, 1150, s('circulation computer monitor'));
  box('interior', C.int, L + 7200, 205200, L + 7400, 205400, 800, s('barcode scanner'));
  box('interior', C.int, L + 7500, 205200, L + 7900, 205500, 800, s('receipt printer for checkouts'));
  box('interior', C.int, L + 8444, 201000, L + 9000, 204000, 762, s('student computer table'));
  for (const y of [201400, 202500, 203600]) face('interior', C.int, L + 8900, y - 250, L + 8900, y + 250, 800, 1150, s('student computer monitor'));
  line('interior', C.car2, circ(L + 2200, 205300, 160, 1000, 10), s('desk globe'), {closed: true});
  sym('interior', C.int, 'mark', P(L + 4572, 203000, 2600), 0, s('library ceiling fan', {anim: {type: 'spin', rpm: 45}}));
  // Office and nurse
  const O = 51720;
  box('interior', C.int, O + 300, 205800, O + 1300, 206500, 1000, s('office copier'));
  box('interior', C.int, O + 150, 202500, O + 450, 204500, 1829, s('teacher mailbox cubbies', {checks: [['shelf_height', 1829]]}));
  line('plumbing', C.plumb, circ(O + 8600, 207100, 280, 1500, 10), s('40 gallon water heater'), {closed: true});
  run('plumbing', C.plumb, [P(O + 8600, 207200, 2900), P(23988, 207200, 2900)], s('cold water main above the ceiling'));
  run('plumbing', C.sewer, [P(23844, 206900, -450), P(58464, 206900, -450), P(58464, 205496, -600)], s('classroom sink waste main'));
  box('interior', C.int, O + 2000, 206900, O + 2600, 207300, 1800, s('pa system amplifier rack'));
  sym('electrical', C.brick, 'mark', P(O + 1600, 200646, 1300), 0, s('aed cabinet'));
  box('interior', C.int, O + 8444, 201500, O + 9000, 202500, 864, s('nurse sink counter', {checks: [['counter_height', 864]]}));
  run('plumbing', C.plumb, [P(O + 8900, 202000, 864), P(O + 8900, 202000, 1120), P(O + 8700, 202000, 1120)], s('nurse faucet'));
  run('plumbing', C.sewer, [P(O + 8700, 202000, 800), P(O + 8700, 202000, -450), P(O + 8700, 206900, -450)], s('nurse sink drain'));
  box('interior', C.int, O + 8444, 204100, O + 9000, 204800, 1800, s('first aid cabinet'));
  box('interior', C.int, O + 3200, 206700, O + 3900, 207300, 1700, s('staff refrigerator'));
  box('interior', C.int, O + 3000, 201200, O + 3400, 201500, 1067, s('visitor sign in tablet', {checks: [['counter_height', 1067]]}));
  box('interior', C.int, O + 3600, 201200, O + 3900, 201450, 1067, s('visitor badge printer'));
  sym('interior', C.int, 'mark', P(O + 6900, 205500, 900), 0, s('desk fan', {anim: {type: 'spin', rpm: 90}}));
  // People at the school
  person(P(15950, 205500), Math.PI / 2, 'standing', 'hanging a backpack in the cubby');
  person(P(18344, 206100), 0, 'sitting', 'sitting criss cross on the reading rug');
  person(P(32400, 206750), Math.PI / 2, 'standing', 'washing paint off at the classroom sink');
  person(P(24800, 202850), -Math.PI / 2, 'standing', 'sharpening a pencil before the spelling test');
  person(P(41550, 206750), Math.PI / 2, 'standing', 'sipping from the drinking fountain');
  person(P(37982, 203100), 0, 'standing', 'adjusting the projector focus');
  person(P(50000, 206200), Math.PI, 'standing', 'scanning returned books at the desk');
  person(P(44076, 206400), 0, 'sitting', 'sprawled on a beanbag with a comic');
  person(P(46700, 205400), Math.PI / 2, 'standing', 'pushing the book cart between the shelves');
  person(P(53300, 206150), Math.PI / 2, 'standing', 'running copies of the spelling test');
  person(P(52500, 203500), Math.PI / 2, 'standing', 'sorting mail into teacher cubbies');
  person(P(57300, 203450), -Math.PI / 2, 'standing', 'taking a temperature with a forehead scanner');

  // ===== Sidewinder Wash Clubhouse, block 2,1 =====
  const CB = 'Sidewinder Wash Clubhouse', c = I(CB);
  // Laundry
  box('interior', C.int, 195650, 116000, 195938, 116500, 1500, c('bill changer'));
  sym('electrical', C.elec, 'outlet', P(195938, 116250, 457), 0, c('changer outlet', {checks: [['outlet_height', 457]]}));
  box('interior', C.int, 195650, 116700, 195938, 117300, 1700, c('detergent vending machine'));
  box('interior', C.int, 195338, 119200, 195938, 119800, 864, c('laundry tub', {checks: [['counter_height', 864]]}));
  run('plumbing', C.plumb, [P(195800, 119500, 864), P(195800, 119500, 1150), P(195600, 119500, 1150)], c('laundry tub faucet'));
  run('plumbing', C.sewer, [P(195600, 119500, 800), P(195600, 119500, -500), P(194024, 119500, -600)], c('laundry tub drain'));
  for (const x of [192774, 193974, 195174]) {
    run('plumbing', C.plumb, [P(x, 122429, 1100), P(x, 122429, 2600)], c('washer hot and cold supply box'));
    run('plumbing', C.sewer, [P(x + 250, 122429, 900), P(x + 250, 122429, -500)], c('washer standpipe drain'));
  }
  for (const x of [192774, 193974]) {
    line('interior', C.int, [P(x, 115514, 1700), P(x, 115264, 1700)], c('dryer vent to the wall cap'));
    sym('electrical', C.elec, 'outlet', P(x + 300, 115364, 1067), 0, c('240 volt dryer receptacle', {checks: [['outlet_height', 1067]]}));
  }
  box('interior', C.int, 194600, 117300, 195100, 117900, 800, c('rolling laundry cart'));
  face('interior', C.int, 192174, 119500, 192174, 120700, 1200, 1800, c('community bulletin board'));
  line('plumbing', C.plumb, circ(195700, 121000, 280, 1500, 10), c('50 gallon water heater'), {closed: true});
  run('plumbing', C.plumb, [P(195700, 121000, 2400), P(197714, 121000, 2400), P(197714, 116100, 2400)], c('hot water line to the showers'));
  sym('interior', C.int, 'mark', P(194056, 120700, 2600), 0, c('laundry ceiling fan', {anim: {type: 'spin', rpm: 60}}));
  box('electrical', C.elec, 192174, 118000, 192274, 118600, 1200, c('clubhouse subpanel'));
  hatch('structure', C.int, [P(192174, 115364, 5), P(196000, 115364, 5), P(196000, 122379, 5), P(192174, 122379, 5)], 'cross', 305, 0, c('laundry vinyl tile floor'), C.struct);
  // Showers
  for (const x of [196974, 198474]) {
    run('plumbing', C.plumb, [P(x, 115564, 2032), P(x, 115800, 2000)], c('shower head'));
    run('plumbing', C.plumb, [P(x, 115564, 1200), P(x + 150, 115564, 1200)], c('shower mixing valve'));
    line('plumbing', C.sewer, circ(x, 116100, 80, 0, 6), c('shower floor drain'), {closed: true});
  }
  box('interior', C.int, 196400, 117700, 198900, 118100, 457, c('locker room bench'));
  for (const y of [116300, 117000]) sym('interior', C.int, 'mark', P(199189, y, 1700), 0, c('towel hook'));
  sym('electrical', C.elec, 'mark', P(197714, 117800, 2743), 0, c('shower exhaust fan'));
  hatch('structure', C.car2, [P(196238, 115364, 5), P(199189, 115364, 5), P(199189, 118722, 5), P(196238, 118722, 5)], 'cross', 150, 0, c('shower room mosaic tile'), C.int);
  // Restroom half
  face('interior', C.car2, 196424, 122379, 198924, 122379, 1100, 1800, c('vanity mirror'));
  for (const x of [197074, 198274]) run('plumbing', C.plumb, [P(x, 122229, 864), P(x, 122229, 1050), P(x, 122000, 1050)], c('vanity faucet'));
  face('interior', C.int, 197714, 119000, 197714, 120600, 300, 1830, c('toilet stall partition'));
  for (const x of [196850, 198550]) {
    box('interior', C.int, x - 250, 119100, x + 250, 119800, 432, c('toilet'));
    run('plumbing', C.plumb, [P(x, 119050, 200), P(x, 119050, 500)], c('toilet supply stop'));
    run('plumbing', C.sewer, [P(x, 119450, 0), P(x, 119450, -500), P(194024, 119450, -700)], c('toilet waste line'));
  }
  line('interior', C.int, [P(199189, 119100, 864), P(199189, 120200, 864)], c('grab bar'));
  sym('electrical', C.elec, 'mark', P(199189, 121000, 1100), 0, c('hand dryer'));
  // Rec room
  box('interior', C.int, 199600, 121929, 201300, 122379, 914, c('kitchenette counter', {checks: [['counter_height', 914]]}));
  run('plumbing', C.plumb, [P(200100, 122300, 914), P(200100, 122300, 1150), P(200100, 122100, 1150)], c('kitchenette faucet'));
  run('plumbing', C.sewer, [P(200100, 122100, 850), P(200100, 122100, -500), P(194024, 122100, -700)], c('kitchenette drain'));
  box('interior', C.int, 200500, 122000, 200800, 122300, 1300, c('drip coffee maker'));
  box('interior', C.int, 200850, 121980, 201250, 122330, 1200, c('microwave'));
  box('interior', C.int, 201400, 121829, 201900, 122379, 860, c('mini fridge'));
  sym('electrical', C.elec, 'outlet', P(200700, 122379, 1067), 0, c('counter outlet', {checks: [['outlet_height', 1067]]}));
  sym('interior', C.brick, 'mark', P(199489, 120500, 1730), 0, c('dartboard on a cork surround'));
  line('interior', C.yellow, [P(201859, 120200, 0), P(201859, 120800, 0)], c('dart oche throw line'));
  face('interior', C.int, 199489, 117200, 199489, 118200, 900, 1600, c('pool cue wall rack'));
  sym('electrical', C.elec, 'switch', P(199489, 116000, 1524), 0, c('rec room thermostat'));
  sym('electrical', C.brick, 'light', P(201673, 115364, 2300), 0, c('exit sign over the rec room door'));
  for (const [x, y] of [[194056, 117500], [200800, 120500]]) sym('electrical', C.elec, 'mark', P(x, y, 2743), 0, c('smoke detector'));
  person(P(195350, 117000), Math.PI / 2, 'standing', 'buying a cup of detergent from the machine');
  person(P(195000, 119500), Math.PI / 2, 'standing', 'rinsing a muddy shirt in the laundry tub');
  person(P(200300, 121550), 0, 'standing', 'brewing a pot of coffee in the rec room');
  person(P(202300, 120700), Math.PI / 2, 'standing', 'aiming a dart at the triple twenty');
  person(P(197300, 121300), 0, 'standing', 'drying hair in front of the mirror');
  person(P(197714, 117300), 0, 'standing', 'waiting for a free shower with a towel');
  person(P(192500, 120100), -Math.PI / 2, 'standing', 'pinning a lost cat flyer to the board');

  // ===== Horned Toad Travel Stop, block 3,0 =====
  const TB = 'Horned Toad Travel Stop', t = I(TB);
  // Point of sale at the checkout
  for (const x of [287650, 289450]) box('interior', C.int, x, 44994, x + 100, 45144, 1100, t('card reader with tap and chip'));
  for (const x of [287126, 288926]) box('interior', C.int, x, 45194, x + 500, 45644, 900, t('cash drawer'));
  for (const x of [287976, 289776]) line('interior', C.int, [P(x, 45144, 1016), P(x, 45144, 1450), P(x + 250, 45144, 1450)], t('customer pole display'));
  for (const x of [287700, 289500]) box('interior', C.int, x, 45250, x + 150, 45400, 1016, t('handheld barcode scanner'));
  box('interior', C.int, 288976, 45194, 289376, 45444, 1050, t('receipt printer'));
  box('interior', C.int, 289900, 45200, 290300, 45600, 1016, t('lottery terminal'));
  box('interior', C.yellow, 286300, 45144, 287000, 45244, 1600, t('scratcher ticket case'));
  box('interior', C.int, 290100, 46300, 290600, 46800, 600, t('under counter drop safe'));
  box('interior', C.brick, 286400, 44900, 286800, 45144, 1300, t('candy and lighter rack'));
  box('electrical', C.elec, 288200, 45300, 288600, 45600, 300, t('pos network switch and ups'));
  sym('electrical', C.elec, 'outlet', P(288400, 45294, 1067), 0, t('register outlet', {checks: [['outlet_height', 1067]]}));
  // Hot food and coffee
  box('interior', C.int, 291776, 45944, 292776, 46544, 914, t('roller grill counter', {checks: [['counter_height', 914]]}));
  for (let i = 0; i < 7; i++) line('interior', C.brick, [P(291876 + i * 130, 46044, 1050), P(291876 + i * 130, 46444, 1050)], t('roller grill roller'));
  for (const x of [291876, 292376]) box('interior', C.int, x, 48044, x + 400, 48394, 1400, t('coffee brewer'));
  box('interior', C.int, 293000, 48000, 293400, 48400, 1300, t('cup dispenser'));
  box('interior', C.int, 293500, 48050, 293900, 48350, 1100, t('lid and straw organizer'));
  box('interior', C.int, 294000, 48000, 294500, 48400, 1050, t('creamer and sugar caddy'));
  // Restrooms
  for (const y of [50400, 53400, 54700]) {
    box('interior', C.int, 294300, y - 350, 294700, y + 350, 432, t('toilet'));
    run('plumbing', C.plumb, [P(294900, y, 200), P(294900, y, 500)], t('toilet supply stop'));
    line('interior', C.int, [P(295026, y - 600, 864), P(295026, y + 300, 864)], t('grab bar'));
  }
  run('plumbing', C.sewer, [P(294500, 50400, -300), P(294500, 52936, -600), P(293876, 52936, -600)], t('mens toilet waste'));
  run('plumbing', C.sewer, [P(294500, 54700, -300), P(294500, 52936, -600)], t('womens toilet waste'));
  box('interior', C.int, 294876, 51500, 295026, 51900, 610, t('urinal'));
  run('plumbing', C.sewer, [P(294950, 51700, 400), P(294950, 51700, -300), P(294500, 51700, -450)], t('urinal drain'));
  run('plumbing', C.sewer, [P(292776, 51736, -300), P(292776, 52936, -500), P(293876, 52936, -600)], t('mens lavatory drain'));
  face('interior', C.int, 293700, 54100, 295026, 54100, 300, 1830, t('womens stall partition'));
  box('interior', C.int, 291668, 53000, 292168, 53900, 864, t('fold down baby changer'));
  sym('electrical', C.elec, 'mark', P(292776, 52443, 1100), 0, t('hand dryer'));
  sym('electrical', C.elec, 'mark', P(293500, 55186, 1100), 0, t('hand dryer'));
  for (const y of [51000, 54000]) line('plumbing', C.sewer, circ(293300, y, 90, 0, 6), t('restroom floor drain'), {closed: true});
  hatch('structure', C.int, [P(291668, 50000, 5), P(295026, 50000, 5), P(295026, 55186, 5), P(291668, 55186, 5)], 'cross', 305, 0, t('restroom ceramic tile'), C.struct);
  // Back of house along the north wall
  box('interior', C.int, 279200, 54400, 280700, 55000, 762, t('managers desk'));
  face('interior', C.int, 279500, 54900, 280200, 54900, 800, 1250, t('security camera monitor'));
  box('electrical', C.elec, 280300, 54500, 280650, 54800, 800, t('camera dvr'));
  box('interior', C.int, 281000, 54600, 281600, 55100, 900, t('office safe'));
  for (const x of [282000, 283800]) box('interior', C.int, x, 54600, x + 1500, 55100, 2134, t('back stock shelving', {checks: [['shelf_height', 2134]]}));
  box('interior', C.int, 283900, 53500, 284300, 53800, 1200, t('hand truck stacked with chip cases'));
  box('interior', C.int, 290600, 54500, 291300, 55100, 300, t('mop sink basin'));
  run('plumbing', C.plumb, [P(290950, 55100, 300), P(290950, 55100, 1000), P(290950, 54900, 1000)], t('mop sink faucet'));
  run('plumbing', C.sewer, [P(290950, 54800, 0), P(290950, 54800, -600), P(293876, 54800, -700), P(293876, 52936, -800)], t('mop sink drain'));
  line('plumbing', C.plumb, circ(289800, 54800, 300, 1500, 10), t('40 gallon water heater'), {closed: true});
  box('electrical', C.elec, 286000, 55086, 286800, 55186, 1500, t('main distribution panel'));
  for (const [x, y] of [[279000, 44000], [286500, 44500], [292000, 50000], [281000, 53500]]) sym('electrical', C.elec, 'mark', P(x, y, 3000), 0, t('security camera dome'));
  box('interior', C.int, 283500, 43294, 284300, 44000, 1300, t('cash machine'));
  sym('electrical', C.elec, 'outlet', P(284400, 43294, 457), 0, t('cash machine outlet', {checks: [['outlet_height', 457]]}));
  sym('electrical', C.brick, 'sign', P(280000, 43294, 1800), 0, t('neon open sign', {text: 'OPEN', anim: {type: 'blink', period: 2, duty: 0.85}}));
  person(P(287300, 44450), 0, 'standing', 'tapping a phone on the card reader');
  person(P(286800, 45700), Math.PI, 'standing', 'restocking scratchers behind the counter');
  person(P(283900, 44350), Math.PI, 'standing', 'withdrawing cash from the atm');
  person(P(279950, 53950), 0, 'standing', 'watching the security monitors');
  person(P(289800, 46550), -Math.PI / 2, 'standing', 'dropping twenties into the safe');
  person(P(292200, 47250), 0, 'standing', 'filling a thermos with black coffee');
  person(P(292300, 45550), 0, 'standing', 'turning taquitos on the roller grill');
  person(P(283500, 53600), Math.PI / 2, 'walking', 'rolling a dolly of chip cases to the floor');
};
