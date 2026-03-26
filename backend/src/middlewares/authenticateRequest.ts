import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { verifySupabaseJwt } from '../modules/supabase-auth/supabase-jwt.service';
import type { AuthenticatedUser } from '../types/auth';

function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization') || req.header('Authorization');
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractBearerToken(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    const user = await verifySupabaseJwt(token);
    req.user = user;
    return true;
  }
}

