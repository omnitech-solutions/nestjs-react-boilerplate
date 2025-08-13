import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { describe, it, beforeEach, expect, vi } from 'vitest'

import { Organization } from './organization.entity'
import { OrganizationsService } from './organizations.service'

describe('OrganizationsService', () => {
  let service: OrganizationsService
  let repo: Repository<Organization>

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useClass: Repository }
      ]
    }).compile()
    service = module.get(OrganizationsService)
    repo = module.get(getRepositoryToken(Organization))
  })

  it('creates an organization', async () => {
    const save = vi
        .spyOn(repo, 'save')
        .mockResolvedValue({ uuid: 'org-1', name: 'Acme' } as unknown as Organization)
    vi.spyOn(repo, 'create').mockReturnValue({ name: 'Acme' } as unknown as Organization)

    const out = await service.create({ name: 'Acme' })
    expect(save).toHaveBeenCalled()
    expect(out.uuid).toBe('org-1')
  })
})