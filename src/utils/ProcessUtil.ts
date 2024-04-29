import FolderManagerService from '../services/FolderManagerService';

export default class ProcessUtil {
    public static isValidCsvFile(target: string) {
        if (!FolderManagerService.fileExists(target)) {
            console.log(`File ${target} does not exist`);
            return false;
        }

        if (!target.endsWith('.csv')) {
            console.log(`File ${target} is not a csv file`);
            return false;
        }

        return true;
    }

    public static convertSubjectToFileName(subject: string): string {
        let fileName = subject.replace(/\s\s+/g, ' ').trim();
        fileName.replace(/[^a-zA-Z0-9-]/g, '');
        fileName = fileName.replace(/\s/g, '-').toLowerCase();
        return fileName;
    }
}
