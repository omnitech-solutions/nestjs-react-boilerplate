---
to: src/database/seeds/<%= lower %>/<%= lower %>-seed.service.ts
---
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import { <%= name %> } from '../../<%= plural %>/<%= lower %>.entity';
import {faker} from '@faker-js/faker';

@Injectable()
export class <%= name %>SeedService {
    constructor(@InjectRepository(<%= name %>) private readonly repo: Repository<<%= name %>>) {
    }

    async run() {
        const exists = await this.repo.exist();
        if (exists) {
            console.log('[seed] <%= name %>s already exist — skipping.');
            return;
        }
        const items = Array.from({length: 10}).map(() =>
            this.repo.create({name: faker.company.name()})
        );
        await this.repo.insert(items);
        console.log('[seed] Inserted <%= name %>s.');
    }

    async clear() {
        await this.repo.clear();
        console.log('[seed] Cleared <%= name %>s.');
    }
}