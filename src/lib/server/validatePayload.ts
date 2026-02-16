import { Socket } from 'socket.io';
import { ZodSchema, ZodError } from 'zod';
import { logger } from './logger.js';

/**
 * Validates a socket payload against a Zod schema.
 * Logs errors and emits server-error if validation fails.
 * Returns true if valid, false if invalid.
 */
export function validatePayload(
	socket: Socket,
	payload: unknown,
	schema: ZodSchema,
	eventName: string
): boolean {
	try {
		schema.parse(payload);
		return true;
	} catch (err) {
		if (err instanceof ZodError) {
			const issues = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
			const message = `Invalid ${eventName} payload: ${issues}`;
			logger.warn(message, { socketId: socket.id, eventName });
			socket.emit('server-error', { message });
			return false;
		}
		throw err;
	}
}
