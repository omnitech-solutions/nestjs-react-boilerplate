import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrganizationsService } from './organizations.service'
import { Organization } from './organization.entity'

describe('OrganizationsService', () => {
  let service: OrganizationsService
  let repo: Repository<Organization>

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrganizationsService, { provide: getRepositoryToken(Organization), useClass: Repository }]
    }).compile()
    service = module.get(OrganizationsService)
    repo = module.get(getRepositoryToken(Organization))
  })

  it('creates an organization', async () => {
    const save = vi.spyOn(repo, 'save').mockResolvedValue({ id: 1, name: 'Acme' } as any)
    vi.spyOn(repo, 'create').mockReturnValue({ name: 'Acme' } as any)
    const out = await service.create({ name: 'Acme' })
    expect(save).toHaveBeenCalled()
    expect(out.id).toBe(1)
  })
})
