import {
    ConfigUpdateSchema,
    type ConfigUpdateInput,
    type ErrorCtor,
} from "./contracts/config.contract";

/**
 * Public interface for config values
 */
export interface LightServiceConfig {
    allowRaiseOnFailure: boolean;
    nonFatalErrorClasses: Array<ErrorCtor | string>;
    defaultNonFatalErrorClasses: Array<ErrorCtor | string>;
    onRaisedError: (ctx: unknown, error: unknown) => void | Promise<void>;
}

/**
 * Normalizes a constructor or string to a class name string
 */
const toName = (v: ErrorCtor | string | null | undefined): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v.trim() || null;
    return v.name || "Error";
};

/**
 * Deduplicate and normalize error classes
 */
const normalizeClassNames = (
    classes: Array<ErrorCtor | string>,
): ReadonlySet<string> => {
    const names = classes
        .map(toName)
        .filter((n): n is string => Boolean(n))
        .map((n) => n.trim());
    return new Set(names);
};

export class Configuration {
    private _allowRaiseOnFailure = true;
    private _nonFatalErrorClasses: Array<ErrorCtor | string> = [];
    private _defaultNonFatalErrorClasses: Array<ErrorCtor | string> = [];
    private _onRaisedError: (ctx: unknown, error: unknown) => void | Promise<void> =
        () => {};

    // ---- accessors ----
    get allowRaiseOnFailure(): boolean {
        return this._allowRaiseOnFailure;
    }
    set allowRaiseOnFailure(v: boolean) {
        this._allowRaiseOnFailure = Boolean(v);
    }

    get nonFatalErrorClasses(): ReadonlyArray<ErrorCtor | string> {
        return this._nonFatalErrorClasses;
    }
    set nonFatalErrorClasses(v: Array<ErrorCtor | string>) {
        this._nonFatalErrorClasses = Array.isArray(v) ? [...v] : [];
    }

    get defaultNonFatalErrorClasses(): ReadonlyArray<ErrorCtor | string> {
        return this._defaultNonFatalErrorClasses;
    }
    set defaultNonFatalErrorClasses(v: Array<ErrorCtor | string>) {
        this._defaultNonFatalErrorClasses = Array.isArray(v) ? [...v] : [];
    }

    get onRaisedError(): (ctx: unknown, error: unknown) => void | Promise<void> {
        return this._onRaisedError;
    }
    set onRaisedError(fn: (ctx: unknown, error: unknown) => void | Promise<void>) {
        this._onRaisedError = typeof fn === "function" ? fn : () => {};
    }

    // ---- helpers ----

    /** Ruby-style predicate */
    allowRaiseOnFailureQ(): boolean {
        return this.allowRaiseOnFailure;
    }

    /** Combined, de-duplicated set of non-fatal error names */
    nonFatalErrors(): ReadonlySet<string> {
        const combined = [
            ...this._defaultNonFatalErrorClasses,
            ...this._nonFatalErrorClasses,
        ];
        return normalizeClassNames(combined);
    }

    isNonFatalError(exception: unknown): boolean {
        const name = this.errorName(exception);
        if (!name) return false;
        return this.nonFatalErrors().has(name);
    }

    isFatalError(exception: unknown): boolean {
        const name = this.errorName(exception);
        if (!name) return true;
        return !this.nonFatalErrors().has(name);
    }

    async runRaisedErrorHook(ctx: unknown, error: unknown): Promise<void> {
        try {
            await this._onRaisedError(ctx, error);
        } catch {
            // swallow hook errors so they don't mask the real error
        }
    }

    /** Update config with contract validation */
    update(partial: Partial<LightServiceConfig>): Readonly<LightServiceConfig> {
        const parsed: ConfigUpdateInput = ConfigUpdateSchema.parse(partial);

        if (parsed.allowRaiseOnFailure !== undefined) {
            this.allowRaiseOnFailure = parsed.allowRaiseOnFailure;
        }
        if (parsed.nonFatalErrorClasses) {
            this.nonFatalErrorClasses = [...parsed.nonFatalErrorClasses];
        }
        if (parsed.defaultNonFatalErrorClasses) {
            this.defaultNonFatalErrorClasses = [...parsed.defaultNonFatalErrorClasses];
        }
        if (parsed.onRaisedError) {
            this.onRaisedError = parsed.onRaisedError;
        }

        return Object.freeze({
            allowRaiseOnFailure: this._allowRaiseOnFailure,
            nonFatalErrorClasses: [...this._nonFatalErrorClasses],
            defaultNonFatalErrorClasses: [...this._defaultNonFatalErrorClasses],
            onRaisedError: this._onRaisedError,
        });
    }

    /** Reset to defaults */
    reset(): void {
        this._allowRaiseOnFailure = true;
        this._nonFatalErrorClasses = [];
        this._defaultNonFatalErrorClasses = [];
        this._onRaisedError = () => {};
    }

    private errorName(ex: unknown): string | null {
        if (ex instanceof Error) {
            // Prefer subclass constructor name if .name is missing or "Error"
            const n = ex.name;
            if (n && n !== "Error") return n;

            const ctorName =
                typeof (ex as { constructor?: { name?: unknown } })?.constructor?.name === "string"
                    ? ((ex as { constructor: { name: string } }).constructor.name)
                    : null;

            return ctorName || "Error";
        }

        const anyEx = ex as { name?: unknown; constructor?: { name?: unknown } };
        const maybeName =
            typeof anyEx?.name === "string"
                ? anyEx.name
                : typeof anyEx?.constructor?.name === "string"
                    ? anyEx.constructor.name
                    : null;

        return maybeName && maybeName.length > 0 ? maybeName : null;
    }
}

/** Singleton config instance */
export const config = new Configuration();

/** Rails-style helper for inline config */
export const configure = (
    fn: (c: Configuration) => void | Promise<void>,
): Promise<void> | void => fn(config);