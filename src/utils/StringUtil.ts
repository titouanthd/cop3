export class StringUtil {
    public static isEmpty(value: string): boolean {
        return value === '' || value === null || value === undefined;
    }

    public static sanitizeAccents(value: string): string {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    static removeSpecialCharacters(value: string) {
        return value.replace(/[^a-zA-Z0-9]/g, ' ');
    }
}
