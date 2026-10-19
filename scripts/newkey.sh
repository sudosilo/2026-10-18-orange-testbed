#!/usr/bin/env bash
# Owner only. Prints the key for one agent id without changing any other key.
# Usage: bash scripts/newkey.sh agent-id
set -e
[ -z "$1" ] && { echo "Usage: bash scripts/newkey.sh agent-id"; exit 1; }
vercel env pull --environment=production .keytmp >/dev/null 2>&1 || true
KS=$(grep '^KEY_SECRET=' .keytmp 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//')
rm -f .keytmp
if [ -z "$KS" ]; then echo "Vercel would not hand back the key secret. Run bash scripts/secure-setup.sh with every agent id instead, then give each agent its new key."; exit 1; fi
echo "KEY FOR $1, SAVE THIS: $(KEY_SECRET="$KS" node scripts/keygen.mjs "$1")"
