import { Command } from 'commander';
import AbstractCommand from '../abstraction/AbstractCommand';
import FolderManagerService from '../../services/FolderManagerService';
import {
    EMPTY,
    FILES_FOLDER,
    DOCUMENTS_TO_REFRESH
} from '../../globals/AppConstants';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import PromiseUtil from '../../utils/PromiseUtil';
import DateUtil from '../../utils/DateUtil';

export default class FindStartDocOutdatedDocumentsCommand extends AbstractCommand {
    readonly #startdocDocumentsSitemapURl = 'https://www.startdoc.fr/sitemap_documents.xml';

    constructor(commander: Command) {
        super(
            commander,
            'find-startdoc-outdated-documents',
            'fsod',
            'Find outdated documents on startdoc',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES_FOLDER + '/' + DOCUMENTS_TO_REFRESH + '/' + DateUtil.getFormattedIsoDate() + '/',
        );
    }

    public async execute() {
        const start = Date.now();
        const browser = await puppeteer.use(StealthPlugin()).launch({
            headless: false,
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(300000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        );

        try {
            const sitemap = await page.goto(this.#startdocDocumentsSitemapURl, { waitUntil: 'domcontentloaded' });
            if (sitemap === null) {
                console.error('No response');
                await browser.close();
                return;
            }
        } catch (error) {
            console.error('Error while fetching sitemap');
            await browser.close();
            return;
        }

        const sitemapContent = await page.content();
        const documentsURls = sitemapContent.match(/https:\/\/www.startdoc.fr\/documents\/[0-9]+-[a-z0-9-]+/g);
        if (documentsURls === null || documentsURls.length === 0) {
            console.error('No documents found');
            await browser.close();
            return;
        }

        documentsURls.filter((value, index, self) => self.indexOf(value) === index);

        let count = 0;
        const URLsToRefresh = [];
        for (const documentUrl of documentsURls) {
            count++;
            try {
                const response = await page.goto(documentUrl, { waitUntil: 'domcontentloaded' });
                if (response === null) {
                    console.error('No response');
                }
                // find <p class="text-right">Dernière mise à jour: 02/05/2024</p>
                const lastUpdate = await page.$eval('p.text-right', (element) => element.textContent);
                const dateValue = lastUpdate?.match(/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/);
                const dateFormatAssertRegex = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
                if (dateValue === null || dateValue === undefined || dateValue.length === 0 || !dateFormatAssertRegex.test(dateValue[0])) {
                    console.error('No date found');
                    continue;
                }

                const splitDate = dateValue[0].split('/');
                const formattedDate = `${splitDate[2]}-${splitDate[1]}-${splitDate[0]}`;
                const date = new Date(formattedDate);

                if (date.getTime() > new Date('2023-10-01').getTime()) {
                    console.log(`Document ${documentUrl} is up to date`);
                } else {
                    console.log(`Document ${documentUrl} is outdated`);
                    URLsToRefresh.push(documentUrl);
                }

            } catch (error) {
                console.error('Error while fetching document, we don\'t know if it is outdated or not');
                URLsToRefresh.push(documentUrl);
            }

            console.log(`Document ${count}/${documentsURls.length} fetched`);
            await PromiseUtil.randomSleep(1000, 2000);
        }

        console.log('URLs to refresh', URLsToRefresh);

        // save URLs to refresh
        FolderManagerService.createFolder(this.destination);
        // we save it as a csv file
        const fileName = 'documents-to-refresh.csv';
        const csvContent = URLsToRefresh.join('\n');
        FolderManagerService.createFile(this.destination + fileName, csvContent);
        await browser.close();
        this.log(`End ${this.name} ${DateUtil.convertMillisecondsToDuration(Date.now() - start)}`);
    }

    // private async sanitizeSummary(page: Page) {
    //     return await page.evaluate(() => {
    //         const summaryList = document.querySelector('#summary-list');
    //         const itemList: { text: string; link: string }[] = [];
    //         if (summaryList !== null) {
    //             const items = summaryList.querySelectorAll('a');
    //             if (items.length > 0) {
    //                 items.forEach((item) => {
    //                     itemList.push({
    //                         text: item.textContent ?? '',
    //                         link: item.getAttribute('href') ?? '',
    //                     });
    //                 });
    //             }
    //         }
    //         return itemList;
    //     });
    // }
}
