import {fromString} from "@utils/object-utils";
import {createAjv, toBaseErrorObject} from "@utils/validator-utils";
import Ajv, {type AnySchema, type ErrorObject, type ValidateFunction} from 'ajv';

import {SchemaValidationError} from './support/schema-validation-error';
import {SchemaValidationResult} from './support/schema-validation-result';

export type {ErrorObject} from 'ajv';
export type ValidationFn<T> = ValidateFunction<T>;

export {SchemaValidationResult, SchemaValidationError};


export class SchemaValidator<T = unknown> {
    private readonly ajv: Ajv;
    private readonly validateFn: ValidationFn<T>;

    constructor(schema: AnySchema, ajv: Ajv = createAjv()) {
        this.ajv = ajv;
        this.validateFn = this.ajv.compile<T>(schema);
    }

    /** Single public entry: accepts object or JSON string, parses if needed, validates, returns result */
    validate(input: unknown): SchemaValidationResult<T> {

        try {
            const data = fromString(input) as T;
            this.validateFn(data);
            return new SchemaValidationResult<T>({data: data as T, errors: this.validateFn.errors ?? []})

        } catch (e: unknown) {
            const reason =
                e instanceof Error && e.message ? e.message : String(e);

            // include the original error message alongside your prefix
            const err: ErrorObject = toBaseErrorObject(
                'base',
                `Invalid JSON input: ${String(input)}. Reason: ${reason}`
            );

            return new SchemaValidationResult<T>({errors: [err]});
        }
    }
}