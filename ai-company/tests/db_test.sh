#!/usr/bin/env bash
# Runs the migration on an empty local PostgreSQL with a Supabase-like auth stub and checks RLS, triggers and approvals.
# Usage: PGHOST=/path/to/socket PGPORT=54329 bash tests/db_test.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=aic_test_$$
psql -U postgres -qc "create database $DB" >/dev/null
trap 'psql -U postgres -qc "drop database if exists $DB" >/dev/null' EXIT
psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -f tests/supabase_stub.sql
psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/migrations/0001_init.sql 2>&1 | grep -v "does not exist, skipping" || true
psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -f tests/db_test.sql 2>&1 | grep -E "ok:|ERROR|FAIL|PASSED"
