import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getValidatedEnv } from '../../config/env.schema';
import { createSupabaseAdminClient } from '../../lib/supabase/admin.client';

type SeedRestaurant = {
  source_id: string;
  name: string;
  city: string;
  cuisine?: string;
  rating?: number;
};

@Injectable()
export class StartupImportService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupImportService.name);

  async onApplicationBootstrap() {
    const env = getValidatedEnv();
    if (!env.ENABLE_STARTUP_IMPORT) {
      this.logger.log('Startup import disabled (ENABLE_STARTUP_IMPORT=false).');
      return;
    }
    await this.runInitialImport();
  }

  async runInitialImport(): Promise<{ imported: number; skipped: boolean }> {
    const env = getValidatedEnv();
    const table = env.SUPABASE_IMPORT_TABLE || 'restaurants';
    const markerTable = env.SUPABASE_IMPORT_MARKER_TABLE || 'startup_import_runs';
    const supabase = createSupabaseAdminClient();

    // If you already have a production-like dataset in Supabase, do not overwrite it.
    // This makes the startup import safe for existing schemas/datasets.
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      this.logger.log(
        `Startup import skipped (${table} already has ${count} row(s)).`,
      );
      return { imported: 0, skipped: true };
    }

    // Idempotency marker (requires the table to exist in Supabase).
    const markerKey = 'initial';
    const { data: existingMarker } = await supabase
      .from(markerTable)
      .select('key')
      .eq('key', markerKey)
      .maybeSingle();

    if (existingMarker) {
      this.logger.log('Startup import skipped (marker exists).');
      return { imported: 0, skipped: true };
    }

    const distSeedPath = join(__dirname, 'seed-data.json');
    const srcSeedPath = join(
      process.cwd(),
      'src',
      'modules',
      'bootstrap',
      'seed-data.json',
    );

    let raw: string;
    try {
      raw = await readFile(distSeedPath, 'utf8');
    } catch (err) {
      // When running from source (dev), the JSON may not exist under dist.
      raw = await readFile(srcSeedPath, 'utf8');
    }
    const items = JSON.parse(raw) as SeedRestaurant[];

    const { error: upsertError } = await supabase.from(table).upsert(items, {
      onConflict: 'source_id',
    });
    if (upsertError) throw upsertError;

    const { error: markerError } = await supabase.from(markerTable).insert({
      key: markerKey,
      imported_count: items.length,
    });
    if (markerError) throw markerError;

    this.logger.log(`Startup import completed: ${items.length} row(s) upserted.`);
    return { imported: items.length, skipped: false };
  }
}

