import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { ClassesService } from "./classes.service";
import { SchedulingService } from "../scheduling/scheduling.service";
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from "./dto/class.dto";

@ApiTags("Classes")
@ApiBearerAuth()
@Controller("classes")
@UseGuards(AuthGuard)
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly schedulingService: SchedulingService
  ) {}

  @Get()
  @RequirePermissions("class.read")
  @ApiOperation({ summary: "Danh sách lớp học" })
  findAll(@Query() query: ClassQueryDto) {
    return this.classesService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("class.read")
  @ApiOperation({ summary: "Chi tiết lớp học" })
  findOne(@Param("id") id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @RequirePermissions("class.create")
  @ApiOperation({ summary: "Tạo lớp học" })
  create(@Body() dto: CreateClassDto, @CurrentUser() user: RequestUser) {
    return this.classesService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("class.update")
  @ApiOperation({ summary: "Cập nhật lớp học" })
  update(@Param("id") id: string, @Body() dto: UpdateClassDto, @CurrentUser() user: RequestUser) {
    return this.classesService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("class.delete")
  @ApiOperation({ summary: "Xóa lớp học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.classesService.remove(id, user.id);
  }

  @Post(":id/generate-sessions")
  @RequirePermissions("class_session.generate")
  @ApiOperation({ summary: "Tạo buổi học ban đầu từ lịch học" })
  generateSessions(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.schedulingService.generateInitialSessions(id, user.id);
  }

  @Post(":id/sync-sessions")
  @RequirePermissions("class_session.sync")
  @ApiOperation({ summary: "Đồng bộ các buổi học còn thiếu" })
  syncSessions(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.schedulingService.syncMissingSessions(id, user.id);
  }
}
