import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ParseFilePipeBuilder } from '@nestjs/common';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @ApiOperation({ summary: 'Upload file', description: 'Uploads a file to Cloudinary' })
  @ApiParam({ name: 'slug', description: 'Folder slug for upload', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('upload/:slug')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime|ogg)|audio\/(mpeg|mp3|wav|ogg|webm|x-wav|x-mp3)|application\/(pdf|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|msword|ogg)|text\/plain)$/i,
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({
          // 500MB limit for large videos
          maxSize: 500 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    ) file: Express.Multer.File,
    @Param('slug') slug: string,
  ) {
    const forbiddenExtensions = /\.(exe|bat|cmd|ps1|js)$/i;
    if (file && forbiddenExtensions.test(file.originalname)) {
      throw new BadRequestException('File type not allowed for security reasons.');
    }

    return this.cloudinaryService.uploadFile(file, slug);
  }

  @ApiOperation({ summary: 'Delete file', description: 'Deletes a file from Cloudinary' })
  @ApiParam({ name: 'publicId', description: 'Cloudinary public ID of the file', type: String })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    return this.cloudinaryService.deleteFile(publicId);
  }
}