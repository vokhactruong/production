import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../src/prisma/prisma.service";

/**
 * Safety gate for the Business Invariant Tests. They run against a REAL
 * Postgres database (partial-index semantics cannot be faked in-memory) and
 * they TRUNCATE tables between tests — so they must never be pointed at a
 * database that is not a dedicated test database.
 *
 * - `TEST_DATABASE_URL` must be set (the suite refuses to fall back to
 *   `DATABASE_URL`).
 * - The URL must contain "test" (e.g. database name `school_portal_test`),
 *   unless `ALLOW_ANY_DB=1` is set explicitly.
 */
export function requireTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Business Invariant Tests need a dedicated Postgres " +
        "test database with migrations applied (prisma migrate deploy). " +
        "See apps/api/test/invariants/README.md."
    );
  }
  if (!url.toLowerCase().includes("test") && process.env.ALLOW_ANY_DB !== "1") {
    throw new Error(
      "Refusing to run: TEST_DATABASE_URL does not look like a test database " +
        '(the URL must contain "test"). The suite truncates tables between tests. ' +
        "Set ALLOW_ANY_DB=1 only if you are absolutely sure."
    );
  }
  return url;
}

/**
 * Real PrismaService (the same class the services use in production), pointed
 * at the test database. PrismaService reads DATABASE_URL/DIRECT_URL from the
 * environment, so both are overridden with TEST_DATABASE_URL before
 * construction — the safety gate above has already vetted the URL.
 */
export function createTestPrisma(): PrismaService {
  const url = requireTestDatabaseUrl();
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  return new PrismaService();
}

/**
 * Tables the invariant tests write to, in one TRUNCATE (CASCADE handles FK
 * ordering). Roles/permissions are untouched — the tests build RequestUser
 * objects directly and never exercise the HTTP auth layer.
 */
const TABLES = [
  "attendances",
  "enrollments",
  "class_sessions",
  "class_schedules",
  "classes",
  "students",
  "courses",
  "subjects",
  "classrooms",
  "employees",
  "audit_logs",
  "user_roles",
  "refresh_tokens",
  "oauth_accounts",
  "users",
];

/** Per-test cleanup: wipe all fixture data so every test starts from zero. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

/** True when an error is the Postgres unique-violation surfaced by Prisma. */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
