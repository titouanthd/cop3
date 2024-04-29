import {Command} from "commander";
import AbstractCommand from "../abstraction/AbstractCommand";
import {EMPTY, FILES_FOLDER, KEYWORDS_FOLDER} from "../../globals/AppConstants";
import DateUtil from "../../utils/DateUtil";
import ProcessUtil from "../../utils/ProcessUtil";
import {ERROR} from "../../services/LoggerService";
import FolderManagerService from "../../services/FolderManagerService";

export class RemoveDuplicatedKeywordsFromCsv extends AbstractCommand {
    constructor(commander: Command) {
        super(
            commander,
            'remove-duplicated-keywords-from-csv',
            'rdkfc',
            'Remove duplicated keywords from CSV',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES_FOLDER + '/' + KEYWORDS_FOLDER + '/' + DateUtil.getFormattedIsoDate() + '/',
        );
    }
    async execute() {
        const start = Date.now();
        this.log('Remove duplicated keywords from CSV');
        let targetPath = process.cwd() + '/files/keywords.csv';
        if (this.target !== EMPTY) {
            if (ProcessUtil.isValidCsvFile(this.target)) {
                targetPath = this.target;
            } else {
                this.log('Invalid target file', ERROR);
                return;
            }
        }

        if (this.destination === EMPTY) {
            this.log('Invalid destination folder', ERROR);
            return;
        }

        this.log('Remove duplicated keywords from CSV');

        const keywords = await FolderManagerService.parseCsv(targetPath);
        console.log(keywords);
    }
}