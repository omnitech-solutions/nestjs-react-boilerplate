import type { ErrorObject } from 'ajv';

export type AppErrors = Record<string, string>;
export type AppParams = Record<string, unknown>;
export type ErrorInput = AppErrors | ErrorObject[];

export type AppContextState<TInput extends Record<string, unknown>, TData> = {
    input: TInput;
    params: AppParams;
    data: TData | null;
    resource: Record<string, unknown> | null;
    errors: AppErrors;
    /** Pre-computed messages to avoid reformatting downstream */
    messages: string[];
};