import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { SafeReturnPath } from '../../domain/safe-return-path';
import { CsrfPort } from '../../application/ports';

export interface CookieOptions { httpOnly: true; secure: true; sameSite: 'lax'; path: '/'; maxAge?: number; }
export class SecureCookieAdapter {
    constructor(private readonly name: string) { }
    options(maxAge?: number): CookieOptions { return { httpOnly: true, secure: true, sameSite: 'lax', path: '/', ...(maxAge === undefined ? {} : { maxAge }) }; }
    serialize(value: string): string { return `${this.name}=${encodeURIComponent(value)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`; }
    clear(): string { return `${this.name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }
}

export class CsrfTokenAdapter implements CsrfPort {
    constructor(private readonly secret: string) { }
    issue(): string { const nonce = randomBytes(24).toString('base64url'); return `${nonce}.${createHmac('sha256', this.secret).update(nonce).digest('base64url')}`; }
    verify(token: string | undefined, expected: string): boolean {
        if (!token || token !== expected || !token.includes('.')) return false;
        const [nonce, signature] = token.split('.');
        const actual = createHmac('sha256', this.secret).update(nonce).digest('base64url');
        return signature.length === actual.length && timingSafeEqual(Buffer.from(signature), Buffer.from(actual));
    }
}

export function safeSameOriginReturnPath(value: unknown): SafeReturnPath | null {
    const result = SafeReturnPath.create(value);
    return result.ok ? result.value : null;
}
