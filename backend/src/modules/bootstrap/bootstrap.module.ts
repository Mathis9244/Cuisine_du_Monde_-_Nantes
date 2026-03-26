import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { StartupImportService } from './startup-import.service';

@Module({
  providers: [StartupImportService],
})
export class BootstrapModule implements OnApplicationBootstrap {
  constructor(private readonly startupImport: StartupImportService) {}

  async onApplicationBootstrap() {
    await this.startupImport.onApplicationBootstrap();
  }
}

