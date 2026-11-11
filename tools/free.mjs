// Lists open ground in one chunk: boxes of W by H mm with 1.5 m clear of every non street record.
// Usage: node tools/free.mjs ../2026-10-18-orange-testbed CX CY W H
import {makeKit} from '../lib/kit.mjs';
const k = await makeKit(process.argv[2]);
const [cx, cy, W, H] = process.argv.slice(3).map(Number);
const S = 79248, ox = cx * S, oy = cy * S;
const c = [...k.W.chunks.values()].find(c => c.k === cx + ':' + cy);
const pts = [];
for (const r of c.records) { if (r.hidden) continue; if (r.discipline==='street') continue;
  if (r.kind === 'symbol') pts.push([r.at[0], r.at[1]]);
  else { const s = k.eng.recSegs(r); for (let i = 0; i + 1 < s.length; i += 2) { const a = s[i], b = s[i + 1]; const n = Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]) / 300) + 1; for (let j = 0; j <= n; j++) pts.push([a[0] + (b[0]-a[0]) * j / n, a[1] + (b[1]-a[1]) * j / n]); } }
}
// ignore big hatches? report free boxes
const out = [];
for (let y = oy + 10000; y + H < oy + S - 10000; y += 1000) for (let x = ox + 10000; x + W < ox + S - 10000; x += 1000) {
  let ok = true; for (const p of pts) if (p[0] > x - 1500 && p[0] < x + W + 1500 && p[1] > y - 1500 && p[1] < y + H + 1500) { ok = false; break; }
  if (ok) out.push([x, y]);
}
console.log(out.length, JSON.stringify(out.slice(0, 15)));
