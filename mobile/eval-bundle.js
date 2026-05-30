// Try to evaluate the dev bundle in a sandbox with RN/expo polyfills to surface module-level throws.
const fs = require("fs");
const vm = require("vm");

const code = fs.readFileSync("/tmp/dev-bundle.js", "utf8");

// Build a minimal globalThis matching what Hermes-RN sets up.
const sandbox = {
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    setImmediate, clearImmediate,
    queueMicrotask,
    Promise,
    globalThis: undefined,
    process: { env: {} },
    __DEV__: true,
    __METRO_GLOBAL_PREFIX__: "",
    nativePerformanceNow: () => Date.now(),
    nativeFlushQueueImmediate: () => {},
    nativeCallSyncHook: () => null,
    __fbBatchedBridge: { callFunctionReturnFlushedQueue: () => [], invokeCallbackAndReturnFlushedQueue: () => [], flushedQueue: () => [], callFunctionReturnResultAndFlushedQueue: () => [] },
};
sandbox.globalThis = sandbox;
sandbox.global = sandbox;
sandbox.self = sandbox;
sandbox.window = sandbox;
// HermesInternal — many expo modules check for this
sandbox.HermesInternal = null;
sandbox.nativeModuleProxy = new Proxy({}, { get: () => ({}) });
sandbox.__turboModuleProxy = () => ({});
sandbox.RN$Bridgeless = false;
sandbox.ErrorUtils = {
    setGlobalHandler: () => {},
    getGlobalHandler: () => () => {},
    reportError: (e) => console.error("ErrorUtils.reportError:", e?.message, "\n", e?.stack?.split("\n").slice(0, 25).join("\n")),
    reportFatalError: (e) => { console.error("FATAL:", e?.message, "\n", e?.stack?.split("\n").slice(0, 30).join("\n")); throw e; },
};
sandbox.__r = undefined;
sandbox.__d = undefined;

const ctx = vm.createContext(sandbox);
try {
    vm.runInContext(code, ctx, { filename: "bundle.js", timeout: 30000 });
    console.log("\n✅ Bundle evaluated without top-level throw");
} catch (e) {
    console.error("\n🔴 BUNDLE EVAL THREW:");
    console.error("Message:", e.message);
    console.error("Stack (first 30 lines):");
    console.error((e.stack || "").split("\n").slice(0, 30).join("\n"));
}
