import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { Prisma } from '@prisma/client';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/restaurants')
@Controller('api/v1/admin/restaurants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminRestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des restaurants (admin, inclut inactifs)' })
  async findAll(
    @Query('cuisine') cuisine?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const where: Prisma.RestaurantWhereInput = {};
    if (cuisine) where.cuisine = { equals: cuisine, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (includeInactive !== 'true') where.isActive = true;

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip: (parseInt(page || '1', 10) - 1) * parseInt(limit || '20', 10),
        take: parseInt(limit || '20', 10),
        orderBy: { name: 'asc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      },
    };
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export CSV (admin)' })
  async exportCsv(
    @Res() res: ExpressResponse,
    @Query('excludeFrench') excludeFrench?: string,
  ): Promise<void> {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const cuisineToCountry: Record<string, string> = {
      chinese: 'Chine',
      japanese: 'Japon',
      indian: 'Inde',
      thai: 'Thaïlande',
      vietnamese: 'Vietnam',
      korean: 'Corée',
      lebanese: 'Liban',
      turkish: 'Turquie',
      italian: 'Italie',
      french: 'France',
      spanish: 'Espagne',
      greek: 'Grèce',
      mexican: 'Mexique',
      american: 'États-Unis',
      moroccan: 'Maroc',
      mediterranean: 'Méditerranée',
      asian: 'Asie',
      seafood: 'Fruits de mer',
    };
    const frenchKeywords = [
      'french',
      'français',
      'française',
      'bistrot',
      'brasserie',
      'bouchon',
      'crepe',
      'crêpe',
      'galette',
    ];

    const rows: string[][] = [
      ['nom', 'typedecuisine', 'adresse', 'ville', 'lien_google_maps', 'phone'],
    ];
    for (const r of restaurants) {
      const cuisineLower = (r.cuisine || '').toLowerCase();
      if (
        excludeFrench === 'true' &&
        frenchKeywords.some((k) => cuisineLower.includes(k))
      )
        continue;
      const country = cuisineToCountry[cuisineLower] || r.cuisine || '';
      if (excludeFrench === 'true' && !country) continue;
      const lat = r.latitude ? Number(r.latitude) : null;
      const lon = r.longitude ? Number(r.longitude) : null;
      const googleMaps =
        lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : '';
      rows.push([
        r.name,
        country,
        r.address || '',
        r.city || 'Nantes',
        googleMaps,
        r.phone || '',
      ]);
    }

    const csv = rows
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="restaurants_nantes.csv"',
    );
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail restaurant (admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.restaurant.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un restaurant' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      rating?: number;
      cuisine?: string;
      address?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      website?: string;
      phone?: string;
    },
  ) {
    return this.prisma.restaurant.update({
      where: { id },
      data: body,
    });
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un restaurant' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Réactiver un restaurant' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
