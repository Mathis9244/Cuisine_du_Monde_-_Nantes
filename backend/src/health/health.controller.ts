import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createSupabasePublicClient } from '../lib/supabase/public.client';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Healthcheck (app + Supabase reachability)' })
  async health() {
    const supabase = createSupabasePublicClient();
    // Lightweight call; verifies URL/key are correct and network is reachable.
    const { error } = await supabase.auth.getSession();
    return {
      ok: !error,
      supabase: error ? { ok: false, error: error.message } : { ok: true },
      timestamp: new Date().toISOString(),
    };
  }
}

