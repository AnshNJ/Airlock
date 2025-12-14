#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { editFile } from './edit/edit.js';

const program = new Command();

program
  .name('ghostdock')
  .description('Securely modify local files using AI')
  .version('1.0.0');

program
  .command('edit')
  .argument('<file>', 'The file you want to modify')
  .option('-i, --instruction <text>', 'Instruction')
  .action(editFile);

program.parse();