import AbstractCommand from "../abstraction/AbstractCommand";
import {Command} from "commander";
import FolderManagerService from "../../services/FolderManagerService";
import DateUtil from "../../utils/DateUtil";
import {EMPTY, FILES_FOLDER, LETTERS_FOLDER} from "../../globals/AppConstants";
import {ILetter} from "../../interfaces/ILetter";
import {Document, HeadingLevel, Packer, Paragraph, TextRun} from 'docx';
import fs from "fs";

export class CreateLetterCommand extends AbstractCommand {
    readonly #folderManager = FolderManagerService;
    protected constructor(commander: Command) {
        super(
            commander,
            'create-letter',
            'cl',
            'Create a new letter in the database',
            process.argv[3] ?? EMPTY,
            process.cwd() + '/' + FILES_FOLDER + '/' + LETTERS_FOLDER + '/' + DateUtil.getFormattedIsoDate() + '/',
        );
    }

    public async execute(): Promise<void> {
        this.log(`Start ${this.name} command`);
        const start = Date.now();

        if (!this.destination) {
            this.log('Invalid destination folder');
            return;
        }

        let target = process.cwd() + '/config/resiliation-letters.csv';
        if (this.target !== EMPTY) {
            if (this.#folderManager.fileExists(this.target)) {
                target = this.target;
            } else {
                this.log('Invalid target file');
                return;
            }
        }

        let letters: ILetter[] = await this.#folderManager.parseCsv(target);
        letters = letters.filter(letter => letter.company_name !== '' && letter.company_name !== null);
        this.log(`Found ${letters.length} letters`);

        this.#folderManager.createFolder(this.destination);

        for (const letter of letters) {
            this.#folderManager.createFolder(this.destination + letter.folder_name);
            const letterDocument = await this.getLetter(letter, this.destination + letter.folder_name);
            Packer.toBuffer(letterDocument).then((buffer) => {
                const fileName = `Lettre résiliation ${letter.company_name}`;
                fs.writeFileSync(this.destination + letter.folder_name + '/' + fileName + '.docx', buffer);
                this.log(
                    `Saved report for document ${letter.company_name}, path: ${this.destination + letter.folder_name + '/' + fileName + '.docx'}`,
                );
            });
        }

        this.log(`${this.name} executed in ${DateUtil.convertMillisecondsToDuration(Date.now() - start)}`);
    }

    private async getLetter(letter: ILetter, folder: string): Promise<Document> {
        await this.saveLogo(letter, folder);
        const shopCoordinates: Paragraph[] = this.getShopCoordinates(letter)
        const clientCoordinates: any[] = this.getClientCoordinates(letter)

        const title = new Paragraph({
            text: 'Letter recommandée avec accusé de réception',
            heading: HeadingLevel.HEADING_1,
            spacing: {after: 200, before: 200}
        });
        const object = new Paragraph({
            text: `Objet : Demande de résiliation à mon abonnement à ${letter.company_name}`,
            heading: HeadingLevel.HEADING_2,
            spacing: {after: 200}
        });

        const text = [
            this.getTextParagraph('Madame, Monsieur,'),
            this.getTextParagraph('Par le présent courrier, je vous informe de ma volonté de résilier mon adhésion à vos services à compter du ${resiliation_date}.'),
            this.getTextParagraph('Conformément aux dispositions de l’article L.121-84-2 du code de la consommation, je souhaite que ma résiliation soit effective à compter de la réception de la présente lettre recommandé avec AR.'),
            this.getTextParagraph('L’accusé de réception de ce courrier faisant foi.'),
            this.getTextParagraph('Si mon paiement se fait par prélèvement automatique, je vous demande de résilier cette autorisation en même temps.'),
            this.getTextParagraph('Merci de m’envoyer une confirmation de résiliation dans les 10 jours ouvrables par courrier ou par email à l’adresse email suivante : ${email-email}'),
            this.getTextParagraph('Bien cordialement,', false, false, "Calibri", {after: 400}),
        ];

        const signature = [
            this.getTextParagraph('Signature'),
            this.getTextParagraph('${firstname} ${lastname}')
        ];

        return new Document({
            sections: [
                {
                    children: [...shopCoordinates, ...clientCoordinates, title, object, ...text, ...signature],
                }
            ],
        });
    }

    private getShopCoordinates(letter: ILetter): Paragraph[] {
        return [
            new Paragraph(
                {
                    text: letter.address_line_1 ?? 'empty_address_line_1',
                    alignment: 'right',
                }
            ),
            new Paragraph(
                {
                    text: letter.address_line_2 ?? 'empty_address_line_2',
                    alignment: 'right',
                }
            ),
            new Paragraph(
                {
                    text: letter.address_line_3 ?? 'empty_address_line_3',
                    alignment: 'right',
                }
            ),
            new Paragraph(
                {
                    text: letter.address_line_4 ?? 'empty_address_line_4',
                    alignment: 'right',
                    spacing: {after: 200}
                }
            ),
        ];
    }

    private getClientCoordinates(letter: ILetter): Paragraph[] {
        // TODO add logic here to select
        let resiliationId = '';
        if (letter.resiliation_id_label !== '' && letter.resiliation_id_label !== null) {
            resiliationId = `${letter.resiliation_id_label} : `;
        }
        if (letter.resiliation_id_custom_filed !== '' && letter.resiliation_id_custom_filed !== null) {
            resiliationId = letter.resiliation_id_custom_filed;
            if (letter.resiliation_id_custom_filed_2 !== '' && letter.resiliation_id_custom_filed_2 !== null) {
                resiliationId += ` - ${letter.resiliation_id_custom_filed_2}`;
            }
        }

        return [
            new Paragraph(
                {
                    text: '${firstname} ${lastname}',
                }
            ),
            new Paragraph(
                {
                    text: '${address-street}',
                }
            ),
            new Paragraph(
                {
                    text: '${address-postalcode} / ${address-city}',
                }
            ),
            new Paragraph(
                {
                    text: resiliationId,
                }
            ),
        ];
    }


    private getTextParagraph(text: string, bold: boolean = false, allCaps: boolean = false, font: string = "Calibri", spacing: {after: number} = {after: 200}): Paragraph {
         return new Paragraph({
             children: [new TextRun({
                 text: text,
                 bold: bold,
                 font: font,
                 allCaps: allCaps
             })],
             spacing: spacing
         });
    }

    private async saveLogo(letter: ILetter, folder: string) {
        // use the logo_link to get the logo
        if (letter.logo_link !== null && letter.logo_link?.startsWith('http')) {
            let logoName = letter.logo_link.split('/').pop();
            const logo = await fetch(letter.logo_link);
            const contentType = logo.headers.get('content-type');
            if (logoName && !logoName.includes('.')) {
                if (contentType) {
                    logoName += '.' + contentType.split('/').pop();
                } else {
                    logoName += '.png';
                }
            }
            const buffer = await logo.arrayBuffer();
            fs.writeFileSync(folder + '/' + this.sanitizeLogoName(logoName || ''), Buffer.from(buffer));
        } else if (letter.logo_link !== null && letter.logo_link.includes('svg')) {
            fs.copyFileSync(letter.logo_link, folder + '/' + DateUtil.getFormattedIsoDate() + '.svg');
        }
    }

    private sanitizeLogoName(logoName: string): string {
        return logoName.replace(/[^a-zA-Z0-9-.]/g, '').toLowerCase();
    }
}