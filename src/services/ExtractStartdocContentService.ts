import { Page } from 'puppeteer';
import InseeEstablishmentInterface from '../interfaces/InseeEstablishmentInterface';
import { HeadingLevel, Paragraph } from 'docx';
import DocxBuilderService from './DocxBuilderService';

export default class ExtractStartdocContentService {
    private docxBuilder: DocxBuilderService = new DocxBuilderService();

    private async sanitizeTitle(page: Page) {
        return await page.title();
    }

    private async sanitizeMetaDescription(page: Page) {
        return await page.evaluate(() => {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription === null) {
                return 'Meta description not found';
            }
            return metaDescription.getAttribute('content') ?? 'Meta description not found';
        });
    }

    private async sanitizeForm(page: Page) {
        return await page.evaluate(() => {
            const result: { placeholder: string; value: string }[] = [];
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
            const itemList: { text: string; link: string }[] = [];
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
            const faq: { question: string; answer: string }[] = [];
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

    public createEstablishmentParagraphs(establishment: InseeEstablishmentInterface) {
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
                heading: HeadingLevel.HEADING_1,
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

    public async createStartdocDocumentReport(page: Page) {
        console.log('Creating Startdoc document report...', this.docxBuilder);
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
                heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Startdoc document analysis',
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: lastUpdate,
                heading: HeadingLevel.HEADING_4,
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
                heading: HeadingLevel.HEADING_3,
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
                heading: HeadingLevel.HEADING_3,
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
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
                text: '',
            }),
            new Paragraph({
                text: 'Contenu',
                heading: HeadingLevel.HEADING_3,
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
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
                text: '',
            }),
            ...blockSeoContentParagraphs.flat(),
        ];
    }
}
