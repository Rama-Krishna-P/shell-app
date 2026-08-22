import { failure, Result, success } from './result';

export class SafeReturnPath {
    private constructor(public readonly value: string) { }

    static create(input: unknown): Result<SafeReturnPath, 'unsafe-return-path'> {
        if (typeof input !== 'string' || !input.startsWith('/') || input.startsWith('//')) {
            return failure('unsafe-return-path');
        }
        try {
            const url = new URL(input, 'https://shell.invalid');
            if (url.origin !== 'https://shell.invalid' || url.pathname !== input.split('?')[0]) {
                return failure('unsafe-return-path');
            }
            return success(new SafeReturnPath(input));
        } catch {
            return failure('unsafe-return-path');
        }
    }
}
