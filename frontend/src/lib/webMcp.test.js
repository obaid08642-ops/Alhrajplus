import { registerPublicWebMcp } from "./webMcp";

describe("registerPublicWebMcp", () => {
    const originalModelContext = navigator.modelContext;
    const originalFetch = global.fetch;

    afterEach(() => {
        Object.defineProperty(navigator, "modelContext", { configurable: true, value: originalModelContext });
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("does nothing when the experimental browser API is unavailable", () => {
        Object.defineProperty(navigator, "modelContext", { configurable: true, value: undefined });
        expect(registerPublicWebMcp()).toBeUndefined();
    });

    it("registers only public read-only listing tools", async () => {
        const cleanup = jest.fn();
        const provideContext = jest.fn(() => cleanup);
        Object.defineProperty(navigator, "modelContext", { configurable: true, value: { provideContext } });
        global.fetch = jest.fn(async () => ({
            ok: true,
            json: async () => ({ result: { content: [{ type: "text", text: '{"items":[]}' }] } }),
        }));

        expect(registerPublicWebMcp()).toBe(cleanup);
        const context = provideContext.mock.calls[0][0];
        expect(context.tools.map((tool) => tool.name)).toEqual(["search_public_listings", "get_public_listing"]);
        expect(context.tools.some((tool) => /wallet|message|promote|bid|payment/i.test(tool.name))).toBe(false);

        await expect(context.tools[0].execute({ query: "سيارة", country_code: "SA" })).resolves.toEqual({ items: [] });
        expect(global.fetch).toHaveBeenCalledWith("/api/mcp", expect.objectContaining({ method: "POST" }));
    });
});
