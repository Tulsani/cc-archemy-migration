#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

RDS_PORT="${RDS_PORT:-3306}"
RDS_DATABASE="${RDS_DATABASE:-archemy}"
MYSQL_SSL_MODE="${MYSQL_SSL_MODE:-REQUIRED}"
APPLY_ROUTINES="${APPLY_ROUTINES:-true}"

required_vars=(RDS_HOST RDS_USER RDS_PASSWORD)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

MYSQL_ARGS=(
  --protocol=TCP
  --host="${RDS_HOST}"
  --port="${RDS_PORT}"
  --user="${RDS_USER}"
  --ssl-mode="${MYSQL_SSL_MODE}"
)

run_mysql() {
  MYSQL_PWD="${RDS_PASSWORD}" mysql "${MYSQL_ARGS[@]}" "$@"
}

echo "Creating database ${RDS_DATABASE} on ${RDS_HOST}:${RDS_PORT}"
run_mysql --execute="CREATE DATABASE IF NOT EXISTS \`${RDS_DATABASE}\` CHARACTER SET utf8 COLLATE utf8_general_ci;"

echo "Applying schema"
run_mysql "${RDS_DATABASE}" < "${ROOT_DIR}/sql/01_schema.sql"

echo "Loading seed rows"
run_mysql "${RDS_DATABASE}" < "${ROOT_DIR}/sql/02_seed.sql"

if [[ "${APPLY_ROUTINES}" == "true" ]]; then
  echo "Applying optional routines and view"
  run_mysql "${RDS_DATABASE}" < "${ROOT_DIR}/sql/03_routines.sql"
else
  echo "Skipping optional routines and view because APPLY_ROUTINES=${APPLY_ROUTINES}"
fi

echo "RDS initialization complete"
