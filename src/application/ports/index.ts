import { BoundedUsername } from '../../domain/identity';
import { SafeReturnPath } from '../../domain/safe-return-path';
import { Result } from '../../domain/result';

export interface OidcPort {
    beginLogin(returnPath: SafeReturnPath): Promise<Result<{ authorizationUrl: string; state: string }, 'dependency-failure' | 'validation-failure'>>;
    completeLogin(code: string, state: string): Promise<Result<{ subject: string; username: BoundedUsername; providerSessionReference: string; expiresAt: number }, 'validation-failure' | 'dependency-failure'>>;
    logout(providerSessionReference: string): Promise<void>;
}

export interface SessionRepository<T = unknown> {
    get(reference: string): Promise<T | null>;
    set(reference: string, value: T, ttlSeconds: number): Promise<void>;
    delete(reference: string): Promise<void>;
}

export interface TransactionRepository<T = unknown> extends SessionRepository<T> {
    consume(reference: string): Promise<T | null>;
}

export interface CsrfPort {
    issue(): string;
    verify(token: string | undefined, expected: string): boolean;
}

export interface RateLimitPort {
    allow(key: string): Promise<boolean>;
}

export interface ManifestPort<T = unknown> {
    find(appId: string): T | null;
}

export interface MicroAppPort<TRequest = unknown, TResponse = unknown> {
    mount(request: TRequest): Promise<TResponse>;
    unmount(): Promise<void>;
}

export type TelemetryOutcome = 'success' | 'invalid-credentials' | 'dependency-failure' | 'validation-failure' | 'rate-limited' | 'route-denied' | 'micro-app-load-failure' | 'terminated';
export interface TelemetryEvent {
    readonly eventName: string;
    readonly eventVersion: 'v1';
    readonly outcome: TelemetryOutcome;
    readonly timestamp: string;
    readonly correlationId: string;
    readonly route?: string;
    readonly component?: string;
    readonly providerCategory?: string;
    readonly status?: number;
    readonly latencyMs?: number;
    readonly subjectHash?: string;
}
export interface TelemetryPort { emit(event: TelemetryEvent): Promise<void>; }
