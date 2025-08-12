import 'reflect-metadata'
import { describe, it, beforeEach, expect, vi } from 'vitest'

import { CreateMetricDto, UpdateMetricDto } from './dto'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

type ServiceMock = {
  findAll: ReturnType<typeof vi.fn>
  findOne: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
}

function createServiceMock(): ServiceMock {
  return {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  }
}

describe('MetricsController', () => {
  let service: ServiceMock
  let controller: MetricsController

  beforeEach(() => {
    service = createServiceMock()
    // Inject the mock service
    controller = new MetricsController(service as unknown as MetricsService)
    vi.clearAllMocks()
  })

  it('list -> delegates to service.findAll', async () => {
    const data = [{ uuid: 'u1' }, { uuid: 'u2' }]
    service.findAll.mockResolvedValue(data)

    const out = await controller.list()
    expect(service.findAll).toHaveBeenCalledTimes(1)
    expect(out).toBe(data)
  })

  it('get -> delegates to service.findOne with uuid', async () => {
    const entity = { uuid: 'abc' }
    service.findOne.mockResolvedValue(entity)

    const out = await controller.get('abc')
    expect(service.findOne).toHaveBeenCalledWith('abc')
    expect(out).toBe(entity)
  })

  it('create -> delegates to service.create with dto', async () => {
    const dto: CreateMetricDto = {
      name: 'Revenue',
      value: '12.34',
      recorded_at: new Date().toISOString()
    } as CreateMetricDto
    const saved = { uuid: 'new-id', ...dto }
    service.create.mockResolvedValue(saved)

    const out = await controller.create(dto)
    expect(service.create).toHaveBeenCalledWith(dto)
    expect(out).toBe(saved)
  })

  it('update -> delegates to service.update with uuid + dto', async () => {
    const uuid = 'id-1'
    const dto: UpdateMetricDto = { name: 'Updated', value: '99.99' }
    const saved = { uuid, ...dto }
    service.update.mockResolvedValue(saved)

    const out = await controller.update(uuid, dto)
    expect(service.update).toHaveBeenCalledWith(uuid, dto)
    expect(out).toBe(saved)
  })

  it('delete -> delegates to service.remove with uuid', async () => {
    const uuid = 'id-2'
    service.remove.mockResolvedValue(undefined)

    const out = await controller.delete(uuid)
    expect(service.remove).toHaveBeenCalledWith(uuid)
    expect(out).toBeUndefined()
  })
})
