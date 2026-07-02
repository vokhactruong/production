import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const USER_SELECT_FOR_EMPLOYEE = {
  id: true,
  email: true,
  status: true,
  userRoles: {
    select: {
      role: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

const EMPLOYEE_SELECT = {
  id: true,
  code: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  avatar: true,
  employeeType: true,
  hireDate: true,
  status: true,
  notes: true,
  userId: true,
  user: { select: USER_SELECT_FOR_EMPLOYEE },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeSelect;

export type EmployeeRecord = Prisma.EmployeeGetPayload<{ select: typeof EMPLOYEE_SELECT }>;

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.EmployeeWhereInput;
    orderBy: Prisma.EmployeeOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<EmployeeRecord[]> {
    return this.prisma.employee.findMany({
      where: params.where,
      select: EMPLOYEE_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.EmployeeWhereInput): Promise<number> {
    return this.prisma.employee.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<EmployeeRecord | null> {
    return (tx ?? this.prisma).employee.findFirst({
      where: { id, deletedAt: null },
      select: EMPLOYEE_SELECT,
    });
  }

  async findByCode(code: string, excludeId?: string): Promise<EmployeeRecord | null> {
    return this.prisma.employee.findFirst({
      where: { code, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: EMPLOYEE_SELECT,
    });
  }

  async findByEmail(email: string, excludeId?: string): Promise<EmployeeRecord | null> {
    return this.prisma.employee.findFirst({
      where: { email, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: EMPLOYEE_SELECT,
    });
  }

  async findByPhone(phone: string, excludeId?: string): Promise<EmployeeRecord | null> {
    return this.prisma.employee.findFirst({
      where: { phone, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: EMPLOYEE_SELECT,
    });
  }

  async findByUserId(userId: string, excludeId?: string): Promise<EmployeeRecord | null> {
    return this.prisma.employee.findFirst({
      where: { userId, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: EMPLOYEE_SELECT,
    });
  }

  async findLastCode(): Promise<string | null> {
    const last = await this.prisma.employee.findFirst({
      select: { code: true },
      orderBy: { createdAt: "desc" },
    });
    return last?.code ?? null;
  }

  async create(data: Prisma.EmployeeCreateInput, tx?: Tx): Promise<EmployeeRecord> {
    return (tx ?? this.prisma).employee.create({ data, select: EMPLOYEE_SELECT });
  }

  async update(id: string, data: Prisma.EmployeeUpdateInput, tx?: Tx): Promise<EmployeeRecord> {
    return (tx ?? this.prisma).employee.update({ where: { id }, data, select: EMPLOYEE_SELECT });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
