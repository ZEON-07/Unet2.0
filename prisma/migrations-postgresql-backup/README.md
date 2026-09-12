# PostgreSQL Migrations Backup

This directory is reserved for archiving PostgreSQL migrations when migrating to SQLite.
The original backend was built with SQLite / D1 compatibility in mind.

To switch back to PostgreSQL in the future:
1. Update datasource in `prisma/schema.prisma` to `provider = "postgresql"`
2. Set `DATABASE_URL="postgresql://user:password@host:5432/inklife"`
3. Generate new migrations or restore from this backup.
