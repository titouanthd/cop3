import AnalyzeDocumentsCommand from './documents/AnalyzeDocumentsCommand';
import { RemoveDuplicatedKeywordsFromCsv } from './keywords/RemoveDuplicatedKeywordsFromCsv';
import {CreateLetterCommand} from "./letters/CreateLetterCommand";

export const COMMANDS = [AnalyzeDocumentsCommand, RemoveDuplicatedKeywordsFromCsv, CreateLetterCommand];
