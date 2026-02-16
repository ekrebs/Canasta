/**
 * Structured logging utility for server-side operations.
 * Provides consistent log format with timestamps, context, and levels.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	userId?: string;
	playerId?: string;
	lobbyId?: string;
	socketId?: string;
	gameId?: string;
	action?: string;
	[key: string]: string | number | undefined;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: {
		message: string;
		stack?: string;
	};
}

class Logger {
	private logs: LogEntry[] = [];
	private maxLogs = 1000; // Keep last 1000 logs in memory for debugging

	log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
		const timestamp = new Date().toISOString();

		const entry: LogEntry = {
			timestamp,
			level,
			message,
			context,
		};

		if (error) {
			entry.error = {
				message: error.message,
				stack: error.stack,
			};
		}

		// In production, send to logging service. For now, console + memory.
		this._outputLog(entry);
		this.logs.push(entry);

		// Trim logs if exceeding max
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}
	}

	private _outputLog(entry: LogEntry): void {
		const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
		const fullMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;

		if (entry.level === 'error') {
			console.error(fullMessage);
			if (entry.error?.stack) {
				console.error(entry.error.stack);
			}
		} else if (entry.level === 'warn') {
			console.warn(fullMessage);
		} else if (entry.level === 'debug') {
			// Only log debug in development
			if (process.env.NODE_ENV !== 'production') {
				console.debug(fullMessage);
			}
		} else {
			console.log(fullMessage);
		}
	}

	debug(message: string, context?: LogContext): void {
		this.log('debug', message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log('info', message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log('warn', message, context);
	}

	error(message: string, context?: LogContext, error?: Error): void {
		this.log('error', message, context, error);
	}

	getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
		let filtered = this.logs;
		if (level) {
			filtered = filtered.filter((l) => l.level === level);
		}
		return filtered.slice(-limit);
	}

	clearLogs(): void {
		this.logs = [];
	}
}

export const logger = new Logger();
