export type Backtrace = readonly string[];

/** Parse stack frames from an Error (skips the first "ErrorName: message" line). */
export const parseBacktrace = (err: Error | null | undefined): Backtrace => {
    const stack = err?.stack ?? "";
    if (!stack) return [];
    const lines = stack.split("\n").map((s) => s.trimEnd());
    return lines.slice(1);
};

/**
 * Clean Node-specific noise from backtraces.
 * - Filters internal frames (node:internal, internal/, bootstrap_node.js)
 * - Optionally strips node_modules frames
 */
export const cleanBacktrace = (
    frames: Backtrace,
    opts?: { stripNodeModules?: boolean }
): Backtrace => {
    const stripNodeModules = Boolean(opts?.stripNodeModules);

    const filtered = frames.filter((line) => {
        const l = line.trim();
        if (!l) return false;
        if (l.includes("node:internal")) return false;
        if (/\(node:internal\/.+\)/.test(l)) return false;
        if (l.includes("internal/")) return false;
        if (l.includes("bootstrap_node.js")) return false;
        return true;
    });

    return stripNodeModules ? filtered.filter((l) => !l.includes("node_modules/")) : filtered;
};