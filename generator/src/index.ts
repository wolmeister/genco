import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import {
  CodeBlockWriter,
  MethodSignatureStructure,
  OptionalKind,
  Project,
  StructureKind,
  VariableDeclarationKind,
  Writers,
} from 'ts-morph';
import { program } from 'commander';

import { Config, configSchema } from './config.schemas';
import { readFile, rm } from 'fs/promises';
import { ApiGenerator } from './api/api-generator';

async function run() {
  // Parse the app params
  program
    .name('GenCo - Node/React code generator!')
    .requiredOption('-c, --configPath <string>', 'config file')
    .parse();

  const { configPath } = program.opts() as { configPath: string };

  // Validate and load the app params
  const realConfigPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  if (existsSync(realConfigPath) === false) {
    console.error(`Config file ${realConfigPath} does not exists`);
    return;
  }

  const rawConfigBuffer = await readFile(realConfigPath, 'utf-8');
  const rawConfig = JSON.parse(rawConfigBuffer.toString());
  const parsedConfig = configSchema.safeParse(rawConfig);
  if (parsedConfig.success === false) {
    // TODO - Formar error
    console.error('Invalid config', parsedConfig.error);
    return;
  }

  // Start the generator
  const apiGenerator = new ApiGenerator(parsedConfig.data);
  await apiGenerator.generate();
  // const config = parsedConfig.data;
  // const moduleFolderPath = path.join(
  //   config.backend.rootPath,
  //   config.backend.modulesFolderPath,
  //   paramCase(config.model)
  // );

  // // Delete existing module
  // if (config.overwrite) {
  //   await rm(moduleFolderPath, { force: true, recursive: true });
  // }

  // const tsProject = new Project({
  //   tsConfigFilePath: path.join(
  //     payload.config.rootPath,
  //     payload.config.tsconfigFilePath
  //   ),
  // });

  // // index.ts
  // const model = paramCase(payload.model);
  // const indexFile = tsProject.createSourceFile(
  //   path.join(moduleFolderPath, 'index.ts')
  // );
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.routes` }]);
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.schemas` }]);
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.service` }]);

  // await indexFile.save();

  // // model.service

  // await serviceFile.save();

  // // model.errors
  // const errorsFile = tsProject.createSourceFile(
  //   path.join(moduleFolderPath, `./${model}.errors.ts`)
  // );

  // await errorsFile.save();

  console.log('Done');
}

run();
