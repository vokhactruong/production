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
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./dto/user.dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("user.read")
  @ApiOperation({ summary: "Danh sách người dùng" })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get("stats")
  @RequirePermissions("dashboard.analytics")
  @ApiOperation({ summary: "Thống kê người dùng" })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(":id")
  @RequirePermissions("user.read")
  @ApiOperation({ summary: "Chi tiết người dùng" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions("user.create")
  @ApiOperation({ summary: "Tạo người dùng" })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.create(dto, user.id);
  }

  @Patch(":id")
  @RequirePermissions("user.update")
  @ApiOperation({ summary: "Cập nhật người dùng" })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.update(id, dto, user.id);
  }

  @Delete(":id")
  @RequirePermissions("user.delete")
  @ApiOperation({ summary: "Xóa người dùng" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.usersService.remove(id, user.id);
  }
}
