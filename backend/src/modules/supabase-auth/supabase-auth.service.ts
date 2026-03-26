import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createSupabasePublicClient } from '../../lib/supabase/public.client';
import { createSupabaseAdminClient } from '../../lib/supabase/admin.client';

@Injectable()
export class SupabaseAuthService {
  async register(email: string, password: string) {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async login(email: string, password: string) {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async refresh(refreshToken: string) {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async logout(userId: string) {
    // Server-side logout can only be done safely with service role.
    // This revokes refresh tokens for the user.
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global');
    if (error) throw new InternalServerErrorException(error.message);
    return { ok: true };
  }
}

