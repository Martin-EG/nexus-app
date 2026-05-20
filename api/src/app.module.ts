import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config as loadEnv } from 'dotenv';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RefundsModule } from './refunds/refunds.module';
import { ExportsModule } from './exports/exports.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';

loadEnv({ path: '.env.local' });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '6543', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // Supabase requires TLS for all connections.
      ssl: { rejectUnauthorized: false },
      // Pick up entities registered via TypeOrmModule.forFeature() in each
      // feature module — works for both ts-node and compiled dist output.
      autoLoadEntities: true,
      synchronize: false, // Use migrations in production
    }),
    AuthModule,
    CatalogModule,
    InventoryModule,
    SalesModule,
    PurchasesModule,
    ReportsModule,
    NotificationsModule,
    RefundsModule,
    ExportsModule,
    UsersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
