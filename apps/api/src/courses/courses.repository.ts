import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const COURSE_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  courseType: true,
  packageLessons: true,
  lessonDuration: true,
  basePrice: true,
  displayOrder: true,
  status: true,
  subjectId: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: { id: true, code: true, name: true },
  },
} satisfies Prisma.CourseSelect;

export type CourseRecord = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>;

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.CourseWhereInput;
    orderBy: Prisma.CourseOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<CourseRecord[]> {
    return this.prisma.course.findMany({
      where: params.where,
      select: COURSE_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.CourseWhereInput): Promise<number> {
    return this.prisma.course.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<CourseRecord | null> {
    return (tx ?? this.prisma).course.findFirst({
      where: { id, deletedAt: null },
      select: COURSE_SELECT,
    });
  }

  async findByCode(code: string, excludeId?: string): Promise<CourseRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        code,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: COURSE_SELECT,
    });
  }

  async create(data: Prisma.CourseCreateInput, tx?: Tx): Promise<CourseRecord> {
    return (tx ?? this.prisma).course.create({ data, select: COURSE_SELECT });
  }

  async update(id: string, data: Prisma.CourseUpdateInput, tx?: Tx): Promise<CourseRecord> {
    return (tx ?? this.prisma).course.update({ where: { id }, data, select: COURSE_SELECT });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
