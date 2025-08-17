import type { ErrorObject } from 'ajv';

import type { EntityGen } from '../entity-gen.schema';

import { SchemaValidationError } from './schema-validation-error';
import { toTypeOrmTemplateVM, type TypeOrmTemplateVM } from './typeorm.mapper';

function isEntityGen(x: unknown): x is EntityGen {
    if (typeof x !== 'object' || x === null) return false;
    const o = x as Record<string, unknown>;
    return (
        typeof o.entityName === 'string' &&
        typeof o.tableName === 'string' &&
        typeof o.primaryKey === 'object' &&
        o.primaryKey !== null &&
        typeof (o.primaryKey as Record<string, unknown>).name === 'string' &&
        typeof (o.primaryKey as Record<string, unknown>).type === 'string' &&
        typeof (o.primaryKey as Record<string, unknown>).options === 'object' &&
        (o as { properties?: unknown }).properties !== undefined
    );
}

export class SchemaValidationResult<T = unknown> {
    /** Validated/coerced value when success === true */
    readonly data?: T;

    /** Wrapped, structured errors when failure === true */
    readonly errors: SchemaValidationError[];

    /** Present only on success */
    readonly typeOrmTemplateVM?: TypeOrmTemplateVM;

    /** Map of key → message, built once */
    readonly messagesByKey: Record<string, string>;

    /** Pre-formatted messages, derived from messagesByKey */
    readonly messages: string[];

    constructor(opts: { data?: T; errors?: ErrorObject[] } = {}) {
        this.data = opts.data;
        this.errors = (opts.errors ?? []).map((e) => new SchemaValidationError(e));

        // compute all derived fields in one place
        const { vm, messagesByKey, messages } = this.setDefaults();
        this.typeOrmTemplateVM = vm;
        this.messagesByKey = messagesByKey;
        this.messages = messages;
    }

    /** dry-validation style */
    get success(): boolean {
        return this.errors.length === 0;
    }
    get failure(): boolean {
        return !this.success;
    }
    get ok(): boolean {
        return this.success;
    }

    // -----------------
    // internals
    // -----------------
    private setDefaults(): {
        vm?: TypeOrmTemplateVM;
        messagesByKey: Record<string, string>;
        messages: string[];
    } {
        const vm = this.success && this.data != null && isEntityGen(this.data)
            ? toTypeOrmTemplateVM(this.data)
            : undefined;

        const messagesByKey = Object.fromEntries(this.errors.map((e) => [e.key, e.message]));

        const messages = Object.entries(messagesByKey).map(([k, v]) => `${k}: ${v}`);

        return { vm, messagesByKey, messages };
    }
}