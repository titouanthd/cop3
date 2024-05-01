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
        protected options: {
            flags: string,
            description: string|undefined,
            defaultValue?: string|boolean|string[]|undefined,
        }[] = [],
    ) {
        this.commander
            .command(this.name)
            .alias(this.alias)
            .description(this.description)
            .action(this.execute.bind(this));

        if (this.options.length > 0) {
            this.options.forEach(option => {
                this.commander.option(option.flags, option.description, option.defaultValue);
            });
        }
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
