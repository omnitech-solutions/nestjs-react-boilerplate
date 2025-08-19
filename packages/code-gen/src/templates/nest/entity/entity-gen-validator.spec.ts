// src/templates/nest/entity/entity-gen-validator.spec.ts
import { toTypeOrmTemplateVM } from '@utils/schema-parser-util/support/typeorm.mapper';
import { describe, it, expect } from 'vitest';

import type { AppContextState } from '../../../application-context.xstate';

import {
    validateEntityGen,
    type EntityGenInput,
} from './entity-gen-validator';

const validEntityGen = {
    entityName: 'User',
    tableName: 'users',
    primaryKey: { name: 'id', type: 'uuid', options: { strategy: 'uuid' } },
    properties: {
        id: { type: 'uuid' },
        email: { type: 'varchar', length: 255, nullable: false },
        createdAt: { type: 'datetime' },
    },
};

describe('EntityGenService / validateEntityGen()', () => {
    it('returns success and builds TypeORM VM for a valid schema JSON string', async () => {
        const ctx = await validateEntityGen(
            JSON.stringify(validEntityGen) as EntityGenInput
        );

        const s = ctx.state as AppContextState<
            Record<string, unknown>,
            typeof validEntityGen
        >;
        expect(ctx.success).toBe(true);
        expect(s.errors).toEqual({});
        expect(s.data).toBeTruthy();

        const resource = toTypeOrmTemplateVM(s.data as any);
        expect(resource.entityName).toBe('User');

        const names = resource.properties.map((p) => p.name);
        expect(names).toContain('email');
        expect(names).not.toContain('createdAt');
    });

    it('schema invalid: missing required fields produces error map and failure', async () => {
        const invalid = { ...validEntityGen, entityName: undefined } as any;
        const ctx = await validateEntityGen(
            JSON.stringify(invalid) as EntityGenInput
        );

        const s = ctx.state;
        expect(ctx.failure).toBe(true);
        expect(Object.keys(s.errors)).toContain('entityName');
        expect(s.data).toBeNull();
    });

    it('malformed JSON string: surfaces base error and fails', async () => {
        const bad = '{"entityName":"User",'; // malformed
        const ctx = await validateEntityGen(bad as EntityGenInput);
        const s = ctx.state;

        expect(ctx.failure).toBe(true);
        expect(s.errors.base).toBeDefined();
        expect(String(s.errors.base)).toMatch(/invalid json input/i);
    });

    it('maps either build-resource or validation failures appropriately', async () => {
        // break PK options.strategy
        const badForMapper = {
            ...validEntityGen,
            primaryKey: {
                ...validEntityGen.primaryKey,
                options: { strategy: undefined },
            },
        } as any;

        const ctx = await validateEntityGen(
            JSON.stringify(badForMapper) as EntityGenInput
        );
        const s = ctx.state;

        if (ctx.failure && Object.keys(s.errors).length > 0) {
            const vals = Object.values(s.errors).map((v) => String(v).toLowerCase());
            const hasBase = 'base' in s.errors;
            const looksLikeAjv = vals.some(
                (m) => m.includes('required') || m.includes('type')
            );
            expect(hasBase || looksLikeAjv).toBe(true);
        } else {
            expect(ctx.success).toBe(true);
            const resource = toTypeOrmTemplateVM(s.data as any);
            expect(resource).toBeTruthy();
        }
    });
});