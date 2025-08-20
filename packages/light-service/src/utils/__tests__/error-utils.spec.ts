import { describe, it, expect } from "vitest";
import { parseBacktrace, cleanBacktrace, type Backtrace } from "../error-utils";

describe("error-utils", () => {
    describe("parseBacktrace", () => {
        it("returns [] for null/undefined or missing stack", () => {
            expect(parseBacktrace(undefined)).toEqual([]);
            expect(parseBacktrace(null)).toEqual([]);

            const errNoStack = new Error("no stack?");
            // Some environments may not set .stack; simulate it.
            Object.defineProperty(errNoStack, "stack", { value: "", configurable: true });
            expect(parseBacktrace(errNoStack)).toEqual([]);
        });

        it("skips the first summary line and returns trimmed frames", () => {
            const e = new Error("boom");
            const fakeStack = [
                "Error: boom",
                "    at fn (/app/src/a.ts:1:1)   ",
                "    at Object.<anonymous> (/app/src/b.ts:2:2)",
                "    at Module._compile (node:internal/modules/cjs/loader:123:45)",
            ].join("\n");

            Object.defineProperty(e, "stack", { value: fakeStack, configurable: true });

            const frames = parseBacktrace(e);
            expect(frames).toEqual([
                "    at fn (/app/src/a.ts:1:1)",
                "    at Object.<anonymous> (/app/src/b.ts:2:2)",
                "    at Module._compile (node:internal/modules/cjs/loader:123:45)",
            ]);
        });
    });

    describe("cleanBacktrace", () => {
        const frames: Backtrace = [
            "    at userFn (/repo/src/user.ts:10:5)",
            "    at helper (/repo/node_modules/pkg/index.js:5:3)",
            "    at Module._compile (node:internal/modules/cjs/loader:1320:27)",
            "    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1278:10)",
            "    at bootstrap_node.js:666:3",
            "    at (node:internal/foo:1:1)",
        ];

        it("filters node internals by default", () => {
            const cleaned = cleanBacktrace(frames);
            expect(cleaned).toEqual([
                "    at userFn (/repo/src/user.ts:10:5)",
                "    at helper (/repo/node_modules/pkg/index.js:5:3)",
            ]);
            expect(cleaned.some((l) => l.includes("node:internal"))).toBe(false);
            expect(cleaned.some((l) => l.includes("internal/"))).toBe(false);
            expect(cleaned.some((l) => l.includes("bootstrap_node.js"))).toBe(false);
        });

        it("optionally strips node_modules frames", () => {
            const cleaned = cleanBacktrace(frames, { stripNodeModules: true });
            expect(cleaned).toEqual([
                "    at userFn (/repo/src/user.ts:10:5)",
            ]);
            expect(cleaned.find((l) => l.includes("node_modules"))).toBeUndefined();
        });

        it("is a no-op on already clean frames (aside from internals)", () => {
            const clean: Backtrace = [
                "at doWork (/srv/app/index.ts:1:1)",
                "at main (/srv/app/main.ts:2:2)",
            ];
            expect(cleanBacktrace(clean)).toEqual(clean);
        });
    });
});