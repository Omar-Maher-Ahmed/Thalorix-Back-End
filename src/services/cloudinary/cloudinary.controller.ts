import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload/:slug')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('slug') slug: string,
  ) {
    return this.cloudinaryService.uploadFile(file, slug);
  }

  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    return this.cloudinaryService.deleteFile(publicId);
  }
}