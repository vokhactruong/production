import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

const CLASS_STATUSES = ["PLANNING", "OPEN", "FULL", "COMPLETED", "CANCELLED"] as const;
const SORT_FIELDS = ["code", "name", "startDate", "endDate", "capacity", "createdAt"] as const;

function toBoolean({ value }: { value: unknown }) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

export class CreateClassDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classroomId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiPropertyOptional({ enum: CLASS_STATUSES, default: "PLANNING" })
  @IsOptional()
  @IsEnum(CLASS_STATUSES)
  status?: "PLANNING" | "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

  @ApiProperty()
  @IsInt()
  @IsPositive()
  capacity!: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sessionCount?: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  classroomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employeeId?: string;

  @ApiPropertyOptional({ enum: CLASS_STATUSES })
  @IsOptional()
  @IsEnum(CLASS_STATUSES)
  status?: "PLANNING" | "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  sessionCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class ClassQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: CLASS_STATUSES })
  @IsOptional()
  @IsEnum(CLASS_STATUSES)
  status?: "PLANNING" | "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classroomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: "code" | "name" | "startDate" | "endDate" | "capacity" | "createdAt" = "createdAt";

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
