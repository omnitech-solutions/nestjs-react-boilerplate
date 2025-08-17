import { describe, it, expect } from 'vitest';
import { toTypeOrmTemplateVM, type TypeOrmTemplateVM } from './typeorm.mapper';
import type { EntityGen } from '../entity-gen.schema';

function vmOf(input: EntityGen): TypeOrmTemplateVM {
    return toTypeOrmTemplateVM(input);
}

describe('typeorm.mapper', () => {
    describe('primary key mapping', () => {
        it('maps uuid PK to primary.tsType=string', () => {
            const input: EntityGen = {
                entityName: 'Organization',
                tableName: 'organizations',
                primaryKey: { name: 'uuid', type: 'uuid', options: { strategy: 'uuid' } },
                properties: {
                    name: { type: 'varchar', length: 255 },
                },
            };
            const vm = vmOf(input);
            expect(vm.primary).toEqual({
                name: 'uuid',
                strategy: 'uuid',
                tsType: 'string',
            });
        });

        it('maps increment PK to primary.tsType=number', () => {
            const input: EntityGen = {
                entityName: 'UserAccount',
                tableName: 'user_accounts',
                primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
                properties: {
                    email: { type: 'varchar', length: 320 },
                },
            };
            const vm = vmOf(input);
            expect(vm.primary).toEqual({
                name: 'id',
                strategy: 'increment',
                tsType: 'number',
            });
        });
    });

    describe('field mapping', () => {
        it('maps varchar with length + non-nullable', () => {
            const input: EntityGen = {
                entityName: 'User',
                tableName: 'users',
                primaryKey: { name: 'id', type: 'uuid', options: { strategy: 'uuid' } },
                properties: {
                    email: { type: 'varchar', length: 255, nullable: false },
                },
            };
            const vm = vmOf(input);
            expect(vm.properties).toEqual([
                {
                    name: 'email',
                    columnType: 'varchar',
                    tsType: 'string',
                    length: 255,
                    nullable: false,
                },
            ]);
        });

        it('maps boolean + text + datetime with nullable flags', () => {
            const input: EntityGen = {
                entityName: 'Article',
                tableName: 'articles',
                primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
                properties: {
                    isPublished: { type: 'boolean' },
                    body: { type: 'text' },
                    publishedAt: { type: 'datetime', nullable: true },
                },
            };
            const vm = vmOf(input);
            // Find by name for clearer assertions
            const byName = Object.fromEntries(vm.properties.map((p) => [p.name, p]));
            expect(byName.isPublished).toEqual({
                name: 'isPublished',
                columnType: 'boolean',
                tsType: 'boolean',
                nullable: false,
            });
            expect(byName.body).toEqual({
                name: 'body',
                columnType: 'text',
                tsType: 'string',
                nullable: false,
            });
            expect(byName.publishedAt).toEqual({
                name: 'publishedAt',
                columnType: 'datetime',
                tsType: 'Date',
                nullable: true,
            });
        });

        it('passes through unknown types as columnType=<raw> and tsType=any', () => {
            const input: EntityGen = {
                entityName: 'Thing',
                tableName: 'things',
                primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
                properties: {
                    payload: { type: 'jsonb' as any, nullable: true }, // unknown to mapper
                },
            };
            const vm = vmOf(input);
            expect(vm.properties).toEqual([
                {
                    name: 'payload',
                    columnType: 'jsonb',
                    tsType: 'any',
                    nullable: true,
                },
            ]);
        });

        it('filters out createdAt/updatedAt from properties (they are handled by template)', () => {
            const input: EntityGen = {
                entityName: 'AuditLog',
                tableName: 'audit_logs',
                primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
                properties: {
                    actor: { type: 'varchar', length: 100 },
                    createdAt: { type: 'datetime' }, // should be filtered
                    updatedAt: { type: 'datetime' }, // should be filtered
                } as any,
            };
            const vm = vmOf(input);
            expect(vm.properties.map((p) => p.name)).toEqual(['actor']);
        });
    });

    describe('identity fields', () => {
        it('passes through entityName and tableName unchanged', () => {
            const input: EntityGen = {
                entityName: 'CustomEntity',
                tableName: 'custom_entities',
                primaryKey: { name: 'key', type: 'uuid', options: { strategy: 'uuid' } },
                properties: {
                    label: { type: 'varchar', length: 128 },
                },
            };
            const vm = vmOf(input);
            expect(vm.entityName).toBe('CustomEntity');
            expect(vm.tableName).toBe('custom_entities');
        });
    });

    describe('contract with template (nullable rendering)', () => {
        it('keeps base tsType and signals nullability separately', () => {
            const input: EntityGen = {
                entityName: 'Note',
                tableName: 'notes',
                primaryKey: { name: 'id', type: 'int', options: { strategy: 'increment' } },
                properties: {
                    title: { type: 'varchar', length: 200 },
                    subtitle: { type: 'varchar', length: 300, nullable: true },
                },
            };
            const vm = vmOf(input);
            const title = vm.properties.find((p) => p.name === 'title')!;
            const subtitle = vm.properties.find((p) => p.name === 'subtitle')!;
            expect(title.tsType).toBe('string');
            expect(title.nullable).toBe(false);
            expect(subtitle.tsType).toBe('string');
            expect(subtitle.nullable).toBe(true);
        });
    });
});