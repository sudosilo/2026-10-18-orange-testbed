// 2026-10-24 c: deepen blocks 1,0 and 1,2, untouched since 10-22.
// 1,0: Saltbush Court House and Red Rock Court House furnished room by room, back yard gardens.
// 1,2: Cholla Street Fire Station Two bays, bunk room, day room and kitchen; new Tamarisk Flat Fire Training Hall east of the hose tower.
export default async (k) => {
  const {P, C, box, line, sym, hatch, run, person, circ, vface, wall, door, tree, blob, wavy, arc} = k;
  const I = (b) => (part, extra = {}) => Object.assign({building: b, part}, extra);
  const used = {};
  const ck = (blk, type, v) => { const key = blk + type; used[key] = (used[key] || 0) + 1; return used[key] <= 8 ? {checks: [[type, v]]} : {}; };
  const light = (x, y, z, m) => sym('electrical', C.elec, 'light', P(x, y, z), 0, m);
  const mark = (disc, x, y, z, m) => sym(disc, disc === 'plumbing' ? C.plumb : disc === 'electrical' ? C.elec : C.int, 'mark', P(x, y, z), 0, m);
  const fan = (x, y, z, rpm, m) => sym('electrical', C.elec, 'mark', P(x, y, z), 0, Object.assign(m, {anim: {type: 'spin', rpm}}));
  const ib = (x0, y0, x1, y1, z, m) => box('interior', C.int, x0, y0, x1, y1, z, m);
  const eb = (x0, y0, x1, y1, z, m) => box('electrical', C.elec, x0, y0, x1, y1, z, m);
  const pb = (x0, y0, x1, y1, z, m) => box('plumbing', C.plumb, x0, y0, x1, y1, z, m);
  const floor = (x0, y0, x1, y1, z, pat, sp, ang, m, c2) => hatch('structure', C.struct, [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], pat, sp, ang, m, c2);
  let B = '1:0';
  const outlet = (x, y, z, m) => sym('electrical', C.elec, 'outlet', P(x, y, z), 0, Object.assign(m, ck(B, 'outlet_height', z)));

  // ================= Block 1,0: two court houses with the same plan, offset 21000 east and 12000 north =================
  const house = (name, dx, dy, acts) => {
    const s = I(name);
    const X = (x) => x + dx, Y = (y) => y + dy;
    // living room and kitchen
    ib(X(101700), Y(49400), X(102100), Y(49850), 457, s('kitchen chair west'));
    ib(X(102700), Y(49400), X(103100), Y(49850), 457, s('kitchen chair east'));
    ib(X(102190), Y(48900), X(102600), Y(49250), 457, s('kitchen chair south'));
    ib(X(100150), Y(49500), X(100850), Y(50700), 450, s('pine coffee table'));
    ib(X(99000), Y(52400), X(99300), Y(53800), 1829, s('bookshelf on the bedroom wall', ck(B, 'shelf_height', 1829)));
    line('interior', C.int, circ(X(99450), Y(48600), 200, 1500, 8), s('floor lamp shade by the sofa'), {closed: true});
    ib(X(102400), Y(45774), X(103000), Y(45874), 1700, s('coat hooks by the front door'));
    ib(X(101450), Y(45900), X(102250), Y(46400), 10, s('coir door mat'));
    ib(X(100000), Y(51800), X(100600), Y(52400), 2438, s('evaporative cooler ceiling grille'));
    ib(X(103000), Y(54200), X(103200), Y(54550), 950, s('dish drying rack by the sink'));
    ib(X(102900), Y(54250), X(103150), Y(54550), 1050, s('drip coffee maker'));
    ib(X(102100), Y(54250), X(102700), Y(54600), 1100, s('microwave over the range'));
    ib(X(101984), Y(53300), X(102300), Y(53650), 600, s('kitchen trash can'));
    ib(X(104100), Y(54618), X(104400), Y(54618), 1450, s('paper towel holder under the cabinet'));
    ib(X(103550), Y(53950), X(103800), Y(54068), 950, s('spice rack on the backsplash'));
    line('interior', C.int, circ(X(103400), Y(54350), 120, 1000, 6), s('jar of wooden spoons'), {closed: true});
    line('interior', C.int, [P(X(105434), Y(51600), 1300), P(X(105434), Y(52800), 1300), P(X(105434), Y(52800), 1900), P(X(105434), Y(51600), 1900)], s('framed desert landscape print'), {closed: true});
    ib(X(104000), Y(47000), X(105434), Y(47300), 762, s('narrow hall table with the mail'));
    // bathroom
    line('interior', C.int, [P(X(93542), Y(46600), 1200), P(X(94400), Y(46600), 1200)], s('towel bar over the tub'));
    line('interior', C.int, [P(X(93542), Y(46560), 1980), P(X(95300), Y(46560), 1980)], s('shower curtain rod'));
    ib(X(93542), Y(47000), X(93642), Y(47400), 1300, s('medicine cabinet mirror'));
    ib(X(95700), Y(47400), X(95900), Y(47550), 650, s('toilet paper holder'));
    floor(X(94450), Y(47350), X(95000), Y(47750), 10, 'lines', 60, 0, s('bath mat'), C.brick);
    mark('plumbing', X(94300), Y(45900), 1000, s('tub spout and mixing valve'));
    pb(X(95250), Y(46800), X(95650), Y(46900), 300, s('toilet supply stop'));
    // bedroom
    ib(X(97300), Y(51500), X(97800), Y(52000), 300, s('wicker laundry hamper'));
    ib(X(96650), Y(53750), X(96900), Y(53900), 700, s('alarm clock on the nightstand'));
    ib(X(98700), Y(51000), X(98878), Y(52200), 1100, s('full length mirror on the partition'));
    floor(X(94192), Y(51968), X(96392), Y(54168), 620, 'cross', 300, 45, s('patchwork quilt on the bed'), C.brick);
    ib(X(94400), Y(53900), X(96200), Y(54168), 700, s('two pillows at the headboard'));
    ib(X(93542), Y(49000), X(94100), Y(51500), 10, s('shoes lined up under the closet rod'));
    // electrical
    mark('electrical', X(96100), Y(50300), 2438, s('bedroom smoke alarm'));
    mark('electrical', X(100200), Y(48000), 2438, s('living room smoke alarm'));
    eb(X(105300), Y(47500), X(105434), Y(48200), 1500, s('house load center by the hall'));
    sym('electrical', C.elec, 'switch', P(X(98950), Y(48600), 1219), 0, s('bedroom light switch'));
    sym('electrical', C.elec, 'switch', P(X(102400), Y(54618), 1219), 0, s('kitchen light switch'));
    outlet(X(98950), Y(50500), 406, s('outlet behind the sofa'));
    outlet(X(96392), Y(54618), 406, s('bedside outlet'));
    run('electrical', C.elec, [P(X(105400), Y(47850), 2438), P(X(105400), Y(51600), 2438), P(X(100300), Y(51600), 2438), P(X(100300), Y(52000), 3400)], s('cooler motor circuit'));
    // plumbing
    run('plumbing', C.plumb, [P(X(105150), Y(46250), 1600), P(X(105150), Y(46250), -300), P(X(103700), Y(46250), -300), P(X(103700), Y(54400), -300), P(X(103700), Y(54400), 500)], s('hot water line to the kitchen sink'));
    run('plumbing', C.plumb, [P(X(105150), Y(46250), -300), P(X(94100), Y(46250), -300), P(X(94100), Y(46250), 900)], s('hot water line to the tub'));
    pb(X(105000), Y(46100), X(105300), Y(46400), 1550, s('water heater temperature relief valve'));
    // texture
    floor(X(98878), Y(51800), X(101900), Y(54618), 5, 'lines', 180, 0, s('worn linoleum kitchen floor'), C.int);
    hatch('structure', C.struct, vface(X(101984), Y(54618), X(105284), Y(54618), 914, 1372), 'cross', 100, 0, s('tile backsplash'), C.brick);
    for (const [x, y, rot, pose, a] of acts) person(P(X(x), Y(y)), rot, pose, a);
  };
  house('Saltbush Court House', 0, 0, [
    [99500, 50000, Math.PI / 2, 'sitting', 'reading the paper on the sofa'],
    [103500, 49300, Math.PI, 'standing', 'sorting the mail on the hall table'],
    [94800, 47600, Math.PI, 'standing', 'brushing teeth at the vanity'],
    [97000, 51300, 0, 'standing', 'tossing work shirts in the hamper'],
  ]);
  house('Red Rock Court House', 21000, 12000, [
    [99500, 50000, Math.PI / 2, 'sitting', 'watching the evening news'],
    [100500, 48900, 0, 'standing', 'switching on the floor lamp'],
    [99750, 53100, Math.PI / 2, 'standing', 'picking a paperback off the shelf'],
    [99300, 46300, Math.PI, 'standing', 'watering herbs on the windowsill'],
  ]);
  // back yards (organic garden beds) and life
  {
    const yd = [[96000, 57600], [117000, 69600 - 12000 + 12000]];
    line('vegetation', C.veg, blob(97000, 58200, 1600, 12, 1), {part: 'chile pepper bed behind Saltbush Court House'}, {closed: true});
    line('vegetation', C.veg2, blob(101500, 58200, 1300, 11, 2), {part: 'tomato cages behind Saltbush Court House'}, {closed: true});
    line('vegetation', C.veg, wavy(93600, 56400, 105400, 56400, 300, 14, 3), {part: 'drip line along the back fence'});
    line('vegetation', C.veg2, blob(120000, 70300, 1500, 12, 4), {part: 'prickly pear garden behind Red Rock Court House'}, {closed: true});
    line('vegetation', C.veg, wavy(114600, 68400, 126400, 68600, 280, 14, 5), {part: 'river rock swale along the back of Red Rock Court House'});
    line('vegetation', C.veg2, blob(124600, 70400, 1100, 10, 6), {part: 'herb spiral of rosemary and sage'}, {closed: true});
    person(P(99200, 58300), Math.PI / 2, 'standing', 'picking ripe chiles into a bowl');
    person(P(103200, 58000), Math.PI, 'standing', 'tying tomato vines to the cage');
    person(P(122000, 70300), Math.PI, 'standing', 'pulling weeds around the prickly pear');
    person(P(126200, 70400), Math.PI, 'standing', 'snipping rosemary for dinner');
    sym('activity', C.person, 'dog', P(118200, 70000), 0.5, {activity: 'dozing in the shade of the carport'});
    person(P(130900, 59000), -Math.PI / 2, 'standing', 'washing the pickup in the drive');
    sym('activity', C.person, 'cart', P(131600, 56700), 0, {activity: 'bucket of soapy water by the truck'});
    line('activity', C.plumb, wavy(130184, 60800, 130900, 58800, 150, 6, 7, 300), {activity: 'garden hose snaking to the truck'});
    tree(108000, 58800, 3, 5);
    sym('vegetation', C.veg2, 'shrub', P(112600, 54600), 0, {part: 'creosote bush by the walk', anim: {type: 'sway', deg: 4, period: 3}});
  }

  // ================= Block 1,2: Cholla Street Fire Station Two =================
  B = '1:2';
  {
    const s = I('Cholla Street Fire Station Two');
    // apparatus bay, east wall lockers
    for (let i = 0; i < 6; i++) {
      const y = 183140 + i * 900;
      ib(117850, y + 150, 118250, y + 650, 1900, s('helmet on locker ' + (i + 1) + ' top shelf'));
      ib(117850, y + 200, 118250, y + 650, 50, s('boots pulled down in bunker pants, locker ' + (i + 1)));
      ib(117950, y + 250, 118250, y + 650, 1100, s('turnout coat on locker ' + (i + 1) + ' hook'));
    }
    line('interior', C.int, [P(118500, 183200, 3000), P(118500, 188200, 3000)], s('roof ladder on wall hooks'));
    line('interior', C.int, [P(118500, 183200, 3400), P(118500, 188200, 3400)], s('attic ladder above it'));
    ib(116000, 193300, 117300, 193682, 1829, s('ems supply cabinet', ck(B, 'shelf_height', 1829)));
    ib(117300, 193500, 117600, 193682, 1200, s('aed in a wall case'));
    ib(112900, 193300, 113900, 193682, 1219, s('chainsaw shelf with bar oil', ck(B, 'shelf_height', 1219)));
    ib(109700, 193700, 111600, 193760, 1000, s('shift roster whiteboard'));
    line('interior', C.int, circ(116600, 191800, 290, 900, 10), s('class a foam drum'), {closed: true});
    line('interior', C.int, circ(116600, 191150, 290, 900, 10), s('second foam drum'), {closed: true});
    ib(115800, 189300, 116700, 190100, 900, s('hose testing machine'));
    ib(113000, 181790, 113800, 181900, 1300, s('portable radio chargers on the wall'));
    ib(114600, 183300, 115100, 183800, 457, s('watch desk chair'));
    ib(113900, 181790, 115700, 181850, 1400, s('district map behind the watch desk'));
    mark('interior', 116000, 181800, 1000, s('dry chemical extinguisher by the front door'));
    mark('interior', 100600, 193600, 1000, s('dry chemical extinguisher by the loft stair'));
    ib(107000, 192400, 108000, 193000, 762, s('wildland pack staging bench'));
    ib(107100, 192500, 107500, 192900, 1100, s('wildland pack one'));
    ib(107550, 192500, 107950, 192900, 1100, s('wildland pack two'));
    ib(102700, 191500, 106300, 191800, 0, s('yellow wheel chock line in bay one'));
    ib(110300, 191500, 113900, 191800, 0, s('yellow wheel chock line in bay two'));
    fan(104525, 189640, 5300, 20, s('big bay ceiling fan over engine two'));
    fan(112125, 189640, 5300, 20, s('big bay ceiling fan over the brush truck'));
    mark('electrical', 108300, 184000, 4600, s('carbon monoxide detector in the bay'));
    light(103400, 193600, 2400, s('lit exit sign over the day room door'));
    eb(116200, 192800, 116600, 193000, 2300, s('emergency light pack'));
    sym('electrical', C.brick, 'light', P(102392, 181900, 4500), 0, s('bay one door warning light', {anim: {type: 'blink', period: 1, duty: 0.5}}));
    sym('electrical', C.brick, 'light', P(109992, 181900, 4500), 0, s('bay two door warning light', {anim: {type: 'blink', period: 1, duty: 0.5}}));
    sym('electrical', C.elec, 'switch', P(106800, 181790, 1300), 0, s('bay one door open close push button'));
    sym('electrical', C.elec, 'switch', P(114400, 181790, 1300), 0, s('bay two door open close push button'));
    run('electrical', C.elec, [P(104825, 185950, 4450), P(106800, 185950, 4450), P(106800, 181790, 4450), P(106800, 181790, 1300)], s('control wire to the bay one button'));
    run('electrical', C.elec, [P(112425, 185950, 4450), P(114400, 185950, 4450), P(114400, 181790, 4450), P(114400, 181790, 1300)], s('control wire to the bay two button'));
    pb(100600, 192000, 101300, 192300, 3600, s('compressed air drop at the loft'));
    run('plumbing', C.plumb, [P(115180, 186000, -1067), P(115180, 186000, 4800), P(104525, 186000, 4800), P(104525, 186000, 4500)], s('air line for the engine shore air'));
    floor(100542, 181790, 102292, 182200, 8, 'lines', 100, 45, s('yellow and black hatch at the front door'), C.yellow);
    // bunk room
    const bunks = [[101292, 194840], [105492, 194840], [101292, 199040], [105492, 199040]];
    bunks.forEach(([x, y], i) => {
      floor(x, y, x + 1000, y + 2000, 640, 'lines', 200, 0, s('wool blanket on bunk ' + (i + 1)), C.brick);
      ib(x + 100, y + 1650, x + 900, y + 1950, 700, s('pillow on bunk ' + (i + 1)));
      ib(x + 100, y - 600, x + 900, y - 150, 450, s('footlocker at bunk ' + (i + 1)));
    });
    mark('electrical', 103800, 197500, 2743, s('bunk room smoke alarm'));
    sym('electrical', C.brick, 'light', P(103800, 196500, 2700), 0, s('red night light for calls'));
    mark('electrical', 104200, 202800, 2400, s('bunk room alert speaker'));
    // day room
    ib(107500, 199700, 108100, 200500, 450, s('day room coffee table'));
    ib(109300, 199500, 109536, 200800, 762, s('game console on the tv stand'));
    ib(106200, 202500, 107700, 202826, 1829, s('day room bookshelf of training manuals'));
    mark('electrical', 107800, 200100, 2743, s('day room smoke alarm'));
    outlet(109536, 200000, 406, s('tv stand outlet'));
    // kitchen
    ib(116300, 202300, 116900, 202700, 930, s('cutting board with onions'));
    line('interior', C.int, circ(115490, 202426, 160, 1150, 10), s('stockpot of green chile stew on the range'), {closed: true});
    line('interior', C.int, [P(113000, 202826, 1500), P(113300, 202826, 1500)], s('magnetic knife strip'));
    ib(117980, 196000, 118530, 196900, 900, s('ice machine'));
    run('plumbing', C.plumb, [P(115180, 196500, -1067), P(118250, 196500, -1067), P(118250, 196500, 900)], s('ice machine water line'));
    run('plumbing', C.sewer, [P(118250, 196300, 200), P(118250, 196300, -600), P(114480, 196300, -700)], s('ice machine floor drain'));
    ib(116300, 194100, 117200, 194600, 1500, s('weekly meal menu board'));
    line('interior', C.int, circ(112600, 199800, 220, 700, 8), s('kitchen trash can'), {closed: true});
    line('interior', C.int, circ(112600, 200400, 220, 700, 8), s('recycling bin'), {closed: true});
    ib(116200, 198720, 116640, 199160, 457, s('sixth kitchen chair'));
    run('plumbing', C.brick, [P(115300, 202476, 1950), P(116062, 202476, 1950), P(116062, 202676, 1950)], s('hood fire suppression nozzle pipe'));
    mark('interior', 116300, 202826, 1300, s('class k extinguisher by the range'));
    mark('electrical', 114180, 200800, 2743, s('kitchen heat detector'));
    // washroom
    ib(109536, 195200, 109636, 195800, 1500, s('towel hooks'));
    ib(111200, 193982, 111400, 194060, 1100, s('soap dispenser'));
    // life
    person(P(117400, 184800), -Math.PI / 2, 'standing', 'laying out turnouts by the locker');
    person(P(116200, 190450), 0, 'standing', 'pressure testing a length of hose');
    person(P(102300, 189500), 0, 'standing', 'folding the station flag');
    person(P(116650, 192800), 0, 'standing', 'restocking the ems cabinet');
    person(P(108500, 192600), 0, 'standing', 'checking water in the wildland packs');
    person(P(110650, 193250), 0, 'standing', 'writing the shift roster on the board');
    person(P(114700, 198900), 0, 'standing', 'wiping down the long table');
    person(P(117450, 196450), Math.PI / 2, 'standing', 'scooping ice into a cooler');
    person(P(108500, 199900), Math.PI / 2, 'sitting', 'playing a video game on break');
    person(P(106900, 202000), 0, 'standing', 'studying a pump operations manual');
  }

  // ----- Tamarisk Flat Fire Training Hall, new, east of the hose tower -----
  {
    const N = 'Tamarisk Flat Fire Training Hall';
    const s = I(N);
    const x0 = 132000, y0 = 184000, x1 = 146000, y1 = 194000, xm = 140000;
    wall(N, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 4267, -610, true);
    wall(N, [[xm, y0], [xm, y1]], 4267, -610, false);
    hatch('structure', C.struct, vface(x0, y0, x1, y0, 0, 4267), 'lines', 300, 0, s('tan metal siding, south face'), C.brick);
    hatch('structure', C.struct, vface(x0, y0, x0, y1, 0, 4267), 'lines', 300, 0, s('tan metal siding, west face'), C.brick);
    hatch('structure', C.roof, [P(x0 - 300, y0 - 300, 4400), P(x1 + 300, y0 - 300, 4400), P(x1 + 300, y1 + 300, 4800), P(x0 - 300, y1 + 300, 4800)], 'lines', 600, 90, s('standing seam roof'), C.struct);
    line('structure', C.struct, rect4(x0 + 150, y0 + 150, xm - 150, y1 - 150, 3048), s('classroom ceiling grid', {checks: [['ceiling_height', 3048]]}), {closed: true});
    floor(x0 + 150, y0 + 150, xm - 150, y1 - 150, 3048, 'cross', 600, 0, s('acoustic ceiling tile'));
    line('structure', C.struct, [P(xm + 100, y0 + 5000, 3700), P(x1 - 100, y0 + 5000, 3700)], s('steel beam across the cache', {checks: [['beam_height', 3700]]}));
    door(N, 135000, y0, 'x', 914, 'classroom front door');
    door(N, 136200, y0, 'x', 914, 'classroom second leaf', -1);
    door(N, xm, 191000, 'y', 914, 'door between the classroom and cache');
    line('structure', C.struct, vface(141000, y0, 145000, y0, 0, 3658), s('roll up door to the equipment cache'), {closed: true});
    // classroom
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const tx = 133500 + c * 3000, ty = 186000 + r * 1900;
      ib(tx, ty, tx + 1830, ty + 600, 762, s('training table row ' + (r + 1) + ' seat ' + (c + 1)));
      ib(tx + 250, ty - 500, tx + 700, ty - 50, 457, s('stacking chair row ' + (r + 1) + ' seat ' + (c * 2 + 1)));
      ib(tx + 1100, ty - 500, tx + 1550, ty - 50, 457, s('stacking chair row ' + (r + 1) + ' seat ' + (c * 2 + 2)));
    }
    ib(x0 + 150, 186000, x0 + 250, 191500, 900, s('whiteboard on the west wall'));
    ib(x0 + 150, 186500, x0 + 200, 191000, 2300, s('pull down projector screen'));
    eb(135900, 189000, 136300, 189400, 3000, s('ceiling projector'));
    ib(132800, 188200, 133400, 189200, 1067, s('instructor lectern'));
    ib(138500, 193500, 139850, 193850, 1829, s('shelf of hose appliances for class', ck(B, 'shelf_height', 1829)));
    ib(136500, 193400, 138300, 193850, 914, s('coffee counter on the north wall', ck(B, 'counter_height', 914)));
    ib(137600, 193500, 137900, 193800, 1050, s('coffee urn'));
    ib(132300, 192800, 133800, 193800, 450, s('cpr manikins in their cases'));
    ib(134000, 193500, 135400, 193850, 1100, s('extinguisher training props'));
    mark('interior', 136000, 193990, 2600, s('classroom wall clock'));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) light(133500 + i * 2400, 186500 + j * 4500, 3048, s('troffer light ' + (i * 2 + j + 1)));
    mark('electrical', 136000, 189000, 3048, s('classroom smoke alarm'));
    outlet(x0 + 150, 189000, 457, s('west wall outlet'));
    outlet(139850, 193700, 1067, s('coffee counter outlet'));
    outlet(136000, 184150, 457, s('south wall outlet'));
    eb(139700, 184300, 139850, 185100, 1500, s('hall panelboard'));
    sym('electrical', C.elec, 'switch', P(135000 - 150, y0 + 150, 1219), 0, s('classroom light switch'));
    ib(136000, 191800, 137000, 192800, 2900, s('evaporative cooler supply grille'));
    fan(134500, 190000, 3000, 45, s('classroom ceiling fan'));
    floor(x0 + 150, y0 + 150, xm - 150, y1 - 150, 5, 'cross', 450, 0, s('vinyl tile floor'), C.int);
    // equipment cache
    for (let i = 0; i < 4; i++) ib(xm + 300, 186000 + i * 1800, xm + 1000, 187400 + i * 1800, 2134, s('wildland shelf bay ' + (i + 1) + ', fire shelters and pulaskis', i < 2 ? ck(B, 'shelf_height', 2134) : {}));
    for (let i = 0; i < 4; i++) line('interior', C.int, circ(143000 + i * 700, 193300, 300, 700, 10), s('rolled hose bundle ' + (i + 1)), {closed: true});
    ib(144500, 186000, 145800, 189000, 2000, s('hand tool rack, mcleods and shovels'));
    ib(142500, 188500, 144000, 189300, 900, s('drip torch fuel cans on a spill tray'));
    pb(145400, 191000, 145850, 191500, 900, s('utility sink'));
    ib(142000, 184400, 144500, 185200, 0, s('painted keep clear zone at the roll up'));
    light(143000, 189000, 3600, s('cache high bay light'));
    mark('electrical', 143000, 191000, 3600, s('cache smoke alarm'));
    outlet(x1 - 150, 188000, 1219, s('cache bench outlet'));
    floor(xm + 150, y0 + 150, x1 - 150, y1 - 150, 5, 'dots', 600, 0, s('sealed concrete cache floor'), C.int);
    // services
    run('plumbing', C.plumb, [P(145600, 191200, 600), P(145600, 191200, -1067), P(145600, 159696, -1067)], s('water service from the Mesquite Street main'));
    run('plumbing', C.sewer, [P(145700, 191300, 0), P(145700, 191300, -900), P(145700, 160896, -1829)], s('building sewer to the Mesquite Street main'));
    run('plumbing', C.plumb, [P(137800, 193650, 914), P(137800, 193650, -900), P(145600, 193650, -900), P(145600, 191200, -1067)], s('cold water to the coffee counter'));
    run('electrical', C.elec, [P(139750, 184700, 1500), P(139750, 184700, -600), P(131000, 184700, -600), P(131000, 202500, -600), P(118000, 202500, -600), P(118000, 202500, 1500)], s('underground feeder from the station panel'));
    // site
    sym('structure', C.sign, 'sign', P(133500, 182400), 0, {text: N});
    line('paving', C.curb, [P(135400, 183900), P(135200, 182000), P(134600, 180000), P(133700, 178000), P(132400, 176000), P(131000, 174200), P(129500, 172900), P(128000, 172000)], {part: 'curving decomposed granite walk to the training hall'});
    for (let i = 0; i < 4; i++) {
      const sx = 137000 + i * 2743;
      line('paving', C.white, [P(sx, 176000), P(sx, 181486)], {part: 'stall stripe', checks: [['stall_width', 2743], ['stall_depth', 5486]]});
    }
    line('paving', C.white, [P(137000 + 4 * 2743, 176000), P(137000 + 4 * 2743, 181486)], {part: 'stall stripe'});
    hatch('paving', C.curb, [P(137000, 176000), P(147972, 176000), P(147972, 181486), P(137000, 181486)], 'dots', 900, 0, {part: 'gravel training lot'});
    sym('vehicle', C.car, 'truck', P(138371, 178743), 0, {part: 'battalion pickup'});
    sym('vehicle', C.car2, 'car', P(141114, 178743), 0, {part: 'student car'});
    tree(130000, 188000, 3, 6);
    tree(147500, 192500, 4, 5);
    line('vegetation', C.veg2, blob(130200, 192500, 1200, 10, 8), {part: 'desert marigold bed by the hall'}, {closed: true});
    line('vegetation', C.veg, wavy(132000, 195200, 146000, 195200, 350, 16, 9), {part: 'gravel swale behind the training hall'});
    person(P(133100, 187700), 0, 'standing', 'teaching a class on fire shelters');
    person(P(134700, 185300), 0, 'sitting', 'taking notes in the front row');
    person(P(137700, 187200), 0, 'sitting', 'raising a hand with a question');
    person(P(133000, 192400), 0, 'standing', 'unpacking a cpr manikin');
    person(P(137400, 193000), 0, 'standing', 'filling a cup at the coffee urn');
    person(P(141300, 187000), Math.PI / 2, 'standing', 'counting pulaskis on the shelf');
    person(P(143300, 192600), 0, 'standing', 'rolling a hose bundle tight');
    person(P(138000, 182600), Math.PI, 'walking', 'walking in late to the class', {type: 'path', speed: 1200, pts: [P(138000, 182600), P(135900, 183500), P(135900, 182000), P(138000, 182600)]});
  }
  function rect4(x0, y0, x1, y1, z) { return [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]; }
};
