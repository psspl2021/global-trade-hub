#!/usr/bin/env bash
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

echo "Running role drift audit..."

RESULT=$(psql "$DATABASE_URL" -t -A -f sql/audits/role_drift.sql)

if [ -n "$RESULT" ]; then
  echo "❌ Drift detected:"
  echo "$RESULT"
  exit 1
else
  echo "✅ No role drift"
fi
