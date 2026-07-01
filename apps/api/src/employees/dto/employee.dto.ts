import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

const EMPLOYEE_TYPES = [
  "TEACHER",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "ACADEMIC",
  "MANAGER",
  "DIRECTOR",
  "OTHER",
] as const;

const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE", "RESIGNED"] as const;
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
const SORT_FIELDS = ["firstName", "lastName", "createdAt", "hireDate", "status"] as const;

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: GENDERS })
  @IsOptional()
  @IsEnum(GENDERS)
  gender?: "MALE" | "FEMALE" | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: EMPLOYEE_TYPES })
  @IsEnum(EMPLOYEE_TYPES)
  employeeType!:
    | "TEACHER"
    | "RECEPTIONIST"
    | "ACCOUNTANT"
    | "ACADEMIC"
    | "MANAGER"
    | "DIRECTOR"
    | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES)
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: GENDERS })
  @IsOptional()
  @IsEnum(GENDERS)
  gender?: "MALE" | "FEMALE" | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_TYPES })
  @IsOptional()
  @IsEnum(EMPLOYEE_TYPES)
  employeeType?:
    | "TEACHER"
    | "RECEPTIONIST"
    | "ACCOUNTANT"
    | "ACADEMIC"
    | "MANAGER"
    | "DIRECTOR"
    | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES)
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class EmployeeQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_TYPES })
  @IsOptional()
  @IsEnum(EMPLOYEE_TYPES)
  employeeType?:
    | "TEACHER"
    | "RECEPTIONIST"
    | "ACCOUNTANT"
    | "ACADEMIC"
    | "MANAGER"
    | "DIRECTOR"
    | "OTHER";

  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES)
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED";

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: "firstName" | "lastName" | "createdAt" | "hireDate" | "status" = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
