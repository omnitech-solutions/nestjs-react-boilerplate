import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { getMetadataArgsStorage } from 'typeorm'
import { Metric } from './metric.entity'

describe('Metric entity mapping', () => {
  const cols = getMetadataArgsStorage().columns.filter(c => c.target === Metric)
  const findCol = (dbName: string, propName?: string) =>
    cols.find(c => (c.options?.name ?? c.propertyName) === dbName || c.propertyName === (propName ?? dbName))

  it('registers the metrics table', () => {
    const table = getMetadataArgsStorage().tables.find(t => t.target === Metric)
    expect(table).toBeTruthy()
    expect(table!.name).toBe('metrics')
  })

  it('maps uuid', () => {
    const c = findCol('uuid')!
    expect(c).toBeTruthy()
    expect(c.options?.name).toBe('uuid')
  })

  it('maps name', () => {
    const c = findCol('name')!
    expect(c.options?.type).toBe('varchar')
    expect(c.options?.length).toBe(255)
  })

  it('maps value', () => {
    const c = findCol('value')!
    expect(c.options?.type).toBe('decimal')
    expect(c.options?.precision).toBe(18)
    expect(c.options?.scale).toBe(6)
  })

  it('maps unit (nullable)', () => {
    const c = findCol('unit')!
    expect(c.options?.type).toBe('varchar')
    expect(c.options?.length).toBe(32)
    expect(c.options?.nullable).toBe(true) // only assert when true
  })

  it('maps recorded_at', () => {
    const c = findCol('recorded_at')!
    expect(c.options?.type).toBe('datetime')
  })

  it('maps timestamps', () => {
    const created = findCol('created_at', 'createdAt')!
    expect(created.options?.type).toBe('datetime')
    expect(created.options?.name).toBe('created_at')

    const updated = findCol('updated_at', 'updatedAt')!
    expect(updated.options?.type).toBe('datetime')
    expect(updated.options?.name).toBe('updated_at')
  })
})
