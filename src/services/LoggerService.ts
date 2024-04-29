import DateUtil from "../utils/DateUtil";

export const INFO = 'INFO';
export const ERROR = 'ERROR';
export const WARN = 'WARN';

export class LoggerService {
    readonly #identifier: string;

    constructor(identifier: string = new Date().toISOString()) {
        this.#identifier = identifier;
    }

    public log(message: string, level: string) {
        switch (level) {
            case INFO:
                this.info(message);
                break;
            case ERROR:
                this.error(message);
                break;
            case WARN:
                this.warn(message);
                break;
            default:
                this.info(message);
                break;
        }
    }

    public info(message: string): void {
        console.log(this.formatMessage(message));
    }

    public error(message: string): void {
        console.error(this.formatMessage(message, ERROR));
    }

    public warn(message: string): void {
        console.warn(this.formatMessage(message, WARN));
    }

    private formatMessage(message: string, level: string = INFO): string {
        return `::${DateUtil.getFormattedIsoDate()}:: [${level}] - ${message}`;
    }

    get identifier(): string {
        return this.#identifier;
    }
}