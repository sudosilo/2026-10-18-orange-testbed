// 2026-10-24 b: deepen blocks 3,2 and 3,3, untouched since 10-22.
// 3,2: Mesa Lantern Cafe walk in and kitchen, Jackrabbit Tire and Lube bays, Creosote Flats Post Office lobby and workroom,
//      Bitterwater Irrigation District Office radio room.
// 3,3: Sun Dog Donut Counter kitchen, Burro Flats Welding and Fab shop, Dry Lake Implement Sales showroom and parts room,
//      Saltcedar Grange Hall chairs, stage and kitchen.
export default async (k) => {
  const {P, C, box, line, sym, hatch, run, person, circ, vface} = k;
  const I = (b) => (part, extra = {}) => Object.assign({building: b, part}, extra);
  const face = (disc, col, ax, ay, bx, by, z0, z1, meta) => line(disc, col, vface(ax, ay, bx, by, z0, z1), meta, {closed: true});
  const used = {};
  const ck = (blk, type, v) => { const key = blk + type; used[key] = (used[key] || 0) + 1; return used[key] <= 8 ? {checks: [[type, v]]} : {}; };
  const light = (x, y, z, m) => sym('electrical', C.elec, 'light', P(x, y, z), 0, m);
  const mark = (disc, x, y, z, m) => sym(disc, disc === 'plumbing' ? C.plumb : disc === 'electrical' ? C.elec : C.int, 'mark', P(x, y, z), 0, m);
  const fan = (x, y, z, rpm, m) => sym('electrical', C.elec, 'mark', P(x, y, z), 0, Object.assign(m, {anim: {type: 'spin', rpm}}));
  const ib = (x0, y0, x1, y1, z, m) => box('interior', C.int, x0, y0, x1, y1, z, m);
  const eb = (x0, y0, x1, y1, z, m) => box('electrical', C.elec, x0, y0, x1, y1, z, m);
  const pb = (x0, y0, x1, y1, z, m) => box('plumbing', C.plumb, x0, y0, x1, y1, z, m);
  const floor = (x0, y0, x1, y1, z, pat, sp, ang, m, c2) => hatch('structure', C.struct, [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], pat, sp, ang, m, c2);
  // Existing ground symbols, so new chairs never land on a person already there.
  const people = [];
  for (const key of ['3:2', '3:3']) for (const r of k.W.chunks.get(key).records) if (!r.hidden && r.kind === 'symbol' && ['person', 'dog', 'table'].includes(r.type)) people.push(r.at);
  const clear = (x, y, d) => people.every(a => Math.hypot(a[0] - x, a[1] - y) > d);

  // ================= Block 3,2 =================
  let B = '3:2';
  const outlet = (x, y, z, m) => sym('electrical', C.elec, 'outlet', P(x, y, z), 0, Object.assign(m, ck(B, 'outlet_height', z)));

  // ----- Mesa Lantern Cafe -----
  {
    const s = I('Mesa Lantern Cafe');
    // walk in cooler 251038-253888 x 178632-181282
    ib(251200, 181000, 253700, 181250, 400, s('walk in wire shelf, cases of eggs'));
    ib(251200, 181000, 253700, 181250, 1100, s('walk in wire shelf, milk and cream'));
    ib(251200, 181000, 253700, 181250, 1800, s('walk in wire shelf, butter and cheese'));
    ib(251200, 178900, 251550, 180800, 600, s('walk in wire shelf, lettuce and tomatoes'));
    ib(251200, 178900, 251550, 180800, 1400, s('walk in wire shelf, green chile tubs'));
    eb(252000, 180850, 253300, 181250, 2250, s('walk in evaporator coil'));
    fan(252350, 181050, 2200, 60, s('evaporator fan one'));
    fan(252950, 181050, 2200, 60, s('evaporator fan two'));
    mark('interior', 253700, 179100, 1500, s('dial thermometer in the walk in'));
    light(252500, 179800, 2400, s('vapor tight walk in light'));
    eb(251500, 179300, 252700, 180300, 4750, s('walk in condensing unit on the roof'));
    run('plumbing', C.plumb, [P(252100, 179800, 4750), P(252100, 179800, 3200), P(252100, 180850, 2400)], s('refrigerant line set to the evaporator'));
    run('plumbing', C.sewer, [P(252600, 181050, 2250), P(253800, 181050, 2250), P(253800, 181050, 150)], s('evaporator condensate drain'));
    // kitchen
    ib(254888, 180832, 259388, 181132, 1400, s('pass shelf over the prep line'));
    line('electrical', C.brick, [P(255000, 180982, 1750), P(259200, 180982, 1750)], s('infrared heat lamp strip over the pass'));
    line('interior', C.int, circ(256400, 180982, 140, 1450, 8), s('stack of warm plates on the pass shelf'), {closed: true});
    ib(258400, 181200, 258800, 181500, 1130, s('four slice toaster on the prep line'));
    ib(257600, 181200, 258050, 181550, 1050, s('waffle iron'));
    ib(252100, 181700, 252700, 182400, 1829, s('speed rack of sheet pans'));
    ib(252900, 182900, 253600, 183600, 1700, s('bread rack of buns and tortillas'));
    ib(265288, 181300, 265738, 182700, 1829, s('clean dish shelving on the east wall'));
    run('plumbing', C.plumb, [P(261588, 183600, 914), P(261588, 183600, 1600), P(261588, 183300, 1600)], s('pre rinse spray valve over the sink'));
    run('plumbing', C.plumb, [P(254888, 183600, 600), P(259388, 183600, 600)], s('black iron gas manifold behind the cook line'));
    run('plumbing', C.plumb, [P(255800, 183600, 600), P(255800, 183400, 500)], s('gas drop to the griddle'));
    run('plumbing', C.plumb, [P(257300, 183600, 600), P(257300, 183400, 500)], s('gas drop to the fryers'));
    run('plumbing', C.plumb, [P(258600, 183600, 600), P(258600, 183400, 500)], s('gas drop to the range'));
    mark('plumbing', 254700, 183600, 900, s('gas shutoff valve with a red handle'));
    run('plumbing', C.plumb, [P(254400, 183600, 600), P(254400, 184100, 600)], s('gas service from the meter on the back wall'));
    eb(255500, 183450, 256200, 183650, 2400, s('hood light and fan switch box'));
    run('electrical', C.elec, [P(265738, 179800, 2600), P(259000, 179800, 2600), P(259000, 180732, 2600)], s('conduit to the pass heat lamps'));
    // dining room and counter
    ib(256300, 177700, 256550, 177950, 1500, s('milkshake spindle mixer'));
    line('interior', C.int, circ(257400, 177830, 150, 1250, 10), s('cake stand with a lemon meringue pie'), {closed: true});
    ib(264700, 171900, 265600, 172300, 1300, s('gumball and toy vending machines by the door'));
    ib(263600, 174800, 264000, 175200, 762, s('wooden high chair'));
    line('interior', C.int, [P(251888, 171700, 2250), P(256888, 171700, 2250)], s('roll up blinds over the west window'));
    line('interior', C.int, [P(258888, 171700, 2250), P(264888, 171700, 2250)], s('roll up blinds over the east window'));
    hatch('structure', C.struct, vface(251038, 171790, 251038, 175400, 0, 1067), 'lines', 150, 90, s('knotty pine wainscot on the dining room wall'), C.brick);
    // restroom
    ib(251038, 177300, 251160, 177500, 600, s('toilet paper dispenser'));
    ib(253400, 178500, 253550, 178582, 1100, s('soap dispenser by the mirror'));
    line('interior', C.int, circ(253500, 176200, 180, 600, 8), s('restroom trash can'), {closed: true});
    light(252000, 176200, 2743, s('restroom ceiling light'));
    person(P(252600, 180000), 0, 'standing', 'pulling a crate of milk from the walk in');
    person(P(264900, 182000), Math.PI / 2, 'standing', 'stacking clean plates on the shelf');
    person(P(263300, 173000), Math.PI, 'standing', 'seating a family at booth four');
    person(P(265100, 172800), Math.PI, 'standing', 'buying gum from the machine by the door');
  }

  // ----- Jackrabbit Tire and Lube -----
  {
    const s = I('Jackrabbit Tire and Lube');
    ib(287038, 182200, 287638, 184400, 914, s('steel workbench on the west wall', ck(B, 'counter_height', 914)));
    ib(287100, 183000, 287400, 183250, 1050, s('bench vise'));
    ib(287150, 183500, 287550, 183900, 1000, s('tpms sensor tool and valve stem drawers'));
    pb(298000, 178400, 298738, 179400, 900, s('solvent parts washer'));
    ib(292300, 174300, 293400, 175000, 1100, s('brake lathe on its stand'));
    ib(292400, 173700, 293300, 173800, 1500, s('wheel weight rack on the front wall'));
    outlet(293200, 173790, 1219, s('240 volt receptacle for the brake lathe'));
    ib(287100, 176700, 287400, 177700, 200, s('three ton floor jack'));
    line('interior', C.int, circ(298300, 182900, 180, 500, 8), s('jack stand one'), {closed: true});
    line('interior', C.int, circ(298300, 183400, 180, 500, 8), s('jack stand two'), {closed: true});
    ib(290400, 176000, 291400, 176450, 100, s('rolling creeper'));
    ib(294400, 175600, 294900, 176100, 900, s('transmission jack'));
    eb(297000, 175200, 297600, 175800, 900, s('battery charger cart'));
    eb(297100, 175300, 297300, 175500, 1000, s('handheld battery tester on the cart'));
    ib(298300, 180300, 298738, 181200, 1219, s('shelf of new batteries', ck(B, 'shelf_height', 1219)));
    pb(287038, 181900, 287300, 182150, 2400, s('air hose reel on the west wall'));
    pb(298600, 179600, 298738, 180200, 2400, s('gear oil hose reel'));
    pb(298600, 177950, 298738, 178350, 2400, s('transmission fluid hose reel'));
    ib(298200, 177900, 298700, 178300, 900, s('oil filter crusher'));
    line('plumbing', C.plumb, circ(298400, 176500, 300, 900, 10), s('waste antifreeze drum'), {closed: true});
    pb(286950, 184500, 287150, 184700, 1100, s('plumbed eyewash station'));
    ib(287038, 179300, 287100, 179900, 1500, s('torque stick set on a wall rack'));
    fan(287500, 174300, 900, 90, s('drum fan blowing through bay one'));
    eb(298738, 184000, 298838, 184400, 1500, s('air compressor disconnect switch'));
    run('electrical', C.elec, [P(298738, 176296, 2000), P(298738, 184200, 2000), P(298738, 184200, 1500)], s('conduit to the compressor disconnect'));
    // office and restroom
    ib(285900, 176500, 286738, 176900, 1800, s('wiper blade display rack'));
    ib(281038, 174200, 281338, 174500, 900, s('magazine rack of truck trader'));
    pb(286200, 175600, 286700, 176000, 1100, s('bottled water cooler'));
    ib(282000, 179640, 282300, 179800, 1200, s('after hours key drop box'));
    ib(284000, 181700, 286000, 182400, 762, s('service writer desk'));
    eb(284200, 181900, 284400, 182100, 800, s('desk phone'));
    eb(285200, 181900, 285500, 182200, 820, s('oil change sticker printer'));
    hatch('structure', C.struct, [P(281038, 173790, 5), P(286738, 173790, 5), P(286738, 179500, 5), P(281038, 179500, 5)], 'lines', 200, 0, s('vinyl plank waiting room floor'), C.int);
    line('interior', C.int, [P(281700, 185682, 840), P(282600, 185682, 840)], s('restroom grab bar'));
    ib(281900, 185600, 282100, 185682, 650, s('restroom toilet paper dispenser'));
    light(282400, 184300, 2743, s('restroom ceiling light'));
    fan(281800, 184300, 2743, 40, s('restroom exhaust fan'));
    ib(283500, 185200, 283738, 185500, 1200, s('restroom paper towel dispenser'));
    person(P(292850, 175500), Math.PI, 'standing', 'turning a brake rotor on the lathe');
    person(P(297900, 180700), Math.PI / 2, 'standing', 'pulling a battery for testing');
    person(P(282150, 179250), 0, 'standing', 'dropping keys in the after hours box');
    person(P(285600, 175550), Math.PI, 'standing', 'pouring coffee in the waiting room');
  }

  // ----- Creosote Flats Post Office -----
  {
    const s = I('Creosote Flats Post Office');
    line('interior', C.int, circ(257400, 210400, 150, 965, 8), s('queue stanchion post one'), {closed: true});
    line('interior', C.int, circ(257400, 211400, 150, 965, 8), s('queue stanchion post two'), {closed: true});
    line('interior', C.brick, [P(257400, 210400, 965), P(257400, 211400, 965)], s('retractable queue belt'));
    ib(256500, 213490, 257400, 213590, 1100, s('lobby drop slots, local and out of town'));
    mark('interior', 261800, 213590, 2600, s('wall clock behind the counter'));
    ib(263000, 213560, 264200, 213600, 2000, s('postage rate chart'));
    ib(260500, 213250, 262000, 213590, 1829, s('retail wall of boxes and padded mailers', ck(B, 'shelf_height', 1829)));
    eb(253000, 212300, 253600, 212900, 1300, s('self service postage kiosk'));
    line('interior', C.int, circ(257100, 210000, 200, 760, 8), s('lobby trash can'), {closed: true});
    hatch('structure', C.struct, [P(251038, 209790, 5), P(266738, 209790, 5), P(266738, 213490, 5), P(251038, 213490, 5)], 'dots', 250, 0, s('terrazzo lobby floor'), C.brick);
    // workroom
    for (let i = 0; i < 4; i++) light(251938 + i * 1700, 218600, 2100, s('case light over sorting case ' + (i + 1)));
    run('electrical', C.elec, [P(251888, 219440, 3400), P(251888, 218700, 2900), P(257700, 218700, 2900)], s('conduit to the case lights'));
    ib(257800, 218400, 257900, 218900, 1600, s('carrier satchels on the case end'));
    eb(251038, 215200, 251238, 216000, 1200, s('scanner charging rack'));
    ib(260200, 215700, 260600, 216000, 1000, s('rubber band and strap dispenser'));
    eb(262800, 215700, 263300, 216000, 1000, s('postage meter on the parcel table'));
    ib(257200, 216200, 258800, 216900, 762, s('supervisor desk'));
    eb(257700, 216850, 258200, 216850, 1150, s('supervisor computer monitor'));
    ib(266000, 216800, 266688, 217500, 1100, s('stamp stock safe'));
    ib(264000, 215800, 264700, 216700, 1829, s('outgoing letter tray rack'));
    ib(266538, 213800, 266738, 214400, 1500, s('first aid cabinet'));
    pb(263600, 214000, 264000, 214400, 1000, s('water cooler in the break corner'));
    ib(254000, 215000, 255000, 215600, 1500, s('rack of empty letter trays'));
    mark('interior', 254000, 219590, 2600, s('workroom wall clock'));
    light(257400, 219490, 3200, s('lit exit sign over the dock door'));
    mark('electrical', 255000, 216500, 3040, s('workroom smoke detector'));
    outlet(266738, 216200, 457, s('outlet by the safe'));
    hatch('structure', C.struct, [P(251038, 213790, 5), P(266738, 213790, 5), P(266738, 219490, 5), P(251038, 219490, 5)], 'dots', 600, 0, s('sealed concrete workroom floor'), C.int);
    person(P(266100, 210650), Math.PI / 2, 'standing', 'taping up a flat rate box');
    person(P(257000, 213050), 0, 'standing', 'dropping mail in the lobby slot');
    person(P(256800, 210850), 0, 'standing', 'waiting in line at the stanchion');
    person(P(258400, 215800), 0, 'standing', 'scanning packages before the route');
    person(P(258000, 217250), Math.PI, 'sitting', 'logging the route times at the desk');
    person(P(251700, 215600), -Math.PI / 2, 'standing', 'pulling a scanner off the charger');
  }

  // ----- Bitterwater Irrigation District Office -----
  {
    const s = I('Bitterwater Irrigation District Office');
    ib(277038, 210000, 277538, 210500, 457, s('lobby chair one'));
    ib(277038, 210700, 277538, 211200, 457, s('lobby chair two'));
    ib(282900, 209790, 283500, 210000, 1500, s('brochure rack, drought tips and order forms'));
    ib(283600, 212140, 284000, 212400, 1100, s('water order drop box'));
    eb(282500, 215500, 283900, 216300, 1000, s('wide format map plotter'));
    ib(283000, 217000, 283700, 217700, 1200, s('rack of rolled lateral maps'));
    ib(278000, 218900, 278700, 219400, 900, s('copier'));
    eb(281000, 218100, 281200, 218300, 800, s('desk phone, desk 1'));
    eb(282800, 218100, 283000, 218300, 800, s('desk phone, desk 2'));
    mark('interior', 281000, 219490, 2400, s('office wall clock'));
    sym('electrical', C.elec, 'switch', P(284738, 213000, 1524), 0, s('cooler thermostat'));
    ib(282300, 216300, 282900, 216900, 2743, s('evaporative cooler supply grille'));
    eb(285038, 212000, 285338, 212800, 1100, s('handheld radio charging rack'));
    eb(287000, 211000, 287500, 211350, 900, s('radio base station'));
    mark('electrical', 288000, 211100, 850, s('desk microphone'));
    run('electrical', C.elec, [P(287200, 211200, 900), P(287200, 211200, 3658), P(287200, 211200, 4200)], s('coax to the roof antenna'));
    line('electrical', C.elec, [P(287200, 211200, 3658), P(287200, 211200, 9000)], s('radio antenna mast on the roof'));
    sym('electrical', C.brick, 'light', P(287200, 211200, 9050), 0, s('red beacon on the mast', {anim: {type: 'blink', period: 2, duty: 0.5}}));
    ib(290600, 214500, 290738, 215400, 1500, s('board of gate padlock keys'));
    eb(289600, 210700, 290000, 211300, 500, s('battery backup for the radio'));
    eb(289900, 215700, 290700, 216400, 1829, s('telemetry modem and network rack'));
    ib(284938, 214000, 285100, 214700, 1700, s('ditch rider hard hats on hooks'));
    ib(289900, 217700, 290600, 218100, 400, s('rubber irrigation boots by the yard door'));
    eb(286950, 216700, 287300, 216950, 1000, s('coffee maker on the break table'));
    pb(284938, 218900, 285338, 219300, 914, s('drinking fountain'));
    hatch('structure', C.struct, [P(277038, 209790, 5), P(284738, 209790, 5), P(284738, 219490, 5), P(277038, 219490, 5)], 'cross', 500, 0, s('blue carpet tile in the office'), C.int);
    person(P(283800, 211700), 0, 'standing', 'dropping off a water order form');
    person(P(283200, 215000), 0, 'standing', 'plotting a new lateral map');
    person(P(285700, 212400), -Math.PI / 2, 'standing', 'charging a radio for the night shift');
    person(P(289700, 217300), 0, 'standing', 'pulling on rubber boots');
    person(P(281600, 217700), 0, 'sitting', 'answering the district phone');
  }

  // ================= Block 3,3 =================
  B = '3:3';
  const outlet3 = (x, y, z, m) => sym('electrical', C.elec, 'outlet', P(x, y, z), 0, Object.assign(m, ck(B, 'outlet_height', z)));

  // ----- Sun Dog Donut Counter -----
  {
    const s = I('Sun Dog Donut Counter');
    ib(253700, 256550, 254300, 256950, 700, s('flour and sugar ingredient bins'));
    ib(253000, 257150, 253500, 257600, 1100, s('glaze warmer'));
    ib(251700, 257150, 252300, 257400, 1000, s('sprinkle and coconut bins'));
    ib(254600, 257200, 255000, 257500, 1000, s('ring donut cutter on the sheeter'));
    ib(252100, 259000, 252600, 259400, 1300, s('cake donut depositor over the fryer'));
    ib(253100, 258200, 253400, 258700, 600, s('fryer oil filter cart'));
    run('plumbing', C.plumb, [P(251700, 259300, 600), P(250600, 259300, 600)], s('gas line to the fryer'));
    mark('plumbing', 251300, 259500, 600, s('fryer gas shutoff'));
    pb(251100, 255800, 251400, 256200, 500, s('water filter for the brewers'));
    run('plumbing', C.plumb, [P(251250, 256000, 500), P(252000, 256000, 1500)], s('water line to the coffee brewer'));
    line('plumbing', C.sewer, circ(254500, 258300, 100, 0, 6), s('kitchen floor drain'), {closed: true});
    line('plumbing', C.sewer, circ(256700, 259500, 120, 0, 6), s('floor sink under the three compartment sink'), {closed: true});
    ib(253488, 254488, 254388, 254788, 950, s('tray of maple bars'));
    ib(254388, 254488, 255388, 254788, 950, s('tray of apple fritters'));
    ib(255388, 254488, 256388, 254788, 950, s('tray of chocolate cake donuts'));
    ib(254200, 255850, 254800, 256200, 1000, s('stack of folded dozen boxes'));
    ib(259700, 254000, 260738, 254600, 914, s('cream and sugar station', ck(B, 'counter_height', 914)));
    ib(259900, 254100, 260300, 254400, 1000, s('cup lid and sleeve caddy'));
    ib(257600, 255800, 258200, 256200, 900, s('trash and tray return'));
    mark('interior', 257400, 256338, 2400, s('wall clock'));
    fan(256000, 253000, 2600, 70, s('ceiling fan over the tables'));
    ib(259700, 259700, 259900, 259788, 650, s('restroom toilet paper dispenser'));
    ib(260638, 256800, 260738, 257100, 1200, s('restroom paper towel dispenser'));
    ib(260650, 257900, 260738, 258050, 1100, s('restroom soap dispenser'));
    fan(259400, 257800, 2743, 40, s('restroom exhaust fan'));
    line('interior', C.int, circ(260400, 256800, 150, 600, 8), s('restroom trash can'), {closed: true});
    person(P(254000, 257300), 0, 'standing', 'cutting rings with the donut cutter');
    person(P(253700, 258400), Math.PI, 'standing', 'filtering the fryer oil');
    person(P(260200, 253650), 0, 'standing', 'stirring creamer into a coffee');
    person(P(257900, 255350), 0, 'standing', 'dropping a tray at the return');
  }

  // ----- Burro Flats Welding and Fab -----
  {
    const s = I('Burro Flats Welding and Fab');
    ib(284200, 256000, 284738, 257800, 1500, s('gas cylinder rack chained to the wall'));
    line('plumbing', C.plumb, circ(284450, 256300, 115, 1500, 8), s('oxygen cylinder'), {closed: true});
    line('plumbing', C.plumb, circ(284450, 256800, 150, 1100, 8), s('acetylene cylinder'), {closed: true});
    line('plumbing', C.plumb, circ(284450, 257300, 115, 1500, 8), s('spare argon cylinder'), {closed: true});
    ib(282600, 262300, 283600, 263400, 1600, s('hydraulic ironworker'));
    outlet3(284738, 263400, 1219, s('240 volt receptacle for the ironworker'));
    ib(273300, 253200, 276300, 254200, 1800, s('press brake'));
    face('interior', C.brick, 277600, 258900, 277600, 261200, 0, 1800, s('red vinyl welding screen between the tables'));
    ib(281500, 254500, 283800, 255300, 914, s('steel workbench', ck(B, 'counter_height', 914)));
    ib(281700, 254700, 282000, 254950, 1050, s('six inch bench vise'));
    ib(282300, 254700, 282900, 255000, 1000, s('angle grinders on the bench'));
    ib(283100, 254700, 283500, 255000, 1100, s('magnetic base drill'));
    ib(273300, 256200, 274100, 256800, 900, s('abrasive chop saw on a stand'));
    ib(284738, 258300, 284838, 259000, 1600, s('welding helmets and gloves on hooks'));
    ib(281800, 264000, 283000, 265400, 900, s('scrap steel bin'));
    ib(267038, 260500, 267600, 262000, 1500, s('sheet rack of 4 by 8 plate on edge'));
    ib(267038, 256900, 267400, 257800, 1600, s('grinding disc and wire wheel shelf', ck(B, 'shelf_height', 1600)));
    line('interior', C.int, [P(267200, 266600, 0), P(267200, 266600, 1200), P(270000, 266600, 1200), P(270000, 266600, 0)], s('finished stock gate leaning on the north wall'));
    fan(283800, 258000, 1400, 80, s('pedestal shop fan'));
    fan(266938, 263000, 3600, 50, s('wall exhaust fan'));
    eb(276000, 257800, 276400, 258200, 4500, s('retractable drop cord reel'));
    ib(284738, 255500, 284838, 255800, 1300, s('eye wash bottle station'));
    hatch('structure', C.struct, [P(273038, 251038, 5), P(284738, 251038, 5), P(284738, 266738, 5), P(273038, 266738, 5)], 'dots', 400, 0, s('oil stained concrete shop floor'), C.curb);
    // office 266888-272888 x 250888-256888
    line('interior', C.int, circ(270900, 255250, 250, 457, 8), s('office chair'), {closed: true});
    ib(272738, 252000, 272838, 252600, 1600, s('steel supplier wall calendar'));
    eb(268500, 250938, 269300, 251338, 1500, s('window air conditioner'));
    ib(271500, 256200, 271900, 256500, 1000, s('office coffee maker'));
    eb(267600, 256300, 268200, 256738, 800, s('large format drawing printer'));
    person(P(274800, 254700), Math.PI, 'standing', 'bending a bracket on the press brake');
    person(P(283000, 261950), 0, 'standing', 'punching holes on the ironworker');
    person(P(282300, 254000), 0, 'standing', 'grinding a weld smooth at the bench');
    person(P(283700, 257000), -Math.PI / 2, 'standing', 'swapping an empty argon bottle');
    person(P(273700, 257300), Math.PI, 'standing', 'cutting angle iron on the chop saw');
  }

  // ----- Dry Lake Implement Sales -----
  {
    const s = I('Dry Lake Implement Sales');
    ib(290988, 251200, 291300, 252000, 1500, s('brochure rack of tractor and mower brochures'));
    ib(290988, 252400, 291300, 253600, 1600, s('toy tractor display shelf'));
    ib(290938, 254000, 291038, 254800, 1500, s('pegboard of mower blades'));
    ib(290988, 255900, 291500, 256738, 914, s('customer coffee station'));
    ib(304600, 253500, 304738, 255000, 1500, s('chainsaw display on the east wall'));
    ib(304638, 255200, 304738, 256700, 1400, s('string trimmer display'));
    ib(301600, 255800, 302900, 256700, 1219, s('shelf of bar oil and safety chaps'));
    ib(300500, 254200, 302000, 255200, 300, s('pallet fork attachment on display'));
    ib(292800, 253985, 293206, 254391, 457, s('second customer chair'));
    eb(292600, 255200, 293000, 255500, 800, s('sales desk printer'));
    eb(291700, 255000, 291950, 255250, 800, s('sales desk phone'));
    fan(297500, 254000, 3500, 60, s('showroom ceiling fan'));
    hatch('structure', C.struct, [P(291038, 251038, 5), P(304738, 251038, 5), P(304738, 256738, 5), P(291038, 256738, 5)], 'gradient', 600, 0, s('polished concrete showroom floor'), C.curb);
    // parts room
    ib(298200, 258400, 299400, 258900, 1100, s('bolt bin drawer cabinet'));
    ib(290938, 259000, 291200, 260000, 1800, s('rack of hanging v belts'));
    ib(299800, 258400, 301200, 259000, 914, s('hose bench'));
    ib(300100, 258500, 300600, 258900, 1200, s('hydraulic hose crimper'));
    ib(301600, 258500, 302200, 259300, 1200, s('reel rack of bulk hydraulic hose'));
    ib(291888, 260088, 303388, 260688, 1676, s('middle shelf, seals and bearings'));
    ib(291888, 261688, 303388, 262288, 1676, s('middle shelf, hydraulic filters'));
    ib(291000, 261000, 291800, 262700, 600, s('floor rack of pto shafts'));
    ib(298000, 257000, 299500, 257700, 914, s('packing and shipping table'));
    eb(298200, 257300, 298700, 257600, 1100, s('shipping label printer'));
    eb(297200, 258450, 297500, 258700, 1100, s('phone on the parts counter'));
    ib(303800, 258600, 304738, 259800, 1219, s('shelf of tractor batteries'));
    mark('interior', 296000, 262738, 2400, s('parts room wall clock'));
    mark('electrical', 294000, 259500, 3040, s('parts room smoke detector'));
    mark('electrical', 298000, 253500, 3600, s('showroom smoke detector'));
    outlet3(290938, 257800, 457, s('parts room outlet by the belts'));
    hatch('structure', C.struct, [P(291038, 257038, 5), P(304738, 257038, 5), P(304738, 262738, 5), P(291038, 262738, 5)], 'dots', 600, 0, s('sealed concrete parts room floor'), C.int);
    person(P(291800, 252950), Math.PI / 2, 'standing', 'browsing the toy tractors');
    person(P(304000, 254300), -Math.PI / 2, 'standing', 'pricing a chainsaw at the wall');
    person(P(300600, 259500), Math.PI, 'standing', 'crimping a hydraulic hose');
    person(P(298700, 258000), Math.PI, 'standing', 'packing a box of parts to ship');
    person(P(292000, 256300), Math.PI / 2, 'standing', 'pouring a free coffee');
  }

  // ----- Saltcedar Grange Hall -----
  {
    const s = I('Saltcedar Grange Hall');
    face('interior', C.brick, 255900, 301600, 267800, 301600, 762, 3500, s('maroon velvet stage curtain'));
    line('interior', C.brick, [P(255900, 301500, 3550), P(267800, 301500, 3550)], s('stage curtain valance'));
    line('electrical', C.elec, [P(256000, 298950, 800), P(267800, 298950, 800)], s('stage footlight strip'));
    for (const x of [257888, 261888, 265888]) light(x, 297800, 3550, s('stage spotlight on the ceiling pipe'));
    eb(254600, 298300, 255000, 298700, 1600, s('pa speaker on a stand, west'));
    eb(268300, 298300, 268700, 298700, 1600, s('pa speaker on a stand, east'));
    mark('electrical', 263000, 299700, 1500, s('microphone on a stand'));
    ib(267500, 286100, 270600, 287000, 1100, s('cart of stacked folding chairs'));
    // chairs on both sides of every banquet table, skipping any spot where someone already stands
    let nchair = 0;
    for (const [ty0, ty1] of [[288888, 289650], [293388, 294150]]) for (const tx of [254388, 258888, 263388]) for (const dx of [500, 1500, 2500]) for (const y of [ty0 - 450, ty1 + 450]) {
      const x = tx + dx; if (!clear(x, y, 600)) continue;
      ib(x - 200, y - 200, x + 200, y + 200, 457, s('folding chair ' + (++nchair)));
    }
    face('interior', C.car2, 253038, 296300, 253038, 298300, 1200, 2400, s('blue ribbon quilt on the west wall'));
    mark('interior', 261000, 285988, 2600, s('wall clock over the front doors'));
    ib(266800, 293400, 269000, 294200, 737, s('folding table of fair canning entries'));
    ib(266900, 293500, 268900, 294100, 900, s('rows of canned peaches and salsa'));
    mark('interior', 263000, 286040, 1100, s('fire extinguisher by the front door'));
    ib(257888, 291888, 258488, 292488, 3658, s('evaporative cooler grille, west'));
    ib(264288, 291888, 264888, 292488, 3658, s('evaporative cooler grille, east'));
    hatch('structure', C.struct, [P(253038, 286038, 5), P(270738, 286038, 5), P(270738, 298800, 5), P(253038, 298800, 5)], 'lines', 150, 0, s('maple hardwood hall floor'), C.brick);
    hatch('structure', C.struct, [P(255888, 298888, 767), P(267888, 298888, 767), P(267888, 301738, 767), P(255888, 301738, 767)], 'lines', 200, 90, s('painted plank stage floor'), C.int);
    // kitchen
    run('plumbing', C.plumb, [P(276700, 301500, 600), P(273400, 301500, 600), P(273400, 301300, 500)], s('gas line to the griddle and range'));
    mark('plumbing', 276500, 301500, 900, s('griddle gas shutoff'));
    ib(271100, 295200, 271600, 295350, 1000, s('syrup pitchers on the pass'));
    ib(275000, 297000, 275900, 297700, 900, s('cart of stacked plates'));
    ib(271000, 301000, 272800, 301738, 1829, s('dish shelving on the north wall'));
    ib(275500, 293200, 276700, 294000, 400, s('sacks of pancake mix on a dunnage rack'));
    line('plumbing', C.sewer, circ(273500, 297500, 100, 0, 6), s('kitchen floor drain'), {closed: true});
    // restrooms
    for (const [y0, n] of [[285888, 'one'], [288888, 'two']]) {
      ib(276738, y0 + 1900, 276838, y0 + 2100, 650, s('toilet paper dispenser, restroom ' + n));
      ib(272000, y0 + 2788, 272300, y0 + 2938, 1200, s('paper towel dispenser, restroom ' + n));
      ib(274300, y0 + 2850, 274450, y0 + 2938, 1100, s('soap dispenser, restroom ' + n));
      fan(275200, y0 + 1500, 2743, 40, s('exhaust fan, restroom ' + n));
      line('interior', C.int, circ(271400, y0 + 600, 150, 600, 8), s('trash can, restroom ' + n), {closed: true});
    }
    person(P(268800, 287600), 0, 'standing', 'setting out folding chairs');
    person(P(253900, 297250), Math.PI / 2, 'standing', 'admiring the blue ribbon quilt');
    person(P(267900, 292700), 0, 'standing', 'judging the canning entries');
    person(P(272000, 296200), 0, 'standing', 'refilling the syrup pitchers');
    person(P(275400, 296450), Math.PI, 'standing', 'carrying a stack of plates out');
  }
};
