interface UniteLegale {
    etatAdministratifUniteLegale: string;
    statutDiffusionUniteLegale: string;
    dateCreationUniteLegale: string;
    categorieJuridiqueUniteLegale: string;
    denominationUniteLegale: string;
    sigleUniteLegale: string | null;
    denominationUsuelle1UniteLegale: string;
    denominationUsuelle2UniteLegale: string | null;
    denominationUsuelle3UniteLegale: string | null;
    sexeUniteLegale: string | null;
    nomUniteLegale: string | null;
    nomUsageUniteLegale: string | null;
    prenom1UniteLegale: string | null;
    prenom2UniteLegale: string | null;
    prenom3UniteLegale: string | null;
    prenom4UniteLegale: string | null;
    prenomUsuelUniteLegale: string | null;
    pseudonymeUniteLegale: string | null;
    activitePrincipaleUniteLegale: string;
    nomenclatureActivitePrincipaleUniteLegale: string;
    identifiantAssociationUniteLegale: string | null;
    economieSocialeSolidaireUniteLegale: string;
    societeMissionUniteLegale: string | null;
    caractereEmployeurUniteLegale: string | null;
    trancheEffectifsUniteLegale: string | null;
    anneeEffectifsUniteLegale: string | null;
    nicSiegeUniteLegale: string;
    dateDernierTraitementUniteLegale: string;
    categorieEntreprise: string | null;
    anneeCategorieEntreprise: string | null;
}

interface AdresseEtablissement {
    complementAdresseEtablissement: string | null;
    numeroVoieEtablissement: string | null;
    indiceRepetitionEtablissement: string | null;
    dernierNumeroVoieEtablissement: string | null;
    indiceRepetitionDernierNumeroVoieEtablissement: string | null;
    typeVoieEtablissement: string;
    libelleVoieEtablissement: string;
    codePostalEtablissement: string;
    libelleCommuneEtablissement: string;
    libelleCommuneEtrangerEtablissement: string | null;
    distributionSpecialeEtablissement: string | null;
    codeCommuneEtablissement: string;
    codeCedexEtablissement: string | null;
    libelleCedexEtablissement: string | null;
    codePaysEtrangerEtablissement: string | null;
    libellePaysEtrangerEtablissement: string | null;
    identifiantAdresseEtablissement: string | null;
    coordonneeLambertAbscisseEtablissement: string | null;
    coordonneeLambertOrdonneeEtablissement: string | null;
}

interface Adresse2Etablissement {
    complementAdresse2Etablissement: string | null;
    numeroVoie2Etablissement: string | null;
    indiceRepetition2Etablissement: string | null;
    typeVoie2Etablissement: string | null;
    libelleVoie2Etablissement: string | null;
    codePostal2Etablissement: string | null;
    libelleCommune2Etablissement: string | null;
    libelleCommuneEtranger2Etablissement: string | null;
    distributionSpeciale2Etablissement: string | null;
    codeCommune2Etablissement: string | null;
    codeCedex2Etablissement: string | null;
    libelleCedex2Etablissement: string | null;
    codePaysEtranger2Etablissement: string | null;
    libellePaysEtranger2Etablissement: string | null;
}

interface PeriodeEtablissement {
    dateFin: string | null;
    dateDebut: string;
    etablissementEmployeur: boolean;
    etablissementSiege: boolean;
    etablissementEmployeurSansPeriode: boolean;
    etablissementSiegeSansPeriode: boolean;
}

export default interface InseeEstablishmentInterface {
    header: {
        statut: number;
        message: string;
    };
    etablissement: {
        siren: string;
        nic: string;
        siret: string;
        statutDiffusionEtablissement: string;
        dateCreationEtablissement: string;
        trancheEffectifsEtablissement: string | null;
        anneeEffectifsEtablissement: string | null;
        activitePrincipaleRegistreMetiersEtablissement: string | null;
        dateDernierTraitementEtablissement: string;
        etablissementSiege: boolean;
        nombrePeriodesEtablissement: number;
        uniteLegale: UniteLegale;
        adresseEtablissement: AdresseEtablissement;
        adresse2Etablissement: Adresse2Etablissement;
        periodesEtablissement: PeriodeEtablissement[];
    }
}

export { UniteLegale, AdresseEtablissement, Adresse2Etablissement, PeriodeEtablissement };