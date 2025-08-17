import { describe, it, expect } from 'vitest';
import type { ErrorObject } from 'ajv';
import {
    RequiredKeywordMapper,
    DefaultPathMapper,
    AjvErrorMapperChain,
    SchemaValidationError,
    type AjvErrorMapper,
} from './schema-validation-error';

// Helpers to fabricate minimal AJV errors
const makeErr = (over: Partial<ErrorObject>): ErrorObject =>
    ({
        instancePath: '',
        schemaPath: '',
        keyword: 'type',
        params: {},
        message: 'invalid',
        ...over,
    } as unknown as ErrorObject);

describe('RequiredKeywordMapper', () => {
    it('handles required errors with missingProperty', () => {
        const err = makeErr({
            keyword: 'required',
            message: 'is required',
            params: { missingProperty: 'email' },
        });

        const m = new RequiredKeywordMapper();
        expect(m.canHandle(err)).toBe(true);
        expect(m.map(err)).toEqual({ key: 'email', message: 'is required' });
    });

    it('does not handle required errors without missingProperty', () => {
        const err = makeErr({ keyword: 'required', params: {} });
        const m = new RequiredKeywordMapper();
        expect(m.canHandle(err)).toBe(false);
    });
});

describe('DefaultPathMapper', () => {
    it('maps instancePath to dot notation and keeps message', () => {
        const err = makeErr({
            instancePath: '/address/street',
            message: 'is required',
        });
        const m = new DefaultPathMapper();
        expect(m.canHandle()).toBe(true); // no args
        expect(m.map(err)).toEqual({
            key: 'address.street',
            message: 'is required',
        });
    });

    it('falls back to "base" when instancePath is empty and message when missing', () => {
        const err = makeErr({ instancePath: '', message: undefined as any });
        const m = new DefaultPathMapper();
        expect(m.map(err)).toEqual({ key: 'base', message: 'invalid' });
    });
});

describe('AjvErrorMapperChain', () => {
    it('uses RequiredKeywordMapper before DefaultPathMapper', () => {
        const chain = new AjvErrorMapperChain(); // defaults include Required then Default
        const reqErr = makeErr({
            keyword: 'required',
            message: 'is required',
            params: { missingProperty: 'name' },
            instancePath: '/ignored/by/required',
        });

        expect(chain.map(reqErr)).toEqual({ key: 'name', message: 'is required' });
    });

    it('falls back to DefaultPathMapper when no mapper claims it', () => {
        const chain = new AjvErrorMapperChain();
        const err = makeErr({ instancePath: '/user/age', message: 'must be integer' });
        expect(chain.map(err)).toEqual({ key: 'user.age', message: 'must be integer' });
    });

    it('withCustom puts custom mappers before defaults', () => {
        // Custom mapper for "enum" that adds allowed values
        const custom: AjvErrorMapper = {
            canHandle: (e) => e.keyword === 'enum',
            map: (e) => ({
                key: (e.instancePath ?? '').replace(/^\//, '').replace(/\//g, '.') || 'base',
                message: `must be one of: ${((e.params as any)?.allowedValues ?? []).join(', ')}`,
            }),
        };

        const chain = AjvErrorMapperChain.withCustom([custom]);
        const err = makeErr({
            keyword: 'enum',
            instancePath: '/role',
            params: { allowedValues: ['admin', 'editor'] },
        });

        expect(chain.map(err)).toEqual({
            key: 'role',
            message: 'must be one of: admin, editor',
        });
    });
});

describe('SchemaValidationError', () => {
    it('exposes key/message via mapper chain and preserves raw details', () => {
        const err = makeErr({
            keyword: 'required',
            params: { missingProperty: 'email' },
            message: 'is required',
            instancePath: '/ignored',
        });

        const sve = new SchemaValidationError(err); // default chain
        expect(sve.key).toBe('email');
        expect(sve.message).toBe('is required');
        expect(sve.details).toBe(err);
        expect(sve.toRecord()).toEqual({ email: 'is required' });
    });

    it('works with default path mapping when not required', () => {
        const err = makeErr({ instancePath: '/profile/bio', message: 'must be string' });
        const sve = new SchemaValidationError(err);
        expect(sve.key).toBe('profile.bio');
        expect(sve.message).toBe('must be string');
    });

    it('uses a provided custom chain', () => {
        const custom: AjvErrorMapper = {
            canHandle: (e) => e.keyword === 'format',
            map: () => ({ key: 'email', message: 'invalid email' }),
        };
        const chain = AjvErrorMapperChain.withCustom([custom]);

        const err = makeErr({ keyword: 'format', instancePath: '/email' });
        const sve = new SchemaValidationError(err, chain);

        expect(sve.key).toBe('email');
        expect(sve.message).toBe('invalid email');
    });
});