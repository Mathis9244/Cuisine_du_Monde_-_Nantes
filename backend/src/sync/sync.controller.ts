import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sync')
@Controller('api/v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('osm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchroniser depuis OpenStreetMap (admin)' })
  async syncFromOSM(@Body() body: { cuisine?: string }) {
    return this.syncService.syncFromOSM(body.cuisine);
  }

  @Post('google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchroniser depuis Google Maps via Selenium (admin)' })
  async syncFromGoogle(@Body() body: { cuisine?: string }) {
    return this.syncService.syncFromGoogle(body.cuisine);
  }
}
