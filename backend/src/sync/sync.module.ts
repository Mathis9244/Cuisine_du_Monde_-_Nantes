import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { OSMFetcherService } from './osm-fetcher.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService, OSMFetcherService],
})
export class SyncModule {}
