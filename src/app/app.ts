import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface SessionResponse {
    readonly authenticated: boolean;
    readonly username?: string;
}

@Component({
    selector: 'shell-root',
    standalone: true,
    template: `<main aria-labelledby="page-title">
            <h1 id="page-title">Shell App</h1>
            <p role="status" aria-live="polite">{{ username ? 'You are signed in.' : sessionResolved ? 'Sign in to continue.' : 'Checking your session.' }}</p>
            @if (username) { <section aria-labelledby="greeting-title"><h2 id="greeting-title">Welcome, {{ username }}</h2><p>Your personalized greeting is ready.</p></section> }
            @else if (sessionResolved) { <a href="/login" aria-label="Sign in to the Shell App">Sign in</a> }
        </main>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
    @Input() username: string | null = null;
    protected sessionResolved = false;

    private readonly platformId = inject(PLATFORM_ID);
    private readonly changeDetector = inject(ChangeDetectorRef);

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        void fetch('/api/session', { credentials: 'same-origin' })
            .then((response): Promise<SessionResponse> => response.ok ? response.json() : Promise.resolve({ authenticated: false }))
            .then((session) => {
                this.username = session.authenticated ? session.username ?? null : null;
                this.sessionResolved = true;
                this.changeDetector.markForCheck();
            })
            .catch(() => {
                this.sessionResolved = true;
                this.changeDetector.markForCheck();
            });
    }
}
