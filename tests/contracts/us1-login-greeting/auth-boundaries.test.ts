import { describe, expect, it } from 'vitest';
import { AllowListedManifest, LOGIN_GREETING_MANIFEST } from '../../../src/navigation/micro-app-manifest';
import { escapeGreetingText } from '../../../src/micro-apps/greeting/greeting-view-model';

describe('US1 versioned boundary contracts', () => {
    it('exposes only the registered greeting manifest entry', () => {
        const manifest = new AllowListedManifest();
        expect(manifest.find('login-greeting-web')).toEqual(LOGIN_GREETING_MANIFEST);
        expect(manifest.find('unknown-app')).toBeNull();
    });

    it('keeps greeting content as escaped text', () => {
        expect(escapeGreetingText('<Ada & Co>')).toBe('&lt;Ada &amp; Co&gt;');
    });
});
