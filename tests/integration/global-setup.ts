/**
 * Integration tests need a real MySQL 8.4 (the production engine).
 * Locally: `docker compose up -d` and
 *   TEST_MYSQL_URL=mysql://root:artsergi@127.0.0.1:3306 npm test
 */
export default function setup() {
  if (!process.env.TEST_MYSQL_URL) {
    throw new Error(
      'TEST_MYSQL_URL is not set. Start MySQL with `docker compose up -d` and run:\n' +
        '  TEST_MYSQL_URL=mysql://root:artsergi@127.0.0.1:3306 npm test',
    )
  }
}
