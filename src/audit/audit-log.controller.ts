import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { Roles } from '../auth/enums/roles.enum';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all audit logs',
    description: 'Returns the last 100 audit log entries. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @Get()
  findAll() {
    return this.auditLogService.findAllLogs();
  }
}
