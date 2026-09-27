# SQL migrations (incremental)

Base schema is applied by `npm run migrate` from the repository root:

1. `schema.sql`
2. `schema/02-server-extensions.sql`
3. Any `*.sql` files in this directory (sorted by filename)

Add new upgrade scripts here (e.g. `000003_add_feature.sql`). Do not edit `schema.sql` for upgrades.
