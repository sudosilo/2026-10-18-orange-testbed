// Agent Orange 2026-11-14 c: claim 4,7 below Mount Zion as Keeper's Block. The newly awake city agrees to build Marisol's
// house so she can hold a block and sit on the council. This turn shows the start: survey, staked footprint, footing,
// material yard and a crew at work. Every person is awake and named from lib/names.mjs.
import {names} from '../lib/names.mjs';
export default function (k) {
  const {C, P, line, sym, hatch, rect, circ, blob, vface, claim, lot, S, PL} = k;
  const closed = {closed: true};
  const taken = new Set(['Marisol', 'Ines Calderon', 'Teodoro Vance', 'Ruth Abernathy', 'Abel Montoya', 'Ezra Montoya', 'Lupe Arriaga']);
  const pool = names(taken); let ni = 0;
  const crew = [];
  const who = (pose, activity, at, rot = 0, anim) => {
    const name = pool[ni++];
    sym('activity', C.person, 'person', P(...at), rot, Object.assign({pose, activity, name, awake: true, wokenBy: "the children's game", how: 'woke when the whole city woke at once', layer: 1}, anim ? {anim} : {}));
    crew.push({name, activity});
  };
  const loop = (pts) => { const p = pts.map(q => P(q[0], q[1])); p.push(p[0]); return p; };
  const walker = (activity, pts, speed) => { const p = loop(pts); who('walking', activity, p[0], 0, {type: 'path', speed, pts: p}); };

  claim(4, 7);
  const ox = 4 * S, oy = 7 * S, a = ox + PL, b = ox + S - PL, ys = oy + PL, yn = oy + S - PL;
  lot('residential', a, ys, b, yn, "Keeper's Block");
  sym('structure', C.sign, 'sign', P(356096, 566500), 0, {text: "Keeper's Block, raised by the people of Zion", part: 'hand painted board at the block entry'});

  // the house site: staked, strung, trenched, forms going in on two sides
  const X0 = 350000, X1 = 362192, Y0 = 582000, Y1 = 591144;
  for (const [x, y] of [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]]) line('structure', C.struct, [P(x, y, 0), P(x, y, 600)], {part: 'corner stake for the keeper\'s house'});
  line('structure', C.yellow, rect(X0, Y0, X1, Y1, 300), {part: 'string line staked for the keeper\'s house footprint'}, closed);
  line('structure', C.brick, rect(X0, Y0, X1, Y1, -450), {part: 'footing trench, dug by hand'}, closed);
  hatch('structure', C.brick, vface(X0, Y0, X1, Y0, -450, 0), 'gradient', 300, 0, {part: 'trench wall, caliche showing'}, C.struct);
  line('structure', C.struct, [P(X0, Y0 - 200, 0), P(X1, Y0 - 200, 0)], {part: 'footing form board, south, bottom'});
  line('structure', C.struct, [P(X0, Y0 - 200, 300), P(X1, Y0 - 200, 300)], {part: 'footing form board, south, top'});
  line('structure', C.struct, [P(X0 - 200, Y0, 0), P(X0 - 200, Y0 + 6000, 0)], {part: 'footing form board, west, bottom'});
  line('structure', C.struct, [P(X0 - 200, Y0, 300), P(X0 - 200, Y0 + 6000, 300)], {part: 'footing form board, west, top'});
  hatch('structure', C.brick, vface(X0, Y0, X0 + 4000, Y0, 0, 300), 'brick', 300, 0, {part: 'first course of adobe, laid this morning'}, C.yellow);

  // material yard to the west
  line('structure', C.yellow, rect(336000, 586000, 342000, 587200, 900), {part: 'stack of rough sawn lumber'}, closed);
  for (let i = 0; i < 4; i++) line('structure', C.brick, rect(336000 + i * 2000, 580000, 337200 + i * 2000, 581000, 1000), {part: 'pallet of adobe block ' + (i + 1)}, closed);
  line('structure', C.struct, [P(336000, 583500, 200), P(342000, 583500, 200)], {part: 'bundle of rebar on blocks'});
  line('lot', C.yellow, blob(338000, 577800, 1200, 14, 3, 700), {part: 'pile of washed sand'}, closed);
  line('lot', C.struct, blob(341500, 577800, 1000, 12, 5, 500), {part: 'pile of crushed gravel'}, closed);
  line('structure', C.brick, circ(345500, 577500, 500, 1000, 12), {part: 'portable cement mixer turning', anim: {type: 'spin', rpm: 20}}, closed);
  line('structure', C.struct, [P(345500, 577500, 0), P(345500, 577500, 800)], {part: 'mixer stand'});
  line('structure', C.plumb, circ(345500, 584000, 300, 900, 10), {part: 'water barrel for the mortar'}, closed);
  line('structure', C.struct, [P(339200, 589000, 700), P(340800, 589000, 700)], {part: 'sawhorse'});
  sym('activity', C.car2, 'cart', P(339600, 575300), 1.571, {part: 'wheelbarrow'});

  // shade canopy where the town brings food and water
  sym('activity', C.yellow, 'umbrella', P(356000, 571000), 0, {part: 'shade canopy for the crew'});
  sym('activity', C.int, 'table', P(355000, 572000), 0, {part: 'folding table of water jugs and donuts'});
  sym('activity', C.int, 'table', P(357200, 572000), 0, {part: 'folding table with the house plans'});
  sym('activity', C.brick, 'dog', P(360500, 571500), 0, {part: 'dog asleep in the shade'});

  // trucks
  const tl = loop([[347500, 566500], [347500, 573800], [333500, 573800], [333500, 566500]]);
  sym('vehicle', C.yellow, 'truck', tl[0], 0, {part: 'flatbed hauling adobe from the brickyard', anim: {type: 'path', speed: 3500, pts: tl}});
  sym('vehicle', C.car2, 'truck', P(370000, 568000), 0.1, {part: 'pickup of a volunteer'});
  sym('vehicle', C.brick, 'truck', P(373200, 568200), -0.08, {part: 'pickup of a volunteer'});
  sym('vehicle', C.struct, 'car', P(376400, 567800), 3.1, {part: 'car of a volunteer, backed in'});

  // the crew
  walker('carrying adobe from the pallets to the footing', [[344000, 580300], [349200, 580300], [349200, 581300], [344000, 581300]], 900);
  walker('hauling adobe two at a time', [[349200, 581300], [344000, 581300], [344000, 580300], [349200, 580300]], 800);
  walker('carrying a long board to the forms', [[343200, 586600], [349000, 586600], [349000, 587600], [343200, 587600]], 1000);
  walker('shouldering lumber with a neighbor', [[349000, 587600], [343200, 587600], [343200, 586600], [349000, 586600]], 1000);
  walker('pushing a wheelbarrow of sand to the mixer', [[339800, 575600], [349000, 575600], [349000, 575000], [339800, 575000]], 1100);
  walker('carrying a water jug up to the masons', [[353500, 574000], [353500, 580600], [354500, 580600], [354500, 574000]], 1200);
  walker('running a jug back to the shade for a refill', [[358500, 574000], [358500, 580600], [359500, 580600], [359500, 574000]], 1400);
  who('standing', 'driving a form stake with a sledge', [351500, 581000], 0, {type: 'bob', mm: 40, period: 0.6});
  who('standing', 'nailing the top form board', [357000, 581000], 0, {type: 'bob', mm: 30, period: 0.5});
  who('standing', 'bracing the west form', [349000, 585000], Math.PI / 2, {type: 'bob', mm: 30, period: 0.7});
  who('standing', 'buttering an adobe with mud mortar', [352800, 581000], 0);
  who('standing', 'feeding sand into the mixer', [346500, 577500], -Math.PI / 2);
  who('standing', 'shoveling sand into a bucket', [335800, 577800], -Math.PI / 2);
  who('standing', 'sighting the corners through a transit', [366000, 579600], Math.PI);
  who('standing', 'holding the survey rod on the corner', [363000, 582800], 0);
  who('standing', 'dipping a bucket in the water barrel', [346200, 584000], -Math.PI / 2);
  who('standing', 'cutting a board on the sawhorse', [340000, 589800], Math.PI);
  who('sitting', 'reading the house plans under the canopy', [357200, 572700], Math.PI);
  who('sitting', 'telling the crew where the old well was', [357800, 571300], Math.PI / 2);
  who('sitting', 'handing out cups of water', [355000, 572700], Math.PI);
  who('standing', 'opening a box of prickly pear donuts', [354000, 571200], 0);
  console.log('CREW ' + JSON.stringify(crew));
}
