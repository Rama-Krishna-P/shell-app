import { failure, Result, success } from '../../domain/result';

export interface RuntimeConfig {
    readonly issuerUrl: string; readonly clientId: string; readonly redirectUri: string; readonly logoutUri: string;
    readonly redisUrl: string; readonly cookieName: string; readonly transactionTtlSeconds: 300;
    readonly usernameMaxUnicodeCharacters: 128; readonly greetingEntry: string;
    readonly telemetrySink: 'disabled' | 'configured-secret-store';
}

const isHttps = (value: unknown): value is string => typeof value === 'string' && new URL(value).protocol === 'https:';
const isRediss = (value: unknown): value is string => typeof value === 'string' && new URL(value).protocol === 'rediss:';

export function parseRuntimeConfig(input: unknown): Result<RuntimeConfig, 'invalid-runtime-config'> {
    if (!input || typeof input !== 'object') return failure('invalid-runtime-config');
    const value = input as Record<string, unknown>;
    try {
        if (!isHttps(value['issuerUrl']) || !isHttps(value['redirectUri']) || !isHttps(value['logoutUri']) || !isHttps(value['greetingEntry']) || !isRediss(value['redisUrl'])) return failure('invalid-runtime-config');
        if (typeof value['clientId'] !== 'string' || !value['clientId'] || typeof value['cookieName'] !== 'string' || !value['cookieName']) return failure('invalid-runtime-config');
        if (value['transactionTtlSeconds'] !== 300 || value['usernameMaxUnicodeCharacters'] !== 128) return failure('invalid-runtime-config');
        if (value['telemetrySink'] !== 'disabled' && value['telemetrySink'] !== 'configured-secret-store') return failure('invalid-runtime-config');
        return success(value as unknown as RuntimeConfig);
    } catch { return failure('invalid-runtime-config'); }
}

export function loadRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): Result<RuntimeConfig, 'invalid-runtime-config'> {
    const raw = environment['SHELL_RUNTIME_CONFIG'];
    if (!raw) return failure('invalid-runtime-config');
    try { return parseRuntimeConfig(JSON.parse(raw) as unknown); } catch { return failure('invalid-runtime-config'); }
}
