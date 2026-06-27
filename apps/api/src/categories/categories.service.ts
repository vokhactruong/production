import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import slugify from "slugify";
import { nanoid } from "nanoid";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { articles: true } } },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });
    if (!cat) throw new NotFoundException("Danh mục không tồn tại");
    return cat;
  }

  private async generateSlug(name: string, excludeId?: string): Promise<string> {
    let slug = slugify(name, { lower: true, strict: true, locale: "vi" });
    const existing = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      slug = `${slug}-${nanoid(6)}`;
    }
    return slug;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { name: { equals: dto.name, mode: "insensitive" } },
    });
    if (existing) throw new ConflictException("Tên danh mục đã tồn tại");

    const slug = await this.generateSlug(dto.name);
    return this.prisma.category.create({
      data: { name: dto.name, slug, description: dto.description },
      include: { _count: { select: { articles: true } } },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: { equals: dto.name, mode: "insensitive" }, NOT: { id } },
      });
      if (existing) throw new ConflictException("Tên danh mục đã tồn tại");
    }

    const slug = dto.name ? await this.generateSlug(dto.name, id) : undefined;

    return this.prisma.category.update({
      where: { id },
      data: { ...(dto.name && { name: dto.name, slug }), ...(dto.description !== undefined && { description: dto.description }) },
      include: { _count: { select: { articles: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const articleCount = await this.prisma.article.count({ where: { categoryId: id } });
    if (articleCount > 0) {
      throw new BadRequestException(`Danh mục đang có ${articleCount} bài viết, không thể xóa`);
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: "Xóa danh mục thành công" };
  }
}
