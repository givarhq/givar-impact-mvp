/**
 * Utility to decode JWT payload without external dependencies.
 * Safe for use in browser environments.
 */
export function decodeJwt<T = any>(token: string | undefined | null): T | null {
    if (!token || typeof token !== 'string') return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload) as T;
    } catch (error) {
        console.warn('JWT Decode Warning:', error);
        return null;
    }
}