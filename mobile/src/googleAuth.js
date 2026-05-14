// DEPRECATED — use socialAuth.js instead. This file remains as a thin shim so
// existing imports (AuthScreens) keep working without a refactor.
import { signInWithGoogle, fetchMe } from "./socialAuth";

export async function signInWithGoogleEmergent() {
    await signInWithGoogle();
    return fetchMe();
}
