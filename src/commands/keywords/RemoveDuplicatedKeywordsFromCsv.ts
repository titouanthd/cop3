import { Command } from 'commander';
import AbstractCommand from '../abstraction/AbstractCommand';
import { EMPTY, FILES_FOLDER, KEYWORDS_FOLDER } from '../../globals/AppConstants';
import DateUtil from '../../utils/DateUtil';
import ProcessUtil from '../../utils/ProcessUtil';
import { ERROR } from '../../services/LoggerService';
import FolderManagerService from '../../services/FolderManagerService';
import { IKeyword } from '../../interfaces/IKeyword';
import { StringUtil } from '../../utils/StringUtil';

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
        if (!FolderManagerService.fileExists(process.cwd() + '/config/banned-keywords.csv')) {
            this.log('Banned keywords file not found', ERROR);
            return;
        }
        if (!FolderManagerService.fileExists(process.cwd() + '/config/banned-companies.csv')) {
            this.log('Banned companies file not found', ERROR);
            return;
        }

        const bannedKeywords: {value: string;}[] = await FolderManagerService.parseCsv(process.cwd() + '/config/banned-keywords.csv');
        const bannedCompanies: {value: string;}[] = await FolderManagerService.parseCsv(process.cwd() + '/config/banned-companies.csv');

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

        const csvContent = await FolderManagerService.parseCsv(targetPath);
        const totalKeywords = csvContent.length;
        const keywords: IKeyword[] = [];
        for (const row of csvContent) {
            if (row.Keyword !== '' && row.Keyword !== null) {
                // first lowercase the keyword
                let k = row.Keyword.toLowerCase();
                // trim the keyword
                // next, remove the accents
                k = StringUtil.sanitizeAccents(k);
                // remove special characters like - _ . , ; : ! ? etc.
                k = StringUtil.removeSpecialCharacters(k);
                // remove the banned keywords
                for (const bannedKeyword of bannedKeywords) {
                    const singular = bannedKeyword.value;
                    const regexSingular = new RegExp(`${singular.replace(' ', '\\s')}`, 'gm');
                    if (k.match(regexSingular)) {
                        console.log(regexSingular, k.match(regexSingular));
                        k = k.replace(regexSingular, '');
                    }
                }

                // remove the banned companies
                for (const bannedCompany of bannedCompanies) {
                    const singular = bannedCompany.value;
                    const regexSingular = new RegExp(`${singular.replace(' ', '\\s')}`, 'gm');
                    if (k.match(regexSingular)) {
                        console.log(regexSingular, k.match(regexSingular));
                        k = k.replace(regexSingular, '');
                    }
                }

                k = k.replace(/\s+/g, ' ');
                k = k.trim();

                const keyword: IKeyword = {
                    keyword: k,
                    originalKeyword: row.Keyword,
                };
                keywords.push(keyword);
            }
        }

        const uniqueKeywords = keywords.filter((keyword, index, self) => index === self.findIndex((t) => t.keyword === keyword.keyword));

        this.log(
            `Removed ${totalKeywords - uniqueKeywords.length} duplicated keywords from ${totalKeywords} keywords, total unique keywords: ${uniqueKeywords.length}`,
        );

        FolderManagerService.createFolder(this.destination);
        const content = uniqueKeywords.map((keyword) => `${keyword.keyword},${keyword.originalKeyword}`).join('\n');
        FolderManagerService.createFile(this.destination + 'sanitized_keywords.csv', 'Keyword,Original Keyword\n' + content);
        this.log(`Unique keywords saved to ${this.destination + 'sanitized_keywords.csv'}`);
    }
}
