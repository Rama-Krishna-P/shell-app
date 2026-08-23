import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'shell-root',
    standalone: true,
    template: `<main aria-labelledby="page-title">
            <h1 id="page-title">Shell App</h1>
            <p role="status" aria-live="polite">{{ username ? 'You are signed in.' : 'Sign in to continue.' }}</p>
            @if (username) { <section aria-labelledby="greeting-title"><h2 id="greeting-title">Welcome, {{ username }}</h2><p>Your personalized greeting is ready.</p></section> }
            @else { <a href="/login" aria-label="Sign in to the Shell App">Sign in</a> }
        </main>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
    @Input() username: string | null = null;
}
