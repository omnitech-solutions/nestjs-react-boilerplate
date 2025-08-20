// src/core/contracts/__tests__/config.contract.spec.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
    isErrorCtor,
    ErrorClassSchema,
    ConfigUpdateSchema,
    type ConfigUpdateInput,
} from "../config.contract";

class MyError extends Error {}
function NotAnErrorCtor() {}

describe("config.contract", () => {
    describe("isErrorConstructor", () => {
        it("returns true for built-in and custom Error constructors", () => {
            expect(isErrorCtor(Error)).toBe(true);
            expect(isErrorCtor(TypeError)).toBe(true);
            expect(isErrorCtor(MyError)).toBe(true);
        });

        it("returns false for non-Error functions and non-functions", () => {
            expect(isErrorCtor(NotAnErrorCtor)).toBe(false);
            expect(isErrorCtor({})).toBe(false);
            expect(isErrorCtor(null)).toBe(false);
            expect(isErrorCtor(undefined)).toBe(false);
        });
    });

    describe("schemas", () => {
        describe("ErrorClassSchema", () => {
            it("accepts a non-empty string class name", () => {
                expect(ErrorClassSchema.parse("TypeError")).toBe("TypeError");
                expect(ErrorClassSchema.parse("CustomError")).toBe("CustomError");
            });

            it("accepts an Error constructor", () => {
                expect(ErrorClassSchema.parse(Error)).toBe(Error);
                expect(ErrorClassSchema.parse(MyError)).toBe(MyError);
            });

            it("rejects empty strings, numbers, and non-Error constructors", () => {
                expect(() => ErrorClassSchema.parse("")).toThrowError(z.ZodError);
                expect(() => ErrorClassSchema.parse(123)).toThrowError(z.ZodError);
                expect(() => ErrorClassSchema.parse(NotAnErrorCtor)).toThrowError(z.ZodError);
            });
        });

        describe("ConfigUpdateSchema", () => {
            it("accepts an empty object (all fields optional)", () => {
                const result = ConfigUpdateSchema.parse({});
                expect(result).toEqual({});
            });

            it("accepts a fully-populated, valid config update", async () => {
                const update = {
                    allowRaiseOnFailure: false,
                    nonFatalErrorClasses: ["TypeError", MyError],
                    defaultNonFatalErrorClasses: [Error],
                    onRaisedError: (ctx: unknown, error: unknown) => {
                        void ctx;
                        void error;
                    },
                };

                const parsed = ConfigUpdateSchema.parse(update);
                expect(parsed.allowRaiseOnFailure).toBe(false);
                expect(parsed.nonFatalErrorClasses).toEqual(["TypeError", MyError]);
                expect(parsed.defaultNonFatalErrorClasses).toEqual([Error]);

                const maybePromise = parsed.onRaisedError?.({}, new Error("x"));
                await expect(Promise.resolve(maybePromise)).resolves.toBeUndefined();
            });

            it("rejects invalid shapes", () => {
                expect(() =>
                    ConfigUpdateSchema.parse({ allowRaiseOnFailure: "nope" }),
                ).toThrowError(z.ZodError);

                expect(() =>
                    ConfigUpdateSchema.parse({ nonFatalErrorClasses: ["", NotAnErrorCtor] }),
                ).toThrowError(z.ZodError);

                expect(() =>
                    ConfigUpdateSchema.parse({ defaultNonFatalErrorClasses: [123] }),
                ).toThrowError(z.ZodError);

                expect(() =>
                    ConfigUpdateSchema.parse({ onRaisedError: 123 }),
                ).toThrowError(z.ZodError);
            });

            it("returns a correctly typed object (smoke type check)", () => {
                const parsed: ConfigUpdateInput = ConfigUpdateSchema.parse({
                    nonFatalErrorClasses: ["TypeError"],
                });
                expect(parsed.nonFatalErrorClasses?.[0]).toBe("TypeError");
            });
        });
    });
});