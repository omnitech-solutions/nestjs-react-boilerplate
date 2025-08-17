import type { ErrorObject } from 'ajv';

/** Output of mapping an AJV error to a friendly (key, message) pair */
export type MappedError = {
    key: string;
    message: string;
};

/** Plug-in contract to convert AJV ErrorObject into a (key, message) pair */
export interface AjvErrorMapper {
    /** Return true if this mapper should handle the error */
    canHandle(err: ErrorObject): boolean;
    /** Produce a key/message for the error */
    map(err: ErrorObject): MappedError;
}

/** Utilities */
function pathToDotNotation(instancePath?: string): string {
    // AJV v8 uses `instancePath` like "/address/street"
    const p = instancePath ?? '';
    const dotted = p.replace(/^\//, '').replace(/\//g, '.'); // -> "address.street"
    return dotted || 'base';
}

// Narrow an ErrorObject to the 'required' keyword shape with missingProperty
function isRequiredError(
    err: ErrorObject
): err is ErrorObject<'required', { missingProperty: string }> {
    return err.keyword === 'required' && typeof (err as ErrorObject<'required'>).params?.missingProperty === 'string';
}

/** Default mapper for `required` keyword that prefers the missing property name */
export class RequiredKeywordMapper implements AjvErrorMapper {
    canHandle(err: ErrorObject): boolean {
        return isRequiredError(err);
    }
    map(err: ErrorObject): MappedError {
        const e = err as ErrorObject<'required', { missingProperty: string }>;
        const key = String(e.params.missingProperty);
        return { key, message: err.message ?? 'is required' };
    }
}

/** Fallback mapper: uses the instance path (dot notation) and AJV message */
export class DefaultPathMapper implements AjvErrorMapper {
    canHandle(): boolean {
        return true;
    }
    map(err: ErrorObject): MappedError {
        const key = pathToDotNotation(err.instancePath);
        return { key, message: err.message ?? 'invalid' };
    }
}

/** Registry that runs mappers in order until one handles the error */
export class AjvErrorMapperChain {
    private readonly mappers: AjvErrorMapper[];

    constructor(mappers?: AjvErrorMapper[]) {
        // order matters: more specific first, generic last
        this.mappers = mappers && mappers.length ? mappers : [new RequiredKeywordMapper(), new DefaultPathMapper()];
    }

    map(err: ErrorObject): MappedError {
        const mapper = this.mappers.find((m) => m.canHandle(err))!;
        return mapper.map(err);
    }

    /** Convenience factory that appends custom mappers ahead of defaults */
    static withCustom(custom: AjvErrorMapper[]): AjvErrorMapperChain {
        return new AjvErrorMapperChain([...custom, new RequiredKeywordMapper(), new DefaultPathMapper()]);
    }
}

/** Wrapper around AJV error that exposes flexible key/message + raw details */
export class SchemaValidationError {
    /** Raw AJV error object for consumers who need paths/keywords/messages */
    public readonly details: ErrorObject;

    private readonly mapped: MappedError;

    constructor(details: ErrorObject, mapperChain?: AjvErrorMapperChain) {
        this.details = details;
        const chain = mapperChain ?? new AjvErrorMapperChain();
        this.mapped = chain.map(details);
    }

    /** Friendly key derived by the mapper chain (e.g., "address.street" or "email") */
    get key(): string {
        return this.mapped.key;
    }

    /** Friendly message derived by the mapper chain (e.g., "is required", "must be integer") */
    get message(): string {
        return this.mapped.message;
    }

    /** For compatibility with prior code that expected { [key]: message } */
    toRecord(): Record<string, string> {
        return { [this.key]: this.message };
    }
}