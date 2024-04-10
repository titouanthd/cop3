export default class DateUtil {
    public static getFormattedIsoDate(): string {
        return new Date().toISOString().replace(/:/g, '-');
    }

    public static convertMillisecondsToDuration(totalDuration: number) {
        const seconds = Math.floor(totalDuration / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    }
}
