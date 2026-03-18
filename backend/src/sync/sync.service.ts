import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OSMFetcherService, OSMRestaurant } from './osm-fetcher.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly osmFetcher: OSMFetcherService,
  ) {}

  async syncFromOSM(cuisineFilter?: string): Promise<{ fetched: number; saved: number; message: string }> {
    const restaurants = await this.osmFetcher.fetchRestaurantsNantes(cuisineFilter);
    let saved = 0;

    for (const r of restaurants) {
      try {
        const source = 'osm';
        const sourceId = r.osmId || `temp-${Date.now()}-${saved}`;
        const existing = await this.prisma.restaurant.findFirst({
          where: { source, sourceId },
        });
        if (existing) {
          await this.prisma.restaurant.update({
            where: { id: existing.id },
            data: this.osmToUpdate(r),
          });
        } else {
          await this.prisma.restaurant.create({
            data: this.osmToCreate(r),
          });
        }
        saved++;
      } catch (e) {
        console.error('Erreur sync restaurant:', r.name, e);
      }
    }

    await this.prisma.syncLog.create({
      data: { source: 'osm', count: saved, status: 'success', details: JSON.stringify({ cuisineFilter }) },
    });

    return { fetched: restaurants.length, saved, message: `${saved} restaurants synchronisés` };
  }

  private osmToCreate(r: OSMRestaurant): Prisma.RestaurantCreateInput {
    return {
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city,
      latitude: r.latitude,
      longitude: r.longitude,
      website: r.website,
      phone: r.phone,
      source: 'osm',
      sourceId: r.osmId,
      isActive: true,
    };
  }

  private osmToUpdate(r: OSMRestaurant): Prisma.RestaurantUpdateInput {
    return {
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city,
      latitude: r.latitude,
      longitude: r.longitude,
      website: r.website,
      phone: r.phone,
    };
  }
}
