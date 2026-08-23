import { BoundedUsername } from '../../domain/identity';

export interface GreetingViewModel {
    readonly subject: string;
    readonly username: string;
    readonly contractVersion: 'v1';
}

export function toGreetingViewModel(subject: string, username: BoundedUsername): GreetingViewModel {
    return Object.freeze({ subject, username: username.value, contractVersion: 'v1' });
}

/** Escape for HTML text contexts when a view is rendered outside Angular's escaping. */
export function escapeGreetingText(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}
