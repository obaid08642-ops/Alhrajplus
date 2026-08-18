import { adminMfaEnrollmentRequired, canAccessAdmin } from "../lib/accessControl";

describe("canAccessAdmin", () => {
    test("allows only the server-provided admin role", () => {
        expect(canAccessAdmin({ role: "admin", email: "anything@example.com" })).toBe(true);
    });

    test("does not trust an email address or a non-admin role", () => {
        expect(canAccessAdmin({ role: "user", email: "Obaid08642@gmail.com" })).toBe(false);
        expect(canAccessAdmin({ role: "moderator", email: "admin@example.com" })).toBe(false);
        expect(canAccessAdmin(null)).toBe(false);
    });

    test("requires enrolled and verified MFA when the server enables the admin MFA policy", () => {
        expect(adminMfaEnrollmentRequired({ role: "admin", admin_mfa_required: true, mfa_enabled: false, mfa_session_verified: false })).toBe(true);
        expect(canAccessAdmin({ role: "admin", admin_mfa_required: true, mfa_enabled: false, mfa_session_verified: false })).toBe(false);
        expect(canAccessAdmin({ role: "admin", admin_mfa_required: true, mfa_enabled: true, mfa_session_verified: false })).toBe(false);
        expect(canAccessAdmin({ role: "admin", admin_mfa_required: true, mfa_enabled: true, mfa_session_verified: true })).toBe(true);
    });
});
