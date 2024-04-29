#! /usr/bin/env node

import dotenv from 'dotenv';
import { Command } from 'commander';
import fs from 'fs';
import AnalyzeDocumentsCommand from './commands/AnalyzeDocumentsCommand';

// force the process to be in the root directory
process.chdir(__dirname + '/..');

let env;
if (process.env.NODE_ENV !== undefined) {
    env = process.env.NODE_ENV;
} else {
    // by default, we are in production
    env = 'prod';
    process.env.NODE_ENV = env;
}

// Load environment variables
console.log(`Loading environment variables from .env.${env}`);
const envFile = `.env.${env}`;
const envFilePath = process.cwd() + '/' + envFile;
if (!fs.existsSync(envFilePath)) {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
}
dotenv.config({
    path: envFile,
});
console.log(`Environment variables loaded`);

const APP_VERSION = process.env.APP_VERSION;
const APP_NAME = process.env.APP_NAME;
if (!APP_VERSION || !APP_NAME) {
    console.error('APP_VERSION or/and APP_NAME is/are not defined');
    process.exit(1);
} else {
    console.log(`Starting ${APP_NAME} v${APP_VERSION}`);
}

// create commander
const commander = new Command();
commander.version(APP_VERSION, '-v, --version').name(APP_NAME).description('CLI to control the tscrapper application').parse(process.argv);

// @ts-ignore
const commands = [AnalyzeDocumentsCommand];

// @ts-ignore
commands.forEach((Command) => new Command(commander));

// Parse the arguments
commander.parse(process.argv);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
