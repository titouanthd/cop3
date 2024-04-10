export default class PromiseUtil {
    public static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public static randomSleep(min: number, max: number): Promise<void> {
        const rand = Math.floor(Math.random() * (max - min + 1) + min);
        console.log(`randomSleep: for ${rand} ms`);
        return new Promise((resolve) => setTimeout(resolve, rand));
    }
}
