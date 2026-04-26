import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CreateAiDto } from './dto/create-ai.dto';
import { UpdateAiDto } from './dto/update-ai.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({ summary: 'Create AI resource', description: 'Creates a new AI resource' })
  @ApiBody({ type: CreateAiDto })
  @ApiResponse({ status: 201, description: 'AI resource created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() createAiDto: CreateAiDto) {
    return this.aiService.create(createAiDto);
  }

  @ApiOperation({ summary: 'Get all AI resources', description: 'Retrieves a list of all AI resources' })
  @ApiResponse({ status: 200, description: 'List of AI resources retrieved successfully' })
  @Get()
  findAll() {
    return this.aiService.findAll();
  }

  @ApiOperation({ summary: 'Get an AI resource by ID', description: 'Retrieves details of a specific AI resource by ID' })
  @ApiParam({ name: 'id', description: 'AI resource ID', type: String })
  @ApiResponse({ status: 200, description: 'AI resource details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'AI resource not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update an AI resource', description: 'Updates details of an existing AI resource' })
  @ApiParam({ name: 'id', description: 'AI resource ID', type: String })
  @ApiBody({ type: UpdateAiDto })
  @ApiResponse({ status: 200, description: 'AI resource updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'AI resource not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiDto: UpdateAiDto) {
    return this.aiService.update(+id, updateAiDto);
  }

  @ApiOperation({ summary: 'Delete an AI resource', description: 'Removes an AI resource from the system' })
  @ApiParam({ name: 'id', description: 'AI resource ID', type: String })
  @ApiResponse({ status: 200, description: 'AI resource deleted successfully' })
  @ApiResponse({ status: 404, description: 'AI resource not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiService.remove(+id);
  }
}
