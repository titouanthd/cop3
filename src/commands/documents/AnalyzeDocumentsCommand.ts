import { Command } from 'commander';
import AbstractCommand from './abstraction/AbstractCommand';
import FolderManagerService from '../services/FolderManagerService';
import { EMPTY, ESTABLISHMENTS_FOLDER, FILES_FOLDER, ANALYZE_REPORTS_FOLDER } from '../globals/AppConstants';
import ProcessUtil from '../utils/ProcessUtil';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StartdocDocumentInterface from '../interfaces/StartdocDocumentInterface';
import InseeSireneApiService from '../services/InseeSireneApiService';
import PromiseUtil from '../utils/PromiseUtil';
import DateUtil from '../utils/DateUtil';
import { Document, Packer, Paragraph } from 'docx';
import fs from 'fs';
import InseeEstablishmentInterface from '../interfaces/InseeEstablishmentInterface';
import ExtractStartdocContentService from '../services/ExtractStartdocContentService';
import {ERROR} from "../services/LoggerService";

export default class AnalyzeDocumentsCommand extends AbstractCommand {
    private startdocExtractor = new ExtractStartdocContentService();

    constructor(commander: Command) {
        super(
            commander,
            'analyze-documents',
            'ad',
            'Analyze documents',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES_FOLDER + '/' + DateUtil.getFormattedIsoDate() + '/',
        );
    }

    public async execute() {
        let targetPath = process.cwd() + '/files/documents.csv';
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

        this.log('Analyze documents');
        const documents: StartdocDocumentInterface[] = await FolderManagerService.parseCsv(targetPath);
        this.log(`Found ${documents.length} documents`);
        for (const document of documents) {
            if (document.siret !== '' && document.siret !== null) {
                const establishment = await InseeSireneApiService.getEstablishmentBySiret(document.siret);
                if (establishment !== null) {
                    this.log(`Found establishment for document ${document.subject}`);
                    FolderManagerService.createFolder(this.destination + ESTABLISHMENTS_FOLDER);
                    FolderManagerService.createFile(
                        this.destination + ESTABLISHMENTS_FOLDER + '/' + document.siret + '.json',
                        JSON.stringify(establishment, null, 4),
                    );
                    this.log(
                        `Saved establishment for document ${document.subject}, path: ${this.destination + ESTABLISHMENTS_FOLDER + '/' + document.siret + '.json'}`,
                    );
                    // update the document with the establishment path
                    document.company = this.destination + ESTABLISHMENTS_FOLDER + '/' + document.siret + '.json';
                }
            }
        }

        const browser = await puppeteer.use(StealthPlugin()).launch({
            headless: true,
        });

        const page = await browser.pages().then((pages) => pages[0]);
        for (const document of documents) {
            let startDocAdminReport: Paragraph[] = [];
            if (document.url_admin_startdoc !== EMPTY && document.url_admin_startdoc !== null) {
                this.log(`Analyzing document ${document.subject}`);
                await page.goto(document.url_admin_startdoc, { waitUntil: 'domcontentloaded' });
                await page.content();
                startDocAdminReport = await this.startdocExtractor.createStartdocDocumentReport(page);
                await PromiseUtil.randomSleep(2500, 5000);
            }

            let establishmentParagraphs: Paragraph[] | null = null;
            if (document.company !== null && document.company !== EMPTY && document.company !== undefined) {
                this.log(`Found establishment for document ${document.subject}`);
                const establishment: InseeEstablishmentInterface = JSON.parse(fs.readFileSync(document.company, 'utf8'));
                establishmentParagraphs = this.startdocExtractor.createEstablishmentParagraphs(establishment);
            }

            const docx = new Document({
                sections: [
                    {
                        children: [...startDocAdminReport, ...(establishmentParagraphs ?? [])],
                    },
                ],
            });

            FolderManagerService.createFolder(this.destination + ANALYZE_REPORTS_FOLDER);
            Packer.toBuffer(docx).then((buffer) => {
                const fileName =
                    document.subject !== EMPTY && document.subject !== null
                        ? ProcessUtil.convertSubjectToFileName(document.subject)
                        : DateUtil.getFormattedIsoDate();
                fs.writeFileSync(this.destination + ANALYZE_REPORTS_FOLDER + '/' + fileName + '.docx', buffer);
                this.log(`Saved report for document ${document.subject}, path: ${this.destination + ANALYZE_REPORTS_FOLDER + '/' + fileName + '.docx'}`);
            });
        }

        await browser.close();
        this.log('Analyze documents done');
    }
}
