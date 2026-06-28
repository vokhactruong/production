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

export class CreateStudentDto {
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
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ["MALE", "FEMALE", "OTHER"] })
  @IsOptional()
  @IsEnum(["MALE", "FEMALE", "OTHER"])
  gender?: "MALE" | "FEMALE" | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateStudentDto {
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
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ["MALE", "FEMALE", "OTHER"] })
  @IsOptional()
  @IsEnum(["MALE", "FEMALE", "OTHER"])
  gender?: "MALE" | "FEMALE" | "OTHER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class StudentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  @ApiPropertyOptional({
    enum: ["firstName", "lastName", "createdAt", "dateOfBirth", "status"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["firstName", "lastName", "createdAt", "dateOfBirth", "status"])
  sortBy?: "firstName" | "lastName" | "createdAt" | "dateOfBirth" | "status" = "createdAt";

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
