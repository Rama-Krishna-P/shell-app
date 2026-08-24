import { describe, expect, it } from 'vitest';
import { mapAuthenticationFailure } from '../../../src/application/auth/failure-policy';
import { RedactedAsyncTelemetry } from '../../../src/infrastructure/telemetry/redacted-telemetry';

describe('US2 safe failure contracts', () => {
    it('returns generic browser-safe responses for invalid and dependency failures', () => {
        const invalid = mapAuthenticationFailure('validation-failure');
        const dependency = mapAuthenticationFailure('dependency-failure');
        expect(invalid).toEqual({ status: 400, body: { authenticated: false, message: 'Unable to complete sign-in.' } });
        expect(dependency).toEqual({ status: 503, body: { authenticated: false, message: 'Sign-in is temporarily unavailable.' } });
        expect(JSON.stringify(invalid)).not.toContain('username');
    });

    it('allows redacted dependency and rate-limit outcomes without blocking authorization', async () => {
        const events: unknown[] = [];
        const telemetry = new RedactedAsyncTelemetry(async (event) => { events.push(event); });
        await telemetry.emit({ eventName: 'dependency-failure', eventVersion: 'v1', outcome: 'dependency-failure', timestamp: new Date(0).toISOString(), correlationId: 'test' });
        await telemetry.emit({ eventName: 'rate-limit', eventVersion: 'v1', outcome: 'rate-limited', timestamp: new Date(0).toISOString(), correlationId: 'test' });
        expect(events).toHaveLength(2);
    });
});