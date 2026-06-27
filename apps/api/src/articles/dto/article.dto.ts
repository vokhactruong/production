import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailPublicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] })
  @IsOptional()
  @IsEnum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
}

export class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailPublicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] })
  @IsOptional()
  @IsEnum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
}

export class ArticleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] })
  @IsOptional()
  @IsEnum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

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
