import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OSMFetcherService, OSMRestaurant } from './osm-fetcher.service';
import { Prisma } from '@prisma/client';
import { spawn } from 'node:child_process';

interface GoogleRestaurant {
  name: string;
  cuisine?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  rating?: number;
  sourceId?: string;
}

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly osmFetcher: OSMFetcherService,
  ) {}

  async syncFromOSM(
    cuisineFilter?: string,
  ): Promise<{ fetched: number; saved: number; message: string }> {
    const restaurants =
      await this.osmFetcher.fetchRestaurantsNantes(cuisineFilter);
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
      data: {
        source: 'osm',
        count: saved,
        status: 'success',
        details: JSON.stringify({ cuisineFilter }),
      },
    });

    return {
      fetched: restaurants.length,
      saved,
      message: `${saved} restaurants synchronisés`,
    };
  }

  async syncFromGoogle(
    cuisineFilter?: string,
  ): Promise<{ fetched: number; saved: number; message: string }> {
    const restaurants = await this.runGoogleScraper(cuisineFilter);
    let saved = 0;

    for (const r of restaurants) {
      try {
        const source = 'google_maps';
        const sourceId = r.sourceId || `${r.name}-${r.address || ''}`.trim();
        const existing = await this.prisma.restaurant.findFirst({
          where: {
            OR: [
              { source, sourceId },
              {
                name: { equals: r.name, mode: 'insensitive' },
                address: r.address ? { equals: r.address, mode: 'insensitive' } : undefined,
                city: { equals: r.city || 'Nantes', mode: 'insensitive' },
              },
            ],
          },
        });

        if (existing) {
          await this.prisma.restaurant.update({
            where: { id: existing.id },
            data: this.googleToUpdate(r),
          });
        } else {
          await this.prisma.restaurant.create({
            data: this.googleToCreate(r, sourceId),
          });
        }
        saved++;
      } catch (e) {
        console.error('Erreur sync Google restaurant:', r.name, e);
      }
    }

    await this.prisma.syncLog.create({
      data: {
        source: 'google_maps',
        count: saved,
        status: 'success',
        details: JSON.stringify({ cuisineFilter }),
      },
    });

    return {
      fetched: restaurants.length,
      saved,
      message: `${saved} restaurants synchronisés depuis Google Maps`,
    };
  }

  private async runGoogleScraper(cuisineFilter?: string): Promise<GoogleRestaurant[]> {
    const command =
      process.env.GOOGLE_SCRAPER_COMMAND ||
      'python scripts/google_maps_scraper.py --city Nantes --limit 5 --headless';
    const commandWithCuisine = cuisineFilter
      ? `${command} --cuisine "${cuisineFilter.replace(/"/g, '\\"')}"`
      : command;

    const child = spawn(commandWithCuisine, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    const result = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Google scraper timeout (120s)'));
      }, 120000);

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve(code ?? 1);
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    if (result !== 0) {
      throw new Error(`Google scraper failed (${result}): ${stderr || 'unknown error'}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new Error('Google scraper output is not valid JSON');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Google scraper output must be a JSON array');
    }

    return parsed
      .filter((item): item is GoogleRestaurant => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { name?: unknown }).name === 'string'
        );
      })
      .map((item) => ({
        ...item,
        city: item.city || 'Nantes',
      }));
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

  private googleToCreate(
    r: GoogleRestaurant,
    sourceId: string,
  ): Prisma.RestaurantCreateInput {
    return {
      name: r.name,
      rating: r.rating,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city || 'Nantes',
      latitude: r.latitude,
      longitude: r.longitude,
      website: r.website,
      phone: r.phone,
      source: 'google_maps',
      sourceId,
      isActive: true,
    };
  }

  private googleToUpdate(r: GoogleRestaurant): Prisma.RestaurantUpdateInput {
    return {
      name: r.name,
      rating: r.rating,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city || 'Nantes',
      latitude: r.latitude,
      longitude: r.longitude,
      website: r.website,
      phone: r.phone,
      source: 'google_maps',
    };
  }
}
