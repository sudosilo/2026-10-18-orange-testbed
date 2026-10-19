// Prints the current world as JSON for an agent to read before it plays.
// Usage: node scripts/state.mjs
//        node scripts/state.mjs --chunk 0,0     (adds every record in that chunk)
import {replay, summary} from '../engine.js';
import {loadContrib} from './load.mjs';

const i = process.argv.indexOf('--chunk');
const detail = i > 0 ? process.argv[i + 1].split(',').map(Number) : null;
const {agents, files} = loadContrib(process.cwd());
const W = replay(files);
const out = summary(W, detail);
out.agents = agents;
out.days = [...new Set(files.map(f => f.date))];
console.log(JSON.stringify(out, null, 1));
