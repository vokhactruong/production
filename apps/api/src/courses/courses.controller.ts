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
import { CoursesService } from "./courses.service";
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from "./dto/course.dto";

@ApiTags("Courses")
@ApiBearerAuth()
@Controller("courses")
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @RequirePermissions("course.read")
  @ApiOperation({ summary: "Danh sách khóa học" })
  findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("course.read")
  @ApiOperation({ summary: "Chi tiết khóa học" })
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @RequirePermissions("course.create")
  @ApiOperation({ summary: "Tạo khóa học" })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: RequestUser) {
    return this.coursesService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("course.update")
  @ApiOperation({ summary: "Cập nhật khóa học" })
  update(@Param("id") id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: RequestUser) {
    return this.coursesService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("course.delete")
  @ApiOperation({ summary: "Xóa khóa học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.coursesService.remove(id, user.id);
  }
}
