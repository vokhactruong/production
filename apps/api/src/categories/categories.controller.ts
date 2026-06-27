import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Categories")
@Controller("categories")
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Danh sách danh mục" })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @RequirePermissions("category.create")
  @ApiOperation({ summary: "Tạo danh mục" })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @RequirePermissions("category.update")
  @ApiOperation({ summary: "Cập nhật danh mục" })
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @RequirePermissions("category.delete")
  @ApiOperation({ summary: "Xóa danh mục" })
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
