import { createHash } from 'node:crypto';
import { TelemetryEvent, TelemetryPort } from '../../application/ports';

const ALLOWED_EVENTS = new Set(['authentication', 'session', 'route-denial', 'rate-limit', 'micro-app', 'dependency-failure', 'sign-out']);
export class RedactedAsyncTelemetry implements TelemetryPort {
    constructor(private readonly sink: (event: TelemetryEvent) => Promise<void>, private readonly enabled = true) { }
    async emit(event: TelemetryEvent): Promise<void> {
        if (!this.enabled || !ALLOWED_EVENTS.has(event.eventName) || event.eventVersion !== 'v1') return;
        const safe: TelemetryEvent = { eventName: event.eventName, eventVersion: 'v1', outcome: event.outcome, timestamp: event.timestamp, correlationId: event.correlationId, ...pickSafe(event) };
        void this.sink(safe).catch(() => undefined);
    }
}
function pickSafe(event: TelemetryEvent): Partial<TelemetryEvent> {
    return Object.fromEntries(Object.entries(event).filter(([key]) => ['route', 'component', 'providerCategory', 'status', 'latencyMs', 'subjectHash'].includes(key))) as Partial<TelemetryEvent>;
}
export function minimizedSubject(subject: string): string { return createHash('sha256').update(subject).digest('hex').slice(0, 16); }
