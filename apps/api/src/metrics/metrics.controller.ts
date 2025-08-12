import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateMetricDto, UpdateMetricDto } from './dto'
import { MetricsService } from './metrics.service'

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get()
  list() {
    return this.service.findAll()
  }

  @Get(':uuid')
  get(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.service.findOne(uuid)
  }

  @Post()
  create(@Body() dto: CreateMetricDto) {
    return this.service.create(dto)
  }

  @Put(':uuid')
  update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() dto: UpdateMetricDto) {
    return this.service.update(uuid, dto)
  }

  @Delete(':uuid')
  delete(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.service.remove(uuid)
  }
}
