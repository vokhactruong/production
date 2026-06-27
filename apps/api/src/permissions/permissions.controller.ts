import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PermissionsService } from "./permissions.service";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions("permission.read")
  @ApiOperation({ summary: "Danh sách permissions (seed cố định)" })
  findAll() {
    return this.permissionsService.findAll();
  }
}
