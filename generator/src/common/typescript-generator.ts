import path from 'path';
import { SourceFile } from 'ts-morph';

import { BaseGenerator } from './base-generator';

export abstract class TypescriptGenerator extends BaseGenerator {
  abstract generate(file: SourceFile): Promise<void>;

  protected getRelativeImportPath(
    rootPath: string,
    importOrLibPath: string,
    file: SourceFile
  ): string {
    // If the path does not starts with a ., it's a external library
    if (importOrLibPath.startsWith('.') === false) {
      return importOrLibPath;
    }

    const importPath = path.join(rootPath, importOrLibPath);
    const importRelativePath = path.relative(path.dirname(file.getFilePath()), importPath);
    if (importRelativePath.endsWith('.ts')) {
      return importRelativePath.substring(0, importRelativePath.length - 3);
    }
    if (importRelativePath.endsWith('.tsx')) {
      return importRelativePath.substring(0, importRelativePath.length - 4);
    }
    return importRelativePath;
  }
}
