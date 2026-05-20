import {
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(
    private readonly exportsService: ExportsService,
    private readonly authService: AuthService,
  ) {}

  @Get('pivot')
  pivot(
    @Query('year') year = '2025',
    @Query('a') a = 'customer_type',
    @Query('b') b = 'category',
  ) {
    return this.exportsService.pivotReport(parseInt(year, 10), a, b);
  }

  @Get('csv')
  csv(@Query() query: Record<string, string>) {
    if (!this.authService.requireAdmin(query)) {
      throw new ForbiddenException('forbidden');
    }
    return this.exportsService.downloadCsv(
      query.customer_type,
      query.status,
    );
  }

  @Get('totals')
  totals(@Query() query: { year?: string; customer_type?: string }) {
    return this.exportsService.aggregateTotals(query);
  }
}
