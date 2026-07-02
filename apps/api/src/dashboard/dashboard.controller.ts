import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Dashboard")
@ApiBearerAuth()
@Controller("dashboard")
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @RequirePermissions("dashboard.analytics")
  @ApiOperation({ summary: "Thống kê tổng quan dashboard" })
  getStats(@CurrentUser() user: RequestUser) {
    return this.dashboardService.getStats(user);
  }
}
