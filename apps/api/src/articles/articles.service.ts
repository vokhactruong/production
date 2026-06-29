import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateArticleDto, UpdateArticleDto, ArticleQueryDto } from "./dto/article.dto";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UploadService } from "../upload/upload.service";
import slugify from "slugify";
import { nanoid } from "nanoid";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "code",
  "pre",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  "*": ["class"],
};

const ARTICLE_INCLUDE = {
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true } },
};

const ARTICLE_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnail: true,
  status: true,
  publishedAt: true,
  viewCount: true,
  tags: true,
  authorId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true } },
};

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly uploadService: UploadService
  ) {}

  private sanitize(html: string): string {
    return sanitizeHtml(html, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
  }

  private async generateSlug(title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true, locale: "vi" });
    const existing = await this.prisma.article.findUnique({
      where: { slug: base },
      select: { id: true },
    });
    return existing ? `${base}-${nanoid(6)}` : base;
  }

  async findAllAdmin(query: ArticleQueryDto, user: RequestUser) {
    const { search, status, categoryId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const canManageAll = user.permissions.includes("article.manage");

    const where = {
      deletedAt: null,
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(!canManageAll && { authorId: user.id }),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneAdmin(id: string, user: RequestUser) {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: ARTICLE_INCLUDE,
    });
    if (!article) throw new NotFoundException("Bài viết không tồn tại");

    const canManageAll = user.permissions.includes("article.manage");
    if (!canManageAll && article.authorId !== user.id) throw new ForbiddenException();

    return article;
  }

  async findAllPublic(query: ArticleQueryDto) {
    const { search, categoryId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
      ...(categoryId && { categoryId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOnePublic(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      include: ARTICLE_INCLUDE,
    });
    if (!article) throw new NotFoundException("Bài viết không tồn tại");

    await this.prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
    return { ...article, viewCount: article.viewCount + 1 };
  }

  async create(dto: CreateArticleDto, user: RequestUser) {
    const cleanContent = this.sanitize(dto.content);
    const slug = await this.generateSlug(dto.title);

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: cleanContent,
        thumbnail: dto.thumbnail,
        thumbnailPublicId: dto.thumbnailPublicId,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        status: dto.status ?? "DRAFT",
        publishedAt: dto.status === "PUBLISHED" ? new Date() : null,
        authorId: user.id,
      },
      include: ARTICLE_INCLUDE,
    });

    await this.auditLogs.log({
      userId: user.id,
      action: "CREATE",
      entity: "Article",
      entityId: article.id,
    });
    return article;
  }

  async update(id: string, dto: UpdateArticleDto, user: RequestUser) {
    const existing = await this.findOneAdmin(id, user);

    // Xóa ảnh cũ trên Cloudinary nếu thumbnail được thay bằng ảnh mới
    if (
      dto.thumbnailPublicId !== undefined &&
      existing.thumbnailPublicId &&
      dto.thumbnailPublicId !== existing.thumbnailPublicId
    ) {
      await this.uploadService.deleteImage(existing.thumbnailPublicId, {
        entity: "Article",
        entityId: id,
      });
    }

    const cleanContent = dto.content ? this.sanitize(dto.content) : undefined;
    const slug = dto.title ? await this.generateSlug(dto.title) : undefined;

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title, slug }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(cleanContent && { content: cleanContent }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
        ...(dto.thumbnailPublicId !== undefined && { thumbnailPublicId: dto.thumbnailPublicId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status && {
          status: dto.status,
          publishedAt: dto.status === "PUBLISHED" ? new Date() : undefined,
        }),
      },
      include: ARTICLE_INCLUDE,
    });

    await this.auditLogs.log({
      userId: user.id,
      action: "UPDATE",
      entity: "Article",
      entityId: id,
    });
    return article;
  }

  async remove(id: string, user: RequestUser) {
    const article = await this.findOneAdmin(id, user);

    await this.prisma.article.update({ where: { id }, data: { deletedAt: new Date() } });

    await this.auditLogs.log({
      userId: user.id,
      action: "DELETE",
      entity: "Article",
      entityId: id,
    });

    if (article.thumbnailPublicId) {
      await this.uploadService.deleteImage(article.thumbnailPublicId, {
        entity: "Article",
        entityId: id,
      });
    }

    return { message: "Xóa bài viết thành công" };
  }

  async publish(id: string, user: RequestUser) {
    const article = await this.prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) throw new NotFoundException();

    const canManageAll = user.permissions.includes("article.manage");
    if (!canManageAll && article.authorId !== user.id) throw new ForbiddenException();

    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      include: ARTICLE_INCLUDE,
    });

    await this.auditLogs.log({
      userId: user.id,
      action: "PUBLISH",
      entity: "Article",
      entityId: id,
    });
    return updated;
  }

  async unpublish(id: string, user: RequestUser) {
    const article = await this.prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) throw new NotFoundException();

    const canManageAll = user.permissions.includes("article.manage");
    if (!canManageAll && article.authorId !== user.id) throw new ForbiddenException();

    return this.prisma.article.update({
      where: { id },
      data: { status: "DRAFT", publishedAt: null },
      include: ARTICLE_INCLUDE,
    });
  }

  async archive(id: string, user: RequestUser) {
    const article = await this.prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) throw new NotFoundException();

    const canManageAll = user.permissions.includes("article.manage");
    if (!canManageAll) throw new ForbiddenException();

    return this.prisma.article.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: ARTICLE_INCLUDE,
    });
  }
}
