import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { ClassSessionsService } from "./class-sessions.service";
import { UpdateClassSessionDto, ClassSessionQueryDto } from "./dto/class-session.dto";

// No POST route here: ClassSession is generated business data, created only
// via SchedulingService (POST /classes/:id/generate-sessions and
// /classes/:id/sync-sessions on ClassesController). Manual adjustments are
// limited to PATCH (date/status/topic/note) and DELETE below.
@ApiTags("Class Sessions")
@ApiBearerAuth()
@Controller("class-sessions")
@UseGuards(AuthGuard)
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Get()
  @RequirePermissions("class_session.read")
  @ApiOperation({ summary: "Danh sách buổi học" })
  findAll(@Query() query: ClassSessionQueryDto) {
    return this.classSessionsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("class_session.read")
  @ApiOperation({ summary: "Chi tiết buổi học" })
  findOne(@Param("id") id: string) {
    return this.classSessionsService.findOne(id);
  }

  @Patch(":id")
  @RequirePermissions("class_session.update")
  @ApiOperation({ summary: "Cập nhật buổi học" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClassSessionDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.classSessionsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("class_session.delete")
  @ApiOperation({ summary: "Xóa buổi học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.classSessionsService.remove(id, user.id);
  }
}
