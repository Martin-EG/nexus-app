import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly authService: AuthService,
  ) {}

  @Get('monthly')
  monthly(@Query('year') year = '2025', @Query('month') month = '1') {
    return this.reportsService.monthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('total')
  async total(@Query('year') year = '2025', @Query('month') month = '1') {
    return {
      total: await this.reportsService.totalSales(
        parseInt(year, 10),
        parseInt(month, 10),
      ),
    };
  }

  @Get('export')
  export(
    @Query() query: Record<string, unknown>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.authService.requireAdmin(body ?? query)) {
      throw new ForbiddenException('forbidden');
    }
    const reportType = (query.type as string) ?? 'sales';
    const minId = parseInt((query.filter as string) ?? '0', 10) || 0;
    return this.reportsService.exportReport(reportType, minId);
  }
}
