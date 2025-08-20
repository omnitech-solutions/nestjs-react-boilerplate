import { describe, it, expect, vi } from "vitest";
import { config, Configuration, configure, type LightServiceConfig } from "../config";

class CustomNonFatal extends Error {}
class AnotherNonFatal extends Error {}

describe("config", () => {
    describe("Configuration", () => {
        it("has sensible defaults", () => {
            const c = new Configuration();
            expect(c.allowRaiseOnFailure).toBe(true);
            expect(c.nonFatalErrorClasses).toEqual([]);
            expect(c.defaultNonFatalErrorClasses).toEqual([]);
            expect(typeof c.onRaisedError).toBe("function");
            expect(c.allowRaiseOnFailureQ()).toBe(true);
            expect(Array.from(c.nonFatalErrors())).toEqual([]);
        });

        describe("update()", () => {
            it("applies partials with validation and returns a frozen snapshot", () => {
                const c = new Configuration();

                const snapshot = c.update({
                    allowRaiseOnFailure: false,
                    nonFatalErrorClasses: ["TypeError", CustomNonFatal],
                    defaultNonFatalErrorClasses: [AnotherNonFatal],
                    onRaisedError: () => {},
                });

                expect(snapshot.allowRaiseOnFailure).toBe(false);
                expect(snapshot.nonFatalErrorClasses).toEqual(["TypeError", CustomNonFatal]);
                expect(snapshot.defaultNonFatalErrorClasses).toEqual([AnotherNonFatal]);
                expect(typeof snapshot.onRaisedError).toBe("function");

                // Returned snapshot should be frozen (immutability)
                expect(Object.isFrozen(snapshot)).toBe(true);
                expect(() => ((snapshot as LightServiceConfig).allowRaiseOnFailure = true)).toThrow();
            });
        });

        describe("nonFatalErrors()", () => {
            it("de-dupes and normalizes class names", () => {
                const c = new Configuration();
                c.update({
                    nonFatalErrorClasses: ["TypeError", "TypeError", CustomNonFatal],
                    defaultNonFatalErrorClasses: [CustomNonFatal, AnotherNonFatal],
                });

                const errors = Array.from(c.nonFatalErrors());
                expect(errors).toContain("TypeError");
                expect(errors).toContain("CustomNonFatal");
                expect(errors).toContain("AnotherNonFatal");
                // De-duped
                expect(errors.filter((e) => e === "CustomNonFatal")).toHaveLength(1);
            });
        });

        describe("error classification", () => {
            it("recognizes non-fatal errors by class name", () => {
                const c = new Configuration();
                c.update({ nonFatalErrorClasses: ["TypeError", CustomNonFatal] });

                expect(c.isNonFatalError(new TypeError("bad"))).toBe(true);
                expect(c.isNonFatalError(new CustomNonFatal("oops"))).toBe(true);
                expect(c.isFatalError(new Error("boom"))).toBe(true);
            });

            it("treats unknowns as fatal", () => {
                const c = new Configuration();
                expect(c.isFatalError("not-an-error")).toBe(true);
            });
        });

        describe("runRaisedErrorHook()", () => {
            it("invokes the provided hook", async () => {
                const c = new Configuration();
                const spy = vi.fn();
                c.update({ onRaisedError: spy });

                await c.runRaisedErrorHook({ foo: 1 }, new Error("oops"));
                expect(spy).toHaveBeenCalledOnce();
                expect(spy).toHaveBeenCalledWith({ foo: 1 }, expect.any(Error));
            });

            it("swallows exceptions from hook", async () => {
                const c = new Configuration();
                c.update({
                    onRaisedError: () => {
                        throw new Error("fail inside hook");
                    },
                });

                // Should not throw
                await expect(c.runRaisedErrorHook({}, new Error("outer"))).resolves.toBeUndefined();
            });
        });

        describe("reset()", () => {
            it("resets to defaults", () => {
                const c = new Configuration();
                c.update({
                    allowRaiseOnFailure: false,
                    nonFatalErrorClasses: ["TypeError"],
                    defaultNonFatalErrorClasses: [AnotherNonFatal],
                    onRaisedError: () => {},
                });

                c.reset();
                expect(c.allowRaiseOnFailure).toBe(true);
                expect(c.nonFatalErrorClasses).toEqual([]);
                expect(c.defaultNonFatalErrorClasses).toEqual([]);
            });
        });
    });

    describe("config singleton", () => {
        it("can be configured via configure()", () => {
            configure((c) => {
                c.allowRaiseOnFailure = false;
            });
            expect(config.allowRaiseOnFailure).toBe(false);

            // reset singleton for test safety
            config.reset();
        });
    });
});