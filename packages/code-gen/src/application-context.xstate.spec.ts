import { describe, it, expect } from 'vitest';
import { ApplicationContext } from './application-context.xstate';

import type {
    AppContextState,
    AppParams,
    AppErrors,
    ErrorInput,
} from './application-context.types';
import { ErrorMapperRegistry, AjvErrorMapper, DefaultMapper } from './error-mappers';

// Small helper so we don’t have to bring AJV in tests
type AjvLikeError = {
    keyword: string;
    instancePath?: string;
    message?: string;
    params?: Record<string, unknown>;
};

function ajvErr(
    keyword: string,
    opts: Partial<AjvLikeError> = {}
): AjvLikeError {
    return {
        keyword,
        message: 'is invalid',
        ...opts,
    };
}

describe('ApplicationContext (XState wrapper)', () => {
    type Input = { a?: number; b?: string };
    type Data = { ok: boolean };

    const initialInput: Input = { a: 1 };
    const registry = new ErrorMapperRegistry([new AjvErrorMapper(), new DefaultMapper()]);

    const newCtx = (
        init: Input = initialInput,
        reg = registry
    ) => new ApplicationContext<Input, Data>(init, { registry: reg });

    it('initializes with provided input and empty data/errors/messages/resource', () => {
        const ctx = newCtx();
        const s = ctx.state as AppContextState<Input, Data>;
        expect(s.input).toEqual({ a: 1 });
        expect(s.params).toEqual({});
        expect(s.data).toBeNull();
        expect(s.resource).toBeNull();
        expect(s.errors).toEqual({});
        expect(s.messages).toEqual([]);
        expect(ctx.success).toBe(true);
        expect(ctx.failure).toBe(false);
    });

    it('setInput: accepts plain objects and rejects non-plain inputs', () => {
        const ctx = newCtx();
        // valid
        ctx.setInput({ b: 'x' });
        expect(ctx.state.input).toEqual({ b: 'x' });
        expect(ctx.state.errors).toEqual({});
        expect(ctx.success).toBe(true);

        // invalid (array)
        ctx.setInput(['nope'] as unknown as Record<string, unknown>);
        expect(ctx.state.errors).toHaveProperty('base', 'Input must be a plain object');
        expect(ctx.messages).toContain('base: Input must be a plain object');

        // invalid (null)
        ctx.setInput(null as unknown as Record<string, unknown>);
        expect(ctx.state.errors).toHaveProperty('base');
        expect(ctx.failure).toBe(true);
    });

    it('addParams: merges params repeatedly', () => {
        const ctx = newCtx();
        ctx.addParams({ a: 1 } as AppParams);
        ctx.addParams({ b: 2 } as AppParams);
        expect(ctx.state.params).toEqual({ a: 1, b: 2 });
    });

    it('setData / clearData also clears resource', () => {
        const ctx = newCtx();
        ctx.setData({ ok: true });
        expect(ctx.state.data).toEqual({ ok: true });

        // set a resource, then clearData should null both data and resource
        ctx.setResource({ foo: 'bar' });
        expect(ctx.state.resource).toEqual({ foo: 'bar' });

        ctx.clearData();
        expect(ctx.state.data).toBeNull();
        expect(ctx.state.resource).toBeNull();
    });

    it('setResource: sets/clears derived resource independently', () => {
        const ctx = newCtx();
        expect(ctx.state.resource).toBeNull();

        ctx.setResource({ name: 'vm' });
        expect(ctx.state.resource).toEqual({ name: 'vm' });

        ctx.setResource(null);
        expect(ctx.state.resource).toBeNull();
    });

    it('addErrors (AppErrors shape): merges and builds messages', () => {
        const ctx = newCtx();
        ctx.addErrors({ fieldA: 'bad' });
        ctx.addErrors({ fieldB: 'worse' });
        expect(ctx.state.errors).toEqual({ fieldA: 'bad', fieldB: 'worse' });
        expect(ctx.messages).toEqual(['fieldA: bad', 'fieldB: worse']);
        expect(ctx.failure).toBe(true);
    });

    it('addErrors (AJV-like array): uses AjvErrorMapper to map', () => {
        const ctx = newCtx();

        const ajvErrors: ErrorInput = [
            ajvErr('required', { params: { missingProperty: 'name' }, message: 'is required' }),
            ajvErr('type', { instancePath: '/age', message: 'should be integer' }),
        ] as unknown as ErrorInput;

        ctx.addErrors(ajvErrors);
        expect(ctx.state.errors).toMatchObject({
            name: 'is required',
            age: 'should be integer',
        });
        expect(ctx.messages).toContain('name: is required');
        expect(ctx.messages).toContain('age: should be integer');
    });

    it('patch: shallow merges, can replace errors/data/resource, and recomputes messages', () => {
        const ctx = newCtx();
        ctx.addErrors({ foo: 'bad' });
        // go through the machine directly to test PATCH; bracket access avoids TS private errors
        (ctx as any)['actor'].send({
            type: 'PATCH',
            value: {
                data: { ok: false },
                resource: { patched: true } as Record<string, unknown>,
                errors: { bar: 'worse' } as AppErrors,
            },
        });

        expect(ctx.state.data).toEqual({ ok: false });
        expect(ctx.state.resource).toEqual({ patched: true });
        expect(ctx.state.errors).toEqual({ bar: 'worse' });
        expect(ctx.messages).toEqual(['bar: worse']);
    });

    it('clearErrors -> success becomes true when no errors', () => {
        const ctx = newCtx();
        ctx.addErrors({ foo: 'bad' });
        expect(ctx.failure).toBe(true);

        ctx.clearErrors();
        expect(ctx.state.errors).toEqual({});
        expect(ctx.success).toBe(true);
    });

    it('resetState: returns to initial snapshot (preserving initial input)', () => {
        const ctx = newCtx();
        ctx
            .addParams({ x: 1 })
            .setData({ ok: true })
            .setResource({ vm: 'tvm' })
            .addErrors({ y: 'nope' });

        ctx.resetState();

        expect(ctx.state).toEqual({
            input: initialInput,
            params: {},
            data: null,
            resource: null,
            errors: {},
            messages: [],
        });
    });

    it('merge(): merges params/data/resource/errors and recomputes messages', () => {
        const ctx = newCtx();
        // seed current state
        ctx
            .addParams({ p0: 0 })
            .setData({ ok: true })
            .setResource({ r0: true })
            .addErrors({ e0: 'old' });

        // incoming partial
        ctx.merge({
            params: { p1: 1 },
            // data present & non-null replaces
            data: { ok: false },
            // resource present & non-null replaces
            resource: { r1: true } as Record<string, unknown>,
            // merge errors and rebuild messages
            errors: { e1: 'new' },
        });

        expect(ctx.state.params).toEqual({ p0: 0, p1: 1 });
        expect(ctx.state.data).toEqual({ ok: false });
        expect(ctx.state.resource).toEqual({ r1: true });
        expect(ctx.state.errors).toEqual({ e0: 'old', e1: 'new' });
        expect(ctx.messages).toEqual(['e0: old', 'e1: new']);
        expect(ctx.failure).toBe(true); // still errors
    });

    it('merge(ApplicationContext): merges state from another ctx instance', () => {
        const a = newCtx({ a: 10 }); // current
        const b = newCtx({ a: 99 }); // donor

        // Make donor have different params/data/resource/errors
        b.addParams({ donor: true } as AppParams)
            .setData({ ok: false })
            .setResource({ vm: 'donor' })
            .addErrors({ donorErr: 'bad' });

        a.merge(b); // merge donor into current

        // input is overwritten by donor's input during merge
        expect(a.state.input).toEqual({ a: 99 });

        expect(a.state.params).toEqual({ donor: true });
        expect(a.state.data).toEqual({ ok: false });
        expect(a.state.resource).toEqual({ vm: 'donor' });
        expect(a.state.errors).toEqual({ donorErr: 'bad' });
        expect(a.messages).toEqual(['donorErr: bad']);
        expect(a.failure).toBe(true);
    });

    it('toState()/fromState(): round-trips a snapshot including resource', () => {
        const original = newCtx();
        original
            .addParams({ a: 2 })
            .setData({ ok: true })
            .setResource({ vm: 'persisted' })
            .addErrors({ z: 'oops' });

        const snap = original.toState();

        const restored = ApplicationContext.fromState<Input, Data>(snap, { registry });
        const s = restored.state;

        expect(s).toEqual(snap);
        expect(restored.messages).toEqual(['z: oops']);
        expect(restored.failure).toBe(true);
    });
});