import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface RestaurantQuery {
  cuisine?: string;
  search?: string;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RestaurantQuery) {
    const {
      cuisine,
      search,
      hasWebsite,
      hasPhone,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
    };

    if (cuisine) {
      where.cuisine = { equals: cuisine, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { cuisine: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasWebsite === true) {
      where.website = { not: null };
    }
    if (hasPhone === true) {
      where.phone = { not: null };
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.restaurant.findFirst({
      where: { id, isActive: true },
    });
  }

  async getStats() {
    const [total, byCuisine] = await Promise.all([
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.restaurant.groupBy({
        by: ['cuisine'],
        where: { isActive: true, cuisine: { not: null } },
        _count: { cuisine: true },
        orderBy: { _count: { cuisine: 'desc' } },
      }),
    ]);

    return {
      total,
      byCuisine: byCuisine.map((c) => ({
        cuisine: c.cuisine,
        count: c._count.cuisine,
      })),
    };
  }

  async getCuisines() {
    const result = await this.prisma.restaurant.findMany({
      where: { isActive: true, cuisine: { not: null } },
      select: { cuisine: true },
      distinct: ['cuisine'],
      orderBy: { cuisine: 'asc' },
    });
    return result.map((r) => r.cuisine).filter(Boolean) as string[];
  }
}
