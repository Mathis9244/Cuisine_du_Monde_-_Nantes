import { Module } from '@nestjs/common';
import { AdminRestaurantsController } from './admin-restaurants.controller';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  controllers: [AdminRestaurantsController],
  imports: [RestaurantsModule],
})
export class AdminModule {}
