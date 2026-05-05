import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @ApiOperation({ summary: 'Get Hello', description: 'Returns a simple greeting message' })
  @ApiResponse({ status: 200, description: 'Greeting returned successfully', type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
