#!/bin/bash
set -e

# Copy our custom pg_hba.conf to the PostgreSQL data directory
cp /tmp/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf

# Restart PostgreSQL to pick up the new configuration
pg_ctl reload -D /var/lib/postgresql/data

echo "✅ Custom pg_hba.conf applied successfully"
