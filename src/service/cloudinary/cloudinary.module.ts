import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from './schema/upload.folders.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema }
    ])
  ],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService], 
})
export class CloudinaryModule {}