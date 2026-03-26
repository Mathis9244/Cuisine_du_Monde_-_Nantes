import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { SupabaseAuthController } from './supabase-auth.controller';
import { SupabaseAuthService } from './supabase-auth.service';

jest.mock('./supabase-jwt.service', () => ({
  verifySupabaseJwt: async () => ({
    id: 'user-1',
    email: 'u@example.com',
    role: 'authenticated',
    claims: { sub: 'user-1', email: 'u@example.com', role: 'authenticated' },
  }),
}));

describe('SupabaseAuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SupabaseAuthController],
      providers: [
        {
          provide: SupabaseAuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/me returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me returns user with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer valid.jwt.here')
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'user-1',
      email: 'u@example.com',
      role: 'authenticated',
    });
  });
});

