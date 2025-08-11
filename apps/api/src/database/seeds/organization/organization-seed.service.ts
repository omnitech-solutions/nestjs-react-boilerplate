import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../../organizations/organization.entity';
import { makeOrganization } from '../../factories/organization.factory';

@Injectable()
export class OrganizationSeedService {
    constructor(@InjectRepository(Organization) private readonly repo: Repository<Organization>) {}

    // Idempotent seed
    async run() {
        const hasAny = await this.repo.exist();
        if (hasAny) {
            console.log('[seed] Organizations already exist — skipping.');
            return;
        }

        const staticData: Partial<Organization>[] = [
            makeOrganization({ name: 'Acme Corporation', industry: 'Manufacturing', website: 'https://acme.example', notes: 'Demo seed org' }),
            makeOrganization({ name: 'Globex Corporation', industry: 'Technology', website: 'https://globex.example' }),
            makeOrganization({ name: 'Initech', industry: 'Software', website: 'https://initech.example' }),
        ];

        const fakeData = Array.from({ length: 10 }).map(() => makeOrganization());

        await this.repo.insert([...staticData, ...fakeData]);
        console.log('[seed] Inserted organizations.');
    }

    // Clear seeded data (used by db:seed:clear)
    async clear() {
        await this.repo.clear();
        console.log('[seed] Cleared organizations.');
    }
}