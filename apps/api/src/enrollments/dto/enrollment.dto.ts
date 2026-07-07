import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

const ENROLLMENT_STATUSES = ["PENDING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
const SORT_FIELDS = ["joinedAt", "status", "createdAt"] as const;

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES, default: "ACTIVE" })
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

  @ApiProperty()
  @IsDateString()
  joinedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  classId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class EnrollmentQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: "joinedAt" | "status" | "createdAt" = "createdAt";

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
  @Max(100)
  limit?: number = 10;
}
