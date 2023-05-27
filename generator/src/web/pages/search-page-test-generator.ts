import { SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';

export class SearchPageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addTests(file);
  }

  private addTests(file: SourceFile): void {
    file.addStatements(writer => {
      writer
        .blankLine()
        .writeLine(`describe('${this.pluralPascalCaseModel}Page', () => `)
        .block(() => {
          // TODO
        })
        .write(');');
    });
  }

  private addImports(file: SourceFile): void {
    // TODO
  }
}
