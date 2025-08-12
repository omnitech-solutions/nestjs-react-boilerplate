import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Metric } from '../../../metrics/metric.entity'

@Injectable()
export class MetricSeedService {
  constructor(
    @InjectRepository(Metric)
    private readonly repo: Repository<Metric>
  ) {}

  // Idempotent seed
  async run() {
    const hasAny = await this.repo.exist()
    if (hasAny) {
      console.log('[seed] metrics already exist — skipping.')
      return
    }

    const fakeData = Array.from({ length: 10 }).map(() => this.make())

    await this.repo.insert(fakeData)
    console.log('[seed] Inserted metrics.')
  }

  // Clear seeded data (used by db:seed:clear)
  async clear() {
    await this.repo.clear()
    console.log('[seed] Cleared metrics.')
  }

  // Inline builder (no factory found)
  private make(overrides: Partial<Metric> = {}): Partial<Metric> {
    return {
      name: faker.company.name(),
      value: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }).toString(),
      unit: faker.lorem.words(3),
      recorded_at: new Date(),
      ...overrides
    }
  }
}
