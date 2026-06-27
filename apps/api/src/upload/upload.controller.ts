import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { UploadService } from "./upload.service";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("Upload")
@ApiBearerAuth()
@Controller("upload")
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @RequirePermissions("upload.file")
  @ApiOperation({ summary: "Upload ảnh lên Cloudinary" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException("Không có file được gửi lên");
    return this.uploadService.uploadImage(file);
  }

  @Delete("image")
  @RequirePermissions("upload.file")
  @ApiOperation({ summary: "Xóa ảnh khỏi Cloudinary" })
  deleteImage(@Body() body: { publicId: string }) {
    if (!body.publicId) throw new BadRequestException("publicId là bắt buộc");
    return this.uploadService.deleteImage(body.publicId);
  }
}
