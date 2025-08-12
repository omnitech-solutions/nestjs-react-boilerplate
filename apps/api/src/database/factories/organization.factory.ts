import { faker } from '@faker-js/faker'

import { Organization } from '../../organizations/organization.entity'

export function makeOrganization(overrides: Partial<Organization> = {}): Partial<Organization> {
  return {
    name: faker.company.name(),
    industry: faker.commerce.department(),
    website: faker.internet.url(),
    notes: faker.lorem.sentence(),
    ...overrides
  }
}
