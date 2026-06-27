import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ArticlesService } from "./articles.service";
import { CreateArticleDto, UpdateArticleDto, ArticleQueryDto } from "./dto/article.dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Articles")
@Controller("articles")
@UseGuards(AuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ─── Public Endpoints ────────────────────────────────────────────────────────

  @Get("public")
  @Public()
  @ApiOperation({ summary: "Danh sách bài viết công khai" })
  findAllPublic(@Query() query: ArticleQueryDto) {
    return this.articlesService.findAllPublic(query);
  }

  @Get("public/:slug")
  @Public()
  @ApiOperation({ summary: "Chi tiết bài viết công khai" })
  findOnePublic(@Param("slug") slug: string) {
    return this.articlesService.findOnePublic(slug);
  }

  // ─── Admin Endpoints ─────────────────────────────────────────────────────────

  @Get("admin")
  @ApiBearerAuth()
  @RequirePermissions("article.read")
  @ApiOperation({ summary: "Danh sách bài viết (admin)" })
  findAllAdmin(@Query() query: ArticleQueryDto, @CurrentUser() user: RequestUser) {
    return this.articlesService.findAllAdmin(query, user);
  }

  @Get("admin/:id")
  @ApiBearerAuth()
  @RequirePermissions("article.read")
  @ApiOperation({ summary: "Chi tiết bài viết (admin)" })
  findOneAdmin(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.articlesService.findOneAdmin(id, user);
  }

  @Post()
  @ApiBearerAuth()
  @RequirePermissions("article.create")
  @ApiOperation({ summary: "Tạo bài viết" })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: RequestUser) {
    return this.articlesService.create(dto, user);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @RequirePermissions("article.update")
  @ApiOperation({ summary: "Cập nhật bài viết" })
  update(@Param("id") id: string, @Body() dto: UpdateArticleDto, @CurrentUser() user: RequestUser) {
    return this.articlesService.update(id, dto, user);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @RequirePermissions("article.delete")
  @ApiOperation({ summary: "Xóa bài viết" })
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.articlesService.remove(id, user);
  }

  @Patch(":id/publish")
  @ApiBearerAuth()
  @RequirePermissions("article.publish")
  @ApiOperation({ summary: "Xuất bản bài viết" })
  publish(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.articlesService.publish(id, user);
  }

  @Patch(":id/unpublish")
  @ApiBearerAuth()
  @RequirePermissions("article.publish")
  @ApiOperation({ summary: "Gỡ xuất bản bài viết" })
  unpublish(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.articlesService.unpublish(id, user);
  }

  @Patch(":id/archive")
  @ApiBearerAuth()
  @RequirePermissions("article.manage")
  @ApiOperation({ summary: "Lưu trữ bài viết" })
  archive(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.articlesService.archive(id, user);
  }
}
