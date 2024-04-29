import { Command } from 'commander';
import DateUtil from '../../utils/DateUtil';
import { EMPTY } from '../../globals/AppConstants';

export default abstract class AbstractCommand {
    private _identifier: string = DateUtil.getFormattedIsoDate();
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
        return this._identifier;
    }
}
