import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const correlationId = (request: Request, response: Response, next: NextFunction): void => {
    const id = request.header('x-correlation-id')?.match(/^[A-Za-z0-9._-]{1,100}$/)?.[0] ?? randomUUID();
    response.setHeader('x-correlation-id', id); (request as Request & { correlationId?: string }).correlationId = id; next();
};

export const failClosed = (_request: Request, response: Response, next: NextFunction): void => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('Pragma', 'no-cache'); response.setHeader('X-Content-Type-Options', 'nosniff'); next();
};

export const httpErrorTranslator = (error: unknown, request: Request, response: Response, _next: NextFunction): void => {
    const id = (request as Request & { correlationId?: string }).correlationId;
    response.status(500).json({ error: 'service-unavailable', correlationId: id });
    void error; void _next;
};
