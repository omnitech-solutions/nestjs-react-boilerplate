// src/templates/nest/schemas/schema-validation-result.spec.ts
import { describe, it, expect } from 'vitest';
import type { ErrorObject } from 'ajv';
import { SchemaValidationResult } from './schema-validation-result';

// Build a raw AJV ErrorObject (no wrapping)
function ajvErr(e: Partial<ErrorObject>): ErrorObject {
    const base: ErrorObject = {
        instancePath: '',
        schemaPath: '#/any',
        keyword: e.keyword ?? 'type',
        params: e.params ?? {},
        message: e.message ?? 'invalid',
    } as ErrorObject;
    return { ...base, ...e } as ErrorObject;
}

describe('SchemaValidationResult', () => {
    it('success case: has valid entity data (so VM is built); messages are empty', () => {
        // Minimal EntityGen-shaped data so the mapper can run
        const data = {
            entityName: 'X',
            tableName: 'xs',
            primaryKey: { name: 'id', type: 'uuid', options: { strategy: 'uuid' } },
            properties: {}, // no fields is fine
        };

        const r = new SchemaValidationResult<typeof data>({ data });

        expect(r.success).toBe(true);
        expect(r.failure).toBe(false);
        expect(r.ok).toBe(true);

        expect(r.data).toEqual(data);
        expect(r.errors).toEqual([]);

        // messages
        expect(r.messagesByKey).toEqual({});
        expect(r.messages).toEqual([]);

        // VM exists for success + entity-like data
        expect(r.typeOrmTemplateVM).toBeDefined();
    });

    it('failure case: builds messagesByKey & messages from AJV errors', () => {
        const errors: ErrorObject[] = [
            // required keyword → key should be the missingProperty ("email")
            ajvErr({
                keyword: 'required',
                params: { missingProperty: 'email' },
                message: 'is required',
            }),
            // path-based error → key is dot-notation of instancePath
            ajvErr({
                keyword: 'format',
                instancePath: '/address/zip',
                message: 'must match format "zip"',
            }),
        ];

        const r = new SchemaValidationResult({ errors });

        expect(r.success).toBe(false);
        expect(r.failure).toBe(true);
        expect(r.ok).toBe(false);

        // precomputed map
        expect(r.messagesByKey).toEqual({
            email: 'is required',
            'address.zip': 'must match format "zip"',
        });

        // precomputed list
        expect(r.messages).toEqual([
            'email: is required',
            'address.zip: must match format "zip"',
        ]);

        // no VM on failure
        expect(r.typeOrmTemplateVM).toBeUndefined();
    });

    it('handles base-level errors when instancePath is empty', () => {
        const r = new SchemaValidationResult({
            errors: [
                ajvErr({
                    keyword: 'type',
                    instancePath: '',
                    message: 'must be object',
                }),
            ],
        });

        expect(Object.keys(r.messagesByKey)).toEqual(['base']);
        expect(r.messagesByKey.base).toBe('must be object');
        expect(r.messages).toEqual(['base: must be object']);
        expect(r.typeOrmTemplateVM).toBeUndefined();
    });

    describe('SchemaValidationResult.typeOrmTemplateVM', () => {
        it('produces the ORIGINAL VM shape from valid entity data', () => {
            const data = {
                entityName: 'Post',
                tableName: 'posts',
                primaryKey: { name: 'id', type: 'uuid', options: { strategy: 'uuid' } },
                properties: {
                    title:   { type: 'varchar', length: 255 },
                    content: { type: 'text', nullable: true },
                },
            };

            const r = new SchemaValidationResult<typeof data>({ data });
            expect(r.success).toBe(true);
            expect(r.typeOrmTemplateVM).toEqual({
                entityName: 'Post',
                tableName: 'posts',
                primary: {
                    name: 'id',
                    strategy: 'uuid',
                    tsType: 'string',
                },
                properties: [
                    {
                        name: 'title',
                        columnType: 'varchar',
                        tsType: 'string',
                        length: 255,
                        nullable: false,
                    },
                    {
                        name: 'content',
                        columnType: 'text',
                        tsType: 'string',
                        nullable: true,
                    },
                ],
            });

            // still no messages for success
            expect(r.messagesByKey).toEqual({});
            expect(r.messages).toEqual([]);
        });

        it('does not attempt to build a VM if only errors are present', () => {
            const r = new SchemaValidationResult({
                errors: [ajvErr({ message: 'must be object' })],
            });

            expect(r.success).toBe(false);
            expect(r.typeOrmTemplateVM).toBeUndefined();
        });
    });
});