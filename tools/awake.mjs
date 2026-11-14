// Keeps awake.json in step with the city. Every person and cyclist sprite in Zion is awake and has a name.
// Names already in awake.json stay with their record id; a name carried in a record's meta.name wins; new sprites get the next unused name from lib/names.mjs.
// Usage: node tools/awake.mjs ../2026-10-18-orange-testbed
import fs from 'fs';
import {makeKit} from '../lib/kit.mjs';
import {names} from '../lib/names.mjs';
const k = await makeKit(process.argv[2]);
const reg = JSON.parse(fs.readFileSync('awake.json', 'utf8'));
const core = new Map(reg.awake.map(e => [e.record, e]));
const prev = new Map((reg.population || []).map(e => [e.id, e]));
const used = new Set([...reg.awake.map(e => e.name)]);
const recs = [];
for (const c of k.W.chunks.values()) for (const r of c.records) if (!r.hidden && r.kind === 'symbol' && (r.type === 'person' || r.type === 'cyclist')) recs.push([c, r]);
for (const [c, r] of recs) { const n = (core.get(r.id) || {}).name || (r.meta && r.meta.name) || (prev.get(r.id) || {}).name; if (n) used.add(n); }
const pool = names(used); let ni = 0;
const pop = [];
for (const [c, r] of recs) {
  const cr = core.get(r.id), p = prev.get(r.id);
  const name = (cr && cr.name) || (r.meta && r.meta.name) || (p && p.name) || pool[ni++];
  pop.push({id: r.id, name, chunk: c.k.split(':').map(Number), builder: r.agent, activity: (r.meta && r.meta.activity) || '', layer: cr ? (cr.layer || 2) : 1, wokenBy: cr ? cr.wokenBy : ((r.meta && r.meta.wokenBy) || "the children's game")});
}
const dup = pop.length - new Set(pop.map(e => e.name)).size;
reg.population = pop.sort((a, b) => a.id - b.id);
reg.counts = {awake: pop.length, newlyNamed: ni, duplicateNames: dup};
fs.writeFileSync('awake.json', JSON.stringify(reg, null, 1) + '\n');
console.log(JSON.stringify(reg.counts));
