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
import { EmployeesService } from "./employees.service";
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  LinkUserDto,
  CreateUserAccountDto,
} from "./dto/employee.dto";

@ApiTags("Employees")
@ApiBearerAuth()
@Controller("employees")
@UseGuards(AuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions("employee.read")
  @ApiOperation({ summary: "Danh sách nhân viên" })
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  // Must be before :id to avoid route collision
  @Get("available-users")
  @RequirePermissions("employee.update")
  @ApiOperation({ summary: "Danh sách tài khoản chưa liên kết" })
  findAvailableUsers() {
    return this.employeesService.findAvailableUsers();
  }

  @Get(":id")
  @RequirePermissions("employee.read")
  @ApiOperation({ summary: "Chi tiết nhân viên" })
  findOne(@Param("id") id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @RequirePermissions("employee.create")
  @ApiOperation({ summary: "Tạo nhân viên" })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: RequestUser) {
    return this.employeesService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("employee.update")
  @ApiOperation({ summary: "Cập nhật nhân viên" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.employeesService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("employee.delete")
  @ApiOperation({ summary: "Xóa nhân viên" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.employeesService.remove(id, user.id);
  }

  @Post(":id/link-user")
  @RequirePermissions("employee.update")
  @ApiOperation({ summary: "Liên kết tài khoản hiện có" })
  linkUser(@Param("id") id: string, @Body() dto: LinkUserDto, @CurrentUser() user: RequestUser) {
    return this.employeesService.linkUser(id, dto, user.id);
  }

  @Post(":id/create-user")
  @RequirePermissions("employee.update")
  @ApiOperation({ summary: "Tạo tài khoản mới và liên kết" })
  createUserAndLink(
    @Param("id") id: string,
    @Body() dto: CreateUserAccountDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.employeesService.createUserAndLink(id, dto, user.id);
  }

  @Delete(":id/unlink-user")
  @RequirePermissions("employee.update")
  @ApiOperation({ summary: "Hủy liên kết tài khoản" })
  unlinkUser(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.employeesService.unlinkUser(id, user.id);
  }
}
