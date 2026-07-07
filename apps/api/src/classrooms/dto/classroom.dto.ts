import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

const CLASSROOM_TYPES = ["PHYSICAL", "ONLINE", "LAB"] as const;
const SORT_FIELDS = ["code", "name", "capacity", "createdAt"] as const;

function toBoolean({ value }: { value: unknown }) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

export class CreateClassroomDto {
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

  @ApiProperty({ enum: CLASSROOM_TYPES })
  @IsEnum(CLASSROOM_TYPES)
  type!: "PHYSICAL" | "ONLINE" | "LAB";

  @ApiProperty()
  @IsInt()
  @IsPositive()
  capacity!: number;

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

export class UpdateClassroomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: CLASSROOM_TYPES })
  @IsOptional()
  @IsEnum(CLASSROOM_TYPES)
  type?: "PHYSICAL" | "ONLINE" | "LAB";

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

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

export class ClassroomQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: CLASSROOM_TYPES })
  @IsOptional()
  @IsEnum(CLASSROOM_TYPES)
  type?: "PHYSICAL" | "ONLINE" | "LAB";

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: "code" | "name" | "capacity" | "createdAt" = "createdAt";

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
