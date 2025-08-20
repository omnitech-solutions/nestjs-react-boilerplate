import { z } from "zod";

/** Error constructor type
 *  Note: constructors are checked contravariantly in TS — to accept all Error subclasses
 *  with arbitrary params, we need `any[]` here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorCtor = new (...args: any[]) => Error;

export const isErrorCtor = (v: unknown): v is ErrorCtor => {
    if (typeof v !== "function") return false;
    type WithPrototype = { prototype?: unknown };
    const proto = (v as WithPrototype).prototype;
    if (!(typeof proto === "object" && proto !== null)) return false;
    // If an object with proto in its chain is an Error, ctor is an Error subclass
    return Object.create(proto as object) instanceof Error;
};

export const ErrorClassSchema = z.union([
    z.string().min(1),
    z.custom<ErrorCtor>(isErrorCtor, { message: "Expected an Error constructor" }),
]);

const isErrorHook = (
    v: unknown,
): v is (ctx: unknown, error: unknown) => void | Promise<void> => typeof v === "function";

export const ConfigUpdateSchema = z.object({
    allowRaiseOnFailure: z.boolean().optional(),
    nonFatalErrorClasses: z.array(ErrorClassSchema).optional(),
    defaultNonFatalErrorClasses: z.array(ErrorClassSchema).optional(),
    onRaisedError: z
        .custom<(ctx: unknown, error: unknown) => void | Promise<void>>(isErrorHook, {
            message: "Expected a function",
        })
        .optional(),
});

export type ConfigUpdateInput = z.infer<typeof ConfigUpdateSchema>;