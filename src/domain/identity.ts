import { failure, Result, success } from './result';

export const USERNAME_MAX_UNICODE_CHARACTERS = 128;

export class BoundedUsername {
    private constructor(public readonly value: string) { }

    static create(input: unknown): Result<BoundedUsername, 'invalid-username'> {
        if (typeof input !== 'string' || input.length === 0) return failure('invalid-username');
        const characters = Array.from(input);
        if (characters.length > USERNAME_MAX_UNICODE_CHARACTERS) return failure('invalid-username');
        return success(new BoundedUsername(input));
    }
}
