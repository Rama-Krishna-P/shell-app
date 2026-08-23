import { BoundedUsername } from '../identity';

export interface UserAccount {
    readonly subject: string;
    readonly username: BoundedUsername;
}

export interface AuthenticatedSession extends UserAccount {
    readonly providerSessionReference: string;
    readonly createdAt: number;
    readonly expiresAt: number;
    readonly active: true;
}

export interface OidcTransaction {
    readonly state: string;
    readonly returnPath: string;
    readonly createdAt: number;
    readonly expiresAt: number;
}