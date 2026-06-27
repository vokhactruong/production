import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto/role.dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
@UseGuards(AuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions("role.read")
  @ApiOperation({ summary: "Danh sách vai trò" })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(":id")
  @RequirePermissions("role.read")
  @ApiOperation({ summary: "Chi tiết vai trò" })
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions("role.create")
  @ApiOperation({ summary: "Tạo vai trò" })
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: RequestUser) {
    return this.rolesService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("role.update")
  @ApiOperation({ summary: "Cập nhật vai trò" })
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: RequestUser) {
    return this.rolesService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("role.delete")
  @ApiOperation({ summary: "Xóa vai trò" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.rolesService.remove(id, user.id);
  }

  @Post(":id/permissions")
  @RequirePermissions("permission.assign")
  @ApiOperation({ summary: "Gán permissions vào vai trò" })
  assignPermissions(
    @Param("id") id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.rolesService.assignPermissions(id, dto, user.id);
  }
}
