import { Module } from '@nestjs/common';
import { SupabaseAuthController } from './supabase-auth.controller';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from '../../middlewares/authenticateRequest';

@Module({
  controllers: [SupabaseAuthController],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
})
export class SupabaseAuthModule {}

