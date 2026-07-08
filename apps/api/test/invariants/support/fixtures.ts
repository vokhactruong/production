import { ClassSession, ClassSessionStatus, Enrollment, Student } from "@prisma/client";
import { PrismaService } from "../../../src/prisma/prisma.service";
import { AuditLogsService } from "../../../src/audit-logs/audit-logs.service";
import { RequestUser } from "../../../src/auth/decorators/current-user.decorator";
import { AttendanceApplicationService } from "../../../src/attendance/attendance-application.service";
import { AttendanceRepository } from "../../../src/attendance/attendance.repository";
import { LessonConsumptionService } from "../../../src/attendance/lesson-consumption.service";
import { ClassSessionsRepository } from "../../../src/class-sessions/class-sessions.repository";
import { ClassSessionsService } from "../../../src/class-sessions/class-sessions.service";

/**
 * The REAL services, wired by hand with the real PrismaService — no mocks for
 * DB semantics, no Nest bootstrap needed. The wiring mirrors production DI
 * exactly: AttendanceApplicationService is the provider behind the
 * SESSION_COMPLETION_POLICY token (attendance.module.ts `useExisting`), so it
 * is passed to ClassSessionsService as the completion policy (D1 seam).
 */
export function buildServices(prisma: PrismaService) {
  const auditLogs = new AuditLogsService(prisma);
  const attendanceRepository = new AttendanceRepository(prisma);
  const attendance = new AttendanceApplicationService(prisma, attendanceRepository, auditLogs);
  const lessonConsumption = new LessonConsumptionService(prisma);
  const classSessionsRepository = new ClassSessionsRepository(prisma);
  const classSessions = new ClassSessionsService(
    prisma,
    classSessionsRepository,
    auditLogs,
    attendance
  );
  return {
    auditLogs,
    attendanceRepository,
    attendance,
    lessonConsumption,
    classSessionsRepository,
    classSessions,
  };
}

export type Services = ReturnType<typeof buildServices>;

let seq = 0;
/** Unique-enough codes for @unique columns (DB is truncated between tests). */
function uniq(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/** `@db.Time` columns store the time-of-day on 1970-01-01 (house convention). */
export const TIME_18 = new Date("1970-01-01T18:00:00.000Z");
export const TIME_20 = new Date("1970-01-01T20:00:00.000Z");

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function daysAgoUtc(days: number): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export function daysFromNowUtc(days: number): Date {
  return daysAgoUtc(-days);
}

export interface FixtureOptions {
  /** Number of ACTIVE students/enrollments in the class roster (default 2). */
  students?: number;
  /** Enrollment cap snapshot (default 15). */
  billingCycleSessions?: number;
  /** Overrides for the fixture ClassSession (default: ONGOING, today 18–20h). */
  session?: {
    status?: ClassSessionStatus;
    date?: Date;
  };
}

export interface FixtureGraph {
  userId: string;
  classId: string;
  session: ClassSession;
  students: Student[];
  enrollments: Enrollment[];
  /** RequestUser with attendance.read/create/update (Teacher tier). */
  teacher: RequestUser;
  /** RequestUser that additionally holds attendance.correct (Admin tier). */
  admin: RequestUser;
}

/**
 * Minimal real fixture graph the Attendance slice sits on:
 * subject → course → classroom → teacher (employee + user) → class →
 * schedule → session, plus N students with ACTIVE enrollments.
 *
 * Session default: ONGOING, dated today 18:00–20:00 UTC — inside the 48h
 * correction window for any test that runs today or tomorrow. Pass
 * `session.date: daysAgoUtc(5)` to get a session firmly outside the window.
 */
export async function seedFixtureGraph(
  prisma: PrismaService,
  options: FixtureOptions = {}
): Promise<FixtureGraph> {
  const studentCount = options.students ?? 2;

  const user = await prisma.user.create({
    data: {
      email: `${uniq("teacher")}@invariant.test`,
      firstName: "Invariant",
      lastName: "Teacher",
    },
  });
  const employee = await prisma.employee.create({
    data: {
      code: uniq("EMP"),
      firstName: "Invariant",
      lastName: "Teacher",
      employeeType: "TEACHER",
      userId: user.id,
    },
  });
  const subject = await prisma.subject.create({
    data: { code: uniq("SUB"), name: "Invariant Subject" },
  });
  const course = await prisma.course.create({
    data: {
      subjectId: subject.id,
      code: uniq("CRS"),
      name: "Invariant Course",
      packageLessons: 15,
      lessonDuration: 120,
      basePrice: 1000000,
    },
  });
  const classroom = await prisma.classroom.create({
    data: { code: uniq("ROOM"), name: "Invariant Room", type: "PHYSICAL", capacity: 30 },
  });
  const klass = await prisma.class.create({
    data: {
      code: uniq("CLS"),
      name: "Invariant Class",
      courseId: course.id,
      subjectId: subject.id,
      classroomId: classroom.id,
      employeeId: employee.id,
      status: "OPEN",
      capacity: 30,
      sessionCount: 15,
      startDate: daysAgoUtc(30),
      endDate: daysFromNowUtc(60),
    },
  });
  await prisma.classSchedule.create({
    data: {
      classId: klass.id,
      weekday: startOfTodayUtc().getUTCDay(),
      startTime: TIME_18,
      endTime: TIME_20,
    },
  });
  const session = await prisma.classSession.create({
    data: {
      classId: klass.id,
      sessionNumber: 1,
      status: options.session?.status ?? "ONGOING",
      date: options.session?.date ?? startOfTodayUtc(),
      startTime: TIME_18,
      endTime: TIME_20,
    },
  });

  const students: Student[] = [];
  const enrollments: Enrollment[] = [];
  for (let i = 0; i < studentCount; i += 1) {
    const student = await prisma.student.create({
      data: { code: uniq("STU"), firstName: "Student", lastName: `${i + 1}`, status: "ACTIVE" },
    });
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: klass.id,
        status: "ACTIVE",
        joinedAt: daysAgoUtc(30),
        billingCycleSessions: options.billingCycleSessions ?? 15,
      },
    });
    students.push(student);
    enrollments.push(enrollment);
  }

  // Permission tiers as the services see them (permissions are checked as
  // strings on RequestUser — never role names — per decisions.md).
  const teacher: RequestUser = {
    id: user.id,
    email: user.email,
    roles: ["Teacher"],
    permissions: ["attendance.read", "attendance.create", "attendance.update"],
  };
  const admin: RequestUser = {
    id: user.id,
    email: user.email,
    roles: ["Admin"],
    permissions: [
      "attendance.read",
      "attendance.create",
      "attendance.update",
      "attendance.correct",
    ],
  };

  return { userId: user.id, classId: klass.id, session, students, enrollments, teacher, admin };
}

/** Additional ClassSession on the fixture class (defaults: ONGOING, today). */
export async function createSession(
  prisma: PrismaService,
  classId: string,
  sessionNumber: number,
  data: { status?: ClassSessionStatus; date?: Date; deletedAt?: Date } = {}
): Promise<ClassSession> {
  return prisma.classSession.create({
    data: {
      classId,
      sessionNumber,
      status: data.status ?? "ONGOING",
      date: data.date ?? startOfTodayUtc(),
      startTime: TIME_18,
      endTime: TIME_20,
      ...(data.deletedAt && { deletedAt: data.deletedAt }),
    },
  });
}

/** Bulk payload marking every given enrollment with one status. */
export function rosterPayload(
  enrollments: { id: string }[],
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"
) {
  return { records: enrollments.map((e) => ({ enrollmentId: e.id, status })) };
}
