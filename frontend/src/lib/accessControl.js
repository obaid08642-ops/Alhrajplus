// Client-side visibility/routing helper only. The backend `require_admin` guard
// remains the authoritative enforcement for every privileged API operation.
export function canAccessAdmin(user) {
    return user?.role === "admin";
}
