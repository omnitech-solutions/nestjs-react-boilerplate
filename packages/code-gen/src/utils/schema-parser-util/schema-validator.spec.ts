// src/.../schema-validator.xstate.spec.ts
import { describe, it, expect } from 'vitest';
import { createAjv } from '@utils/validator-utils';
import { SchemaValidator } from './schema-validator';
import { EntityGenSchema, type EntityGen } from '../../templates/nest/schemas/entity-gen.schema';

// ----------------------------
// Test data
// ----------------------------
const ajv = createAjv();

const validEntity: EntityGen = {
    entityName: 'Organization',
    tableName: 'organizations',
    primaryKey: {
        name: 'uuid',
        type: 'uuid',
        options: { strategy: 'uuid' },
    },
    properties: {
        name: { type: 'varchar', length: 255 },
        industry: { type: 'varchar', length: 100, nullable: true },
        website: { type: 'varchar', length: 2048, nullable: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime' },
        updatedAt: { type: 'datetime' },
    },
};

describe('SchemaValidator (XState + ApplicationContext) with TypeBox EntityGenSchema', () => {
    it('validate(): success for valid plain object', () => {
        const v = new SchemaValidator<EntityGen>(EntityGenSchema, ajv);
        const ctx = v.validate(validEntity);

        // ApplicationContext instance with success and populated data
        const s = ctx.state;
        expect(ctx.success).toBe(true);
        expect(s.errors).toEqual({});
        expect(s.messages).toEqual([]);
        expect(s.data).toBeTruthy();
        expect((s.data as EntityGen).entityName).toBe('Organization');
    });

    it('validate(): success for valid JSON string (Organization object stringified)', () => {
        const v = new SchemaValidator<EntityGen>(EntityGenSchema, ajv);
        const ctx = v.validate(JSON.stringify(validEntity));

        const s = ctx.state;
        expect(ctx.success).toBe(true);
        expect(s.errors).toEqual({});
        expect(s.messages).toEqual([]);
        expect(s.data).toBeTruthy();
        expect((s.data as EntityGen).tableName).toBe('organizations');
    });

    it('validate(): failure with Ajv errors when required field is missing', () => {
        const v = new SchemaValidator<EntityGen>(EntityGenSchema, ajv);

        // Remove a required field (entityName) to trigger "required" error
        const invalid: Partial<EntityGen> = { ...validEntity };
        delete invalid.entityName;

        const ctx = v.validate(invalid);
        const s = ctx.state;

        expect(ctx.failure).toBe(true);
        expect(s.data).toBeNull();
        expect(Object.keys(s.errors).length).toBeGreaterThan(0);

        // Default AJV error mappers map "required" -> missing property key
        expect(Object.keys(s.errors)).toContain('entityName');

        // Message should be AJV's required message
        const msg = s.messages.find((m) => m.startsWith('entityName:'));
        expect(msg).toBeDefined();
        expect(msg).toContain(`must have required property 'entityName'`);
    });

    it('validate(): failure with base error for malformed JSON string', () => {
        const v = new SchemaValidator<EntityGen>(EntityGenSchema, ajv);
        const ctx = v.validate('{"entityName":"Oops",'); // malformed

        const s = ctx.state;
        expect(ctx.failure).toBe(true);
        expect(s.data).toBeNull();

        // Base error produced via toBaseErrorObject()
        expect(Object.keys(s.errors)).toContain('base');
        const baseMsg = s.messages.find((m) => m.startsWith('base:'));
        expect(baseMsg).toBeDefined();
        expect(String(baseMsg)).toContain('Invalid JSON input');
    });

    it('resetState(): clears context back to clean state', () => {
        const v = new SchemaValidator<EntityGen>(EntityGenSchema, ajv);

        // dirty it up first
        const ctx = v.validate(validEntity);
        expect(ctx.state.data).not.toBeNull();

        // reset via ApplicationContext API
        ctx.resetState();
        const s = ctx.state;

        expect(ctx.success).toBe(true);
        expect(s.input).toEqual({}); // initial input from ctor
        expect(s.params).toEqual({});
        expect(s.data).toBeNull();
        expect(s.errors).toEqual({});
        expect(s.messages).toEqual([]);
    });
});