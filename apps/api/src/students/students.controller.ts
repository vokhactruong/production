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
import { StudentsService } from "./students.service";
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from "./dto/student.dto";

@ApiTags("Students")
@ApiBearerAuth()
@Controller("students")
@UseGuards(AuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @RequirePermissions("student.read")
  @ApiOperation({ summary: "Danh sách học sinh" })
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("student.read")
  @ApiOperation({ summary: "Chi tiết học sinh" })
  findOne(@Param("id") id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @RequirePermissions("student.create")
  @ApiOperation({ summary: "Tạo học sinh" })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: RequestUser) {
    return this.studentsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("student.update")
  @ApiOperation({ summary: "Cập nhật học sinh" })
  update(@Param("id") id: string, @Body() dto: UpdateStudentDto, @CurrentUser() user: RequestUser) {
    return this.studentsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("student.delete")
  @ApiOperation({ summary: "Xóa học sinh" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.studentsService.remove(id, user.id);
  }
}
