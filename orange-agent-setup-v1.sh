#!/data/data/com.termux/files/usr/bin/bash
# Agent Orange runner setup v1, for Termux. Safe to run again: it reuses everything that already exists.
# Usage, from the repo folder: AGENT_KEY=the-agent-orange-key bash orange-agent-setup-v1.sh
set -e
ROOT="$HOME/2026-10-22-orange-agent"
SERVICE="orange-agent-api"
gen(){ node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))'; }
if [ -z "$AGENT_KEY" ]; then echo "Run it as: AGENT_KEY=the-agent-orange-key bash orange-agent-setup-v1.sh"; exit 1; fi

echo ""
echo "Step: Anthropic key"
AK="${ANTHROPIC_API_KEY:-}"
for d in "$HOME/blue-agent/blue-agent-backend" "$HOME/blue-agent"; do
  if [ -n "$AK" ] || [ ! -d "$d" ]; then continue; fi
  AK=$(cd "$d" && railway variables --service blue-agent-api --kv 2>/dev/null | grep '^ANTHROPIC_API_KEY=sk-ant' | head -1 | cut -d= -f2- || true)
done
LINKS=$(node -e 'try{const c=require(require("os").homedir()+"/.railway/config.json");for(const [p,v] of Object.entries(c.projects||{}))console.log(p+"\t"+(v.service||""))}catch(e){}')
while IFS="$(printf '\t')" read -r d s; do
  if [ -n "$AK" ] || [ ! -d "$d" ]; then continue; fi
  v=$(cd "$d" && railway variables --kv 2>/dev/null | grep '^ANTHROPIC_API_KEY=sk-ant' | head -1 | cut -d= -f2-)
  if [ -z "$v" ] && [ -n "$s" ]; then v=$(cd "$d" && railway variables --kv --service "$s" 2>/dev/null | grep '^ANTHROPIC_API_KEY=sk-ant' | head -1 | cut -d= -f2-); fi
  if [ -n "$v" ]; then AK="$v"; fi
done <<LIST
$LINKS
LIST
if [ -z "$AK" ]; then read -rp "Paste your Anthropic API key and press enter: " AK; fi
echo "Anthropic key found."

echo ""
echo "Step: Railway runner"
cd "$ROOT/orange-agent-backend"
if ! railway status --json 2>/dev/null | grep -q '"orange-agent"'; then railway init --name orange-agent; fi
if ! railway status --json 2>/dev/null | grep -q '"orange-agent"'; then echo "Railway did not link the orange-agent project to this folder"; exit 1; fi
railway service list --json 2>/dev/null | grep -q '"Redis"' || railway add --database redis
railway service list --json 2>/dev/null | grep -q "\"$SERVICE\"" || railway add --service "$SERVICE" --variables PORT=8080
DASH=$(railway variables --service "$SERVICE" --kv 2>/dev/null | grep '^DASH_KEY=' | cut -d= -f2- || true)
[ -n "$DASH" ] || DASH=$(gen)
railway variables --service "$SERVICE" \
  --set 'REDIS_URL=${{Redis.REDIS_URL}}' \
  --set "PORT=8080" \
  --set "DASH_KEY=$DASH" \
  --set "ANTHROPIC_API_KEY=$AK" \
  --set "GH_TOKEN=$(gh auth token)" \
  --set "AGENT_KEYS={\"agent-orange\":\"$AGENT_KEY\"}" >/dev/null
railway up --service "$SERVICE" --ci
API=$(railway domain --port 8080 --service "$SERVICE" --json 2>/dev/null | grep -o '[a-z0-9-]*\.up\.railway\.app' | head -1 || true)
[ -n "$API" ] || API=$(railway domain list --service "$SERVICE" --json 2>/dev/null | grep -o '[a-z0-9-]*\.up\.railway\.app' | head -1 || true)
for i in $(seq 1 30); do
  if curl -fs --max-time 10 "https://$API/health" | grep -q '"ok":true'; then break; fi
  echo "waiting for the runner to come up..."
  sleep 10
done
curl -s "https://$API/health"; echo ""

echo ""
echo "Step: dashboard address goes to GitHub, Vercel builds it from there"
cd "$ROOT"
gh auth setup-git >/dev/null 2>&1 || true
printf 'window.DQ_API="https://%s";\n' "$API" > orange-agent-config-v1.js
git add orange-agent-config-v1.js
git -c user.name=sudosilo -c user.email=sudosilo@users.noreply.github.com commit -q -m "Point the dashboard at the runner" || true
git pull -q --rebase origin main
git push -q origin main

echo ""
echo "SAVE THIS dashboard key: $DASH"
echo "SAVE THIS runner api address: $API"
