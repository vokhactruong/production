import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { AttendanceApplicationService } from "./attendance-application.service";
import {
  RecordSessionAttendanceDto,
  CorrectAttendanceDto,
  AttendanceQueryDto,
} from "./dto/attendance.dto";

// No DELETE route on purpose: attendance is participation evidence —
// corrections only, never deletes (approved business rule). Post-48h
// corrections additionally require the `attendance.correct` permission,
// enforced inside the service (48h window anchored to the session's end).
@ApiTags("Attendance")
@ApiBearerAuth()
@Controller("attendance")
@UseGuards(AuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceApplicationService: AttendanceApplicationService) {}

  @Get()
  @RequirePermissions("attendance.read")
  @ApiOperation({ summary: "Danh sách điểm danh" })
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceApplicationService.findAll(query);
  }

  @Post("sessions/:sessionId")
  @RequirePermissions("attendance.create")
  @ApiOperation({ summary: "Điểm danh cả buổi học (bulk, idempotent)" })
  recordSession(
    @Param("sessionId") sessionId: string,
    @Body() dto: RecordSessionAttendanceDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.attendanceApplicationService.recordSession(sessionId, dto, user);
  }

  @Patch(":id")
  @RequirePermissions("attendance.update")
  @ApiOperation({ summary: "Sửa điểm danh" })
  correct(
    @Param("id") id: string,
    @Body() dto: CorrectAttendanceDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.attendanceApplicationService.correct(id, dto, user);
  }
}
