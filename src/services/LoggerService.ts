export const INFO = 'INFO';
export const ERROR = 'ERROR';
export const WARN = 'WARN';

export class LoggerService {
    readonly #identifier: string;

    constructor(identifier: string = new Date().toISOString()) {
        this.#identifier = identifier;
    }

    public log(message: string): void {
        console.log(this.formatMessage(message));
    }

    public error(message: string): void {
        console.error(this.formatMessage(message, ERROR));
    }

    public warn(message: string): void {
        console.warn(this.formatMessage(message, WARN));
    }

    private formatMessage(message: string, level: string = INFO): string {
        return `::${this.identifier}:: [${level}] - ${message}`;
    }

    get identifier(): string {
        return this.#identifier;
    }
}