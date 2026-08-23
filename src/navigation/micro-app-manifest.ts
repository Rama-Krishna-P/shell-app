import { ManifestPort } from '../application/ports';

export interface MicroAppManifestEntry {
    readonly appId: string;
    readonly route: string;
    readonly label: string;
    readonly entryLocation: string;
    readonly contractVersion: 'v1';
    readonly maxLoadMs: number;
}

export const LOGIN_GREETING_MANIFEST: MicroAppManifestEntry = Object.freeze({
    appId: 'login-greeting-web',
    route: '/',
    label: 'Personalized greeting',
    entryLocation: '/micro-apps/login-greeting-web/remoteEntry.js',
    contractVersion: 'v1',
    maxLoadMs: 2000,
});

export class AllowListedManifest implements ManifestPort<MicroAppManifestEntry> {
    private readonly entries = new Map([[LOGIN_GREETING_MANIFEST.appId, LOGIN_GREETING_MANIFEST]]);

    find(appId: string): MicroAppManifestEntry | null {
        const entry = this.entries.get(appId);
        return entry && entry.entryLocation.startsWith('/') && !entry.entryLocation.startsWith('//') ? entry : null;
    }
}
