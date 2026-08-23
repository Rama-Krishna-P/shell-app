import { OidcPort } from '../ports';
import { SafeReturnPath } from '../../domain/safe-return-path';
import { Result } from '../../domain/result';

export interface LoginEntry {
    readonly authorizationUrl: string;
    readonly returnPath: SafeReturnPath;
}

export class LoginEntryUseCase {
    constructor(private readonly oidc: OidcPort) { }

    async execute(returnPath: unknown = '/'): Promise<Result<LoginEntry, 'dependency-failure' | 'validation-failure'>> {
        const safePath = SafeReturnPath.create(returnPath);
        if (!safePath.ok) return { ok: false, error: 'validation-failure' };
        const result = await this.oidc.beginLogin(safePath.value);
        return result.ok ? { ok: true, value: { authorizationUrl: result.value.authorizationUrl, returnPath: safePath.value } } : result;
    }
}