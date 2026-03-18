import { Module } from '@nestjs/common';
import { AdminRestaurantsController } from './admin-restaurants.controller';

@Module({
  controllers: [AdminRestaurantsController],
})
export class AdminModule {}
