import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Matches,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

const CLASS_SESSION_STATUSES = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"] as const;
const SORT_FIELDS = ["date", "sessionNumber", "status", "createdAt"] as const;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = "Định dạng giờ không hợp lệ (HH:mm)";

// No CreateClassSessionDto: ClassSession is generated business data, created
// only via SchedulingService (see /classes/:id/generate-sessions and
// /classes/:id/sync-sessions). classId and sessionNumber are never
// user-editable — see UpdateClassSessionDto below, which omits both.

export class UpdateClassSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: "18:00" })
  @IsOptional()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  startTime?: string;

  @ApiPropertyOptional({ example: "20:00" })
  @IsOptional()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  endTime?: string;

  @ApiPropertyOptional({ enum: CLASS_SESSION_STATUSES })
  @IsOptional()
  @IsEnum(CLASS_SESSION_STATUSES)
  status?: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ClassSessionQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ enum: CLASS_SESSION_STATUSES })
  @IsOptional()
  @IsEnum(CLASS_SESSION_STATUSES)
  status?: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "date" })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: "date" | "sessionNumber" | "status" | "createdAt" = "date";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";

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
