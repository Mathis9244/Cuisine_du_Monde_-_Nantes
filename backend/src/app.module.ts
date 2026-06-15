import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { AdminModule } from './admin/admin.module';
import { SupabaseAuthModule } from './modules/supabase-auth/supabase-auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { HealthController } from './health/health.controller';
import { getValidatedEnv } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // @nestjs/config passes the parsed .env file as `config` BEFORE it is
      // injected into process.env. Merge both so validation works whether the
      // vars come from a local .env file or from real env vars (Docker).
      validate: (config) => getValidatedEnv({ ...process.env, ...config }),
    }),
    PrismaModule,
    RestaurantsModule,
    AuthModule,
    SyncModule,
    AdminModule,
    SupabaseAuthModule,
    BootstrapModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
