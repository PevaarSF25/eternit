export const SESSION_KEY = 'eternit_hse_session';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

export async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
            clearSession();
            return null;
        }
        return session;
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

export function logout() {
    clearSession();
    window.location.href = 'login.html';
}

export function requireAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

export function saveSession(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...sessionData,
        expiresAt: Date.now() + SESSION_TTL
    }));
}
