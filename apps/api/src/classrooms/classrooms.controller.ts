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
import { ClassroomsService } from "./classrooms.service";
import { CreateClassroomDto, UpdateClassroomDto, ClassroomQueryDto } from "./dto/classroom.dto";

@ApiTags("Classrooms")
@ApiBearerAuth()
@Controller("classrooms")
@UseGuards(AuthGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  @RequirePermissions("classroom.read")
  @ApiOperation({ summary: "Danh sách phòng học" })
  findAll(@Query() query: ClassroomQueryDto) {
    return this.classroomsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("classroom.read")
  @ApiOperation({ summary: "Chi tiết phòng học" })
  findOne(@Param("id") id: string) {
    return this.classroomsService.findOne(id);
  }

  @Post()
  @RequirePermissions("classroom.create")
  @ApiOperation({ summary: "Tạo phòng học" })
  create(@Body() dto: CreateClassroomDto, @CurrentUser() user: RequestUser) {
    return this.classroomsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("classroom.update")
  @ApiOperation({ summary: "Cập nhật phòng học" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClassroomDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.classroomsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("classroom.delete")
  @ApiOperation({ summary: "Xóa phòng học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.classroomsService.remove(id, user.id);
  }
}
