// Client-side visibility/routing helper only. The backend `require_admin` guard
// remains authoritative for every privileged API operation.
export function adminMfaEnrollmentRequired(user) {
    return Boolean(
        user?.role === "admin" &&
        user?.admin_mfa_required &&
        (!user?.mfa_enabled || !user?.mfa_session_verified)
    );
}

export function canAccessAdmin(user) {
    return Boolean(user?.role === "admin" && !adminMfaEnrollmentRequired(user));
}
