# Database performance checks

Tools for checking that the database keeps up as members and messages grow. Nothing here runs
in the app.

## `benchQueries.js`: time the app's own read queries

Runs the app's real query functions against a **test copy** of the database and prints how long
each one takes, plus any table it reads in full. Only `SELECT`s are timed (with `EXPLAIN ANALYZE`).
Anything that would write is skipped and never runs. The script refuses to start unless
`DATABASE_URL` looks like a local test database.

```bash
# a throwaway database with the real schema
psql -U postgres -c "CREATE DATABASE pulse_idx_test"
DATABASE_URL=postgresql://postgres@localhost:5432/pulse_idx_test JWT_SECRET=x JWT_REFRESH_SECRET=y \
  node src/db/migrate.js
# fill it with test data at the scale you want to check (~100k members, ~5M messages
# was used for migration 051), then:
DATABASE_URL=postgresql://postgres@localhost:5432/pulse_idx_test JWT_SECRET=x JWT_REFRESH_SECRET=y \
  node scripts/bench/benchQueries.js results.json
# PLAN="chat list" prints the full plan of matching cases
```

## On the live server

Read-only queries, safe to run any time as the app's database user.

**Which queries cost the most in real use.** This needs `pg_stat_statements`, which Postgres
only collects if `shared_preload_libraries = 'pg_stat_statements'` is set in `postgresql.conf`
(restart Postgres after setting it), followed by `CREATE EXTENSION pg_stat_statements;`. Give it
a few days of traffic, then:

```sql
SELECT round(total_exec_time) AS total_ms, calls, round(mean_exec_time::numeric, 1) AS avg_ms,
       left(regexp_replace(query, '\s+', ' ', 'g'), 120) AS query
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Indexes that have never been used** since statistics were last reset. Primary keys and
unique indexes are left out because they enforce rules, not just speed. Let the app run for a
few weeks first, and remember that rare jobs (account deletion, admin pages) may not have run yet.

```sql
SELECT s.relname AS "table", s.indexrelname AS "index", s.idx_scan AS times_used,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE NOT i.indisunique AND NOT i.indisprimary
ORDER BY s.idx_scan, pg_relation_size(s.indexrelid) DESC;
```

**Check the indexes from migration 051 built properly** (`valid` should be true):

```sql
SELECT c.relname, i.indisvalid AS valid, pg_size_pretty(pg_relation_size(c.oid)) AS size
FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
WHERE c.relname IN ('idx_messages_conversation_not_read', 'idx_users_username_trgm',
                    'idx_conversations_pinned_message');
```
