import { fromString } from '@utils/object-utils';
import { createAjv, toBaseErrorObject } from '@utils/validator-utils';
import Ajv, { type AnySchema, type ErrorObject, type ValidateFunction } from 'ajv';

import {
    ApplicationContext,
    ErrorMapperRegistry,
} from '../../application-context.xstate';

export class SchemaValidator<T = unknown> {
    private readonly ajv: Ajv;
    private readonly validateFn: ValidateFunction<T>;
    private readonly registry: ErrorMapperRegistry;
    private readonly ctx: ApplicationContext<Record<string, unknown>, T>;

    constructor(schema: AnySchema, ajv: Ajv = createAjv(), registry?: ErrorMapperRegistry) {
        this.ajv = ajv;
        this.validateFn = this.ajv.compile<T>(schema);
        this.registry = registry ?? new ErrorMapperRegistry();

        this.ctx = new ApplicationContext<Record<string, unknown>, T>({} as Record<string, unknown>, {
            registry: this.registry,
        });
    }

    /**
     * Validate an input (object or JSON string) and return the same
     * ApplicationContext instance so callers can chain or inspect state/messages.
     */
    validate(input: unknown): ApplicationContext<Record<string, unknown>, T> {
        this.ctx.setInput(this.ensurePlainObjectOrError(input));

        try {
            const data = fromString<T>(input as string | T) as T;
            this.validateFn(data);

            if (this.validateFn.errors && this.validateFn.errors.length > 0) {
                this.ctx.clearData().addErrors(this.validateFn.errors);
                return this.ctx;
            }

            this.ctx.clearErrors().setData(data);
            return this.ctx;
        } catch (e: unknown) {
            const reason = e instanceof Error && e.message ? e.message : String(e);
            const err: ErrorObject = toBaseErrorObject(
                'base',
                `Invalid JSON input: ${String(input)}. Reason: ${reason}`
            );
            this.ctx.clearData().addErrors([err]);
            return this.ctx;
        }
    }

    // -----------------
    // internals
    // -----------------
    private ensurePlainObjectOrError(input: unknown): Record<string, unknown> {
        if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
            return input as Record<string, unknown>;
        }
        // mark the problem; the registry will turn this into messages
        this.ctx.addErrors({ base: 'Input must be a plain object' });
        return {};
    }
}