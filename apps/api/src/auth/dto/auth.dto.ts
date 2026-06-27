import { IsEmail, IsString, MinLength, IsNotEmpty, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "john@school.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin@123456" })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Cần ít nhất 1 chữ hoa" })
  @Matches(/[0-9]/, { message: "Cần ít nhất 1 số" })
  @Matches(/[^A-Za-z0-9]/, { message: "Cần ít nhất 1 ký tự đặc biệt" })
  password!: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

export class LoginDto {
  @ApiProperty({ example: "admin@school.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin@123456" })
  @IsString()
  @MinLength(6)
  password!: string;
}
