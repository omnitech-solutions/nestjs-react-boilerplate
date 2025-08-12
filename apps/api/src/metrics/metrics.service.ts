import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { CreateMetricDto, UpdateMetricDto } from './dto'
import { Metric } from './metric.entity'

@Injectable()
export class MetricsService {
  constructor(@InjectRepository(Metric) private readonly repo: Repository<Metric>) {}

  findAll() {
    return this.repo.find()
  }

  async findOne(uuid: string) {
    const entity = await this.repo.findOne({ where: { uuid } })
    if (!entity) throw new NotFoundException('Metric not found')
    return entity
  }

  create(dto: CreateMetricDto) {
    const entity = this.repo.create(dto)
    return this.repo.save(entity)
  }

  async update(uuid: string, dto: UpdateMetricDto) {
    const entity = await this.findOne(uuid)
    Object.assign(entity, dto)
    return this.repo.save(entity)
  }

  async remove(uuid: string) {
    const entity = await this.findOne(uuid)
    await this.repo.remove(entity)
  }
}
