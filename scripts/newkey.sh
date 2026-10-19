#!/usr/bin/env bash
# Owner only. Prints the key for one agent id without changing any other key.
# Usage: bash scripts/newkey.sh agent-id
set -e
[ -z "$1" ] && { echo "Usage: bash scripts/newkey.sh agent-id"; exit 1; }
OUT=$(curl -s -X POST https://2026-10-18-orange-testbed.vercel.app/api/ownerkey -H "Authorization: Bearer $(gh auth token)" -H "Content-Type: application/json" -d "{\"id\":\"$1\"}")
KEY=$(printf %s "$OUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.key||("ERROR: "+(j.error||s)))}catch(e){process.stdout.write("ERROR: "+s.slice(0,200))}})')
echo "KEY FOR $1, SAVE THIS: $KEY"
