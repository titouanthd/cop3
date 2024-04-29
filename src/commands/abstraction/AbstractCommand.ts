import { Command } from 'commander';
import { EMPTY } from '../../globals/AppConstants';
import { INFO, LoggerService } from '../../services/LoggerService';

export default abstract class AbstractCommand {
    #identifier: string = Date.now().toString();
    #logger = new LoggerService(this.identifier);

    protected constructor(
        protected commander: Command,
        protected name: string,
        protected alias: string,
        protected description: string,
        protected target: string = EMPTY,
        protected destination: string = EMPTY,
    ) {
        this.commander.command(this.name).alias(this.alias).description(this.description).action(this.execute.bind(this));
    }

    protected abstract execute(): Promise<void>;

    get identifier(): string {
        return this.#identifier;
    }

    get logger(): LoggerService {
        return this.#logger;
    }

    public log(message: string, level: string = INFO): void {
        this.logger.log(message, level);
    }
}
