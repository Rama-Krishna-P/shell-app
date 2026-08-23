import { AuthenticatedSession } from '../domain/auth';
import { ManifestPort, MicroAppPort } from '../application/ports';
import { MicroAppManifestEntry } from '../navigation/micro-app-manifest';
import { toGreetingViewModel } from '../micro-apps/greeting/greeting-view-model';

export interface GreetingProjection {
    readonly subject: string;
    readonly username: string;
    readonly contractVersion: 'v1';
}

export class AuthenticatedShell {
    constructor(
        private readonly manifest: ManifestPort<MicroAppManifestEntry>,
        private readonly microApp: MicroAppPort<GreetingProjection, unknown>,
    ) { }

    async mount(session: AuthenticatedSession): Promise<{ ok: true; app: MicroAppManifestEntry; projection: GreetingProjection } | { ok: false; error: 'unavailable' }> {
        const app = this.manifest.find('login-greeting-web');
        if (!app || app.appId !== 'login-greeting-web' || app.contractVersion !== 'v1') return { ok: false, error: 'unavailable' };
        const projection = toGreetingViewModel(session.subject, session.username);
        try { await this.microApp.mount(projection); return { ok: true, app, projection }; } catch { return { ok: false, error: 'unavailable' }; }
    }

    async unmount(): Promise<void> { await this.microApp.unmount(); }
}