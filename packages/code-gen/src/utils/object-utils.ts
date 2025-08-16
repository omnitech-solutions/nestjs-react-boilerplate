import { isString } from 'lodash-es';

/**
 * Parses a JSON string into a JavaScript object.
 *
 * This function returns the original value if the input is not a string,
 * mimicking the behavior of a similar Ruby method. It is a type-safe way
 * to handle potentially non-string input using a Lodash utility.
 *
 * @template T - The expected shape of the parsed JSON object.
 * @param {string | T} input The JSON string to parse, or any other value.
 * @returns {T | unknown} The parsed object with type T, or the original value if it was not a string.
 * @throws {Error} If the string is not valid JSON, the error message will include the failed input.
 */
export function fromString<T = unknown>(input: string | T): T | unknown {
    if (!isString(input)) {
        return input;
    }

    try {
        return JSON.parse(input);
    } catch (error) {
        throw new Error(`Invalid JSON string provided: ${input}`);
    }
}