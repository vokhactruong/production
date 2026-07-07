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
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentQueryDto } from "./dto/enrollment.dto";

@ApiTags("Enrollments")
@ApiBearerAuth()
@Controller("enrollments")
@UseGuards(AuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @RequirePermissions("enrollment.read")
  @ApiOperation({ summary: "Danh sách đăng ký học" })
  findAll(@Query() query: EnrollmentQueryDto) {
    return this.enrollmentsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("enrollment.read")
  @ApiOperation({ summary: "Chi tiết đăng ký học" })
  findOne(@Param("id") id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Post()
  @RequirePermissions("enrollment.create")
  @ApiOperation({ summary: "Tạo đăng ký học" })
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: RequestUser) {
    return this.enrollmentsService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("enrollment.update")
  @ApiOperation({ summary: "Cập nhật đăng ký học" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.enrollmentsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("enrollment.delete")
  @ApiOperation({ summary: "Xóa đăng ký học" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.enrollmentsService.remove(id, user.id);
  }
}
