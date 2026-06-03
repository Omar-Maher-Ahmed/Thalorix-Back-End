import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from './schema/upload.folders.schema';
import { ConfigService } from '@nestjs/config';
import { UploadResponse } from './interfaces/upload-response.interface';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    @InjectModel(Folder.name) private folderModel: Model<Folder>,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private async getFolderPath(slug: string): Promise<string> {
    const folder = await this.folderModel.findOne({ slug, isActive: true });

    if (!folder) {
      // Auto-create folder if it doesn't exist to prevent upload failures
      let newFolder = await this.folderModel.findOneAndUpdate(
        { slug },
        {
          $setOnInsert: {
            name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
            slug: slug,
            path: `thalorix/${slug}`,
            isActive: true,
            maxSizeMB: 50,
          },
        },
        { upsert: true, returnDocument: 'after', new: true },
      );
      if (!newFolder) {
        newFolder = await this.folderModel.findOne({ slug });
      }
      return newFolder?.path || `thalorix/${slug}`;
    }

    return folder.path;
  }

  async uploadFile(
    file: Express.Multer.File,
    slug: string,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const folderPath = await this.getFolderPath(slug);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: folderPath, resource_type: 'auto' },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`, error);
            return reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            this.logger.error('Cloudinary returned no result and no error.');
            return reject(new BadRequestException('Cloudinary returned no result.'));
          }
          this.logger.log(`Successfully uploaded file to Cloudinary: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
          });
        }
      ).end(file.buffer);
    });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}