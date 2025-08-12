import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateOrganizationDto, UpdateOrganizationDto } from './dto'
import { OrganizationsService } from './organizations.service'

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list() {
    return this.service.findAll()
  }

  @Get(':uuid')
  get(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.service.findOne(uuid)
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto)
  }

  @Put(':uuid')
  update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(uuid, dto)
  }

  @Delete(':uuid')
  delete(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.service.remove(uuid)
  }
}
