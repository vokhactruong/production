import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { v2 as cloudinary } from "cloudinary";
import { PrismaService } from "../prisma/prisma.service";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_RETRY = 5;

interface DeleteContext {
  entity?: string;
  entityId?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error(
        "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in apps/api/.env"
      );
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException("Chỉ cho phép ảnh JPEG, PNG, WebP, GIF");
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException("File không được vượt quá 5MB");
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "school-portal/articles", resource_type: "image" },
          (error, result) => {
            if (error || !result) return reject(new Error(error?.message ?? "Upload failed"));
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string, context: DeleteContext = {}): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Cloudinary delete failed for "${publicId}": ${message}`);
      await this.prisma.pendingDeletion
        .create({
          data: {
            publicId,
            entity: context.entity ?? "unknown",
            entityId: context.entityId,
            error: message,
          },
        })
        .catch(() => {});
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async retryPendingDeletions(): Promise<void> {
    const pending = await this.prisma.pendingDeletion.findMany({
      where: { retryCount: { lt: MAX_RETRY } },
      take: 50,
    });

    for (const record of pending) {
      try {
        await cloudinary.uploader.destroy(record.publicId);
        await this.prisma.pendingDeletion.delete({ where: { id: record.id } });
        this.logger.log(`Retry succeeded for "${record.publicId}"`);
      } catch (err) {
        const newCount = record.retryCount + 1;
        await this.prisma.pendingDeletion.update({
          where: { id: record.id },
          data: {
            retryCount: newCount,
            lastTriedAt: new Date(),
            error: err instanceof Error ? err.message : String(err),
          },
        });
        if (newCount >= MAX_RETRY) {
          this.logger.error(
            `Cloudinary delete permanently failed for "${record.publicId}" after ${MAX_RETRY} retries`
          );
        }
      }
    }
  }
}
