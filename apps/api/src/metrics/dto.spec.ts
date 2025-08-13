import 'reflect-metadata'
import { validate } from 'class-validator'
import { describe, it, expect } from 'vitest'

import { CreateMetricDto, UpdateMetricDto } from './dto'

// Helper: validate an instance populated from a plain payload
async function runValidation<T extends object>(Cls: new () => T, payload: Partial<T>) {
  const instance = Object.assign(new Cls(), payload)
  return validate(instance)
}

describe('CreateMetricDto', () => {
  it('accepts a valid payload', async () => {
    const errors = await runValidation(CreateMetricDto, {
      name: 'Revenue',
      value: '123.456',
      unit: 'CAD',
      recorded_at: new Date().toISOString()
    })
    expect(errors).toHaveLength(0)
  })

  it('allows missing optional unit', async () => {
    const errors = await runValidation(CreateMetricDto, {
      name: 'Users',
      value: '1000',
      recorded_at: '2024-01-01T00:00:00.000Z'
    })
    expect(errors).toHaveLength(0)
  })

  it('rejects short name (<2) or non-string', async () => {
    const short = await runValidation(CreateMetricDto, {
      name: 'A',
      value: '1',
      recorded_at: new Date().toISOString()
    })
    expect(short.length).toBeGreaterThan(0)

    const notString = await runValidation(CreateMetricDto, {
      name: 42 as any,
      value: '1',
      recorded_at: new Date().toISOString()
    })
    expect(notString.length).toBeGreaterThan(0)
  })

  it('requires value as string', async () => {
    const errors = await runValidation(CreateMetricDto, {
      name: 'Sessions',
      value: 123 as any,
      recorded_at: new Date().toISOString()
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('requires recorded_at as ISO date string', async () => {
    const missing = await runValidation(CreateMetricDto, {
      name: 'Sessions',
      value: '123'
    })
    expect(missing.length).toBeGreaterThan(0)

    const bad = await runValidation(CreateMetricDto, {
      name: 'Sessions',
      value: '123',
      recorded_at: 'not-a-date'
    })
    expect(bad.length).toBeGreaterThan(0)
  })
})

describe('UpdateMetricDto', () => {
  it('accepts empty payload (all fields optional)', async () => {
    const errors = await runValidation(UpdateMetricDto, {})
    expect(errors).toHaveLength(0)
  })

  it('applies same validators when fields are present', async () => {
    const bad = await runValidation(UpdateMetricDto, {
      name: 'A', // too short
      value: 5 as any, // must be string
      unit: 10 as any, // must be string
      recorded_at: 'nope' // must be date string
    })
    expect(bad.length).toBeGreaterThan(0)
  })

  it('accepts valid partial updates', async () => {
    const ok1 = await runValidation(UpdateMetricDto, { name: 'Good Name' })
    expect(ok1).toHaveLength(0)

    const ok2 = await runValidation(UpdateMetricDto, { value: '12.34' })
    expect(ok2).toHaveLength(0)

    const ok3 = await runValidation(UpdateMetricDto, { recorded_at: new Date().toISOString() })
    expect(ok3).toHaveLength(0)
  })
})
