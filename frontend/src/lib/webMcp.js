const JSON_RPC_VERSION = "2.0";

async function invokePublicMcpTool(name, argumentsValue) {
    const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: JSON_RPC_VERSION,
            id: `webmcp-${Date.now()}`,
            method: "tools/call",
            params: { name, arguments: argumentsValue },
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || "Public marketplace tool request failed");
    }
    const text = payload?.result?.content?.find?.((item) => item?.type === "text")?.text;
    if (!text) return payload?.result || {};
    try {
        return JSON.parse(text);
    } catch {
        return { text };
    }
}

const PUBLIC_TOOLS = [
    {
        name: "search_public_listings",
        description: "Search public, approved Haraj Plus marketplace listings. This tool is read-only and never accesses private accounts, messages, wallets, promotions, bids, or payments.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", minLength: 1, maxLength: 80, description: "Short listing search query" },
                country_code: { type: "string", pattern: "^[A-Za-z]{2}$", description: "Marketplace country code; default SA" },
                limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
            },
            required: ["query"],
            additionalProperties: false,
        },
        execute: (args) => invokePublicMcpTool("search_public_listings", args),
    },
    {
        name: "get_public_listing",
        description: "Get one public, approved Haraj Plus listing by listing ID or slug. This tool is read-only.",
        inputSchema: {
            type: "object",
            properties: {
                listing_ref: { type: "string", minLength: 1, maxLength: 160 },
                country_code: { type: "string", pattern: "^[A-Za-z]{2}$", description: "Marketplace country code; default SA" },
            },
            required: ["listing_ref"],
            additionalProperties: false,
        },
        execute: (args) => invokePublicMcpTool("get_public_listing", args),
    },
];

/**
 * Registers only safe, public discovery tools with Chrome's experimental WebMCP API.
 * Unsupported browsers receive no polyfill and retain the normal application flow.
 */
export function registerPublicWebMcp() {
    if (typeof window === "undefined") return undefined;
    const modelContext = window.navigator?.modelContext;
    if (!modelContext || typeof modelContext.provideContext !== "function") return undefined;
    try {
        return modelContext.provideContext({
            name: "haraj-plus-public-marketplace",
            description: "Read-only discovery of public, approved Haraj Plus marketplace listings.",
            tools: PUBLIC_TOOLS,
        });
    } catch (error) {
        // WebMCP is an early-preview capability. A rejected registration must never
        // affect normal browsing or expose the exception to ordinary users.
        console.info("[webmcp] public tools were not registered", error?.message || error);
        return undefined;
    }
}
