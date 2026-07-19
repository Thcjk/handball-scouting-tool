#!/usr/bin/env bash
set -euo pipefail

echo "=== Kronenchronik Production Start ==="

# Prisma Client generieren
npx prisma generate --schema=database/prisma/schema.prisma

# Datenbank-Schema anwenden
npx prisma db push --schema=database/prisma/schema.prisma --skip-generate

# Welt seeden (ignoriert Fehler wenn schon vorhanden)
npx ts-node --compiler-options '{"module":"commonjs"}' server/prisma/seed.ts || echo "Seed übersprungen (evtl. schon vorhanden)"

echo "=== Server starten ==="
node server/dist/main.js
