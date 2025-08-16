import {default as Ajv} from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import {fromString} from "../../../utils/object-utils";
import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";
import isString from "lodash/isString";

const __dirname = path.dirname(__filename);

export interface ParsedSchemaData {
    entityName: string;
    tableName: string;
    primaryKey: {
        name: string;
        type: string;
        options: {
            strategy: 'uuid' | 'increment';
        };
    };
    properties: {
        [key: string]: {
            type: string;
            nullable?: boolean;
            length?: number;
        };
    };
}

const schemaPath = path.resolve(__dirname, './nest-generation-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

export type ValidationError = Record<string, string>;
export class ValidationResult<T = unknown> {
    errors: ValidationError[];
    data?: T;

    constructor() {
        this.errors = [];
        this.data = undefined;
    }

    get success(): boolean {
        return this.errors.length === 0;
    }

    get failure(): boolean {
        return this.errors.length > 0;
    }

    withErrors(errs: string | string[] | ValidationError | ValidationError[]): this {
        const arr = isArray(errs) ? errs : [errs];
        const normalized: ValidationError[] = arr.map((err) => {
            if (isString(err)) {
                return { base: err };
            }
            return err;
        });
        this.errors.push(...normalized);
        return this;
    }

    withData(data: T): this {
        this.data = data;
        return this;
    }

    resetData = (): this => {
        this.data = undefined;
        return this
    }
}

export function toJsonData(input: string | ParsedSchemaData): ValidationResult<ParsedSchemaData> {
    const result = new ValidationResult<ParsedSchemaData>();

    if (!isString(input) && !isPlainObject(input)) {
        return result.withErrors('unsupported input type');
    }

    try {
        const data = fromString<ParsedSchemaData>(input as any) as ParsedSchemaData;
        return result.withData(data);
    } catch (e: any) {
        return result.withErrors(e?.message ?? 'Invalid JSON input');
    }
}

/**
 * Validates a JSON file against the predefined entity-generation-schema.json.
 *
 * @returns ValidationResult<ParsedSchemaData> with errors like [{ base: '...' }, { field: '...' }]
 * @throws {Error} If the validation fails, an error with details is thrown.
 * @param input
 */
export function validateAndParseSchema(
    input: string | ParsedSchemaData
): ValidationResult<ParsedSchemaData> {
    const result = toJsonData(input);
    if (result.failure || !result.data) return result;

    const ok = validate(result.data);
    if (!ok) {
        const errs: ValidationError[] = (validate.errors ?? []).map((e) => {
            const key = (e.instancePath ?? '').replace(/^\//, '') || 'base';
            return { [key]: e.message ?? 'invalid' };
        });
        return result.resetData().withErrors(errs);
    }

    return result;
}