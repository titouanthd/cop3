import AnalyzeDocumentsCommand from './documents/AnalyzeDocumentsCommand';
import {RemoveDuplicatedKeywordsFromCsv} from './keywords/RemoveDuplicatedKeywordsFromCsv';
import {CreateLetterCommand} from "./letters/CreateLetterCommand";
import FindStartDocOutdatedDocumentsCommand from "./documents/FindStartDocOutdatedDocumentsCommand";

export const COMMANDS = [
    AnalyzeDocumentsCommand,
    RemoveDuplicatedKeywordsFromCsv,
    CreateLetterCommand,
    FindStartDocOutdatedDocumentsCommand
];
