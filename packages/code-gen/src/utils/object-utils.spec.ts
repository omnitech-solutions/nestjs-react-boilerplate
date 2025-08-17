import { describe, it, expect } from 'vitest';
import { fromString } from './object-utils.js';

describe('fromString', () => {
    it('parses a valid JSON object string', () => {
        const input = '{"x":1,"y":"z"}';
        const out = fromString<{ x: number; y: string }>(input);
        expect(out).toEqual({ x: 1, y: 'z' });
    });

    it('parses JSON primitives from strings', () => {
        expect(fromString<number>('123')).toBe(123);
        expect(fromString<string>('"abc"')).toBe('abc');
        expect(fromString<boolean>('true')).toBe(true);
        expect(fromString<null>('null')).toBeNull();
    });

    it('ignores non-string inputs and returns them as-is (identity)', () => {
        const obj = { a: 1 };
        const arr = [1, 2, 3];
        const num = 42;
        const bool = false;
        const nil = null;
        const und = undefined;

        // objects/arrays: same reference
        expect(fromString(obj)).toBe(obj);
        expect(fromString(arr)).toBe(arr);

        // primitives: same value
        expect(fromString(num)).toBe(num);
        expect(fromString(bool)).toBe(bool);
        expect(fromString(nil)).toBe(nil);
        expect(fromString(und as any)).toBe(und);
    });

    it('handles leading/trailing whitespace in JSON strings', () => {
        const input = ' \n\t { "a": 1 }  ';
        const out = fromString<{ a: number }>(input);
        expect(out).toEqual({ a: 1 });
    });

    it('treats boxed String objects as strings (lodash isString)', () => {
         
        const boxed: any = String('{"k":"v"}');
        const out = fromString<{ k: string }>(boxed);
        expect(out).toEqual({ k: 'v' });
    });

    it('throws with the original string embedded for invalid JSON', () => {
        const bad = '{bad';
        expect(() => fromString(bad)).toThrowError(
            /Expected property name or '}'/
        );
    });

    it('throws for empty string input', () => {
        expect(() => fromString('')).toThrowError(
            /Unexpected end of JSON input/
        );
    });

    it('throws for non-JSON garbage string', () => {
        expect(() => fromString('undefined')).toThrowError(
            /"undefined" is not valid JSON/
        );
    });
});