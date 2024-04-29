import { Command } from 'commander';
import AbstractCommand from './abstraction/AbstractCommand';
import FolderManagerService from '../services/FolderManagerService';
import { EMPTY, ESTABLISHMENTS, FILES, ANALYZE_REPORTS } from '../globals/AppConstants';
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

export default class AnalyzeDocumentsCommand extends AbstractCommand {
    private startdocExtractor = new ExtractStartdocContentService();

    constructor(commander: Command) {
        super(
            commander,
            'analyze-documents',
            'ad',
            'Analyze documents',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES + '/' + DateUtil.getFormattedIsoDate() + '/',
        );
    }

    public async execute() {
        let targetPath = process.cwd() + '/files/documents.csv';
        if (this.target !== EMPTY) {
            if (ProcessUtil.isValidCsvFile(this.target)) {
                targetPath = this.target;
            } else {
                console.error('Invalid target file');
                return;
            }
        }

        if (this.destination === EMPTY) {
            console.error('Invalid destination folder');
            return;
        }

        console.log('Analyze documents');
        const documents: StartdocDocumentInterface[] = await FolderManagerService.parseCsv(targetPath);
        console.log(`Found ${documents.length} documents`);
        for (const document of documents) {
            if (document.siret !== '' && document.siret !== null) {
                const establishment = await InseeSireneApiService.getEstablishmentBySiret(document.siret);
                if (establishment !== null) {
                    console.log(`Found establishment for document ${document.subject}`);
                    FolderManagerService.createFolder(this.destination + ESTABLISHMENTS);
                    FolderManagerService.createFile(
                        this.destination + ESTABLISHMENTS + '/' + document.siret + '.json',
                        JSON.stringify(establishment, null, 4),
                    );
                    console.log(
                        `Saved establishment for document ${document.subject}, path: ${this.destination + ESTABLISHMENTS + '/' + document.siret + '.json'}`,
                    );
                    // update the document with the establishment path
                    document.company = this.destination + ESTABLISHMENTS + '/' + document.siret + '.json';
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
                console.log(`Analyzing document ${document.subject}`);
                await page.goto(document.url_admin_startdoc, { waitUntil: 'domcontentloaded' });
                await page.content();
                startDocAdminReport = await this.startdocExtractor.createStartdocDocumentReport(page);
                await PromiseUtil.randomSleep(2500, 5000);
            }

            let establishmentParagraphs: Paragraph[] | null = null;
            if (document.company !== null && document.company !== EMPTY && document.company !== undefined) {
                console.log(`Found establishment for document ${document.subject}`);
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

            FolderManagerService.createFolder(this.destination + ANALYZE_REPORTS);
            Packer.toBuffer(docx).then((buffer) => {
                const fileName =
                    document.subject !== EMPTY && document.subject !== null
                        ? ProcessUtil.convertSubjectToFileName(document.subject)
                        : DateUtil.getFormattedIsoDate();
                fs.writeFileSync(this.destination + ANALYZE_REPORTS + '/' + fileName + '.docx', buffer);
            });
        }
    }
}
