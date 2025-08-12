import 'reflect-metadata'
import { NotFoundException } from '@nestjs/common'
import type { Repository } from 'typeorm'
import { describe, it, beforeEach, expect, vi } from 'vitest'

import { CreateMetricDto, UpdateMetricDto } from './dto'
import { Metric } from './metric.entity'
import { MetricsService } from './metrics.service'

type RepoMock<T> = {
  find: vi.Mock<Promise<T[]>, []>
  findOne: vi.Mock<Promise<T | null>, [any]>
  create: vi.Mock<T, [Partial<T>]>
  save: vi.Mock<Promise<T>, [T]>
  remove: vi.Mock<Promise<void>, [T]>
}

function createRepoMock<T>(): RepoMock<T> {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn()
  }
}

describe('MetricsService', () => {
  let repo: RepoMock<Metric>
  let svc: MetricsService

  beforeEach(() => {
    repo = createRepoMock<Metric>()
    // Cast only at injection point; keeps our mock strongly typed for .mock* helpers
    svc = new MetricsService(repo as unknown as Repository<Metric>)
    vi.clearAllMocks()
  })

  it('findAll -> returns repo.find()', async () => {
    const rows: Metric[] = [{ uuid: 'u1' } as Metric, { uuid: 'u2' } as Metric]
    repo.find.mockResolvedValue(rows)

    const out = await svc.findAll()
    expect(repo.find).toHaveBeenCalledTimes(1)
    expect(out).toBe(rows)
  })

  it('findOne -> returns entity when found', async () => {
    const row = { uuid: 'abc' } as Metric
    repo.findOne.mockResolvedValue(row)

    const out = await svc.findOne('abc')
    expect(repo.findOne).toHaveBeenCalledWith({ where: { uuid: 'abc' } })
    expect(out).toBe(row)
  })

  it('findOne -> throws NotFoundException when missing', async () => {
    repo.findOne.mockResolvedValue(null)
    await expect(svc.findOne('missing')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('create -> repo.create + repo.save', async () => {
    const dto: CreateMetricDto = {
      name: 'Revenue',
      value: '12.34',
      recorded_at: new Date().toISOString()
    } as CreateMetricDto

    const created = { ...dto } as Metric
    const saved = { uuid: 'new-id', ...created } as Metric

    repo.create.mockReturnValue(created)
    repo.save.mockResolvedValue(saved)

    const out = await svc.create(dto)
    expect(repo.create).toHaveBeenCalledWith(dto)
    expect(repo.save).toHaveBeenCalledWith(created)
    expect(out).toBe(saved)
  })

  it('update -> merges dto and saves', async () => {
    const existing = { uuid: 'id-1', name: 'Old', value: '1.00', recorded_at: new Date() } as unknown as Metric
    const dto: UpdateMetricDto = { name: 'New Name', value: '2.00' }

    repo.findOne.mockResolvedValue(existing)
    const saved = { ...existing, ...dto } as Metric
    repo.save.mockResolvedValue(saved)

    const out = await svc.update('id-1', dto)
    expect(repo.findOne).toHaveBeenCalledWith({ where: { uuid: 'id-1' } })
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining(dto))
    expect(out).toBe(saved)
  })

  it('remove -> finds then removes', async () => {
    const existing = { uuid: 'id-2' } as Metric
    repo.findOne.mockResolvedValue(existing)
    repo.remove.mockResolvedValue()

    await svc.remove('id-2')
    expect(repo.findOne).toHaveBeenCalledWith({ where: { uuid: 'id-2' } })
    expect(repo.remove).toHaveBeenCalledWith(existing)
  })

  it('remove -> throws if entity not found', async () => {
    repo.findOne.mockResolvedValue(null)
    await expect(svc.remove('nope')).rejects.toBeInstanceOf(NotFoundException)
    expect(repo.remove).not.toHaveBeenCalled()
  })
})
