import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';

@ApiTags('restaurants')
@Controller('api/v1/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des restaurants avec filtres et pagination' })
  @ApiQuery({ name: 'cuisine', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'hasWebsite', required: false, type: Boolean })
  @ApiQuery({ name: 'hasPhone', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('cuisine') cuisine?: string,
    @Query('search') search?: string,
    @Query('hasWebsite') hasWebsite?: string,
    @Query('hasPhone') hasPhone?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.restaurantsService.findAll({
      cuisine,
      search,
      hasWebsite: hasWebsite === 'true' ? true : hasWebsite === 'false' ? false : undefined,
      hasPhone: hasPhone === 'true' ? true : hasPhone === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy: sortBy || 'name',
      sortOrder: sortOrder || 'asc',
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des restaurants' })
  async getStats() {
    return this.restaurantsService.getStats();
  }

  @Get('cuisines')
  @ApiOperation({ summary: 'Liste des types de cuisines disponibles' })
  async getCuisines() {
    return this.restaurantsService.getCuisines();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un restaurant' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.restaurantsService.findOne(id);
  }
}
