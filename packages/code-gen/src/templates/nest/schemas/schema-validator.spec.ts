// src/templates/nest/schemas/schema-validator.spec.ts
import { describe, it, expect } from 'vitest';
import { SchemaValidator } from './schema-validator';
import { createAjv } from '@utils/validator-utils';
import { EntityGenSchema } from '../schemas/entity-gen.schema';

describe('SchemaValidator (EntityGenSchema)', () => {
    const ajv = createAjv();

    // A fully valid EntityGen JSON payload (as a string)
    const validEntityJson = JSON.stringify({
        entityName: 'Organization',
        tableName: 'organizations',
        primaryKey: { name: 'uuid', type: 'uuid', options: { strategy: 'uuid' } },
        properties: {
            name: { type: 'varchar', length: 255 },
            industry: { type: 'varchar', length: 100, nullable: true },
            website: { type: 'varchar', length: 2048, nullable: true },
            notes: { type: 'text', nullable: true },
        },
    });

    it('accepts a valid EntityGen JSON string and produces a VM', () => {
        const v = new SchemaValidator<typeof EntityGenSchema>(EntityGenSchema, ajv);

        const res = v.validate(validEntityJson);

        // no validation errors
        expect(res.errors).toEqual([]);
        expect(res.ok).toBe(true);

        // data is the parsed object
        expect(res.data).toBeDefined();
        expect((res.data as any).entityName).toBe('Organization');
        expect((res.data as any).tableName).toBe('organizations');

        // VM is built on success
        expect(res.typeOrmTemplateVM).toBeDefined();
        const vm = res.typeOrmTemplateVM!;
        // spot-check the mapped shape (we don’t need to assert every field)
        expect(vm.entityName).toBe('Organization');
        expect(vm.tableName).toBe('organizations');
        expect(vm.primary.strategy).toBe('uuid');
        // check a couple of properties were mapped
        const propNames = vm.properties.map(p => p.name);
        expect(propNames).toContain('name');
        expect(propNames).toContain('industry');
    });

    it('invalid JSON → base error with original reason', () => {
        const v = new SchemaValidator<any>(EntityGenSchema, ajv);

        const res = v.validate('{"entityName":'); // malformed JSON
        expect(res.failure).toBe(true);
        expect(res.errors.length).toBeGreaterThan(0);
        // message includes our “Invalid JSON input:” prefix
        expect(res.messagesByKey.base).toMatch(/invalid json input:/i);
    });

    it('missing required top-level field is reported with mapped key', () => {
        const v = new SchemaValidator<any>(EntityGenSchema, ajv);
        const bad = JSON.stringify({
            // entityName missing
            tableName: 'organizations',
            primaryKey: { name: 'uuid', type: 'uuid', options: { strategy: 'uuid' } },
            properties: {},
        });

        const res = v.validate(bad);
        expect(res.failure).toBe(true);

        // RequiredKeywordMapper should surface the missing property name as the key
        const keys = res.errors.map(e => e.key);
        expect(keys).toContain('entityName');
    });

    it('missing required nested field (primaryKey.name) is reported', () => {
        const v = new SchemaValidator<any>(EntityGenSchema, ajv);
        const bad = JSON.stringify({
            entityName: 'Organization',
            tableName: 'organizations',
            primaryKey: { /* name missing */ type: 'uuid', options: { strategy: 'uuid' } },
            properties: {},
        });

        const res = v.validate(bad);
        expect(res.failure).toBe(true);

        // Our RequiredKeywordMapper maps to the missingProperty key itself (“name”)
        const keys = res.errors.map(e => e.key);
        expect(keys).toContain('name');
    });
});