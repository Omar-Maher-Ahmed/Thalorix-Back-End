import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateService } from './templates.service';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req) {
    return this.templateService.create(dto, req.user);
  }

  @Get('marketplace/:id')
  findAllByMarketplace(@Param('id') id: string) {
    return this.templateService.findAllByMarketplace(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
    @Req() req,
  ) {
    return this.templateService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.templateService.remove(id, req.user);
  }
}