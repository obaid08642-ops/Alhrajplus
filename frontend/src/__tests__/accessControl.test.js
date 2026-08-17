import { canAccessAdmin } from "../lib/accessControl";

describe("canAccessAdmin", () => {
    test("allows only the server-provided admin role", () => {
        expect(canAccessAdmin({ role: "admin", email: "anything@example.com" })).toBe(true);
    });

    test("does not trust an email address or a non-admin role", () => {
        expect(canAccessAdmin({ role: "user", email: "Obaid08642@gmail.com" })).toBe(false);
        expect(canAccessAdmin({ role: "moderator", email: "admin@example.com" })).toBe(false);
        expect(canAccessAdmin(null)).toBe(false);
    });
});
