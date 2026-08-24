import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface SessionResponse {
    readonly authenticated: boolean;
    readonly username?: string;
    readonly message?: string;
}

@Component({
    selector: 'shell-root',
    standalone: true,
    template: `<main aria-labelledby="page-title">
            <h1 id="page-title">Shell App</h1>
            <p role="status" aria-live="polite">{{ username ? 'You are signed in.' : errorMessage ?? (sessionResolved ? 'Sign in to continue.' : 'Checking your session.') }}</p>
            @if (username) { <section aria-labelledby="greeting-title"><h2 id="greeting-title">Welcome, {{ username }}</h2><p>Your personalized greeting is ready.</p><form (submit)="signOut($event)"><button type="submit">Sign out</button></form><p role="status" aria-live="polite">{{ signOutMessage }}</p></section> }
            @else if (sessionResolved) { <a href="/login" aria-label="Sign in to the Shell App">Sign in</a> }
        </main>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
    @Input() username: string | null = null;
    protected sessionResolved = false;
    protected errorMessage: string | null = null;
    protected signOutMessage: string | null = null;

    private readonly platformId = inject(PLATFORM_ID);
    private readonly changeDetector = inject(ChangeDetectorRef);

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        void fetch('/api/session', { credentials: 'same-origin' })
            .then((response): Promise<SessionResponse> => response.ok ? response.json() : Promise.resolve({ authenticated: false }))
            .then((session) => {
                this.username = session.authenticated ? session.username ?? null : null;
                this.errorMessage = session.authenticated ? null : session.message ?? null;
                this.sessionResolved = true;
                this.changeDetector.markForCheck();
            })
            .catch(() => {
                this.errorMessage = 'Sign-in is temporarily unavailable.';
                this.sessionResolved = true;
                this.changeDetector.markForCheck();
            });
    }

    protected async signOut(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        this.signOutMessage = 'Signing out.';
        try {
            const csrfResponse = await fetch('/csrf', { credentials: 'same-origin' });
            const csrf = await csrfResponse.json() as { token?: string };
            const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'X-CSRF-Token': csrf.token ?? '' },
            });
            if (response.redirected) { window.location.assign(response.url); return; }
            this.signOutMessage = 'Unable to sign out. Please try again.';
        } catch {
            this.signOutMessage = 'Sign-out is temporarily unavailable.';
        }
        this.changeDetector.markForCheck();
    }
}
