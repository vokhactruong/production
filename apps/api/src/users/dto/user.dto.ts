import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  IsNotEmpty,
  Matches,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Cần ít nhất 1 chữ hoa" })
  @Matches(/[0-9]/, { message: "Cần ít nhất 1 số" })
  password!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

export class UserQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";

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
