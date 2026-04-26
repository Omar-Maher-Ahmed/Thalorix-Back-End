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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @ApiOperation({ summary: 'Create a template', description: 'Creates a new template' })
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req) {
    return this.templateService.create(dto, req.user);
  }

  @ApiOperation({ summary: 'Get templates by marketplace', description: 'Retrieves all templates for a specific marketplace' })
  @ApiParam({ name: 'id', description: 'Marketplace ID', type: String })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace not found' })
  @Get('marketplace/:id')
  findAllByMarketplace(@Param('id') id: string) {
    return this.templateService.findAllByMarketplace(id);
  }

  @ApiOperation({ summary: 'Update a template', description: 'Updates an existing template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
    @Req() req,
  ) {
    return this.templateService.update(id, dto, req.user);
  }

  @ApiOperation({ summary: 'Delete a template', description: 'Removes a template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.templateService.remove(id, req.user);
  }
}