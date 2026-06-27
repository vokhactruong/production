import { Global, Module } from "@nestjs/common";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsService } from "./audit-logs.service";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
