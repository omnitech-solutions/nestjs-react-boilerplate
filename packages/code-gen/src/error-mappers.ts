import type { ErrorObject } from 'ajv';

import type { AppErrors, ErrorInput } from './application-context.types';

export interface ErrorMapper {
    canHandle(input: ErrorInput): boolean;
    map(input: ErrorInput): AppErrors;
}

export class DefaultMapper implements ErrorMapper {
    canHandle(input: ErrorInput): boolean {
        return !Array.isArray(input);
    }
    map(input: ErrorInput): AppErrors {
        return input as AppErrors;
    }
}

export class AjvErrorMapper implements ErrorMapper {
    constructor(
        private readonly mapFn?: (err: ErrorObject) => { key: string; message: string }
    ) {}

    canHandle(input: ErrorInput): boolean {
        if (!Array.isArray(input) || input.length === 0) return false;
        // Narrow the first item structurally to look like an AJV error
        const first = input[0] as unknown as ErrorObject;
        return typeof first === 'object' && first !== null && 'keyword' in first;
    }

    map(input: ErrorInput): AppErrors {
        if (!this.canHandle(input)) return input as AppErrors;
        const out: AppErrors = {};
        for (const e of input as ErrorObject[]) {
            const { key, message } = this.mapSingleAjv(e);
            out[key] = message; // last write wins
        }
        return out;
    }

    private mapSingleAjv(err: ErrorObject): { key: string; message: string } {
        if (this.mapFn) return this.mapFn(err);
        const missing = (err as ErrorObject<'required', { missingProperty?: string }>)
            .params?.missingProperty;
        const key =
            err.keyword === 'required' && typeof missing === 'string'
                ? missing
                : this.toDotPath(err.instancePath) || 'base';
        return { key, message: err.message ?? 'invalid' };
    }

    private toDotPath(instancePath?: string): string {
        const p = instancePath ?? '';
        return p.replace(/^\//, '').replace(/\//g, '.'); // "/a/b" -> "a.b"
    }
}

/** Chain/registry: first mapper whose canHandle() is true; fallback defaults to AjvErrorMapper */
export class ErrorMapperRegistry {
    private readonly chain: ErrorMapper[];
    private readonly fallback: ErrorMapper;

    constructor(chain?: ErrorMapper[], fallback?: ErrorMapper) {
        this.fallback = fallback ?? new AjvErrorMapper();
        this.chain = chain?.length ? chain : [new AjvErrorMapper(), new DefaultMapper()];
    }

    map(input: ErrorInput): AppErrors {
        const mapper = this.chain.find((m) => m.canHandle(input)) ?? this.fallback;
        return mapper.map(input);
    }
}