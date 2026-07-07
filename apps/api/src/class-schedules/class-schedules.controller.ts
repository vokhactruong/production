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
import { ClassSchedulesService } from "./class-schedules.service";
import {
  CreateClassScheduleDto,
  UpdateClassScheduleDto,
  ClassScheduleQueryDto,
} from "./dto/class-schedule.dto";

@ApiTags("Class Schedules")
@ApiBearerAuth()
@Controller("class-schedules")
@UseGuards(AuthGuard)
export class ClassSchedulesController {
  constructor(private readonly classSchedulesService: ClassSchedulesService) {}

  @Get()
  @RequirePermissions("class_schedule.read")
  @ApiOperation({ summary: "Danh sách lịch học của lớp" })
  findAll(@Query() query: ClassScheduleQueryDto) {
    return this.classSchedulesService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("class_schedule.read")
  @ApiOperation({ summary: "Chi tiết một khung giờ học" })
  findOne(@Param("id") id: string) {
    return this.classSchedulesService.findOne(id);
  }

  @Post()
  @RequirePermissions("class_schedule.create")
  @ApiOperation({ summary: "Thêm khung giờ học" })
  create(@Body() dto: CreateClassScheduleDto, @CurrentUser() user: RequestUser) {
    return this.classSchedulesService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("class_schedule.update")
  @ApiOperation({ summary: "Cập nhật khung giờ học" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClassScheduleDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.classSchedulesService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("class_schedule.delete")
  @ApiOperation({ summary: "Xóa khung giờ học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.classSchedulesService.remove(id, user.id);
  }
}
