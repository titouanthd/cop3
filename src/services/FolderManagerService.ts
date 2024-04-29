import * as fs from 'fs';
import csv from 'csv-parser';
export default class FolderManagerService {
    public static createFolder(folderPath: string): void {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, {
                recursive: true,
            });
            console.log(`Creating folder: ${folderPath}`);
        }
    }

    public static deleteFolder(folderPath: string): void {
        if (fs.existsSync(folderPath)) {
            fs.rmdirSync(folderPath, {
                recursive: true,
            });
            console.log(`Deleting folder: ${folderPath}`);
        }
    }

    public static copyFolder(source: string, destination: string): void {
        console.log(`Copying folder from ${source} to ${destination}`);
        fs.copyFileSync(source, destination);
    }

    public static moveFolder(source: string, destination: string): void {
        console.log(`Moving folder from ${source} to ${destination}`);
        fs.renameSync(source, destination);
    }

    public static listFolder(folderPath: string): void {
        console.log(`Listing folder: ${folderPath}`);
        fs.readdirSync(folderPath).forEach((file) => {
            console.log(file);
        });
    }

    public static getFolderSize(folderPath: string): number {
        console.log(`Getting folder size: ${folderPath}`);
        let size = 0;
        fs.readdirSync(folderPath).forEach((file) => {
            size += fs.statSync(file).size;
        });
        return size;
    }

    public static createFile(filePath: string, content: string): void {
        console.log(`Creating file: ${filePath}`);
        fs.writeFileSync(filePath, content);
    }

    public static deleteFile(filePath: string): void {
        console.log(`Deleting file: ${filePath}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    public static getFileContent(filePath: string): string {
        console.log(`Getting file content: ${filePath}`);
        return fs.readFileSync(filePath, 'utf8');
    }

    // check if a file exists
    public static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    public static async parseCsv(targetPath: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            console.log(`Parsing csv file: ${targetPath}`);
            if (!FolderManagerService.fileExists(targetPath) || !targetPath.endsWith('.csv')) {
                console.error('Invalid target file');
                reject();
            }

            const results: any[] = [];
            fs.createReadStream(targetPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('error', (error) => {
                    console.error(error);
                    reject();
                })
                .on('end', () => {
                    console.log('CSV file successfully processed');
                    resolve(results);
                });
        });
    }
}
