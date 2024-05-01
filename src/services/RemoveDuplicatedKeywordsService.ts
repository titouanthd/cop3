import FolderManagerService from "./FolderManagerService";

export class RemoveDuplicatedKeywordsService {
    public async updateKeywordsOrder(filePath: string): Promise<void> {
        const keywords: {value: string}[] = await FolderManagerService.parseCsv(filePath);
        if (!keywords || keywords.length <= 0) {
            return;
        }
        // sort keywords alphabetically
        keywords.sort((a, b) => {
            return a.value.localeCompare(b.value);
        });
        // sort keywords by length
        keywords.sort((a, b) => {
            return b.value.length - a.value.length;
        });

        // save updated keywords
        let content = 'value\n';
        keywords.forEach((keyword) => {
            content += keyword.value + '\n';
        });
        // delete old file
        FolderManagerService.deleteFile(filePath);
        // create new file
        FolderManagerService.createFile(filePath, content);
    }
}