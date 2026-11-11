// Lists every record within M mm of a box, to check a site before building on it.
// Usage: node tools/near.mjs ../2026-10-18-orange-testbed X0 Y0 X1 Y1 M
import {makeKit} from '../lib/kit.mjs';
const k = await makeKit(process.argv[2]);
const [x0, y0, x1, y1, m] = process.argv.slice(3).map(Number);
for (const c of k.W.chunks.values()) for (const r of c.records) { if (r.hidden) continue;
  const s = r.kind === 'symbol' ? [r.at, r.at] : k.eng.recSegs(r); let hit = false;
  for (let i = 0; i + 1 < s.length && !hit; i += 2) { const a = s[i], b = s[i + 1]; const n = Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]) / 200) + 1; for (let j = 0; j <= n; j++) { const x = a[0] + (b[0]-a[0]) * j / n, y = a[1] + (b[1]-a[1]) * j / n; if (x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m) { hit = true; break; } } }
  if (hit) console.log(r.id, r.agent, r.kind, r.discipline, r.type || '', (r.meta && (r.meta.part || r.meta.activity || r.meta.street || r.meta.name)) || '', r.kind === 'symbol' ? r.at.join(',') : '');
}
