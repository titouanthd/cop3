export default class InseeSireneApiService
{
    public static readonly sirenApiUrl: string = 'https://api.insee.fr/entreprises/sirene/V3.11/siren';
    public static readonly siretApiUrl: string = 'https://api.insee.fr/entreprises/sirene/V3.11/siret';
    public static readonly limit: number = 1000;

    public static async getEstablishmentBySiret(siret: string): Promise<any>
    {
        const apiKey = process.env.INSEE_SIRENE_API_TOKEN;
        if (apiKey === undefined) {
            console.log('INSEE_SIRENE_API_TOKEN is not defined');
            return;
        }

        const siretApiUrl = `${this.siretApiUrl}/${siret}`;
        console.log(`siretApiUrl: ${siretApiUrl}`);

        const response = await fetch(siretApiUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Error ${response.status} ${response.statusText}`);
            return;
        }

        return response.json();
    }
}