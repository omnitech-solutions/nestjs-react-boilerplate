import {
    setup,
    createActor,
    assign,
    type ActorRefFrom,
} from 'xstate';

import type {
    AppErrors,
    AppParams,
    ErrorInput,
    AppContextState,
} from './application-context.types';
import { ErrorMapperRegistry } from './error-mappers';

export { ErrorMapperRegistry };

export type {
    AppErrors,
    AppParams,
    ErrorInput,
    AppContextState
};

/* =========================
   Shared types & helpers
========================= */
export function buildMessages(errors: AppErrors): string[] {
    return Object.entries(errors).map(([key, value]) => `${key}: ${value}`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merge helper with rules described above */
function mergeState<TInput extends Record<string, unknown>, TData>(
    current: AppContextState<TInput, TData>,
    incoming: Partial<AppContextState<TInput, TData>>
): AppContextState<TInput, TData> {
    const nextInput = (incoming.input && isPlainObject(incoming.input))
        ? (incoming.input as TInput)
        : current.input;

    const nextParams = {
        ...current.params,
        ...(incoming.params ?? {}),
    } as AppParams;

    const hasIncomingData = Object.prototype.hasOwnProperty.call(incoming, 'data');
    const nextData = hasIncomingData
        ? (incoming.data ?? null)
        : current.data;

    const hasIncomingResource = Object.prototype.hasOwnProperty.call(incoming, 'resource');
    const nextResource = hasIncomingResource
        ? (incoming.resource as Record<string, unknown> | null)
        : (current).resource ?? null;

    const nextErrors = {
        ...current.errors,
        ...(incoming.errors ?? {}),
    } as AppErrors;

    const nextMessages = buildMessages(nextErrors);

    return {
        input: nextInput,
        params: nextParams,
        data: nextData as TData | null,
        resource: nextResource ?? null,
        errors: nextErrors,
        messages: nextMessages,
    };
}

/* =========================
   XState machine
========================= */

type BaseCtx<TInput extends Record<string, unknown>, TData> =
    AppContextState<TInput, TData> & { __initialInput: TInput };

type Ev<TInput extends Record<string, unknown>, TData> =
    | { type: 'SET_INPUT'; value: unknown }
    | { type: 'ADD_PARAMS'; value: AppParams }
    | { type: 'SET_DATA'; value: TData }
    | { type: 'SET_RESOURCE'; value: Record<string, unknown> | null }
    | { type: 'CLEAR_DATA' }
    | { type: 'ADD_ERRORS'; value: ErrorInput }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'PATCH'; value: Partial<AppContextState<TInput, TData>> }
    | { type: 'MERGE'; value: Partial<AppContextState<TInput, TData>> }
    | { type: 'RESET' };

function createAppMachine<TInput extends Record<string, unknown>, TData>(opts: {
    initialInput: TInput;
    registry: ErrorMapperRegistry;
}) {
    const { initialInput, registry } = opts;

    return setup({
        types: {} as {
            context: BaseCtx<TInput, TData>;
            events: Ev<TInput, TData>;
        },

        actions: {
            setInput: assign(({ context, event }) => {
                const v = (event as Ev<TInput, TData> & { type: 'SET_INPUT' }).value;
                if (!isPlainObject(v)) {
                    const merged = { ...context.errors, base: 'Input must be a plain object' };
                    return { errors: merged, messages: buildMessages(merged) };
                }
                return { input: v as TInput };
            }),

            addParams: assign(({ context, event }) => ({
                params: {
                    ...context.params,
                    ...(event as Ev<TInput, TData> & { type: 'ADD_PARAMS' }).value,
                },
            })),

            setData: assign(({ event }) => ({
                data: (event as Ev<TInput, TData> & { type: 'SET_DATA' }).value as TData,
            })),

            setResource: assign(({ event }) => ({
                resource: (event as Ev<TInput, TData> & { type: 'SET_RESOURCE' }).value as Record<string, unknown> | null,
            })),

            clearData: assign(() => ({ data: null, resource: null })),

            addErrors: assign(({ context, event }) => {
                const mapped = registry.map(
                    (event as Ev<TInput, TData> & { type: 'ADD_ERRORS' }).value
                );
                const merged = { ...context.errors, ...mapped };
                return { errors: merged, messages: buildMessages(merged) };
            }),

            clearErrors: assign(() => ({ errors: {}, messages: [] })),

            patch: assign(({ context, event }) => {
                const nextValue = (event as Ev<TInput, TData> & { type: 'PATCH' }).value;
                const nextErrors = (nextValue.errors ?? context.errors) as AppErrors;
                return { ...nextValue, messages: buildMessages(nextErrors) };
            }),

            merge: assign(({ context, event }) => {
                const incoming = (event as Ev<TInput, TData> & { type: 'MERGE' }).value;
                const next = mergeState<TInput, TData>(
                    {
                        input: context.input,
                        params: context.params,
                        data: context.data,
                        resource: (context).resource ?? null,
                        errors: context.errors,
                        messages: context.messages,
                    },
                    incoming
                );
                return next;
            }),

            reset: assign(({ context }) => ({
                input: context.__initialInput,
                params: {},
                data: null,
                resource: null,
                errors: {},
                messages: [],
            })),
        },

        guards: {
            hasErrors: ({ context }) => Object.keys(context.errors).length > 0,
        },
    }).createMachine({
        id: 'application-context',
        context: {
            __initialInput: initialInput,
            input: initialInput,
            params: {},
            data: null,
            resource: null,
            errors: {},
            messages: [],
        },
        initial: 'clean',
        states: {
            clean: {
                on: {
                    SET_INPUT: { actions: 'setInput', target: 'route' },
                    ADD_PARAMS: { actions: 'addParams' },
                    SET_DATA: { actions: 'setData' },
                    SET_RESOURCE: { actions: 'setResource' },
                    CLEAR_DATA: { actions: 'clearData' },
                    ADD_ERRORS: { actions: 'addErrors', target: 'route' },
                    CLEAR_ERRORS: { actions: 'clearErrors' },
                    PATCH: { actions: 'patch', target: 'route' },
                    MERGE: { actions: 'merge', target: 'route' },
                    RESET: { actions: 'reset', target: 'clean' },
                },
            },

            error: {
                on: {
                    SET_INPUT: { actions: 'setInput', target: 'route' },
                    ADD_PARAMS: { actions: 'addParams' },
                    SET_DATA: { actions: 'setData' },
                    SET_RESOURCE: { actions: 'setResource' },
                    CLEAR_DATA: { actions: 'clearData' },
                    ADD_ERRORS: { actions: 'addErrors', target: 'route' },
                    CLEAR_ERRORS: { actions: 'clearErrors', target: 'clean' },
                    PATCH: { actions: 'patch', target: 'route' },
                    MERGE: { actions: 'merge', target: 'route' },
                    RESET: { actions: 'reset', target: 'clean' },
                },
            },

            route: {
                always: [
                    { target: 'error', guard: 'hasErrors' },
                    { target: 'clean' },
                ],
            },
        },
    });
}

/* =========================
   Public class API
========================= */

export type ApplicationContextOptions = {
    registry?: ErrorMapperRegistry;
};

export class ApplicationContext<
    TInput extends Record<string, unknown>,
    TData = unknown
> {
    private readonly registry: ErrorMapperRegistry;
    private readonly actor: ActorRefFrom<ReturnType<typeof createAppMachine<TInput, TData>>>;

    constructor(initialInput: TInput, options?: ApplicationContextOptions) {
        this.registry = options?.registry ?? new ErrorMapperRegistry();
        const machine = createAppMachine<TInput, TData>({
            initialInput,
            registry: this.registry,
        });
        this.actor = createActor(machine).start();
    }

    setInput(newInput: unknown) {
        this.actor.send({ type: 'SET_INPUT', value: newInput });
        return this;
    }

    addParams(params: AppParams) {
        this.actor.send({ type: 'ADD_PARAMS', value: params });
        return this;
    }

    setData(data: TData) {
        this.actor.send({ type: 'SET_DATA', value: data });
        return this;
    }

    /** Set or clear the derived resource (e.g., a template VM) */
    setResource(resource: Record<string, unknown> | null) {
        this.actor.send({ type: 'SET_RESOURCE', value: resource });
        return this;
    }

    clearData() {
        this.actor.send({ type: 'CLEAR_DATA' });
        return this;
    }

    addErrors(errorInput: ErrorInput) {
        this.actor.send({ type: 'ADD_ERRORS', value: errorInput });
        return this;
    }

    fail(errorInput: ErrorInput) {
        return this.addErrors(errorInput);
    }

    clearErrors() {
        this.actor.send({ type: 'CLEAR_ERRORS' });
        return this;
    }

    /** Merge another context or a partial state into this one */
    merge(
        other:
            | ApplicationContext<TInput, TData>
            | Partial<AppContextState<TInput, TData>>
    ) {
        const value: Partial<AppContextState<TInput, TData>> =
            other instanceof ApplicationContext
                ? other.state
                : other;

        this.actor.send({ type: 'MERGE', value });
        return this;
    }

    resetState() {
        this.actor.send({ type: 'RESET' });
        return this;
    }

    /** Export a readonly snapshot (useful for persisting or merging elsewhere) */
    toState(): AppContextState<TInput, TData> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __initialInput, ...rest } = this.actor.getSnapshot().context;
        return rest as AppContextState<TInput, TData>;
    }

    /** Create a new context from a persisted state (merges in after construction) */
    static fromState<TI extends Record<string, unknown>, TD = unknown>(
        state: AppContextState<TI, TD>,
        options?: ApplicationContextOptions
    ): ApplicationContext<TI, TD> {
        const ctx = new ApplicationContext<TI, TD>(state.input, options);
        // use MERGE so errors/messages/resource are respected and routed
        ctx.merge(state);
        return ctx;
    }

    get state(): AppContextState<TInput, TData> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __initialInput, ...rest } = this.actor.getSnapshot().context;
        return rest as AppContextState<TInput, TData>;
    }

    get success(): boolean {
        return Object.keys(this.actor.getSnapshot().context.errors).length === 0;
    }

    get failure(): boolean {
        return !this.success;
    }

    get messages(): string[] {
        return this.actor.getSnapshot().context.messages;
    }
}