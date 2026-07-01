import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { CategoriesModule } from "./categories/categories.module";
import { ArticlesModule } from "./articles/articles.module";
import { UploadModule } from "./upload/upload.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { StudentsModule } from "./students/students.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { CoursesModule } from "./courses/courses.module";
import { EmployeesModule } from "./employees/employees.module";

@Module({
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CategoriesModule,
    ArticlesModule,
    UploadModule,
    AuditLogsModule,
    DashboardModule,
    StudentsModule,
    SubjectsModule,
    CoursesModule,
    EmployeesModule,
  ],
})
export class AppModule {}
