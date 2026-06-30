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
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto, UpdateSubjectDto, SubjectQueryDto } from "./dto/subject.dto";

@ApiTags("Subjects")
@ApiBearerAuth()
@Controller("subjects")
@UseGuards(AuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @RequirePermissions("subject.read")
  @ApiOperation({ summary: "Danh sách môn học" })
  findAll(@Query() query: SubjectQueryDto) {
    return this.subjectsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("subject.read")
  @ApiOperation({ summary: "Chi tiết môn học" })
  findOne(@Param("id") id: string) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @RequirePermissions("subject.create")
  @ApiOperation({ summary: "Tạo môn học" })
  create(@Body() dto: CreateSubjectDto, @CurrentUser() user: RequestUser) {
    return this.subjectsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("subject.update")
  @ApiOperation({ summary: "Cập nhật môn học" })
  update(@Param("id") id: string, @Body() dto: UpdateSubjectDto, @CurrentUser() user: RequestUser) {
    return this.subjectsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("subject.delete")
  @ApiOperation({ summary: "Xóa môn học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.subjectsService.remove(id, user.id);
  }
}
