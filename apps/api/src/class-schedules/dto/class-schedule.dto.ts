import { IsString, IsOptional, IsNotEmpty, IsInt, Min, Max, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = "Định dạng giờ không hợp lệ (HH:mm)";

export class CreateClassScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ description: "0 = Chủ nhật .. 6 = Thứ bảy", minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: "18:00" })
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  startTime!: string;

  @ApiProperty({ example: "20:00" })
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  endTime!: string;
}

export class UpdateClassScheduleDto {
  @ApiPropertyOptional({ description: "0 = Chủ nhật .. 6 = Thứ bảy", minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;

  @ApiPropertyOptional({ example: "18:00" })
  @IsOptional()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  startTime?: string;

  @ApiPropertyOptional({ example: "20:00" })
  @IsOptional()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  endTime?: string;
}

export class ClassScheduleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;
}
