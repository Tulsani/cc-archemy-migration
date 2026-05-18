# Archemy RDS Setup

This folder initializes an Amazon RDS MySQL or Aurora MySQL database with the base Archemy catalog schema and seed data from `Data/DatabaseImport.sql`.

## Files

- `sql/01_schema.sql` creates the application tables and foreign keys.
- `sql/02_seed.sql` loads the base catalog rows: domains, dimensions, areas, dimension-area joins, recurring business problems, and seed KADs.
- `sql/03_routines.sql` optionally recreates the original stored procedures and `pcg` view without local `DEFINER` clauses.
- `scripts/run-rds-setup.sh` creates the database, applies the schema, loads seed data, and optionally applies routines.

## RDS Requirements

Use Amazon RDS for MySQL or Aurora MySQL. The source dump came from MySQL 5.7, and it should also run on MySQL 8.0 with normal compatibility warnings for legacy integer display widths.

Recommended setup:

- Engine: RDS MySQL 8.0, RDS MySQL 5.7, or Aurora MySQL-compatible.
- Database name: `archemy`.
- Charset/collation: `utf8` / `utf8_general_ci`.
- Port: `3306`.
- Storage: small gp3 allocation is enough for dev; enable autoscaling for shared environments.
- Backups: enable automated backups; use deletion protection outside dev.
- Networking: place RDS in private subnets for ECS/Lambda access. For local bootstrap, either temporarily allow your current IP to port `3306` or run the setup from a bastion/CloudShell/VPN inside the VPC.
- Security group: allow inbound `3306` only from your developer IP, ECS service security group, Lambda security group, or bastion security group.
- User privileges for setup: `CREATE`, `DROP`, `ALTER`, `INDEX`, `INSERT`, `UPDATE`, `DELETE`, `SELECT`, `CREATE ROUTINE`, `ALTER ROUTINE`, and `CREATE VIEW`. If you do not want routines/view yet, run with `APPLY_ROUTINES=false`.

Later, `node-app` should use env vars like:

```bash
DB_HOST=<rds-endpoint>
DB_PORT=3306
DB_NAME=archemy
DB_USER=<app-user>
DB_PASSWORD=<app-password>
DB_SSL=true
```

## Run Setup

Install a MySQL client locally first. On macOS:

```bash
brew install mysql-client
```

Then run:

```bash
cd rds-setup

export RDS_HOST=<your-rds-endpoint>
export RDS_PORT=3306
export RDS_DATABASE=archemy
export RDS_USER=<admin-or-setup-user>
export RDS_PASSWORD=<password>

./scripts/run-rds-setup.sh
```

If your MySQL client does not support `--ssl-mode`, set:

```bash
export MYSQL_SSL_MODE=DISABLED
```

If the setup user does not have routine/view privileges yet:

```bash
export APPLY_ROUTINES=false
./scripts/run-rds-setup.sh
```

## Manual Run

The script is just a convenience wrapper. The equivalent manual sequence is:

```bash
mysql --host="$RDS_HOST" --port=3306 --user="$RDS_USER" --ssl-mode=REQUIRED \
  --execute="CREATE DATABASE IF NOT EXISTS archemy CHARACTER SET utf8 COLLATE utf8_general_ci;"

mysql --host="$RDS_HOST" --port=3306 --user="$RDS_USER" --ssl-mode=REQUIRED archemy < sql/01_schema.sql
mysql --host="$RDS_HOST" --port=3306 --user="$RDS_USER" --ssl-mode=REQUIRED archemy < sql/02_seed.sql
mysql --host="$RDS_HOST" --port=3306 --user="$RDS_USER" --ssl-mode=REQUIRED archemy < sql/03_routines.sql
```

## Troubleshooting

If RDS MySQL returns `ERROR 6125 ... Missing unique key for constraint`, use this RDS schema file rather than the original dump directly. The original MySQL 5.7 dump had two legacy foreign keys on IAD assignment tables that pointed at non-unique columns. `sql/01_schema.sql` keeps the same table model but points those relationships at the intended assignment primary keys so newer RDS MySQL versions can create the schema.
