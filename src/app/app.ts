import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'shell-root',
    standalone: true,
    template: '<main><h1>Shell App</h1><p>Authentication is configured in a later phase.</p></main>',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App { }
