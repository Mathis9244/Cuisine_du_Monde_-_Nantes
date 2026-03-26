import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from '../../middlewares/authenticateRequest';
import type { RequestWithUser } from '../../middlewares/authenticateRequest';
import { Req } from '@nestjs/common';

class EmailPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RefreshDto {
  @IsString()
  refresh_token!: string;
}

@ApiTags('supabase-auth')
@Controller('auth')
export class SupabaseAuthController {
  constructor(private readonly auth: SupabaseAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register (Supabase Auth)' })
  async register(@Body() dto: EmailPasswordDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login (Supabase Auth)' })
  async login(@Body() dto: EmailPasswordDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh session (Supabase Auth)' })
  async refresh(@Body() dto: RefreshDto) {
    if (!dto.refresh_token) throw new BadRequestException('Missing refresh_token');
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh tokens via service role)' })
  async logout(@Req() req: RequestWithUser) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing user');
    return this.auth.logout(user.id);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user from Supabase JWT' })
  async me(@Req() req: RequestWithUser) {
    return req.user;
  }
}

