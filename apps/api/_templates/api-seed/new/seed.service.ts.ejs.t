---
    to: src/database/seeds/<%= lower %>/<%= lower %>-seed.service.ts
---
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { <%= name %> } from '<%= entityImportPath %>'
<%_ if (hasFactory) { _%>
import { make<%= name %> } from '<%= factoryImportPath %>'
<%_ } else { _%>
import { faker } from '@faker-js/faker'
<%_ } _%>

@Injectable()
export class <%= name %>SeedService {
    constructor(
        @InjectRepository(<%= name %>)
        private readonly repo: Repository<<%= name %>>
    ) {}

    // Idempotent seed
    async run() {
        const hasAny = await this.repo.exist()
        if (hasAny) {
            console.log('[seed] <%= plural %> already exist — skipping.')
            return
        }

        <%_ if (hasFactory) { _%>
        const fakeData = Array.from({ length: 10 }).map(() => make<%= name %>())
        <%_ } else { _%>
        const fakeData = Array.from({ length: 10 }).map(() => this.make())
        <%_ } _%>

        await this.repo.insert(fakeData)
        console.log('[seed] Inserted <%= plural %>.')
    }

    // Clear seeded data (used by db:seed:clear)
    async clear() {
        await this.repo.clear()
        console.log('[seed] Cleared <%= plural %>.')
    }

    <%_ if (!hasFactory) { _%>
    // Inline builder (no factory found)
    private make(overrides: Partial<<%= name %>> = {}): Partial<<%= name %>> {
        return {
            <%- makeBody %>
            ...overrides
        }
    }
    <%_ } _%>
}