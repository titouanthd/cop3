import {Command} from "commander";
import AbstractCommand from "./abstraction/AbstractCommand";

export class RemoveDuplicatedKeywordsFromCsv extends AbstractCommand {
    constructor(commander: Command) {
        super(commander, 'remove-duplicated-keywords-from-csv', 'rdkfc', 'Remove duplicated keywords from CSV');
    }
    async execute() {
        const start = Date.now();
        console.log('Remove duplicated keywords from CSV');
    }
}