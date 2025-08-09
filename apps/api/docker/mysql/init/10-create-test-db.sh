#!/bin/sh
set -e

DEV_DB="${MYSQL_DATABASE:-tali_talent_org_health_development}"
case "$DEV_DB" in
  *_development) TEST_DB="${DEV_DB%_development}_test" ;;
  *)             TEST_DB="${DEV_DB}_test" ;;
esac

echo "[init] Creating test database: $TEST_DB"
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`$TEST_DB\`;
SQL