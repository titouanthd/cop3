import {Command} from "commander";
import AbstractCommand from "./abstraction/AbstractCommand";
import FolderManagerService from "../services/FolderManagerService";
import {EMPTY, ESTABLISHMENTS, FILES, ANALYZE_REPORTS} from "../globals/AppConstants";
import ProcessUtil from "../utils/ProcessUtil";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import StartdocDocumentInterface from "../interfaces/StartdocDocumentInterface";
import InseeSireneApiService from "../services/InseeSireneApiService";
import PromiseUtil from "../utils/PromiseUtil";
import DateUtil from "../utils/DateUtil";
import {Page} from "puppeteer";
import {Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow} from "docx";
import fs from "fs";
import InseeEstablishmentInterface from "../interfaces/InseeEstablishmentInterface";

export default class AnalyzeDocumentsCommand extends AbstractCommand {
    constructor(commander: Command) {
        super(
            commander,
            'analyze-documents',
            'ad',
            'Analyze documents',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES + '/' + DateUtil.getFormattedIsoDate() + '/'
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
                    FolderManagerService.createFile(this.destination + ESTABLISHMENTS + '/' + document.siret + '.json', JSON.stringify(establishment, null, 4));
                    console.log(`Saved establishment for document ${document.subject}, path: ${this.destination + ESTABLISHMENTS + '/' + document.siret + '.json'}`);
                    // update the document with the establishment path
                    document.company = this.destination + ESTABLISHMENTS + '/' + document.siret + '.json';
                }
            }
        }

        const browser = await puppeteer.use(StealthPlugin()).launch({
            headless: true,
        });
        const page = await browser.pages().then(pages => pages[0]);
        for (const document of documents) {
            let startDocAdminReport: Paragraph[] = [];
            if (document.url_admin_startdoc !== EMPTY && document.url_admin_startdoc !== null) {
                console.log(`Analyzing document ${document.subject}`);
                await page.goto(document.url_admin_startdoc, {waitUntil: 'domcontentloaded'});
                await page.content();
                startDocAdminReport = await this.createStartdocDocumentReport(page);
                await PromiseUtil.randomSleep(2500, 5000);
            }

            let establishmentParagraphs: Paragraph[] | null = null;
            if (document.company !== null && document.company !== EMPTY && document.company !== undefined) {
                console.log(`Found establishment for document ${document.subject}`);
                const establishment: InseeEstablishmentInterface = JSON.parse(fs.readFileSync(document.company, 'utf8'));
                establishmentParagraphs = this.createEstablishmentParagraphs(establishment);
            }

            const docx = new Document({
                sections: [
                    {
                        children: [
                            ...startDocAdminReport,
                            ...establishmentParagraphs ?? [],
                        ]
                    }
                ]
            });

            FolderManagerService.createFolder(this.destination + ANALYZE_REPORTS);
            Packer.toBuffer(docx).then((buffer) => {
                const fileName = document.subject !== EMPTY && document.subject !== null ? ProcessUtil.convertSubjectToFileName(document.subject) : DateUtil.getFormattedIsoDate();
                fs.writeFileSync(this.destination + ANALYZE_REPORTS + '/' + fileName + '.docx', buffer);
            });
        }

        process.exit(0);
    }

    private async sanitizeTitle(page: Page) {
        return await page.title();
    }

    private async sanitizeMetaDescription(page: Page) {
        return await page.evaluate(() => {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription === null) {
                return 'Meta description not found'
            }
            return metaDescription.getAttribute('content') ?? 'Meta description not found';
        });
    }

    private async sanitizeForm(page: Page) {
        return await page.evaluate(() => {
            const result: { placeholder: string, value: string }[] = [];
            const form = document.querySelector('#user_landing');
            if (form !== null) {
                const placeholders = form.querySelectorAll('input[placeholder]');
                if (placeholders.length > 0) {
                    placeholders.forEach((placeholder) => {
                        result.push({
                            placeholder: placeholder.getAttribute('placeholder') ?? '',
                            value: placeholder.getAttribute('value') ?? '',
                        });
                    });
                }
            }

            return result;
        });
    }

    private async sanitizeSummary(page: Page) {
        return await page.evaluate(() => {
            const summaryList = document.querySelector('#summary-list');
            const itemList: { text: string, link: string }[] = [];
            if (summaryList !== null) {
                const items = summaryList.querySelectorAll('a');
                if (items.length > 0) {
                    items.forEach((item) => {
                        itemList.push({
                            text: item.textContent ?? '',
                            link: item.getAttribute('href') ?? '',
                        });
                    });
                }
            }
            return itemList;
        });
    }

    private async sanitizeSectionSeoTitle(page: Page) {
        return await page.evaluate(() => {
            let result = '';
            const contentTitle = document.querySelector('h3.content-title');
            if (contentTitle !== null) {
                result = contentTitle.textContent ?? '';
            }
            return result;
        });
    }

    private async sanitizeLastUpdate(page: Page) {
        return await page.evaluate(() => {
            let result = '';
            const sectionSeo = document.querySelector('#section-seo');
            if (sectionSeo !== null) {
                const lastUpdate = sectionSeo.querySelector('.text-right');
                if (lastUpdate !== null) {
                    result = lastUpdate.textContent ?? '';
                }
            }
            return result;
        });
    }

    private async sanitizeSectionSeoContent(page: Page) {
        return await page.evaluate(() => {
            let result = '';
            const sectionSeo = document.querySelector('#section-seo');
            if (sectionSeo !== null) {
                const content = sectionSeo.querySelector('#document-title');
                if (content !== null && content.textContent !== null) {
                    result = content.innerHTML;
                    result = result.trim();
                    result = result.replace(/(<([^>]+)>)/gi, '');
                    result = result.replace(/(\s\s+)/g, '\n');
                    result = result.replace(/(\n\n+)/g, '\n');
                }
            }
            return result;
        });
    }

    private async sanitizeBlockSeoContent(page: Page) {
        return await page.evaluate(() => {
            const blockSeoContent = document.querySelector('.block-seo-content');
            const faq: { question: string, answer: string }[] = [];
            if (blockSeoContent !== null) {
                const questions = blockSeoContent.querySelectorAll('h3');
                const answers = blockSeoContent.querySelectorAll('p');
                questions.forEach((question, index) => {
                    faq.push({
                        question: question.textContent ?? '',
                        answer: answers[index].textContent ?? '',
                    });
                });
            }
            return faq;
        });
    }

    private createEstablishmentParagraphs(establishment: InseeEstablishmentInterface) {
        console.log('Creating establishment table...', establishment.etablissement.siret);
        const siret = establishment.etablissement.siret;
        const siren = establishment.etablissement.siren;
        const name = establishment.etablissement.uniteLegale.denominationUniteLegale;
        const roadType = establishment.etablissement.adresseEtablissement.typeVoieEtablissement;
        const roadName = establishment.etablissement.adresseEtablissement.libelleVoieEtablissement;
        const roadNumber = establishment.etablissement.adresseEtablissement.numeroVoieEtablissement;
        const postalCode = establishment.etablissement.adresseEtablissement.codePostalEtablissement;
        const city = establishment.etablissement.adresseEtablissement.libelleCommuneEtablissement;
        const address = `${roadNumber} ${roadType} ${roadName}, ${postalCode} ${city}`;
        const creationDate = establishment.etablissement.dateCreationEtablissement;
        const mainEstablishment = establishment.etablissement.etablissementSiege;
        const mainActivity = establishment.etablissement.uniteLegale.activitePrincipaleUniteLegale;
        const lastUpdate = establishment.etablissement.uniteLegale.dateDernierTraitementUniteLegale;

        return [
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Etablissement',
                heading: HeadingLevel.HEADING_1
            }),
            new Paragraph({
                text: 'SIRET: ' + siret ?? 'Error: no SIRET found',
            }),
            new Paragraph({
                text: 'SIREN: ' + siren ?? 'Error: no SIREN found',
            }),
            new Paragraph({
                text: 'Nom: ' + name ?? 'Error: no name found',
            }),
            new Paragraph({
                text: 'Adresse: ' + address ?? 'Error: no address found',
            }),
            new Paragraph({
                text: 'Date de création: ' + creationDate ?? 'Error: no creation date found',
            }),
            new Paragraph({
                text: 'Etablissement principal: ' + (mainEstablishment ? 'Oui' : 'Non'),
            }),
            new Paragraph({
                text: 'Activité principale: ' + mainActivity ?? 'Error: no main activity found',
            }),
            new Paragraph({
                text: 'Dernière mise à jour: ' + lastUpdate ?? 'Error: no last update found',
            }),
        ];
    }

    private async createStartdocDocumentReport(page: Page) {
        const title = await this.sanitizeTitle(page);
        const metaDescription = await this.sanitizeMetaDescription(page);
        const form = await this.sanitizeForm(page);
        const formParagraphs = form.map((item) => {
            if (item.placeholder !== '') {
                return new Paragraph({
                    text: item.placeholder,
                    bullet: {
                        level: 0,
                    },
                });
            } else {
                return new Paragraph({
                    text: item.value ?? 'Error: no value found',
                    bullet: {
                        level: 0,
                    },
                });
            }
        });
        const sectionSeoTitle = await this.sanitizeSectionSeoTitle(page);
        const summary = await this.sanitizeSummary(page);
        const summaryParagraphs = summary.map((item) => {
            return new Paragraph({
                text: item.text,
                bullet: {
                    level: 0,
                },
            });
        });
        const lastUpdate = await this.sanitizeLastUpdate(page);
        const sectionSeo = await this.sanitizeSectionSeoContent(page);
        const blockSeoContent = await this.sanitizeBlockSeoContent(page);
        const blockSeoContentParagraphs = blockSeoContent.map((item) => {
            const q = new Paragraph({
                text: item.question,
                heading: HeadingLevel.HEADING_3,
            });
            const a = new Paragraph({
                text: item.answer,
            });
            return [q, a];
        });

        return [
            new Paragraph({
                text: 'Analyse report',
                heading: HeadingLevel.TITLE
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Startdoc document analysis',
                heading: HeadingLevel.HEADING_1
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: lastUpdate,
                heading: HeadingLevel.HEADING_4
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: metaDescription,
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Formulaire',
                heading: HeadingLevel.HEADING_3
            }),
            new Paragraph({
                text: '',
            }),
            ...formParagraphs,
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Sommaire',
                heading: HeadingLevel.HEADING_3
            }),
            new Paragraph({
                text: '',
            }),
            ...summaryParagraphs,
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: sectionSeoTitle !== '' ? sectionSeoTitle : 'Section SEO non trouvée',
                heading: HeadingLevel.HEADING_3
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Contenu',
                heading: HeadingLevel.HEADING_3
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: sectionSeo !== '' ? sectionSeo : 'Contenu non trouvé',
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'FAQ',
                heading: HeadingLevel.HEADING_3
            }),
            new Paragraph({
                text: '',
            }),
            ...blockSeoContentParagraphs.flat(),
        ]
    }
}