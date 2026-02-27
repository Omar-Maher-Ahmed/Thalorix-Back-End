
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from './schema/upload.folders.schema';
import { ConfigService } from '@nestjs/config';
import { UploadResponse } from './interfaces/upload-response.interface';

@Injectable()
export class CloudinaryService {
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
      throw new NotFoundException('Upload folder not found or inactive');
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
      cloudinary.uploader
        .upload_stream(
          { folder: folderPath, resource_type: 'auto' },
          (error, result?: UploadApiResponse) => {
            if (error) return reject(error);
            if (!result) return reject('Upload failed');

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
            });
          },
        )
        .end(file.buffer);
    });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}