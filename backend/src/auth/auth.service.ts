import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

type AuthUser = { id: number; email: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    if (!user) return null;
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return null;

    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }

  async createAdmin(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.adminUser.create({
      data: { email, password: hash },
      select: { id: true, email: true, createdAt: true },
    });
  }
}
